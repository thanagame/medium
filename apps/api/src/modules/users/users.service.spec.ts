import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import type { UserRepository } from '../../database/repositories/user.repository';

const fakeProfile = {
  id: 'u1',
  username: 'ada',
  name: 'Ada Lovelace',
  bio: null,
  avatarUrl: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  _count: { articles: 4 },
};

describe('UsersService', () => {
  let service: UsersService;
  let users: jest.Mocked<Pick<
    UserRepository,
    'findByUsernameWithArticleCount' | 'update'
  >>;

  beforeEach(() => {
    users = {
      findByUsernameWithArticleCount: jest.fn(),
      update: jest.fn(),
    };
    service = new UsersService(users as unknown as UserRepository);
  });

  describe('getProfile', () => {
    it('คืนโปรไฟล์พร้อม articleCount จาก _count.articles', async () => {
      users.findByUsernameWithArticleCount.mockResolvedValue(fakeProfile as never);

      const result = await service.getProfile('ada');

      expect(result.user.username).toBe('ada');
      expect(result.articleCount).toBe(4);
    });

    it('โยน NotFoundException เมื่อไม่พบผู้ใช้', async () => {
      users.findByUsernameWithArticleCount.mockResolvedValue(null);

      await expect(service.getProfile('ghost')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('ส่งเฉพาะ field ที่ถูกกำหนดค่าเข้ามา (name)', async () => {
      users.update.mockResolvedValue({ ...fakeProfile, name: 'New Name' } as never);

      await service.updateProfile('u1', { name: 'New Name' } as never);

      expect(users.update).toHaveBeenCalledWith('u1', { name: 'New Name' });
    });

    it('แปลง bio/avatarUrl ที่เป็น string ว่าง -> null', async () => {
      users.update.mockResolvedValue(fakeProfile as never);

      await service.updateProfile('u1', { bio: '', avatarUrl: '' } as never);

      expect(users.update).toHaveBeenCalledWith('u1', {
        bio: null,
        avatarUrl: null,
      });
    });

    it('ไม่ส่ง field ที่เป็น undefined (patch ว่าง)', async () => {
      users.update.mockResolvedValue(fakeProfile as never);

      await service.updateProfile('u1', {} as never);

      expect(users.update).toHaveBeenCalledWith('u1', {});
    });
  });
});
