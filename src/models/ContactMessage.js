const { Schema, model } = require('mongoose');

const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, trim: true, maxlength: 200, default: '' },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    read: { type: Boolean, default: false, index: true },
    archived: { type: Boolean, default: false, index: true },
    meta: {
      ip: String,
      userAgent: String,
    },
  },
  { timestamps: true }
);

contactMessageSchema.index({ createdAt: -1 });

module.exports = model('ContactMessage', contactMessageSchema);
