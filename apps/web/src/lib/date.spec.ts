import { formatDate, timeAgo } from './date';

describe('formatDate', () => {
  it('จัดรูปแบบวันที่เป็นภาษาไทย (วัน เดือนย่อ ปี)', () => {
    // 2024-01-15 -> "15 ม.ค. 2567" (พ.ศ.)
    const result = formatDate('2024-01-15T00:00:00.000Z');
    expect(result).toContain('15');
    expect(result).toContain('2567');
  });
});

describe('timeAgo', () => {
  // ตรึงเวลาปัจจุบันไว้ที่ค่าคงที่ เพื่อให้ผลลัพธ์ทดสอบได้แน่นอน
  const NOW = new Date('2024-06-01T12:00:00.000Z').getTime();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const ago = (ms: number) => new Date(NOW - ms).toISOString();

  it('น้อยกว่า 1 นาที -> "เมื่อสักครู่"', () => {
    expect(timeAgo(ago(30 * 1000))).toBe('เมื่อสักครู่');
  });

  it('เป็นหน่วยนาที', () => {
    expect(timeAgo(ago(5 * 60 * 1000))).toBe('5 นาทีที่แล้ว');
  });

  it('เป็นหน่วยชั่วโมง', () => {
    expect(timeAgo(ago(3 * 60 * 60 * 1000))).toBe('3 ชั่วโมงที่แล้ว');
  });

  it('เป็นหน่วยวัน (น้อยกว่า 7 วัน)', () => {
    expect(timeAgo(ago(2 * 24 * 60 * 60 * 1000))).toBe('2 วันที่แล้ว');
  });

  it('7 วันขึ้นไป -> fallback เป็นวันที่เต็ม', () => {
    const result = timeAgo(ago(10 * 24 * 60 * 60 * 1000));
    expect(result).toContain('2567'); // เป็นรูปแบบวันที่ ไม่ใช่ "x วันที่แล้ว"
    expect(result).not.toContain('ที่แล้ว');
  });
});
