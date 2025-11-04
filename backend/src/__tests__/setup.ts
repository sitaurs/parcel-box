// Global test setup
import { beforeAll, afterAll } from 'vitest';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.API_TOKEN = 'test-api-token-for-testing';
process.env.MQTT_HOST = 'localhost';
process.env.MQTT_PORT = '1883';
process.env.MQTT_USER = 'test-user';
process.env.MQTT_PASS = 'test-pass';
process.env.WA_API_URL = 'http://localhost:3001';

beforeAll(() => {
  // Setup code before all tests
});

afterAll(() => {
  // Cleanup code after all tests
});
