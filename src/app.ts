import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import routes from './api/routes/index.js';
import { requestIdMiddleware } from './api/middlewares/requestId.js';
import { requestLoggerMiddleware } from './api/middlewares/requestLogger.js';
import { errorHandler } from './api/middlewares/errorHandler.js';
import { notFoundHandler } from './api/middlewares/notFound.js';

const app = express();

app.set('trust proxy', 1);
app.set('x-powered-by', false);

app.use(helmet());
app.use(
  cors({
    origin: env.NODE_ENV === 'production' ? process.env.CORS_ORIGIN?.split(',') : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    exposedHeaders: ['x-request-id'],
  }),
);
app.use(compression());
app.use(cookieParser());
app.use(
  express.json({
    limit: '10kb',
  }),
);
app.use(
  express.urlencoded({
    extended: true,
    limit: '10kb',
  }),
);

app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
