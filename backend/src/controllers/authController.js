const jwt = require('jsonwebtoken');
const { User, MemberApplication } = require('../models');
const { sendEmail, formatYmcEmail } = require('../config/mailer');

/**
 * Helper to generate JWT token and cookie options
 */
const sendTokenResponse = (user, statusCode, res) => {
  const secret = process.env.JWT_SECRET || 'ymc_jwt_default_secret_key_change_in_production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  const token = jwt.sign({ id: user._id, role: user.role }, secret, {
    expiresIn,
  });

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      memberType: user.memberType,
      points: user.points,
      isProudMember: user.isProudMember,
      applicationId: user.applicationId,
    },
  });
};

/**
 * @desc    Authenticate member / admin & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username and password',
      });
    }

    // Allow login with either username or email
    const user = await User.findOne({
      $or: [{ username: username.trim() }, { email: username.trim().toLowerCase() }],
    }).populate('applicationId');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Could not find an account with that username or email.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password does not match.',
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log out current user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logoutUser = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully',
  });
};

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('applicationId');
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Complete member account registration (from invitation link)
 * @route   POST /api/auth/register-member
 * @access  Public (invitation-based)
 */
const completeRegistration = async (req, res, next) => {
  try {
    const { userId, applicationId, username, password } = req.body;

    if (!userId || !applicationId || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields (userId, applicationId, username, password) are required',
      });
    }

    // Find the approved application
    const application = await MemberApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Membership application record not found',
      });
    }

    // Verify application status and ID match
    if (application.userId !== userId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid member ID for this application',
      });
    }

    if (!application.status) {
      return res.status(400).json({
        success: false,
        message: 'This application has not been approved yet by the YMC Executive Board',
      });
    }

    if (application.joined) {
      return res.status(400).json({
        success: false,
        message: 'An account has already been registered for this membership ID',
      });
    }

    // Check if username or email already taken
    const existingUser = await User.findOne({
      $or: [{ username }, { email: application.email }],
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this username or email already exists',
      });
    }

    // Create User record
    const user = await User.create({
      username: username.trim(),
      email: application.email,
      passwordHash: password,
      role: 'member',
      memberType: 'ActiveMember',
      points: 0,
      applicationId: application._id,
    });

    // Mark application as joined
    application.joined = true;
    await application.save();

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send password reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a registered email address',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Return 200 to prevent email enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been dispatched.',
      });
    }

    // Generate reset token valid for 1 hour
    const secret = (process.env.JWT_SECRET || 'ymc_jwt_default_secret') + user.passwordHash;
    const resetToken = jwt.sign({ id: user._id, email: user.email }, secret, {
      expiresIn: '1h',
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?id=${user._id}&token=${resetToken}`;

    const emailHtml = formatYmcEmail({
      title: 'Password Reset Request',
      bodyHtml: `
        <p>Dear ${user.username},</p>
        <p>We received a request to reset the password for your <b>YMC</b> account.</p>
        <p>Please click the button below to set a new password. This link is valid for 1 hour.</p>
      `,
      actionButton: {
        text: 'Reset Password',
        url: resetUrl,
      },
    });

    await sendEmail({
      to: user.email,
      subject: 'YMC - Password Reset Request',
      html: emailHtml,
    });

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been dispatched.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { userId, token, newPassword } = req.body;

    if (!userId || !token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'User ID, token, and new password are required',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User record not found',
      });
    }

    // Verify token using secret keyed with current passwordHash
    const secret = (process.env.JWT_SECRET || 'ymc_jwt_default_secret') + user.passwordHash;
    try {
      jwt.verify(token, secret);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset link',
      });
    }

    // Set new password (pre-save hook will hash it)
    user.passwordHash = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. You may now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginUser,
  logoutUser,
  getMe,
  completeRegistration,
  forgotPassword,
  resetPassword,
};
