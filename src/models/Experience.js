const { Schema, model } = require('mongoose');

const experienceSchema = new Schema(
  {
    company: { type: String, required: true, trim: true, maxlength: 160 },
    role: { type: String, required: true, trim: true, maxlength: 160 },
    location: { type: String, trim: true, default: '' },
    employmentType: { type: String, trim: true, default: 'Full-time' },
    startDate: { type: String, required: true, trim: true }, // e.g. "Mar 2025"
    endDate: { type: String, trim: true, default: '' },
    current: { type: Boolean, default: false },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    achievements: { type: [String], default: [] },
    technologies: { type: [String], default: [] },
    companyLogo: {
      type: new Schema({ url: String, publicId: String }, { _id: false }),
      default: () => ({}),
    },
    companyUrl: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0, index: true },
    published: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = model('Experience', experienceSchema);
