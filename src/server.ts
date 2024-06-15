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
    return JSON.stringify({
      date: tokens.date(req, res, 'iso'),
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: tokens.status(req, res),
      response: `${tokens['response-time'](req, res)} ms`,
      level: 'INFO',
    });
  }

  private setupControllers(): void {
    const userController = new UserController();
    const authController = new AuthController();
    const meliController = new MeliController();
    const roleController = new RoleController();
    const permissionController = new PermissionController();
    const favoriteController = new FavoriteController();

    super.addControllers(
      [
        userController,
        authController,
        meliController,
        roleController,
        permissionController,
        favoriteController,
      ],
      customServer
    );
  }

  private async initConnectionDB(): Promise<void> {
    const CONN_STR = config.db_connection_string as string;
    console.log("🚀 ~ ServerApp ~ initConnectionDB ~ CONN_STR:", CONN_STR)
    const db = await mongoose.connect(CONN_STR);
    console.log('Data base is connect: ' + db.connection.name);
  }

  public getApp(): Application {
    return this.app;
  }

  public start(port: number) {
    this.app.listen(port, () => {
      logger.imp(this.STARTED_MSG + port);
      if (process.env.NODE_ENV !== "test") loadData();
    });
  }
}
