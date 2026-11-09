const { cloudinary, enabled } = require('../config/cloudinary');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

function assertEnabled() {
  if (!enabled) {
    throw ApiError.unavailable(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.'
    );
  }
}

function uploadBuffer(buffer, options = {}) {
  assertEnabled();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: env.cloudinary.folder, ...options },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

async function uploadImage(file, folder = 'images') {
  const res = await uploadBuffer(file.buffer, {
    folder: `${env.cloudinary.folder}/${folder}`,
    resource_type: 'image',
    overwrite: true,
  });
  return { url: res.secure_url, publicId: res.public_id, bytes: res.bytes };
}

// PDFs go up as `raw` so the delivery URL serves the original file,
// and we append the original filename so downloads keep a sensible name.
async function uploadPdf(file, folder = 'resume') {
  const res = await uploadBuffer(file.buffer, {
    folder: `${env.cloudinary.folder}/${folder}`,
    resource_type: 'raw',
    use_filename: true,
    unique_filename: true,
    filename_override: file.originalname,
  });
  return {
    url: res.secure_url,
    publicId: res.public_id,
    bytes: res.bytes,
    fileName: file.originalname,
  };
}

async function destroy(publicId, resourceType = 'image') {
  if (!publicId || !enabled) return null;
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    // Deleting a stale asset must never break the request that triggered it.
    // eslint-disable-next-line no-console
    console.warn('[cloudinary] destroy failed for', publicId, err.message);
    return null;
  }
}

module.exports = { uploadImage, uploadPdf, destroy, enabled, assertEnabled };
