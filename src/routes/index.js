const { Router } = require('express');

const { requireAuth, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { loginLimiter, contactLimiter } = require('../middleware/rateLimit');

const V = require('../validators');
const crudFactory = require('../controllers/crud.factory');
const { Skill, Experience, Project, Education, Certification } = require('../models');

const auth = require('../controllers/auth.controller');
const profile = require('../controllers/profile.controller');
const resume = require('../controllers/resume.controller');
const contact = require('../controllers/contact.controller');
const uploads = require('../controllers/upload.controller');
const overview = require('../controllers/overview.controller');

const router = Router();
const admin = [requireAuth, requireAdmin];

/* =================== auth =================== */
router.post('/auth/login', loginLimiter, validate(V.loginSchema), auth.login);
router.post('/auth/logout', auth.logout);
router.get('/auth/me', requireAuth, auth.me);
router.post('/auth/change-password', admin, validate(V.changePasswordSchema), auth.changePassword);

/* =================== aggregate =================== */
router.get('/portfolio', overview.getPortfolio);
router.get('/stats', admin, overview.getStats);

/* =================== profile =================== */
router.get('/profile', profile.getProfile);
router.put('/profile', admin, validate(V.profileSchema), profile.updateProfile);
router.post('/profile/avatar', admin, upload.singleImage('file'), profile.uploadProfileImage('avatar'));
router.post('/profile/og-image', admin, upload.singleImage('file'), profile.uploadProfileImage('ogImage'));

/* =================== resource routes =================== */
/**
 * Every resource below exposes the same shape:
 *   GET    /           public, published records only
 *   GET    /all        admin, including unpublished
 *   GET    /:id        public (published) by id or slug
 *   POST   /           admin
 *   PUT    /:id        admin
 *   PATCH  /reorder    admin
 *   DELETE /:id        admin
 */
function mountResource(path, Model, schema, options) {
  const c = crudFactory(Model, options);
  const r = Router();

  r.get('/', c.list(true));
  r.get('/all', ...admin, c.list(false));
  r.patch('/reorder', ...admin, validate(V.reorderSchema), c.reorder);
  r.get('/:id', c.getOne(true));
  r.post('/', ...admin, validate(schema), c.create);
  r.put('/:id', ...admin, validate(schema.partial()), c.update);
  r.delete('/:id', ...admin, c.remove);

  router.use(path, r);
}

mountResource('/skills', Skill, V.skillSchema, {
  searchFields: ['name', 'category'],
  defaultSort: { order: 1, name: 1 },
  imageFields: [{ path: 'iconPublicId' }],
});

mountResource('/experience', Experience, V.experienceSchema, {
  searchFields: ['company', 'role', 'description'],
  defaultSort: { order: 1, createdAt: -1 },
  imageFields: [{ path: 'companyLogo' }],
});

mountResource('/projects', Project, V.projectSchema, {
  searchFields: ['title', 'summary', 'description', 'category'],
  defaultSort: { order: 1, createdAt: -1 },
  imageFields: [{ path: 'thumbnail' }, { path: 'images' }],
});

mountResource('/education', Education, V.educationSchema, {
  searchFields: ['institution', 'qualification', 'field'],
  defaultSort: { order: 1, createdAt: -1 },
});

mountResource('/certifications', Certification, V.certificationSchema, {
  searchFields: ['name', 'issuer'],
  defaultSort: { order: 1, createdAt: -1 },
});

/* =================== resume =================== */
router.get('/resume/active', resume.getActive);
router.get('/resume', ...admin, resume.listResumes);
router.post('/resume', ...admin, upload.singlePdf('file'), resume.uploadResume);
router.put('/resume/:id/activate', ...admin, resume.activateResume);
router.put('/resume/:id/deactivate', ...admin, resume.deactivateResume);
router.delete('/resume/:id', ...admin, resume.deleteResume);

/* =================== uploads =================== */
router.post('/uploads/image', ...admin, upload.singleImage('file'), uploads.uploadImage);
router.post('/uploads/images', ...admin, upload.manyImages('files', 8), uploads.uploadImages);
router.delete('/uploads', ...admin, validate(V.deleteAssetSchema), uploads.deleteAsset);

/* =================== contact =================== */
router.post('/contact', contactLimiter, validate(V.contactSchema), contact.submitMessage);
router.get('/contact', ...admin, contact.listMessages);
router.put('/contact/:id', ...admin, validate(V.messageUpdateSchema), contact.updateMessage);
router.delete('/contact/:id', ...admin, contact.deleteMessage);

/* =================== meta =================== */
router.get('/meta/skill-categories', (_req, res) =>
  res.json({ success: true, data: V.CATEGORIES })
);

module.exports = router;
