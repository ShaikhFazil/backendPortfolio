require('dotenv').config();

const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  // eslint-disable-next-line no-console
  console.error(`[config] Missing required env vars: ${missing.join(', ')}`);
  console.error('[config] Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const bool = (v, d = false) =>
  v === undefined ? d : ['1', 'true', 'yes'].includes(String(v).toLowerCase());

const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: (process.env.NODE_ENV || 'development') === 'production',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieName: process.env.COOKIE_NAME || 'portfolio_token',
  cookieCrossSite: bool(process.env.COOKIE_CROSS_SITE, false),
  frontendUrls: (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'portfolio',
  },
  maxImageBytes: Number(process.env.MAX_IMAGE_SIZE_MB || 5) * 1024 * 1024,
  maxPdfBytes: Number(process.env.MAX_PDF_SIZE_MB || 10) * 1024 * 1024,
};

env.cloudinaryEnabled = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret
);

module.exports = env;
