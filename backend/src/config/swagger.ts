import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '../config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Parcel Box API',
      version: '1.0.0',
      description: 'REST API documentation for Smart Parcel Box IoT system',
      contact: {
        name: 'Smart Parcel Box Team',
        email: 'support@smartparcelbox.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || `http://localhost:${config.port}/api/v1`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /auth/login endpoint',
        },
        deviceToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-device-token',
          description: 'Device authentication token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user-1234567890' },
            username: { type: 'string', example: 'admin' },
            role: { type: 'string', enum: ['admin', 'user'], example: 'admin' },
            name: { type: 'string', nullable: true, example: 'John Doe' },
            hasPin: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Package: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'pkg-1234567890' },
            deviceId: { type: 'string', example: 'dev-001' },
            tsDetected: { type: 'string', format: 'date-time' },
            tsPhoto: { type: 'string', format: 'date-time', nullable: true },
            tsRelease: { type: 'string', format: 'date-time', nullable: true },
            tsDrop: { type: 'string', format: 'date-time', nullable: true },
            photoUrl: { type: 'string', nullable: true },
            thumbUrl: { type: 'string', nullable: true },
            distanceCm: { type: 'number', example: 15 },
            note: { type: 'string', nullable: true },
            status: { type: 'string', example: 'detected' },
          },
        },
        Device: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'dev-001' },
            name: { type: 'string', example: 'Front Door Box' },
            token: { type: 'string', example: 'device-secret-token' },
            lastSeen: { type: 'string', format: 'date-time' },
            fwVersion: { type: 'string', example: '1.2.0' },
          },
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'evt-1234567890' },
            deviceId: { type: 'string', example: 'dev-001' },
            type: { type: 'string', example: 'door_open' },
            ts: { type: 'string', format: 'date-time' },
            details: { type: 'object' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string', example: 'Package Detected' },
            body: { type: 'string', example: 'A new package has been detected' },
            timestamp: { type: 'string', format: 'date-time' },
            read: { type: 'boolean', example: false },
            type: { type: 'string', example: 'package' },
            data: { type: 'object' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Error message' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Operation successful' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
