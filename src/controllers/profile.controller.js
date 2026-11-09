const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/respond');
const { Profile } = require('../models');
const cloud = require('../services/cloudinary.service');

const getProfile = asyncHandler(async (_req, res) => {
  const profile = await Profile.getSingleton();
  if (!profile) throw ApiError.notFound('Profile has not been created yet. Run `npm run seed:content`.');
  return ok(res, profile);
});

const updateProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOneAndUpdate({ key: 'singleton' }, req.body, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  });
  return ok(res, profile);
});

// field is 'avatar' or 'ogImage'
const uploadProfileImage = (field) =>
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('No file received');
    const profile = await Profile.getSingleton();
    if (!profile) throw ApiError.notFound('Profile not found');

    const previous = profile.get(field)?.publicId;
    const uploaded = await cloud.uploadImage(req.file, 'profile');

    profile.set(field, { url: uploaded.url, publicId: uploaded.publicId });
    await profile.save();

    if (previous && previous !== uploaded.publicId) await cloud.destroy(previous, 'image');
    return ok(res, profile);
  });

module.exports = { getProfile, updateProfile, uploadProfileImage };
