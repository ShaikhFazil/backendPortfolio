const { Schema, model } = require('mongoose');

const resumeSchema = new Schema(
  {
    label: { type: String, trim: true, default: 'Resume' },
    fileName: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    bytes: { type: Number, default: 0 },
    mimeType: { type: String, default: 'application/pdf' },
    isActive: { type: Boolean, default: false, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
  },
  { timestamps: true }
);

resumeSchema.statics.getActive = function getActive() {
  return this.findOne({ isActive: true }).sort({ updatedAt: -1 });
};

module.exports = model('Resume', resumeSchema);
