const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/respond');
const cloud = require('../services/cloudinary.service');

// Generic authenticated image upload used by the dashboard forms
// (project thumbnails, screenshots, skill icons, company logos).
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file received');
  const folder = ['projects', 'skills', 'experience', 'profile', 'misc'].includes(req.body.folder)
    ? req.body.folder
    : 'misc';
  const uploaded = await cloud.uploadImage(req.file, folder);
  return ok(res, uploaded);
});

const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.length) throw ApiError.badRequest('No files received');
  const folder = ['projects', 'skills', 'experience', 'profile', 'misc'].includes(req.body.folder)
    ? req.body.folder
    : 'misc';
  const uploaded = await Promise.all(req.files.map((f) => cloud.uploadImage(f, folder)));
  return ok(res, uploaded);
});

const deleteAsset = asyncHandler(async (req, res) => {
  const { publicId, resourceType } = req.body;
  await cloud.destroy(publicId, resourceType || 'image');
  return ok(res, { publicId, deleted: true });
});

module.exports = { uploadImage, uploadImages, deleteAsset };
