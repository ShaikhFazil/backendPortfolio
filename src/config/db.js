const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

async function connectDB() {
  await mongoose.connect(env.mongoUri, { autoIndex: !env.isProd });
  // eslint-disable-next-line no-console
  console.log(`[db] connected to ${mongoose.connection.name}`);
  return mongoose.connection;
}

module.exports = { connectDB, mongoose };
