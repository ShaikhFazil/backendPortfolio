const { Schema, model } = require('mongoose');

const educationSchema = new Schema(
  {
    institution: { type: String, required: true, trim: true, maxlength: 200 },
    qualification: { type: String, required: true, trim: true, maxlength: 200 },
    field: { type: String, trim: true, default: '' },
    startYear: { type: String, trim: true, default: '' },
    endYear: { type: String, trim: true, default: '' },
    grade: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    order: { type: Number, default: 0, index: true },
    published: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = model('Education', educationSchema);
