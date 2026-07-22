import { TagsService } from './tags.service';
import type { TagRepository } from '../../database/repositories/tag.repository';

// helper สร้าง tag พร้อมจำนวนบทความที่ published
const tag = (id: string, name: string, count: number) => ({
  id,
  name,
  slug: name.toLowerCase(),
  _count: { articles: count },
});

describe('TagsService', () => {
  let service: TagsService;
  let tags: jest.Mocked<Pick<TagRepository, 'findAllWithPublishedCount'>>;

  beforeEach(() => {
    tags = { findAllWithPublishedCount: jest.fn() };
    service = new TagsService(tags as unknown as TagRepository);
  });

  describe('popular', () => {
    it('map _count.articles -> articleCount และเรียงจากมากไปน้อย', async () => {
      tags.findAllWithPublishedCount.mockResolvedValue([
        tag('t1', 'nest', 3),
        tag('t2', 'react', 10),
        tag('t3', 'docker', 5),
      ] as never);

      const result = await service.popular();

      expect(result.map((t) => t.name)).toEqual(['react', 'docker', 'nest']);
      expect(result[0].articleCount).toBe(10);
    });

    it('กรอง tag ที่ไม่มีบทความ published (count = 0) ออก', async () => {
      tags.findAllWithPublishedCount.mockResolvedValue([
        tag('t1', 'nest', 2),
        tag('t2', 'empty', 0),
      ] as never);

      const result = await service.popular();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('nest');
    });

    it('จำกัดผลลัพธ์สูงสุด 20 tag', async () => {
      const many = Array.from({ length: 30 }, (_, i) =>
        tag(`t${i}`, `tag${i}`, i + 1),
      );
      tags.findAllWithPublishedCount.mockResolvedValue(many as never);

      const result = await service.popular();

      expect(result).toHaveLength(20);
    });

    it('คืน array ว่างเมื่อไม่มี tag เลย', async () => {
      tags.findAllWithPublishedCount.mockResolvedValue([]);

      expect(await service.popular()).toEqual([]);
    });
  });
});
