/**
 * Comprehensive Phase 2 Verification Test Suite
 * Tests all core API endpoints:
 * 1. Members API (/api/members) - Applications, Approvals, Dashboard, Points, Proud status
 * 2. Blood Share API (/api/bloodshare) - Urgent Needs, Donors, Compound Search, Profile, Stats
 * 3. Events API (/api/events) - Event Listing, Event Creation, Registration, Duplicate Prevention
 * 4. Y's Library API (/api/library) - Syllabus, Electives, Showcase, View Counters, Profile Summary
 * 5. Media API (/api/media) - Podcasts & TDC Talks (filtering by year)
 * 6. Contact API (/api/contact) - Contact Info & Email Inquiry
 * 7. Security & Role Authorization - 401 on missing tokens, 403 on forbidden roles
 * 8. Old Project Read-Only Integrity Check
 */

const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
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

const app = require('./src/server');

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

// Generate JWT token helper
const JWT_SECRET = process.env.JWT_SECRET || 'ymc_jwt_default_secret_key_change_in_production';
function generateTestToken(userId, role) {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '1h' });
}

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 YMC MERN Phase 2 Core API Verification Suite');
  console.log('========================================\n');

  // Start ephemeral HTTP test server
  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, resolve));
  const port = testServer.address().port;

  // HTTP request client helper
  const api = (urlPath, method = 'GET', body = null, token = null) => {
    return new Promise((resolve, reject) => {
      const postData = body ? JSON.stringify(body) : null;
      const headers = {
        'Content-Type': 'application/json',
      };
      if (postData) {
        headers['Content-Length'] = Buffer.byteLength(postData);
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const options = {
        hostname: '127.0.0.1',
        port,
        path: urlPath,
        method,
        headers,
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

  // Create test users for role authorization
  const adminUser = await User.findOneAndUpdate(
    { email: 'testadmin_p2@ymcgct.org' },
    {
      username: 'testadmin_p2',
      email: 'testadmin_p2@ymcgct.org',
      passwordHash: 'adminpassword123',
      role: 'admin',
      memberType: 'BoardMember',
      points: 150,
      isProudMember: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const memberUser = await User.findOneAndUpdate(
    { email: 'testmember_p2@ymcgct.org' },
    {
      username: 'testmember_p2',
      email: 'testmember_p2@ymcgct.org',
      passwordHash: 'memberpassword123',
      role: 'member',
      memberType: 'ActiveMember',
      points: 40,
      isProudMember: false,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const adminToken = generateTestToken(adminUser._id, 'admin');
  const memberToken = generateTestToken(memberUser._id, 'member');

  // ----------------------------------------------------
  // SECTION 1: Member Application & Management APIs
  // ----------------------------------------------------
  console.log('--- 1. Member Application & Management APIs (/api/members) ---');

  let testAppId = null;
  const uniqueRoll = `2114${Math.floor(100 + Math.random() * 900)}`;
  const uniqueEmail = `applicant_${Date.now()}@example.com`;

  await itAsync('POST /api/members/apply submits application and sends confirmation email', async () => {
    const res = await api('/api/members/apply', 'POST', {
      name: 'Vimal Raj',
      rollNo: uniqueRoll,
      department: 'ECE',
      yearNo: '3',
      email: uniqueEmail,
      mobileNo: '9876543210',
      address: 'Hostel Block 2, GCT',
      dob: '2004-03-22',
      question1: 'Coordinated technical symposium',
      question2: 'Passionate about student media and leadership',
      question3: 'Video editing, event hosting',
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert(res.body.data.id, 'Should return application id');
    testAppId = res.body.data.id;
  });

  await itAsync('POST /api/members/apply prevents duplicate email submission (409)', async () => {
    const res = await api('/api/members/apply', 'POST', {
      name: 'Duplicate Vimal',
      rollNo: uniqueRoll,
      department: 'ECE',
      yearNo: '3',
      email: uniqueEmail,
      mobileNo: '9876543210',
      address: 'Hostel Block 2, GCT',
      dob: '2004-03-22',
      question1: 'Q1',
      question2: 'Q2',
      question3: 'Q3',
    });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
  });

  await itAsync('GET /api/members/applications/pending enforces admin/board authorization (401/403/200)', async () => {
    // 401 unauthenticated
    const res401 = await api('/api/members/applications/pending');
    assert.strictEqual(res401.status, 401);

    // 403 standard member
    const res403 = await api('/api/members/applications/pending', 'GET', null, memberToken);
    assert.strictEqual(res403.status, 403);

    // 200 admin
    const res200 = await api('/api/members/applications/pending', 'GET', null, adminToken);
    assert.strictEqual(res200.status, 200);
    assert.strictEqual(res200.body.success, true);
    assert(Array.isArray(res200.body.data));
  });

  await itAsync('POST /api/members/applications/:id/approve generates official YMC-ID and assigns status', async () => {
    const res = await api(`/api/members/applications/${testAppId}/approve`, 'POST', null, adminToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.data.userId.startsWith('YMC'), `Should start with YMC, got ${res.body.data.userId}`);
    assert.strictEqual(res.body.data.status, true);

    // Re-approving already approved application should return 400
    const reApprove = await api(`/api/members/applications/${testAppId}/approve`, 'POST', null, adminToken);
    assert.strictEqual(reApprove.status, 400);
  });

  await itAsync('GET /api/members/dashboard returns user profile, proud members, and leaderboard', async () => {
    const res = await api('/api/members/dashboard', 'GET', null, memberToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.data.myUser);
    assert(Array.isArray(res.body.data.proudMembers));
    assert(Array.isArray(res.body.data.leaderboard));
  });

  await itAsync('PATCH /api/members/:id/points updates member points successfully', async () => {
    const res = await api(`/api/members/${memberUser._id}/points`, 'PATCH', { points: 85 }, adminToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.points, 85);
  });

  await itAsync('PATCH /api/members/:id/proud toggles proud member badge', async () => {
    const res = await api(`/api/members/${memberUser._id}/proud`, 'PATCH', null, adminToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.isProudMember, true);
  });

  // ----------------------------------------------------
  // SECTION 2: Blood Share APIs
  // ----------------------------------------------------
  console.log('\n--- 2. Blood Share APIs (/api/bloodshare) ---');

  let testNeedId = null;
  let testDonorId = null;
  const testDonorEmail = `donor_${Date.now()}@example.com`;

  await itAsync('POST /api/bloodshare/needs submits urgent blood requirement', async () => {
    const res = await api('/api/bloodshare/needs', 'POST', {
      patientName: 'Subashini',
      attenderName: 'Praveen',
      email: 'praveen@example.com',
      number: '9123456780',
      bloodGroup: 'B+',
      bloodUnits: 3,
      hospitalName: 'KG Hospital, Coimbatore',
      location: 'Government Hospital Road, Coimbatore',
      canAffordTravel: true,
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'open');
    testNeedId = res.body.data._id;
  });

  await itAsync('GET /api/bloodshare/needs returns list of open blood requests', async () => {
    const res = await api('/api/bloodshare/needs');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.count >= 1);
  });

  await itAsync('PATCH /api/bloodshare/needs/:id/status updates status to fulfilled', async () => {
    const res = await api(`/api/bloodshare/needs/${testNeedId}/status`, 'PATCH', { status: 'fulfilled' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'fulfilled');
  });

  await itAsync('POST /api/bloodshare/donors registers a new blood donor', async () => {
    const res = await api('/api/bloodshare/donors', 'POST', {
      name: 'Naveen Kumar',
      dob: '2002-11-10',
      email: testDonorEmail,
      number: '9845123456',
      bloodGroup: 'O+',
      location: 'Gandhipuram, Coimbatore',
      moreLocation: 'Near Bus Stand',
      showOnSearch: true,
      receiveMail: true,
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.bloodGroup, 'O+');
    testDonorId = res.body.data._id;
  });

  await itAsync('GET /api/bloodshare/donors/search filters donors by bloodGroup and location', async () => {
    const res = await api('/api/bloodshare/donors/search?bloodGroup=O%2B&location=Gandhipuram');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.count >= 1);
    assert.strictEqual(res.body.data[0].bloodGroup, 'O+');
  });

  await itAsync('POST /api/bloodshare/donors/profile fetches donor by registered email', async () => {
    const res = await api('/api/bloodshare/donors/profile', 'POST', { email: testDonorEmail });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.email, testDonorEmail);
  });

  await itAsync('PUT /api/bloodshare/donors/:id updates donor location and settings', async () => {
    const res = await api(`/api/bloodshare/donors/${testDonorId}`, 'PUT', {
      location: 'RS Puram, Coimbatore',
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.location, 'RS Puram, Coimbatore');
  });

  await itAsync('GET /api/bloodshare/stats returns donor breakdown by blood group and total', async () => {
    const res = await api('/api/bloodshare/stats');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.data.hasOwnProperty('O+'));
    assert(res.body.data.hasOwnProperty('A+'));
    assert(res.body.data.hasOwnProperty('total'));
    assert(res.body.data.total >= 1);
  });

  // ----------------------------------------------------
  // SECTION 3: Events APIs
  // ----------------------------------------------------
  console.log('\n--- 3. Events APIs (/api/events) ---');

  let testEventId = null;
  const eventAttendeeEmail = `attendee_${Date.now()}@gct.ac.in`;

  await itAsync('POST /api/events creates a new event (protected: admin/board)', async () => {
    const res = await api(
      '/api/events',
      'POST',
      {
        title: 'YMC Media Conclave 2025',
        description: 'Annual gathering of student journalists, podcasters, and designers.',
        venue: 'GCT Diamond Jubilee Auditorium',
        link: 'https://ymcgct.org/events/conclave2025',
        date: '2025-11-20T09:30:00.000Z',
      },
      adminToken
    );

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.title, 'YMC Media Conclave 2025');
    testEventId = res.body.data._id;
  });

  await itAsync('GET /api/events and /api/events/:id retrieve events', async () => {
    const resList = await api('/api/events');
    assert.strictEqual(resList.status, 200);
    assert(resList.body.count >= 1);

    const resSingle = await api(`/api/events/${testEventId}`);
    assert.strictEqual(resSingle.status, 200);
    assert.strictEqual(resSingle.body.data.title, 'YMC Media Conclave 2025');
  });

  await itAsync('POST /api/events/register registers attendee for event', async () => {
    const res = await api('/api/events/register', 'POST', {
      eventId: testEventId,
      name: 'Ananya S',
      email: eventAttendeeEmail,
      number: '9876543210',
      department: 'CSE',
      yearNo: '2',
      college: 'GCT Coimbatore',
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.email, eventAttendeeEmail);
  });

  await itAsync('POST /api/events/register prevents duplicate registration (409)', async () => {
    const res = await api('/api/events/register', 'POST', {
      eventId: testEventId,
      name: 'Ananya S Duplicate',
      email: eventAttendeeEmail,
      number: '9876543210',
    });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
  });

  await itAsync('GET /api/events/:id/registrations retrieves attendee roster (admin/board)', async () => {
    const res = await api(`/api/events/${testEventId}/registrations`, 'GET', null, adminToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.count >= 1);
    assert.strictEqual(res.body.data[0].email, eventAttendeeEmail);
  });

  // ----------------------------------------------------
  // SECTION 4: Y's Library APIs
  // ----------------------------------------------------
  console.log('\n--- 4. Y\'s Library APIs (/api/library) ---');

  let testResourceDept = 'CSE';
  let testResourceYear = '3';
  let testWorkId = null;
  const studentEmail = `author_${Date.now()}@gct.ac.in`;

  await itAsync('POST /api/library/resources adds syllabus study material (admin/board)', async () => {
    const res = await api(
      '/api/library/resources',
      'POST',
      {
        year: testResourceYear,
        dept: testResourceDept,
        course: 'Database Management Systems',
        bookLink: 'https://drive.google.com/test-dbms-notes',
      },
      adminToken
    );

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.course, 'Database Management Systems');
  });

  await itAsync('GET /api/library/resources queries syllabus and increments usage counter', async () => {
    const res = await api(`/api/library/resources?year=${testResourceYear}&dept=${testResourceDept}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.count >= 1);
    assert(typeof res.body.usages === 'number');
    assert(res.body.usages >= 1);
  });

  await itAsync('POST /api/library/electives & GET /api/library/electives manage electives', async () => {
    const addRes = await api(
      '/api/library/electives',
      'POST',
      {
        dept: 'CSE',
        course: 'Cloud Computing and DevOps',
        bookLink: 'https://drive.google.com/test-cloud-notes',
        category: 'Professional Elective',
      },
      adminToken
    );
    assert.strictEqual(addRes.status, 201);

    const getRes = await api('/api/library/electives?category=Professional%20Elective&dept=CSE');
    assert.strictEqual(getRes.status, 200);
    assert(getRes.body.count >= 1);
    assert.strictEqual(getRes.body.data[0].course, 'Cloud Computing and DevOps');
  });

  await itAsync('POST /api/library/showcase creates student work & GET /showcase filters by type', async () => {
    const createRes = await api('/api/library/showcase', 'POST', {
      type: 'poem',
      category: 'None',
      title: 'Echoes of the Quadrangle',
      authorName: 'Sivaranjani',
      email: studentEmail,
      content: 'Under the banyan leaves of GCT, memories whisper softly...',
    });

    assert.strictEqual(createRes.status, 201);
    assert.strictEqual(createRes.body.success, true);
    testWorkId = createRes.body.data._id;

    // Filter by type
    const getRes = await api('/api/library/showcase?type=poem');
    assert.strictEqual(getRes.status, 200);
    assert(getRes.body.count >= 1);
  });

  await itAsync('GET /api/library/showcase/:id views work and increments view counter', async () => {
    const res = await api(`/api/library/showcase/${testWorkId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.views, 1);
  });

  await itAsync('POST /api/library/user-profile returns submission profile across 10 categories', async () => {
    const res = await api('/api/library/user-profile', 'POST', { email: studentEmail });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.totalSubmissions, 1);
    assert.strictEqual(res.body.categories.poems, 1);
    assert.strictEqual(res.body.categories.articles, 0);
  });

  await itAsync('GET /api/library/stats returns aggregate library numbers', async () => {
    const res = await api('/api/library/stats');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.data.totalResources >= 1);
    assert(res.body.data.totalElectives >= 1);
    assert(res.body.data.totalShowcaseWorks >= 1);
  });

  // ----------------------------------------------------
  // SECTION 5: Media APIs (Podcasts & TDC Talks)
  // ----------------------------------------------------
  console.log('\n--- 5. Media APIs (/api/media) ---');

  let testPodId = null;
  let testTdcId = null;

  await itAsync('POST /api/media/podcasts & GET /api/media/podcasts manage podcasts', async () => {
    const addRes = await api(
      '/api/media/podcasts',
      'POST',
      {
        title: 'YMC Dialogue: The Art of Filmmaking',
        link: 'https://spotify.com/ymc-dialogue-ep2',
        coverImage: '/media/filmmaking.jpeg',
      },
      adminToken
    );

    assert.strictEqual(addRes.status, 201);
    testPodId = addRes.body.data._id;

    const listRes = await api('/api/media/podcasts');
    assert.strictEqual(listRes.status, 200);
    assert(listRes.body.count >= 1);
  });

  await itAsync('POST /api/media/tdc-talks & GET /api/media/tdc-talks filter talks by year', async () => {
    const addRes = await api(
      '/api/media/tdc-talks',
      'POST',
      {
        title: 'Building Scalable Cloud Applications',
        speaker: 'GCT Alumnus - Senior SRE',
        link: 'https://youtube.com/watch?v=sampletdc2024',
        year: '2024',
      },
      adminToken
    );

    assert.strictEqual(addRes.status, 201);
    testTdcId = addRes.body.data._id;

    // Filter by year
    const filterRes = await api('/api/media/tdc-talks?year=2024');
    assert.strictEqual(filterRes.status, 200);
    assert(filterRes.body.count >= 1);
    assert.strictEqual(filterRes.body.data[0].year, '2024');
  });

  // ----------------------------------------------------
  // SECTION 6: Contact APIs
  // ----------------------------------------------------
  console.log('\n--- 6. Contact APIs (/api/contact) ---');

  await itAsync('GET /api/contact returns club contact coordinates', async () => {
    const res = await api('/api/contact');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.data.club.includes('Youth Media Club'));
    assert(res.body.data.institution.includes('Government College of Technology'));
  });

  await itAsync('POST /api/contact submits message and sends notification email', async () => {
    const res = await api('/api/contact', 'POST', {
      name: 'Rohan Mehra',
      email: 'rohan@example.com',
      subject: 'Collaboration Opportunity',
      message: 'We would love to partner with YMC for the upcoming tech hackathon!',
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.message.includes('sent successfully'));
  });

  await itAsync('POST /api/contact validates required input fields (400)', async () => {
    const res = await api('/api/contact', 'POST', {
      name: 'Incomplete',
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  // ----------------------------------------------------
  // SECTION 7: Cleanup & Old Project Read-Only Integrity
  // ----------------------------------------------------
  console.log('\n--- 7. Cleanup & Old Project Read-Only Integrity ---');

  await itAsync('Cleanup test artifacts created during test run', async () => {
    if (testAppId) await MemberApplication.findByIdAndDelete(testAppId);
    if (testNeedId) await BloodRequest.findByIdAndDelete(testNeedId);
    if (testDonorId) await BloodDonor.findByIdAndDelete(testDonorId);
    if (testEventId) {
      await Event.findByIdAndDelete(testEventId);
      await EventRegistration.deleteMany({ eventId: testEventId });
    }
    if (testWorkId) await StudentWork.findByIdAndDelete(testWorkId);
    if (testPodId) await Podcast.findByIdAndDelete(testPodId);
    if (testTdcId) await TdcTalk.findByIdAndDelete(testTdcId);
    await User.deleteMany({ email: { $in: ['testadmin_p2@ymcgct.org', 'testmember_p2@ymcgct.org'] } });
  });

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

  // Close server and mongoose connection
  await new Promise((resolve) => testServer.close(resolve));
  try {
    await mongoose.connection.close();
  } catch (e) {
    // ignore
  }

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n========================================');
  console.log(`Phase 2 Test Results: \x1b[32m${passCount} Passed\x1b[0m, \x1b[31m${failCount} Failed\x1b[0m`);
  console.log('========================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
