import request from 'supertest';
import { app } from '../app.js';

describe('Health Check Endpoint', () => {
  it('should return health status object with correct structure', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('mongodb');
    expect(response.body).toHaveProperty('redis');
    expect(response.body).toHaveProperty('memory');
    expect(response.body).toHaveProperty('pid');
    expect(response.body).toHaveProperty('nodeVersion');
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('serviceName');
  });

  it('should return status as healthy or unhealthy', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(['healthy', 'unhealthy']).toContain(response.body.status);
  });

  it('should return 200 when healthy', async () => {
    const response = await request(app).get('/api/v1/health');

    if (response.body.status === 'healthy') {
      expect(response.status).toBe(200);
    }
  });

  it('should return valid JSON timestamp', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
  });
});
