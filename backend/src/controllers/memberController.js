const { MemberApplication, User } = require('../models');
const { sendEmail, formatYmcEmail } = require('../config/mailer');

/**
 * @desc    Submit new membership application
 * @route   POST /api/members/apply
 * @access  Public
 */
const submitApplication = async (req, res, next) => {
  try {
    const {
      name,
      rollNo,
      department,
      yearNo,
      email,
      mobileNo,
      socialMedia,
      linkedId,
      address,
      dob,
      question1,
      question2,
      question3,
    } = req.body;

    // Check if application already submitted with this email
    const existing = await MemberApplication.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An application with this email address has already been submitted and is currently being processed.',
      });
    }

    const application = await MemberApplication.create({
      name,
      rollNo,
      department,
      yearNo,
      email: email.toLowerCase().trim(),
      mobileNo,
      socialMedia,
      linkedId,
      address,
      dob,
      question1,
      question2,
      question3,
    });

    // Send confirmation email to applicant
    const emailHtml = formatYmcEmail({
      title: 'Membership Registration Received',
      bodyHtml: `
        <p>Dear ${name},</p>
        <p>Thank you for applying to join <b>YMC GCT</b> (Youth Media Club).</p>
        <p>Your application has been received successfully and will be reviewed by our Executive Board shortly.</p>
        <p>Once verified, you will receive an official invitation link to set up your membership account and receive your official YMC ID.</p>
        <br/>
        <p>Warm regards,<br><b>YMC Executive Board</b><br>Government College of Technology, Coimbatore</p>
      `,
    });

    await sendEmail({
      to: application.email,
      subject: 'YMC GCT - Membership Application Confirmation',
      html: emailHtml,
    });

    res.status(201).json({
      success: true,
      message: 'Your application has been submitted successfully and will be reviewed by our team shortly.',
      data: {
        id: application._id,
        name: application.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all pending applications for review
 * @route   GET /api/members/applications/pending
 * @access  Private (Admin & Board)
 */
const getPendingApplications = async (req, res, next) => {
  try {
    const applications = await MemberApplication.find({ status: false }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve application and dispatch invitation email
 * @route   POST /api/members/applications/:id/approve
 * @access  Private (Admin & Board)
 */
const approveApplication = async (req, res, next) => {
  try {
    const application = await MemberApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Membership application not found',
      });
    }

    if (application.status) {
      return res.status(400).json({
        success: false,
        message: 'This application has already been approved',
      });
    }

    // Generate official YMC member ID (e.g. YMC2001)
    const ymcId = await MemberApplication.generateYmcId(application.yearNo);
    application.userId = ymcId;
    application.status = true;
    await application.save();

    // Construct account creation link
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const activationUrl = `${clientUrl}/register-account?memid=${ymcId}&id=${application._id}`;

    // Send invitation email
    const emailHtml = formatYmcEmail({
      title: "Welcome to YMC! You're Accepted",
      bodyHtml: `
        <p>Dear ${application.name},</p>
        <p>Greetings from <b>YMC GCT</b>! We are thrilled to welcome you as a member of our club.</p>
        <p>Your official membership ID is: <b style="font-size: 16px; color: #1e3a8a;">${ymcId}</b></p>
        <p>Please click the button below to complete your registration and activate your member account:</p>
      `,
      actionButton: {
        text: 'Activate Member Account',
        url: activationUrl,
      },
    });

    await sendEmail({
      to: application.email,
      subject: 'Welcome to YMC GCT - Membership Activation',
      html: emailHtml,
    });

    res.status(200).json({
      success: true,
      message: `Application approved successfully. Member ID ${ymcId} assigned and invitation email dispatched.`,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get member dashboard data (user details, proud members, points leaderboard)
 * @route   GET /api/members/dashboard
 * @access  Private (All authenticated members)
 */
const getMemberDashboard = async (req, res, next) => {
  try {
    const myUser = await User.findById(req.user._id).populate('applicationId');

    // Proud members
    const proudMembers = await User.find({ isProudMember: true })
      .select('username memberType points isProudMember applicationId')
      .populate('applicationId', 'name userId department yearNo')
      .sort({ points: -1 });

    // Active members leaderboard
    const leaderboard = await User.find({ memberType: 'ActiveMember' })
      .select('username memberType points isProudMember applicationId')
      .populate('applicationId', 'name userId department yearNo')
      .sort({ points: -1 });

    res.status(200).json({
      success: true,
      data: {
        myUser,
        proudMembers,
        leaderboard,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all members for points management & admin views
 * @route   GET /api/members/all
 * @access  Private (Admin & Board)
 */
const getAllMembers = async (req, res, next) => {
  try {
    const members = await User.find()
      .populate('applicationId')
      .sort({ points: -1 });

    res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update member points
 * @route   PATCH /api/members/:id/points
 * @access  Private (Admin & Board)
 */
const updateMemberPoints = async (req, res, next) => {
  try {
    const { points } = req.body;

    if (points === undefined || isNaN(points)) {
      return res.status(400).json({
        success: false,
        message: 'A valid numeric points value must be provided',
      });
    }

    const member = await User.findByIdAndUpdate(
      req.params.id,
      { points: Number(points) },
      { new: true, runValidators: true }
    ).populate('applicationId');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Points updated successfully',
      data: {
        id: member._id,
        username: member.username,
        points: member.points,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle proud member badge
 * @route   PATCH /api/members/:id/proud
 * @access  Private (Admin & Board)
 */
const toggleProudMember = async (req, res, next) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    member.isProudMember = !member.isProudMember;
    await member.save();

    res.status(200).json({
      success: true,
      message: `Member ${member.isProudMember ? 'marked as' : 'removed from'} Proud Member`,
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitApplication,
  getPendingApplications,
  approveApplication,
  getMemberDashboard,
  getAllMembers,
  updateMemberPoints,
  toggleProudMember,
};
