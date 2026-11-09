const { v2: cloudinary } = require('cloudinary');
const env = require('./env');

if (env.cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
} else {
  // eslint-disable-next-line no-console
  console.warn(
    '[cloudinary] credentials missing - upload endpoints will return 503 until configured.'
  );
}

module.exports = { cloudinary, enabled: env.cloudinaryEnabled };
