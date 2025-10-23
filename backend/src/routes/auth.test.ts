import request from 'supertest';
import express from 'express';
import authRoutes from './auth';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

describe('Auth Routes', () => {
  describe('POST /api/v1/auth/login', () => {
    it('should return 400 if email or password is missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Email and password are required');
    });

    it('should return 401 for invalid credentials', async () => {
      // Mock prisma to return null (user not found)
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for inactive user', async () => {
      // Mock prisma to return inactive user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'inactive@example.com',
        password: await bcrypt.hash('password123', 10),
        passwordSet: true,
        active: false,
        status: 'INACTIVE',
        userType: 'FAMILIA',
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 200 and tokens for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);

      // Mock prisma to return active user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        password: hashedPassword,
        passwordSet: true,
        active: true,
        status: 'ACTIVE',
        userType: 'ADMINISTRADOR',
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        userType: 'ADMINISTRADOR',
      });

      // Verify token is valid
      const decoded = jwt.verify(response.body.data.token, process.env.JWT_SECRET!) as any;
      expect(decoded.id).toBe('user-1');
      expect(decoded.email).toBe('test@example.com');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 if no token provided', async () => {
      const response = await request(app).get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 200 and user data for valid token', async () => {
      // Generate valid token
      const token = jwt.sign(
        { id: 'user-1', email: 'test@example.com', userType: 'ADMINISTRADOR' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      // Mock prisma to return user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        userType: 'ADMINISTRADOR',
        status: 'ACTIVE',
        active: true,
        phone: '+34600000000',
        dni: '12345678A',
        birthDate: new Date('1990-01-01'),
        nationality: 'Española',
        address: 'Test Address',
        country: 'España',
        autonomousCommunity: 'Madrid',
        province: 'Madrid',
        city: 'Madrid',
        postalCode: '28001',
        centerId: null,
        centerIds: [],
        specialty: null,
        licenseNumber: null,
        allowedEtapas: [],
        allowedCourses: [],
        allowedGroups: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('user-1');
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should return 403 for inactive user', async () => {
      // Generate valid token
      const token = jwt.sign(
        { id: 'user-1', email: 'test@example.com', userType: 'FAMILIA' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      // Mock prisma to return inactive user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        userType: 'FAMILIA',
        status: 'INACTIVE',
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should return 401 if no refresh token provided', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 200 and new tokens for valid refresh token', async () => {
      // Generate valid refresh token
      const refreshToken = jwt.sign(
        { id: 'user-1' },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '7d' }
      );

      // Mock prisma to return user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        userType: 'ADMINISTRADOR',
        status: 'ACTIVE',
        active: true,
      });

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.id).toBe('user-1');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should return 200 even without token', async () => {
      const response = await request(app).post('/api/v1/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Logged out successfully');
    });

    it('should return 200 with valid token', async () => {
      const token = jwt.sign(
        { id: 'user-1', email: 'test@example.com', userType: 'ADMINISTRADOR' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
