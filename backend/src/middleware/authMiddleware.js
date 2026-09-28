const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Protect routes: Validates JWT token from HTTP-only cookie or Authorization header
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check HTTP-only cookie first (recommended for web clients)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fall back to Authorization: Bearer <token> header (standard for API clients)
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: No authentication token provided',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'ymc_jwt_default_secret_key_change_in_production'
    );

    // Attach current user object to request (excluding password)
    const user = await User.findById(decoded.id).populate('applicationId');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: Invalid or expired token',
    });
  }
};

/**
 * Role-based authorization middleware
 * Example: authorize('admin', 'board')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user ? req.user.role : 'guest'}' is not authorized to access this resource`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};
