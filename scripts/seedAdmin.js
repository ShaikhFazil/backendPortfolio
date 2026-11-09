#!/usr/bin/env node
/**
 * Creates (or updates the password of) the single administrator account.
 *
 * Credentials come from the environment or from flags — nothing is hardcoded:
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' npm run seed:admin
 *   node scripts/seedAdmin.js --email you@example.com --password 'a-long-password'
 *
 * Re-running with an existing email resets that account's password.
 */
const readline = require('readline');
const env = require('../src/config/env');
const { connectDB, mongoose } = require('../src/config/db');
const { AdminUser } = require('../src/models');

function parseFlags(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    if (key.startsWith('--')) {
      out[key.slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return out;
}

function ask(question, { hidden = false } = {}) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    if (hidden) {
      const onData = (char) => {
        if ([ '\n', '\r', '\u0004' ].includes(String(char))) {
          process.stdin.removeListener('data', onData);
        } else {
          readline.clearLine(process.stdout, 0);
          readline.cursorTo(process.stdout, 0);
          process.stdout.write(`${question}${'*'.repeat(rl.line.length)}`);
        }
      };
      process.stdin.on('data', onData);
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer.trim());
    });
  });
}

(async () => {
  const flags = parseFlags(process.argv);

  let email = flags.email || process.env.ADMIN_EMAIL;
  let password = flags.password || process.env.ADMIN_PASSWORD;
  const name = flags.name || process.env.ADMIN_NAME || 'Administrator';

  if (!email) email = await ask('Admin email: ');
  if (!password) password = await ask('Admin password (min 10 chars): ', { hidden: true });

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    console.error('A valid admin email is required.');
    process.exit(1);
  }
  if (!password || password.length < 10) {
    console.error('Admin password must be at least 10 characters.');
    process.exit(1);
  }

  await connectDB();

  const passwordHash = await AdminUser.hashPassword(password);
  const existing = await AdminUser.findOne({ email: email.toLowerCase() });

  if (existing) {
    existing.passwordHash = passwordHash;
    existing.name = name;
    await existing.save();
    console.log(`[seed] password reset for existing admin ${existing.email}`);
  } else {
    const count = await AdminUser.countDocuments();
    if (count > 0) {
      console.warn(`[seed] note: ${count} admin account(s) already exist; adding another.`);
    }
    const user = await AdminUser.create({ name, email: email.toLowerCase(), passwordHash });
    console.log(`[seed] admin created: ${user.email}`);
  }

  console.log(`[seed] sign in at ${env.frontendUrls[0]}/dashboard/login`);
  await mongoose.connection.close();
  process.exit(0);
})().catch(async (err) => {
  console.error('[seed] failed:', err.message);
  try { await mongoose.connection.close(); } catch { /* ignore */ }
  process.exit(1);
});
