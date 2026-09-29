const express = require('express');
const router = express.Router();
const {
  getLibraryResources,
  addLibraryResource,
  deleteLibraryResource,
  getElectiveResources,
  addElectiveResource,
  deleteElectiveResource,
  getShowcaseWorks,
  getWorkDetail,
  createShowcaseWork,
  deleteShowcaseWork,
  submitWorkViaEmail,
  getStudentProfileSummary,
  getLibraryStats,
} = require('../controllers/libraryController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

/**
 * Public Routes - Library & Study Materials
 */
// Get syllabus books/notes by year & dept (increments library usage counter)
router.get('/resources', getLibraryResources);

// Get electives (Open vs Professional, filterable by dept)
router.get('/electives', getElectiveResources);

// Get aggregate library statistics
router.get('/stats', getLibraryStats);

/**
 * Public Routes - Student Creative Showcase
 */
// Get published student works (articles, poems, blogs, photography, etc.)
router.get('/showcase', getShowcaseWorks);

// Get single student work detail and increment view count
router.get('/showcase/:id', getWorkDetail);

// Publish new student creative work directly
router.post('/showcase', createShowcaseWork);

// Submit student work with file attachments (up to 5 files, 25MB max) via email
router.post('/submit-work', upload.array('attachments', 5), submitWorkViaEmail);

// Get student submission profile counts across all 10 categories
router.post('/user-profile', getStudentProfileSummary);

/**
 * Admin & Board Protected Routes
 */
// Add new syllabus study material
router.post('/resources', protect, authorize('admin', 'board'), addLibraryResource);

// Delete syllabus study material
router.delete('/resources/:id', protect, authorize('admin', 'board'), deleteLibraryResource);

// Add new elective resource
router.post('/electives', protect, authorize('admin', 'board'), addElectiveResource);

// Delete elective resource
router.delete('/electives/:id', protect, authorize('admin', 'board'), deleteElectiveResource);

// Delete student showcase item
router.delete('/showcase/:id', protect, authorize('admin', 'board'), deleteShowcaseWork);

module.exports = router;
