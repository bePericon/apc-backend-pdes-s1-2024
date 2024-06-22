import config from '../config/config';
import axios from 'axios';

const basePath = config.base_path;

describe('auth controller', () => {
  describe('POST /api/auth/login', () => {
    it('should return success response with logged user', async () => {
      const expectedResponse = {
        status: 'Se ha iniciado sesión correctamente',
        code: 200,
      };

      const newUserData = {
        email: 'admin@email.com',
        password: '12345678',
      };

      const { status, data } = await axios.post(`${basePath}/auth/login`, newUserData);

      expect(status).toEqual(200);
      expect(data.code).toEqual(expectedResponse.code);
      expect(data.status).toEqual(expectedResponse.status);
    });
  });
});
