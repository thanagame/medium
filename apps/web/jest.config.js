/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  transform: { [String.raw`^.+\.tsx?$`]: ['ts-jest', { isolatedModules: true }] },
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: String.raw`.*\.spec\.ts$`,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  // coverage — ทดสอบเฉพาะ logic ล้วน (lib/) ไม่รวม React components
  collectCoverageFrom: ['lib/**/*.ts', '!**/*.spec.ts'],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov'],
};
