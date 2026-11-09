const { Schema, model } = require('mongoose');

const imageSchema = new Schema(
  { url: { type: String, required: true }, publicId: String, alt: String },
  { _id: false }
);

const projectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, trim: true, lowercase: true, index: true },
    summary: { type: String, trim: true, maxlength: 400, default: '' },
    description: { type: String, trim: true, maxlength: 8000, default: '' },
    category: { type: String, trim: true, default: 'Web App', index: true },
    technologies: { type: [String], default: [] },
    features: { type: [String], default: [] },
    thumbnail: {
      type: new Schema({ url: String, publicId: String }, { _id: false }),
      default: () => ({}),
    },
    images: { type: [imageSchema], default: [] },
    liveUrl: { type: String, trim: true, default: '' },
    githubUrl: { type: String, trim: true, default: '' },
    featured: { type: Boolean, default: false, index: true },
    published: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0, index: true },
    year: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

projectSchema.pre('validate', function setSlug(next) {
  if (!this.slug && this.title) this.slug = slugify(this.title);
  next();
});

module.exports = model('Project', projectSchema);
