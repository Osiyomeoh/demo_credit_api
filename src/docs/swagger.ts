import swaggerJsdoc from 'swagger-jsdoc';

const version = process.env.npm_package_version || '1.0.0';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Demo Credit Wallet API',
      version,
      description:
        'Lendsqr Demo Credit wallet service. User registration with Karma blacklist check, wallet funding, transfers, and withdrawals.',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    servers: [
      {
        url: process.env.SWAGGER_SERVER_URL || 'http://localhost:3005/api/v1',
      },
    ],
  },
  apis: ['src/routes/**/*.ts'],
});

