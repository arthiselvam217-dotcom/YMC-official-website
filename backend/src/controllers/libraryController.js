const {
  LibraryResource,
  ElectiveResource,
  StudentWork,
  UsageCounter,
} = require('../models');
const { sendEmail, formatYmcEmail } = require('../config/mailer');

/**
 * @desc    Get syllabus study materials by year and department (increments visit counter)
 * @route   GET /api/library/resources
 * @access  Public
 */
const getLibraryResources = async (req, res, next) => {
  try {
    const { year, dept } = req.query;

    const query = {};
    if (year) query.year = year;
    if (dept) query.dept = dept.toUpperCase();

    // Increment global library usage counter
    const currentUsages = await UsageCounter.increment('library');

    const resources = await LibraryResource.find(query).sort({ course: 1 });

    res.status(200).json({
      success: true,
      usages: currentUsages,
      count: resources.length,
      data: resources,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add new syllabus study material
 * @route   POST /api/library/resources
 * @access  Private (Admin & Board)
 */
const addLibraryResource = async (req, res, next) => {
  try {
    const { year, dept, course, bookLink } = req.body;

    const resource = await LibraryResource.create({
      year,
      dept: dept.toUpperCase(),
      course,
      bookLink,
    });

    res.status(201).json({
      success: true,
      message: 'Library resource added successfully',
      data: resource,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get electives (Open Electives or Professional Electives)
 * @route   GET /api/library/electives
 * @access  Public
 */
const getElectiveResources = async (req, res, next) => {
  try {
    const { category, dept } = req.query;

    const query = {};
    if (category) query.category = category;
    if (dept) query.dept = dept.toUpperCase();

    const electives = await ElectiveResource.find(query).sort({ course: 1 });

    res.status(200).json({
      success: true,
      count: electives.length,
      data: electives,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add new elective resource
 * @route   POST /api/library/electives
 * @access  Private (Admin & Board)
 */
const addElectiveResource = async (req, res, next) => {
  try {
    const { dept, course, bookLink, category } = req.body;

    const elective = await ElectiveResource.create({
      dept: dept.toUpperCase(),
      course,
      bookLink,
      category,
    });

    res.status(201).json({
      success: true,
      message: 'Elective resource added successfully',
      data: elective,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student creative works (articles, poems, blogs, photography, etc.)
 * @route   GET /api/library/showcase
 * @access  Public
 */
const getShowcaseWorks = async (req, res, next) => {
  try {
    const { type, category } = req.query;

    const query = { status: 'published' };
    if (type) query.type = type;
    if (category && category !== 'None') query.category = category;

    const works = await StudentWork.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: works.length,
      data: works,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single student work detail & increment views
 * @route   GET /api/library/showcase/:id
 * @access  Public
 */
const getWorkDetail = async (req, res, next) => {
  try {
    const work = await StudentWork.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!work) {
      return res.status(404).json({
        success: false,
        message: 'Work item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: work,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new student creative work
 * @route   POST /api/library/showcase
 * @access  Public
 */
const createShowcaseWork = async (req, res, next) => {
  try {
    const { type, category, title, authorName, email, content, link } = req.body;

    const work = await StudentWork.create({
      type,
      category: category || 'None',
      title,
      authorName,
      email: email.toLowerCase().trim(),
      content,
      link: link || '',
      status: 'published',
    });

    res.status(201).json({
      success: true,
      message: 'Your work has been published in the YMC Student Showcase!',
      data: work,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit student work with file attachments via email
 * @route   POST /api/library/submit-work
 * @access  Public
 */
const submitWorkViaEmail = async (req, res, next) => {
  try {
    const { name, email, title, category, link, message } = req.body;
    const files = req.files || [];

    const fileAttachments = files.map((file) => ({
      filename: file.originalname,
      path: file.path,
    }));

    const emailHtml = formatYmcEmail({
      title: 'New Student Work Submission',
      bodyHtml: `
        <p>A new student contribution has been submitted to the <b>YMC Student Showcase</b>:</p>
        <ul>
          <li><b>Name:</b> ${name}</li>
          <li><b>Email:</b> ${email}</li>
          <li><b>Title:</b> ${title}</li>
          <li><b>Category:</b> ${category}</li>
          ${link ? `<li><b>Link:</b> <a href="${link}">${link}</a></li>` : ''}
        </ul>
        <p><b>Content / Note:</b></p>
        <p style="background: #f1f5f9; padding: 12px; border-radius: 4px;">${message || 'No additional message provided.'}</p>
        <p>Attachments: ${files.length} file(s) attached.</p>
      `,
    });

    await sendEmail({
      to: process.env.EMAIL_USER || 'admin@ymcgct.org',
      subject: `YMC Showcase Submission: ${title} by ${name}`,
      html: emailHtml,
      attachments: fileAttachments,
    });

    res.status(200).json({
      success: true,
      message: 'Your work has been submitted successfully to the YMC Library team.',
      attachedFilesCount: files.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student profile summary of submissions across all 10 categories
 * @route   POST /api/library/user-profile
 * @access  Public
 */
const getStudentProfileSummary = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const [
      articles,
      poems,
      microtales,
      blogs,
      photography,
      artsCrafts,
      music,
      dance,
      speech,
      animations,
      others,
    ] = await Promise.all([
      StudentWork.countDocuments({ email: cleanEmail, type: 'article' }),
      StudentWork.countDocuments({ email: cleanEmail, type: 'poem' }),
      StudentWork.countDocuments({ email: cleanEmail, type: 'microtale' }),
      StudentWork.countDocuments({ email: cleanEmail, type: 'blog' }),
      StudentWork.countDocuments({ email: cleanEmail, category: 'Photography' }),
      StudentWork.countDocuments({ email: cleanEmail, category: 'Arts/Crafts' }),
      StudentWork.countDocuments({ email: cleanEmail, category: 'Music' }),
      StudentWork.countDocuments({ email: cleanEmail, category: 'Dance' }),
      StudentWork.countDocuments({ email: cleanEmail, category: 'Speech' }),
      StudentWork.countDocuments({ email: cleanEmail, category: 'Animations' }),
      StudentWork.countDocuments({ email: cleanEmail, category: 'Others' }),
    ]);

    const totalSubmissions =
      articles + poems + microtales + blogs + photography + artsCrafts + music + dance + speech + animations + others;

    res.status(200).json({
      success: true,
      email: cleanEmail,
      totalSubmissions,
      categories: {
        articles,
        poems,
        microtales,
        blogs,
        photography,
        artsCrafts,
        music,
        dance,
        speech,
        animations,
        others,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete library resource
 * @route   DELETE /api/library/resources/:id
 * @access  Private (Admin & Board)
 */
const deleteLibraryResource = async (req, res, next) => {
  try {
    const resource = await LibraryResource.findByIdAndDelete(req.params.id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Library resource not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Library resource deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete elective resource
 * @route   DELETE /api/library/electives/:id
 * @access  Private (Admin & Board)
 */
const deleteElectiveResource = async (req, res, next) => {
  try {
    const elective = await ElectiveResource.findByIdAndDelete(req.params.id);
    if (!elective) {
      return res.status(404).json({
        success: false,
        message: 'Elective resource not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Elective resource deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete student showcase work
 * @route   DELETE /api/library/showcase/:id
 * @access  Private (Admin & Board)
 */
const deleteShowcaseWork = async (req, res, next) => {
  try {
    const work = await StudentWork.findByIdAndDelete(req.params.id);
    if (!work) {
      return res.status(404).json({
        success: false,
        message: 'Student work item not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student work deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get aggregate stats for library & showcase
 * @route   GET /api/library/stats
 * @access  Public
 */
const getLibraryStats = async (req, res, next) => {
  try {
    const [resourcesCount, electivesCount, worksCount, usage] = await Promise.all([
      LibraryResource.countDocuments(),
      ElectiveResource.countDocuments(),
      StudentWork.countDocuments(),
      UsageCounter.findOne({ feature: 'library' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalResources: resourcesCount,
        totalElectives: electivesCount,
        totalShowcaseWorks: worksCount,
        libraryViews: usage ? usage.count : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
