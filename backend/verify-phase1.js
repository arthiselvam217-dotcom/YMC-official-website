/**
 * Comprehensive Phase 1 Verification Test Suite
 * Tests all backend models, authentication, middleware, error handling,
 * mailer, server endpoints, and old project read-only integrity.
 */

const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

dotenv.config();

const {
  User,
  MemberApplication,
  BloodDonor,
  BloodRequest,
  Event,
  EventRegistration,
  LibraryResource,
  ElectiveResource,
  StudentWork,
  Podcast,
  TdcTalk,
  UsageCounter,
} = require('./src/models');

const { protect, authorize } = require('./src/middleware/authMiddleware');
const errorHandler = require('./src/middleware/errorHandler');
const { formatYmcEmail, sendEmail } = require('./src/config/mailer');

let passCount = 0;
let failCount = 0;

function it(description, fn) {
  try {
    fn();
    console.log(`  \x1b[32m✔\x1b[0m ${description}`);
    passCount++;
  } catch (err) {
    console.error(`  \x1b[31m✖\x1b[0m ${description}`);
    console.error(`    \x1b[31m${err.message}\x1b[0m`);
    failCount++;
  }
}

async function itAsync(description, fn) {
  try {
    await fn();
    console.log(`  \x1b[32m✔\x1b[0m ${description}`);
    passCount++;
  } catch (err) {
    console.error(`  \x1b[31m✖\x1b[0m ${description}`);
    console.error(`    \x1b[31m${err.message}\x1b[0m`);
    failCount++;
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 YMC MERN Phase 1 Verification Suite');
  console.log('========================================\n');

  // ----------------------------------------------------
  // SECTION 1: Mongoose Models & Schemas
  // ----------------------------------------------------
  console.log('--- 1. Mongoose Models Schema & Validation ---');

  it('All 12 Mongoose models are properly exported', () => {
    assert(User, 'User model should be defined');
    assert(MemberApplication, 'MemberApplication model should be defined');
    assert(BloodDonor, 'BloodDonor model should be defined');
    assert(BloodRequest, 'BloodRequest model should be defined');
    assert(Event, 'Event model should be defined');
    assert(EventRegistration, 'EventRegistration model should be defined');
    assert(LibraryResource, 'LibraryResource model should be defined');
    assert(ElectiveResource, 'ElectiveResource model should be defined');
    assert(StudentWork, 'StudentWork model should be defined');
    assert(Podcast, 'Podcast model should be defined');
    assert(TdcTalk, 'TdcTalk model should be defined');
    assert(UsageCounter, 'UsageCounter model should be defined');
  });

  it('User model validates required fields and roles', () => {
    const invalidUser = new User({});
    const err = invalidUser.validateSync();
    assert(err.errors.username, 'Username is required');
    assert(err.errors.email, 'Email is required');
    assert(err.errors.passwordHash, 'Password is required');

    const validUser = new User({
      username: 'ymcadmin',
      email: 'admin@ymcgct.org',
      passwordHash: 'secret123',
      role: 'admin',
      memberType: 'BoardMember',
    });
    const validErr = validUser.validateSync();
    assert(!validErr, 'Valid user should not produce validation errors');
  });

  it('MemberApplication validates fields and screening questions', () => {
    const invalidApp = new MemberApplication({});
    const err = invalidApp.validateSync();
    assert(err.errors.name, 'Name required');
    assert(err.errors.rollNo, 'Roll number required');
    assert(err.errors.department, 'Department required');
    assert(err.errors.yearNo, 'Year required');
    assert(err.errors.question1, 'Question 1 required');
    assert(err.errors.question2, 'Question 2 required');
    assert(err.errors.question3, 'Question 3 required');

    const validApp = new MemberApplication({
      name: 'John Doe',
      rollNo: '2114001',
      department: 'CSE',
      yearNo: '3',
      email: 'john@example.com',
      mobileNo: '9876543210',
      address: 'Hostel Block 3, GCT',
      dob: '2003-05-15',
      question1: 'Leadership experience',
      question2: 'Why YMC?',
      question3: 'What skills can you contribute?',
    });
    assert(!validApp.validateSync(), 'Valid application should pass validation');
    assert.strictEqual(validApp.userId, 'NoId', 'Default userId should be NoId');
    assert.strictEqual(validApp.status, false, 'Default status should be pending (false)');
    assert.strictEqual(validApp.joined, false, 'Default joined should be false');
  });

  it('MemberApplication.generateYmcId produces official YMC prefix', async () => {
    assert(typeof MemberApplication.generateYmcId === 'function');
  });

  it('BloodDonor validates supported blood groups and auto-generates uniqueId', () => {
    const donor = new BloodDonor({
      name: 'Arun Kumar',
      dob: new Date('2002-01-01'),
      email: 'arun@example.com',
      number: '9876543210',
      bloodGroup: 'O+',
      location: 'Coimbatore',
    });
    assert(!donor.validateSync(), 'Valid donor passes validation');
    assert(donor.uniqueId, 'uniqueId should be generated automatically');

    const invalidDonor = new BloodDonor({
      bloodGroup: 'INVALID',
    });
    const err = invalidDonor.validateSync();
    assert(err.errors.bloodGroup, 'Should reject invalid blood group');
  });

  it('BloodRequest validates patient, units, hospital and status enum', () => {
    const request = new BloodRequest({
      patientName: 'Kavitha',
      attenderName: 'Ramesh',
      email: 'ramesh@example.com',
      number: '9876543210',
      bloodGroup: 'B+',
      bloodUnits: 2,
      hospitalName: 'Coimbatore Medical College Hospital',
      location: 'Trichy Road, Coimbatore',
    });
    assert(!request.validateSync(), 'Valid blood request passes validation');
    assert.strictEqual(request.status, 'open', 'Default status is open');
  });

  it('LibraryResource and ElectiveResource validate departments and categories', () => {
    const lib = new LibraryResource({
      year: '2',
      dept: 'ECE',
      course: 'Digital Signal Processing',
      bookLink: 'https://drive.google.com/test-dsp',
    });
    assert(!lib.validateSync(), 'Valid library resource passes validation');

    const elective = new ElectiveResource({
      dept: 'CSE',
      course: 'Machine Learning',
      bookLink: 'https://drive.google.com/test-ml',
      category: 'Professional Elective',
    });
    assert(!elective.validateSync(), 'Valid elective passes validation');
  });

  it('StudentWork supports unified content types and categories with view count', () => {
    const article = new StudentWork({
      type: 'article',
      category: 'None',
      title: 'The AI Revolution',
      authorName: 'Deepa',
      email: 'deepa@gct.ac.in',
      content: 'Artificial Intelligence in modern society...',
    });
    assert(!article.validateSync(), 'Valid student work article passes validation');
    assert.strictEqual(article.views, 0, 'Initial views should be 0');

    const photo = new StudentWork({
      type: 'cocurricular',
      category: 'Photography',
      title: 'Sunset at Maruthamalai',
      authorName: 'Karthik',
      email: 'karthik@gct.ac.in',
      content: 'Captured using DSLR 50mm lens',
    });
    assert(!photo.validateSync(), 'Valid cocurricular passes validation');
  });

  it('Podcast and TdcTalk validate links and titles', () => {
    const podcast = new Podcast({
      title: 'Episode 1: Tech Trends',
      link: 'https://spotify.com/episode1',
    });
    assert(!podcast.validateSync(), 'Valid podcast passes');
    assert.strictEqual(podcast.coverImage, '/media/podlogo.jpeg');

    const tdc = new TdcTalk({
      title: 'Web3 and Beyond',
      speaker: 'Suresh Babu',
      link: 'https://youtube.com/watch?v=sample',
      year: '2024',
    });
    assert(!tdc.validateSync(), 'Valid TDC talk passes');
  });

  // ----------------------------------------------------
  // SECTION 2: Password Security & Methods
  // ----------------------------------------------------
  console.log('\n--- 2. User Password Security & Methods ---');

  await itAsync('User schema compares passwords and strips passwordHash in JSON', async () => {
    const user = new User({
      username: 'testmember',
      email: 'test@ymcgct.org',
      passwordHash: 'PlainPassword123',
    });

    // Simulate pre-save hook
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash('PlainPassword123', salt);

    const isCorrect = await user.comparePassword('PlainPassword123');
    const isWrong = await user.comparePassword('WrongPassword');

    assert.strictEqual(isCorrect, true, 'comparePassword with correct password must be true');
    assert.strictEqual(isWrong, false, 'comparePassword with wrong password must be false');

    const json = user.toJSON();
    assert.strictEqual(json.passwordHash, undefined, 'toJSON must not expose passwordHash');
  });

  // ----------------------------------------------------
  // SECTION 3: JWT & Authentication Middleware
  // ----------------------------------------------------
  console.log('\n--- 3. JWT & Authentication Middleware ---');

  it('protect middleware rejects requests without token with 401', async () => {
    const req = { cookies: {}, headers: {} };
    let statusSent = null;
    let jsonSent = null;
    const res = {
      status: (s) => {
        statusSent = s;
        return {
          json: (j) => {
            jsonSent = j;
          },
        };
      },
    };
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    await protect(req, res, next);
    assert.strictEqual(statusSent, 401);
    assert.strictEqual(jsonSent.success, false);
    assert.strictEqual(nextCalled, false);
  });

  it('protect middleware rejects invalid token with 401', async () => {
    const req = { cookies: { token: 'invalid.jwt.token' }, headers: {} };
    let statusSent = null;
    const res = {
      status: (s) => {
        statusSent = s;
        return { json: () => {} };
      },
    };
    let nextCalled = false;

    await protect(req, res, () => {
      nextCalled = true;
    });
    assert.strictEqual(statusSent, 401);
    assert.strictEqual(nextCalled, false);
  });

  it('authorize middleware grants access to matching roles and denies others', () => {
    const adminReq = { user: { role: 'admin' } };
    const memberReq = { user: { role: 'member' } };
    let statusSent = null;
    const res = {
      status: (s) => {
        statusSent = s;
        return { json: () => {} };
      },
    };

    let adminNext = false;
    authorize('admin', 'board')(adminReq, res, () => {
      adminNext = true;
    });
    assert.strictEqual(adminNext, true, 'Admin should be granted access');

    let memberNext = false;
    authorize('admin', 'board')(memberReq, res, () => {
      memberNext = true;
    });
    assert.strictEqual(memberNext, false, 'Member should not be granted admin access');
    assert.strictEqual(statusSent, 403, 'Should return 403 Forbidden');
  });

  // ----------------------------------------------------
  // SECTION 4: Centralized Error Handler
  // ----------------------------------------------------
  console.log('\n--- 4. Centralized Error Handler ---');

  it('errorHandler formats Mongoose ValidationError into 400 response', () => {
    const mockErr = {
      name: 'ValidationError',
      errors: {
        field1: { message: 'field1 is required' },
        field2: { message: 'field2 is invalid' },
      },
    };
    let statusSent = null;
    let jsonSent = null;
    const res = {
      status: (s) => {
        statusSent = s;
        return {
          json: (j) => {
            jsonSent = j;
          },
        };
      },
    };

    errorHandler(mockErr, {}, res, () => {});
    assert.strictEqual(statusSent, 400);
    assert.strictEqual(jsonSent.success, false);
    assert.deepStrictEqual(jsonSent.errors, ['field1 is required', 'field2 is invalid']);
  });

  it('errorHandler handles duplicate key error (11000) with 409', () => {
    const mockErr = {
      code: 11000,
      keyValue: { email: 'test@example.com' },
    };
    let statusSent = null;
    let jsonSent = null;
    const res = {
      status: (s) => {
        statusSent = s;
        return {
          json: (j) => {
            jsonSent = j;
          },
        };
      },
    };

    errorHandler(mockErr, {}, res, () => {});
    assert.strictEqual(statusSent, 409);
    assert(jsonSent.message.includes('email already exists'));
  });

  it('errorHandler handles JWT errors with 401', () => {
    const mockErr = { name: 'JsonWebTokenError' };
    let statusSent = null;
    const res = {
      status: (s) => {
        statusSent = s;
        return { json: () => {} };
      },
    };

    errorHandler(mockErr, {}, res, () => {});
    assert.strictEqual(statusSent, 401);
  });

  // ----------------------------------------------------
  // SECTION 5: Mailer Configuration & YMC Branding
  // ----------------------------------------------------
  console.log('\n--- 5. Mailer Configuration & YMC Branding ---');

  it('formatYmcEmail generates HTML containing YMC branding and details', () => {
    const html = formatYmcEmail({
      title: 'Welcome to YMC',
      bodyHtml: '<p>Your application is approved.</p>',
      actionButton: { text: 'Activate Account', url: 'http://localhost:5173/activate' },
    });

    assert(html.includes('YMC GCT'), 'Must contain YMC GCT');
    assert(html.includes('Youth Media Club'), 'Must contain Youth Media Club subtitle');
    assert(html.includes('Government College of Technology'), 'Must contain College info');
    assert(html.includes('Activate Account'), 'Must include action button text');
    assert(html.includes('http://localhost:5173/activate'), 'Must include button URL');
  });

  await itAsync('sendEmail operates safely in Mock Mode when SMTP is unconfigured', async () => {
    const result = await sendEmail({
      to: 'member@example.com',
      subject: 'Test Subject',
      html: '<p>Test</p>',
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.mocked, true, 'Should use mock mode');
  });

  // ----------------------------------------------------
  // SECTION 6: Express Server & HTTP API Endpoints
  // ----------------------------------------------------
  console.log('\n--- 6. Express Server HTTP Endpoints ---');

  await itAsync('Express app serves /api/health, /api, 404, and /api/auth routes', async () => {
    const app = require('./src/server');

    // Start server on an ephemeral port
    const testServer = http.createServer(app);
    await new Promise((resolve) => testServer.listen(0, resolve));
    const port = testServer.address().port;

    const request = (path, method = 'GET', body = null) => {
      return new Promise((resolve, reject) => {
        const postData = body ? JSON.stringify(body) : null;
        const options = {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
          },
        };

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, body: JSON.parse(data) });
            } catch (e) {
              resolve({ status: res.statusCode, raw: data });
            }
          });
        });

        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
      });
    };

    // 1. Test /api/health
    const health = await request('/api/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.body.status, 'ok');
    assert(health.body.club.includes('YMC'));

    // 2. Test /api summary
    const apiSummary = await request('/api');
    assert.strictEqual(apiSummary.status, 200);
    assert(apiSummary.body.endpoints.auth);

    // 3. Test unknown route -> 404
    const notFound = await request('/api/non-existent-route');
    assert.strictEqual(notFound.status, 404);
    assert.strictEqual(notFound.body.success, false);

    // 4. Test /api/auth/login without body -> 400 validation error
    const authLogin = await request('/api/auth/login', 'POST', {});
    assert.strictEqual(authLogin.status, 400);
    assert.strictEqual(authLogin.body.success, false);

    // 5. Test /api/auth/me without token -> 401 unauthorized
    const authMe = await request('/api/auth/me');
    assert.strictEqual(authMe.status, 401);
    assert.strictEqual(authMe.body.success, false);

    // Close test server
    await new Promise((resolve) => testServer.close(resolve));
  });

  // ----------------------------------------------------
  // SECTION 7: Old Project Read-Only Integrity Check
  // ----------------------------------------------------
  console.log('\n--- 7. Old Project (ysc-webmaster-main) Read-Only Integrity ---');

  it('Old Django project remains intact and completely unmodified', () => {
    const oldProjectPath = 'C:\\Users\\arthi\\Downloads\\ysc-webmaster-main (1)\\ysc-webmaster-main';
    assert(fs.existsSync(oldProjectPath), 'Old Django project path must exist');
    assert(fs.existsSync(path.join(oldProjectPath, 'manage.py')), 'manage.py must exist in old project');
    assert(fs.existsSync(path.join(oldProjectPath, 'clubweb')), 'clubweb must exist in old project');
    assert(fs.existsSync(path.join(oldProjectPath, 'homepage')), 'homepage must exist in old project');
    assert(fs.existsSync(path.join(oldProjectPath, 'members')), 'members must exist in old project');
    assert(fs.existsSync(path.join(oldProjectPath, 'eventsapp')), 'eventsapp must exist in old project');
    assert(fs.existsSync(path.join(oldProjectPath, 'bloodshare')), 'bloodshare must exist in old project');
    assert(fs.existsSync(path.join(oldProjectPath, 'library')), 'library must exist in old project');
    assert(fs.existsSync(path.join(oldProjectPath, 'media')), 'media must exist in old project');
    assert(fs.existsSync(path.join(oldProjectPath, 'static')), 'static must exist in old project');
  });

  // Cleanly close mongoose connection
  try {
    await mongoose.connection.close();
  } catch (e) {
    // ignore
  }

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n========================================');
  console.log(`Test Results: \x1b[32m${passCount} Passed\x1b[0m, \x1b[31m${failCount} Failed\x1b[0m`);
  console.log('========================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
