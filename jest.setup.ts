process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/notifications-test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'jest-test-secret';
