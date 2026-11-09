const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/respond');
const cloud = require('../services/cloudinary.service');

/**
 * Builds the standard list/get/create/update/delete/reorder handlers shared by
 * Skill, Experience, Project, Education and Certification.
 *
 * opts:
 *   searchFields  - fields matched by ?search=
 *   defaultSort   - mongoose sort object
 *   imageFields   - [{ path: 'thumbnail', folder: 'projects' }] cleaned up on delete
 */
function crudFactory(Model, opts = {}) {
  const {
    searchFields = [],
    defaultSort = { order: 1, createdAt: -1 },
    imageFields = [],
  } = opts;

  const buildFilter = (query, { publicOnly = false } = {}) => {
    const filter = {};
    if (publicOnly) filter.published = true;
    if (query.category) filter.category = query.category;
    if (query.featured !== undefined) filter.featured = query.featured === 'true';
    if (query.kind) filter.kind = query.kind;
    if (!publicOnly && query.published !== undefined) {
      filter.published = query.published === 'true';
    }
    if (query.search && searchFields.length) {
      const rx = new RegExp(String(query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = searchFields.map((f) => ({ [f]: rx }));
    }
    return filter;
  };

  const list = (publicOnly) =>
    asyncHandler(async (req, res) => {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 100));
      const filter = buildFilter(req.query, { publicOnly });

      const [items, total] = await Promise.all([
        Model.find(filter).sort(defaultSort).skip((page - 1) * limit).limit(limit).lean(),
        Model.countDocuments(filter),
      ]);

      return ok(res, items, { page, limit, total, pages: Math.ceil(total / limit) || 1 });
    });

  const getOne = (publicOnly) =>
    asyncHandler(async (req, res) => {
      const byId = /^[a-f\d]{24}$/i.test(req.params.id);
      const query = byId ? { _id: req.params.id } : { slug: req.params.id };
      if (publicOnly) query.published = true;
      const doc = await Model.findOne(query).lean();
      if (!doc) throw ApiError.notFound(`${Model.modelName} not found`);
      return ok(res, doc);
    });

  const create = asyncHandler(async (req, res) => {
    if (req.body.order === undefined) {
      const last = await Model.findOne().sort({ order: -1 }).select('order').lean();
      req.body.order = last ? (last.order || 0) + 1 : 0;
    }
    const doc = await Model.create(req.body);
    return created(res, doc);
  });

  const update = asyncHandler(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) throw ApiError.notFound(`${Model.modelName} not found`);
    return ok(res, doc);
  });

  const remove = asyncHandler(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) throw ApiError.notFound(`${Model.modelName} not found`);

    // collect the public ids this record owns, then make sure no sibling
    // record still points at them before asking Cloudinary to delete.
    const publicIds = [];
    for (const field of imageFields) {
      const value = doc.get(field.path);
      if (Array.isArray(value)) value.forEach((v) => v?.publicId && publicIds.push(v.publicId));
      else if (value?.publicId) publicIds.push(value.publicId);
    }

    await doc.deleteOne();

    for (const publicId of publicIds) {
      const stillUsed = await Model.exists({
        $or: imageFields.map((f) => ({ [`${f.path}.publicId`]: publicId })),
      });
      if (!stillUsed) await cloud.destroy(publicId, 'image');
    }

    return ok(res, { id: req.params.id, deleted: true });
  });

  const reorder = asyncHandler(async (req, res) => {
    const { items } = req.body; // [{ id, order }]
    await Model.bulkWrite(
      items.map((it) => ({
        updateOne: { filter: { _id: it.id }, update: { $set: { order: it.order } } },
      }))
    );
    const docs = await Model.find().sort(defaultSort).lean();
    return ok(res, docs);
  });

  return { list, getOne, create, update, remove, reorder };
}

module.exports = crudFactory;
