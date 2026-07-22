import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import type { UserRepository } from '../../database/repositories/user.repository';

// mock ทั้ง module bcryptjs (hash/compare กลายเป็น jest.fn อัตโนมัติ)
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// user ตัวอย่างที่ repository จะคืนกลับมา (มี field password ที่ต้องไม่หลุดออก response)
const fakeUser = {
  id: 'u1',
  email: 'ada@example.com',
  username: 'ada',
  name: 'Ada Lovelace',
  bio: null,
  avatarUrl: null,
  password: 'hashed-pw',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
};

describe('AuthService', () => {
  let service: AuthService;
  let users: jest.Mocked<Pick<
    UserRepository,
    'findByEmailOrUsername' | 'findByEmail' | 'findById' | 'create'
  >>;
  let jwt: jest.Mocked<Pick<JwtService, 'sign'>>;

  beforeEach(() => {
    users = {
      findByEmailOrUsername: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };
    jwt = { sign: jest.fn().mockReturnValue('signed-token') };

    service = new AuthService(
      users as unknown as UserRepository,
      jwt as unknown as JwtService,
    );
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('สร้าง user ใหม่ + hash password + คืน token และ user (ไม่มี password หลุด)', async () => {
      users.findByEmailOrUsername.mockResolvedValue(null);
      users.create.mockResolvedValue(fakeUser as never);
      mockedBcrypt.hash.mockResolvedValue('hashed-pw' as never);

      const result = await service.register({
        email: 'ada@example.com',
        username: 'ada',
        name: 'Ada Lovelace',
        password: 'password123',
      } as never);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'ada@example.com', password: 'hashed-pw' }),
      );
      expect(jwt.sign).toHaveBeenCalledWith({ sub: 'u1', username: 'ada' });
      expect(result.token).toBe('signed-token');
      expect(result.user.username).toBe('ada');
      // password ต้องถูกตัดทิ้งจาก response
      expect((result.user as Record<string, unknown>).password).toBeUndefined();
    });

    it('โยน ConflictException เมื่ออีเมลซ้ำ', async () => {
      users.findByEmailOrUsername.mockResolvedValue({
        ...fakeUser,
        email: 'ada@example.com',
      } as never);

      await expect(
        service.register({
          email: 'ada@example.com',
          username: 'other',
          name: 'x',
          password: 'password123',
        } as never),
      ).rejects.toThrow(ConflictException);
      expect(users.create).not.toHaveBeenCalled();
    });

    it('โยน ConflictException เมื่อ username ซ้ำ', async () => {
      users.findByEmailOrUsername.mockResolvedValue({
        ...fakeUser,
        email: 'different@example.com',
      } as never);

      await expect(
        service.register({
          email: 'new@example.com',
          username: 'ada',
          name: 'x',
          password: 'password123',
        } as never),
      ).rejects.toThrow('username นี้ถูกใช้แล้ว');
    });
  });

  describe('login', () => {
    it('คืน token เมื่ออีเมล/รหัสผ่านถูกต้อง', async () => {
      users.findByEmail.mockResolvedValue(fakeUser as never);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.login({
        email: 'ada@example.com',
        password: 'password123',
      } as never);

      expect(result.token).toBe('signed-token');
      expect(result.user.email).toBe('ada@example.com');
    });

    it('โยน UnauthorizedException เมื่อไม่พบผู้ใช้', async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'no@one.com', password: 'x' } as never),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('โยน UnauthorizedException เมื่อรหัสผ่านผิด', async () => {
      users.findByEmail.mockResolvedValue(fakeUser as never);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.login({ email: 'ada@example.com', password: 'wrong' } as never),
      ).rejects.toThrow('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    });
  });

  describe('me', () => {
    it('คืนข้อมูล user เมื่อพบ id', async () => {
      users.findById.mockResolvedValue(fakeUser as never);

      const result = await service.me('u1');

      expect(users.findById).toHaveBeenCalledWith('u1');
      expect(result.username).toBe('ada');
    });

    it('โยน UnauthorizedException เมื่อไม่พบ user', async () => {
      users.findById.mockResolvedValue(null);

      await expect(service.me('missing')).rejects.toThrow(UnauthorizedException);
    });
  });
});
