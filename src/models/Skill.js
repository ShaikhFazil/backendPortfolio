const { Schema, model } = require('mongoose');

const CATEGORIES = [
  'Languages',
  'Frontend',
  'Backend',
  'Databases',
  'State Management & APIs',
  'AI, LLMs & Generative AI',
  'DevOps & Tools',
];

const skillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    category: { type: String, required: true, enum: CATEGORIES, index: true },
    level: { type: Number, min: 0, max: 100, default: 0 },
    iconUrl: { type: String, trim: true, default: '' },
    iconPublicId: { type: String, default: '' },
    featured: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0, index: true },
    published: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

skillSchema.index({ category: 1, order: 1 });
skillSchema.statics.CATEGORIES = CATEGORIES;

module.exports = model('Skill', skillSchema);
