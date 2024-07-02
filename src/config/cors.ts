import { CorsOptions } from 'cors';

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:8080',
  'https://apc-frontend-pdes-s1-2024.vercel.app',
  'https://docker-backend-production.up.railway.app'
];

export const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const isValidOrigin = allowedOrigins.includes(origin);

    if (!isValidOrigin) {
      const _errorMsg =
        'The CORS policy for this site does not ' +
        'allow access from the specified Origin.';

      return callback(new Error(_errorMsg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: [
    'Cookie',
    'Cookies',
    'Authorization',
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Access-Control-Allow-Request-Method',
    "Access-Control-Allow-Headers"
  ],
  credentials: true,
};
