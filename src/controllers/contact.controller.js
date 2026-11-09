const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/respond');
const { ContactMessage } = require('../models');

const submitMessage = asyncHandler(async (req, res) => {
  const message = await ContactMessage.create({
    ...req.body,
    meta: {
      ip: req.ip,
      userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
    },
  });
  // only echo back what the public form needs
  return created(res, { id: message._id, createdAt: message.createdAt });
});

const listMessages = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  const filter = {};
  if (req.query.read !== undefined) filter.read = req.query.read === 'true';
  if (req.query.archived !== undefined) filter.archived = req.query.archived === 'true';
  if (req.query.search) {
    const rx = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { subject: rx }, { message: rx }];
  }

  const [items, total, unread] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ContactMessage.countDocuments(filter),
    ContactMessage.countDocuments({ read: false, archived: false }),
  ]);

  return ok(res, items, { page, limit, total, unread, pages: Math.ceil(total / limit) || 1 });
});

const updateMessage = asyncHandler(async (req, res) => {
  const doc = await ContactMessage.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) throw ApiError.notFound('Message not found');
  return ok(res, doc);
});

const deleteMessage = asyncHandler(async (req, res) => {
  const doc = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!doc) throw ApiError.notFound('Message not found');
  return ok(res, { id: req.params.id, deleted: true });
});

module.exports = { submitMessage, listMessages, updateMessage, deleteMessage };
