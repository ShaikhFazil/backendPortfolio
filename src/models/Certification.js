const { Schema, model } = require('mongoose');

const certificationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    issuer: { type: String, trim: true, default: '' },
    issueDate: { type: String, trim: true, default: '' },
    credentialId: { type: String, trim: true, default: '' },
    credentialUrl: { type: String, trim: true, default: '' },
    kind: {
      type: String,
      enum: ['certification', 'achievement'],
      default: 'certification',
      index: true,
    },
    order: { type: Number, default: 0, index: true },
    published: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = model('Certification', certificationSchema);
