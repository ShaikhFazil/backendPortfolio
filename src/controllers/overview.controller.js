const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const {
  Project, Skill, Experience, Education, Certification, Resume, ContactMessage, Profile,
} = require('../models');

// Everything the public site needs, in one request.
const getPortfolio = asyncHandler(async (_req, res) => {
  const [profile, skills, experience, projects, education, certifications, resume] =
    await Promise.all([
      Profile.getSingleton(),
      Skill.find({ published: true }).sort({ order: 1, name: 1 }).lean(),
      Experience.find({ published: true }).sort({ order: 1 }).lean(),
      Project.find({ published: true }).sort({ order: 1, createdAt: -1 }).lean(),
      Education.find({ published: true }).sort({ order: 1 }).lean(),
      Certification.find({ published: true }).sort({ order: 1 }).lean(),
      Resume.getActive(),
    ]);

  return ok(res, {
    profile,
    skills,
    experience,
    projects,
    education,
    certifications,
    resume: resume
      ? { url: resume.url, fileName: resume.fileName, updatedAt: resume.updatedAt }
      : null,
  });
});

// Dashboard metrics, all computed from the database.
const getStats = asyncHandler(async (_req, res) => {
  const [
    projects, featuredProjects, skills, experience, education, certifications,
    messages, unreadMessages, resume, resumeCount, profile,
  ] = await Promise.all([
    Project.countDocuments(),
    Project.countDocuments({ featured: true }),
    Skill.countDocuments(),
    Experience.countDocuments(),
    Education.countDocuments(),
    Certification.countDocuments(),
    ContactMessage.countDocuments(),
    ContactMessage.countDocuments({ read: false, archived: false }),
    Resume.getActive(),
    Resume.countDocuments(),
    Profile.getSingleton(),
  ]);

  const recent = await Promise.all([
    Project.find().sort({ updatedAt: -1 }).limit(5).select('title updatedAt').lean(),
    Experience.find().sort({ updatedAt: -1 }).limit(3).select('company role updatedAt').lean(),
    ContactMessage.find().sort({ createdAt: -1 }).limit(5).select('name subject createdAt read').lean(),
  ]);

  return ok(res, {
    counts: {
      projects, featuredProjects, skills, experience, education,
      certifications, messages, unreadMessages, resumeVersions: resumeCount,
    },
    resume: resume
      ? { fileName: resume.fileName, url: resume.url, updatedAt: resume.updatedAt, active: true }
      : null,
    profileUpdatedAt: profile?.updatedAt || null,
    recent: {
      projects: recent[0],
      experience: recent[1],
      messages: recent[2],
    },
  });
});

module.exports = { getPortfolio, getStats };
