const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/respond');
const { Resume } = require('../models');
const cloud = require('../services/cloudinary.service');

const getActive = asyncHandler(async (_req, res) => {
  const resume = await Resume.getActive();
  if (!resume) return ok(res, null);
  return ok(res, resume);
});

const listResumes = asyncHandler(async (_req, res) => {
  const items = await Resume.find().sort({ createdAt: -1 }).lean();
  return ok(res, items);
});

const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No PDF received');
  if (req.file.mimetype !== 'application/pdf') throw ApiError.badRequest('Only PDF files are accepted');

  const uploaded = await cloud.uploadPdf(req.file, 'resume');

  // a freshly uploaded resume becomes the active one
  await Resume.updateMany({ isActive: true }, { $set: { isActive: false } });

  const resume = await Resume.create({
    label: req.body.label || 'Resume',
    fileName: uploaded.fileName,
    url: uploaded.url,
    publicId: uploaded.publicId,
    bytes: uploaded.bytes,
    isActive: true,
    uploadedBy: req.user?._id,
  });

  return created(res, resume);
});

const activateResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);
  if (!resume) throw ApiError.notFound('Resume not found');

  await Resume.updateMany({ isActive: true }, { $set: { isActive: false } });
  resume.isActive = true;
  await resume.save();

  return ok(res, resume);
});

const deactivateResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!resume) throw ApiError.notFound('Resume not found');
  return ok(res, resume);
});

const deleteResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);
  if (!resume) throw ApiError.notFound('Resume not found');

  const publicId = resume.publicId;
  await resume.deleteOne();

  const stillUsed = await Resume.exists({ publicId });
  if (!stillUsed) await cloud.destroy(publicId, 'raw');

  // keep one active resume if any remain
  const active = await Resume.getActive();
  if (!active) {
    const latest = await Resume.findOne().sort({ createdAt: -1 });
    if (latest) {
      latest.isActive = true;
      await latest.save();
    }
  }

  return ok(res, { id: req.params.id, deleted: true });
});

module.exports = {
  getActive,
  listResumes,
  uploadResume,
  activateResume,
  deactivateResume,
  deleteResume,
};
