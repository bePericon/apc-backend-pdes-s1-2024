import supertest from 'supertest';
import { app } from '../main';
import config from '../config/config';
const mockingoose = require('mockingoose');
import User from '../model/userSchema';
import Role from '../model/roleSchema';

const basePath = config.base_path;

describe('auth controller', () => {
  let request: any;

  beforeEach(() => {
    request = supertest(app);
  });

  describe('POST /api/auth/signup', () => {
    it('should return success response with created user', async () => {
      const _docRole = {
        _id: '507f191e810c19729de860ea',
        name: 'comprador',
        description: 'description comprador role',
      };

      const _docUser = {
        _id: '6634402c2543201511a02dfe',
        email: 'test@email.com',
        name: 'Test',
      };

      mockingoose(Role).toReturn(_docRole, 'findOne');
      mockingoose(User).toReturn(_docUser, 'save');

      const expectedResponse = {
        status: 'Usuario registrado',
        code: 201,
      };

      const newUserData = {
        name: 'Test',
        email: 'test@email.com',
        password: '12345678',
      };

      const res = await request.post(`/${basePath}/auth/signup`).send(newUserData);

      expect(res.status).toEqual(201);
      expect(res.body.code).toEqual(expectedResponse.code);
      expect(res.body.status).toEqual(expectedResponse.status);
    });
  });
});
