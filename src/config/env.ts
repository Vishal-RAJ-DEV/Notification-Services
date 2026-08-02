import 'dotenv/config';
import { cleanEnv, port, str, host } from 'envalid';

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
  PORT: port({ default: 3000 }),
  MONGO_URI: str({ desc: 'MongoDB connection string' }),
  REDIS_HOST: host({ default: 'localhost' }),
  REDIS_PORT: port({ default: 6379 }),
  REDIS_PASSWORD: str({ default: '' }),
  JWT_SECRET: str({ desc: 'Secret key for JWT token signing' }),
  LOG_LEVEL: str({ choices: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'], default: 'info' }),
  QUEUE_PREFIX: str({ default: 'notifications' }),
  SERVICE_NAME: str({ default: 'notification-service' }),
});

export type Env = typeof env;
