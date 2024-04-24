import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'APC API Documentation',
      version: '1.0.0',
    },
  },
  apis: [
    `${path.join(__dirname, './controller/*')}`,
    `${path.join(__dirname, './class/*')}`,
    `${path.join(__dirname, './middleware/*')}`,
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
