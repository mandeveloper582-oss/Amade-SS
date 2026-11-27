const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'amade-lms-integration-test-secret';

const User = require('../src/models/User');
const Course = require('../src/models/Course');
const CourseModule = require('../src/models/CourseModule');
const Lesson = require('../src/models/Lesson');
const Quiz = require('../src/models/Quiz');
const Enrollment = require('../src/models/Enrollment');
const app = require('../src/app');

let mongo;
let server;
let baseUrl;
let student;
let studentToken;
let course;
let firstLesson;
let secondLesson;
let quiz;
let enrollment;

before(async () => {
  mongo = await MongoMemoryServer.create({
    binary: { version: '7.0.24' },
    instance: { launchTimeout: 45000, wiredTigerCacheSizeGB: 0.25 },
  });
  await mongoose.connect(mongo.getUri(), { serverSelectionTimeoutMS: 10000 });

  student = await User.create({
    name: 'LMS Test Student',
    email: 'lms-test-student@example.test',
    password: 'integration-test-password',
    role: 'student',
  });
  const instructor = await User.create({
    name: 'LMS Test Instructor',
    email: 'lms-test-instructor@example.test',
    password: 'integration-test-password',
    role: 'instructor',
  });
  course = await Course.create({
    title: 'LMS Integration Test',
    slug: 'lms-integration-test',
    description: 'Temporary test course',
    status: 'published',
    isPublished: true,
    instructor: instructor._id,
  });
  const module = await CourseModule.create({
    course: course._id,
    title: 'Module One',
    order: 1,
    isPublished: true,
  });
  firstLesson = await Lesson.create({
    course: course._id,
    module: module._id,
    title: 'Quiz Lesson',
    order: 1,
    content: 'First lesson content',
    isPublished: true,
  });
  secondLesson = await Lesson.create({
    course: course._id,
    module: module._id,
    title: 'Following Lesson',
    order: 2,
    content: 'Second lesson content',
    isPublished: true,
  });
  quiz = await Quiz.create({
    lesson: firstLesson._id,
    passScore: 80,
    questions: Array.from({ length: 5 }, (_, index) => ({
      prompt: `Question ${index + 1}`,
      options: ['Incorrect', 'Correct', 'Option C', 'Option D'],
      correctOptionIndex: 1,
    })),
  });
  enrollment = await Enrollment.create({
    student: student._id,
    course: course._id,
    status: 'active',
  });

  studentToken = jwt.sign({ id: student._id }, process.env.JWT_SECRET);
  server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
}, { timeout: 90000 });

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState) await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test('lesson progress requires the student learning flow and passing quiz evidence', async () => {
  const request = async (method, path, body) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${studentToken}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, json: await response.json() };
  };

  const lockedLessons = await request('GET', `/students/courses/${course._id}/lessons`);
  assert.equal(lockedLessons.status, 200);
  const hiddenLesson = lockedLessons.json.data.find(({ _id }) => _id === String(secondLesson._id));
  assert.equal(hiddenLesson.isLocked, true);
  assert.equal(hiddenLesson.content, undefined);
  assert.equal(hiddenLesson.englishContent, undefined);
  assert.equal(hiddenLesson.introduction, undefined);
  assert.equal(hiddenLesson.stepByStep, undefined);
  assert.equal(hiddenLesson.oromoSummary, undefined);

  const bypassProgress = await request('PUT', `/enrollments/${enrollment._id}/progress`, {
    completedLessons: [String(firstLesson._id), String(secondLesson._id)],
  });
  assert.equal(bypassProgress.status, 403);

  const completeLockedLesson = await request('PUT', `/students/lessons/${secondLesson._id}/complete`, {});
  assert.equal(completeLockedLesson.status, 403);

  const attempt = await request('POST', `/quizzes/lessons/${firstLesson._id}/submit`, {
    answers: quiz.questions.map(({ _id }) => ({ questionId: String(_id), selectedIndex: 1 })),
    score: 0,
  });
  assert.equal(attempt.status, 200);
  assert.equal(attempt.json.data.score, 100);
  assert.equal(attempt.json.data.passed, true);

  const unlockedLessons = await request('GET', `/students/courses/${course._id}/lessons`);
  const unlockedLesson = unlockedLessons.json.data.find(({ _id }) => _id === String(secondLesson._id));
  assert.equal(unlockedLesson.isLocked, false);

  const completed = await request('PUT', `/students/lessons/${secondLesson._id}/complete`, {});
  assert.equal(completed.status, 200);
  assert.equal(completed.json.data.progress, 100);
  assert.equal(completed.json.data.status, 'completed');

  const certificateRequest = await request('POST', `/students/courses/${course._id}/certificate`, {});
  assert.equal(certificateRequest.status, 202);
  assert.equal(certificateRequest.json.data.status, 'pending');

  const certificateStatus = await request('GET', `/students/courses/${course._id}/certificate/status`);
  assert.equal(certificateStatus.status, 200);
  assert.equal(certificateStatus.json.data.status, 'pending');
});
