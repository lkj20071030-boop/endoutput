import { createApp } from './server.bundle.mjs';

const port = Number(process.env.PORT || 8000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}
const options = process.env.SESSION_STORE_PATH ? { storePath: process.env.SESSION_STORE_PATH } : {};
const server = createApp(options);
server.on('error', (error) => {
  console.error('Web service failed to start:', error.message);
  process.exit(1);
});
server.listen(port, '0.0.0.0', () => {
  console.log(`Zhixi Web listening on 0.0.0.0:${port}`);
});
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 10000).unref();
  });
}
