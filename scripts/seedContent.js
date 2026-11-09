#!/usr/bin/env node
/**
 * Loads the portfolio content from scripts/seed-data.json.
 *
 *   npm run seed:content           # only fills collections that are empty
 *   npm run seed:content -- --force  # wipes and reloads content collections
 *
 * Admin accounts, resumes and contact messages are never touched.
 */
const path = require('path');
const fs = require('fs');
const { connectDB, mongoose } = require('../src/config/db');
const {
  Profile, Skill, Experience, Project, Education, Certification,
} = require('../src/models');

const force = process.argv.includes('--force');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed-data.json'), 'utf8'));

async function fill(Model, rows, label) {
  if (force) {
    await Model.deleteMany({});
  } else {
    const count = await Model.countDocuments();
    if (count > 0) {
      console.log(`[seed] ${label}: ${count} already present, skipped (use --force to replace)`);
      return;
    }
  }
  await Model.insertMany(rows);
  console.log(`[seed] ${label}: inserted ${rows.length}`);
}

(async () => {
  await connectDB();

  const existingProfile = await Profile.getSingleton();
  if (!existingProfile || force) {
    await Profile.findOneAndUpdate(
      { key: 'singleton' },
      { ...data.profile, key: 'singleton' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log('[seed] profile: written');
  } else {
    console.log('[seed] profile: already present, skipped (use --force to replace)');
  }

  await fill(Skill, data.skills, 'skills');
  await fill(Experience, data.experience, 'experience');
  await fill(Project, data.projects, 'projects');
  await fill(Education, data.education, 'education');
  await fill(Certification, data.certifications, 'certifications');

  console.log('\n[seed] done. Upload your resume PDF and images from /dashboard.');
  await mongoose.connection.close();
  process.exit(0);
})().catch(async (err) => {
  console.error('[seed] failed:', err.message);
  try { await mongoose.connection.close(); } catch { /* ignore */ }
  process.exit(1);
});
