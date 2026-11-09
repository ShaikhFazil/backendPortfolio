const { Schema, model } = require('mongoose');

const imageSchema = new Schema(
  { url: String, publicId: String },
  { _id: false }
);

const socialSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    icon: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

// Singleton document: there is exactly one profile.
const profileSchema = new Schema(
  {
    key: { type: String, default: 'singleton', unique: true, immutable: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    tagline: { type: String, trim: true, maxlength: 300, default: '' },
    summary: { type: String, trim: true, maxlength: 2000, default: '' },
    bio: { type: String, trim: true, maxlength: 8000, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    availability: { type: String, trim: true, default: '' },
    yearsOfExperience: { type: Number, min: 0, max: 80, default: 0 },
    avatar: { type: imageSchema, default: () => ({}) },
    ogImage: { type: imageSchema, default: () => ({}) },
    socials: { type: [socialSchema], default: [] },
  },
  { timestamps: true }
);

profileSchema.statics.getSingleton = async function getSingleton() {
  return this.findOne({ key: 'singleton' });
};

module.exports = model('Profile', profileSchema);
