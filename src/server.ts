import express, { Application } from 'express';
import { Server } from '@overnightjs/core';
import morgan, { TokenIndexer } from 'morgan';
import cors from 'cors';
import { IncomingMessage, ServerResponse } from 'http';
import { corsOptions } from './config/cors';
import logger from 'jet-logger';
import UserController from './controller/user.controller';
import customServer from 'express-promise-router';
import mongoose from 'mongoose';
import config from './config/config';
import errorMiddleware from './middleware/error.middleware';
import AuthController from './controller/auth.controller';
import cookieParser from 'cookie-parser';
import MeliController from './controller/meli.controller';
import RoleController from './controller/role.controller';
import PermissionController from './controller/permission.controller';
import FavoriteController from './controller/favorite.controller';
import { loadData } from './data/load';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import MetricsController from './controller/metrics.controller';
import promClient from 'prom-client';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
    access_token?: string;
    metrics?: any;
  }
}

export class ServerApp extends Server {
  private readonly STARTED_MSG = 'Server APC running on port: ';

  constructor() {
    super(true);
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(morgan(this.morganJsonFormat));
    this.app.use(cookieParser());
    this.app.use(cors(corsOptions));
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Credentials', 'true');
      next();
    });

    // Create a Registry to register the metrics
    const register = new promClient.Registry();
    register.setDefaultLabels({
      app: 'apc-backend',
    });
    promClient.collectDefaultMetrics({ register });

    const httpRequestTimer = new promClient.Histogram({
      name: 'http_request_duration_ms',
      help: 'Duration of HTTP requests in ms',
      labelNames: ['method', 'route', 'code'],
      // buckets for response time from 0.1ms to 1s
      buckets: [0.1, 5, 15, 50, 100, 200, 300, 400, 500, 1000],
    });
    const requestCounter = new promClient.Counter({
      name: "http_requests_total",
      help: "Total number of HTTP requests",
      labelNames: ["method", "status_code"],
    });

    register.registerMetric(httpRequestTimer);  
    register.registerMetric(requestCounter);  


    this.app.use((req, res, next) => {
      req.metrics = { register, httpRequestTimer, requestCounter };
      next();
    });

    this.setupControllers();

    this.app.use(errorMiddleware);

    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    this.initConnectionDB();
  }

  private morganJsonFormat(
    tokens: TokenIndexer,
    req: IncomingMessage,
    res: ServerResponse
  ) {
    const status = tokens.status(req, res);
    const statusInfo = ['200', '201'];

    return JSON.stringify({
      date: tokens.date(req, res, 'iso'),
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: status,
      response: `${tokens['response-time'](req, res)} ms`,
      level: statusInfo.includes(status as string) ? 'INFO' : 'WARN',
    });
  }

  private setupControllers(): void {
    const userController = new UserController();
    const authController = new AuthController();
    const meliController = new MeliController();
    const roleController = new RoleController();
    const permissionController = new PermissionController();
    const favoriteController = new FavoriteController();
    const metricsController = new MetricsController();

    super.addControllers(
      [
        userController,
        authController,
        meliController,
        roleController,
        permissionController,
        favoriteController,
        metricsController,
      ],
      customServer
    );
  }

  private async initConnectionDB(): Promise<void> {
    const CONN_STR = config.db_connection_string as string;
    console.log('🚀 ~ ServerApp ~ initConnectionDB ~ CONN_STR:', CONN_STR);
    const db = await mongoose.connect(CONN_STR);
    console.log('Data base is connect: ' + db.connection.name);
  }

  public getApp(): Application {
    return this.app;
  }

  public start(port: number) {
    this.app.listen(port, () => {
      logger.imp(this.STARTED_MSG + port);
      if (process.env.NODE_ENV !== 'test') loadData();
    });
  }
}
