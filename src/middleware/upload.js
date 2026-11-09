const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'];
const PDF_TYPES = ['application/pdf'];

function build(allowed, maxBytes) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 10 },
    fileFilter: (_req, file, cb) => {
      if (!allowed.includes(file.mimetype)) {
        return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
      }
      cb(null, true);
    },
  });
}

const imageUpload = build(IMAGE_TYPES, env.maxImageBytes);
const pdfUpload = build(PDF_TYPES, env.maxPdfBytes);

module.exports = {
  singleImage: (field = 'file') => imageUpload.single(field),
  manyImages: (field = 'files', max = 8) => imageUpload.array(field, max),
  singlePdf: (field = 'file') => pdfUpload.single(field),
  IMAGE_TYPES,
  PDF_TYPES,
};
