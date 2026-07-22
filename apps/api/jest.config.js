/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  // transpile อย่างเดียว ไม่ type-check ข้ามไฟล์ (เร็วขึ้น + ไม่ล้มเพราะ Prisma client ที่ยังไม่ generate)
  transform: { [String.raw`^.+\.ts$`]: ['ts-jest', { isolatedModules: true }] },
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: String.raw`.*\.spec\.ts$`,
  moduleFileExtensions: ['ts', 'js', 'json'],
  // class-transformer (@Expose/@Type) ต้องมี reflect-metadata โหลดก่อนรัน
  setupFiles: ['reflect-metadata'],
  // coverage
  collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts', '!main.ts', '!**/*.module.ts'],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov'],
};
