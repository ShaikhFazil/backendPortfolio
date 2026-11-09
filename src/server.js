const app = require('./app');
const env = require('./config/env');
const { connectDB, mongoose } = require('./config/db');

(async () => {
  try {
    await connectDB();
    const server = app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`[server] listening on http://localhost:${env.port} (${env.nodeEnv})`);
    });

    const shutdown = async (signal) => {
      // eslint-disable-next-line no-console
      console.log(`\n[server] ${signal} received, shutting down`);
      server.close(async () => {
        await mongoose.connection.close();
        process.exit(0);
      });
    };
    ['SIGINT', 'SIGTERM'].forEach((s) => process.on(s, () => shutdown(s)));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  }
})();
