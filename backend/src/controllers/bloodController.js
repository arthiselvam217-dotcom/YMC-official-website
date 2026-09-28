const { BloodDonor, BloodRequest } = require('../models');

/**
 * @desc    Get active urgent blood requests
 * @route   GET /api/bloodshare/needs
 * @access  Public
 */
const getActiveBloodNeeds = async (req, res, next) => {
  try {
    const needs = await BloodRequest.find({ status: 'open' }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: needs.length,
      data: needs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit urgent blood requirement
 * @route   POST /api/bloodshare/needs
 * @access  Public
 */
const createBloodNeed = async (req, res, next) => {
  try {
    const {
      patientName,
      attenderName,
      email,
      number,
      bloodGroup,
      bloodUnits,
      hospitalName,
      location,
      canAffordTravel,
    } = req.body;

    const request = await BloodRequest.create({
      patientName,
      attenderName,
      email,
      number,
      bloodGroup,
      bloodUnits: bloodUnits ? Number(bloodUnits) : 1,
      hospitalName,
      location,
      canAffordTravel: Boolean(canAffordTravel),
    });

    res.status(201).json({
      success: true,
      message: 'Blood request registered successfully and posted to the urgent requests board.',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register as a blood donor
 * @route   POST /api/bloodshare/donors
 * @access  Public
 */
const registerDonor = async (req, res, next) => {
  try {
    const {
      name,
      dob,
      email,
      number,
      bloodGroup,
      location,
      moreLocation,
      receiveMail,
      showOnSearch,
    } = req.body;

    // Check if donor with this email already registered
    const existing = await BloodDonor.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A donor profile with this email address already exists. You can view or update your profile.',
      });
    }

    const donor = await BloodDonor.create({
      name,
      dob: new Date(dob),
      email: email.toLowerCase().trim(),
      number,
      bloodGroup,
      location,
      moreLocation: moreLocation || '',
      receiveMail: receiveMail !== undefined ? Boolean(receiveMail) : true,
      showOnSearch: showOnSearch !== undefined ? Boolean(showOnSearch) : true,
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for registering as a blood donor with YMC BloodShare! Your commitment helps save lives.',
      data: donor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search donors by blood group and/or location
 * @route   GET /api/bloodshare/donors/search
 * @access  Public
 */
const searchDonors = async (req, res, next) => {
  try {
    const { bloodGroup, location } = req.query;

    const query = { showOnSearch: true };

    if (bloodGroup && bloodGroup.trim() !== '') {
      query.bloodGroup = bloodGroup.trim();
    }

    if (location && location.trim() !== '') {
      query.location = { $regex: location.trim(), $options: 'i' };
    }

    const donors = await BloodDonor.find(query)
      .select('name bloodGroup location moreLocation number email createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: donors.length,
      data: donors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get donor profile by email (for self-service management)
 * @route   POST /api/bloodshare/donors/profile
 * @access  Public
 */
const getDonorProfile = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a donor email address',
      });
    }

    const donor = await BloodDonor.findOne({ email: email.toLowerCase().trim() });
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'No registered donor found with this email address.',
      });
    }

    res.status(200).json({
      success: true,
      data: donor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update donor profile
 * @route   PUT /api/bloodshare/donors/:id
 * @access  Public
 */
const updateDonorProfile = async (req, res, next) => {
  try {
    const donor = await BloodDonor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor record not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Donor profile updated successfully',
      data: donor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete donor profile
 * @route   DELETE /api/bloodshare/donors/:id
 * @access  Public
 */
const deleteDonorProfile = async (req, res, next) => {
  try {
    const donor = await BloodDonor.findByIdAndDelete(req.params.id);

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor record not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Your donor profile has been deleted from the registry.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get aggregate donor statistics by blood group
 * @route   GET /api/bloodshare/stats
 * @access  Public
 */
const getBloodStats = async (req, res, next) => {
  try {
    const stats = await BloodDonor.aggregate([
      {
        $group: {
          _id: '$bloodGroup',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      'O+': 0, 'O-': 0,
      'A+': 0, 'A-': 0,
      'B+': 0, 'B-': 0,
      'AB+': 0, 'AB-': 0,
      total: 0,
    };

    stats.forEach((item) => {
      if (result.hasOwnProperty(item._id)) {
        result[item._id] = item.count;
        result.total += item.count;
      }
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveBloodNeeds,
  createBloodNeed,
  registerDonor,
  searchDonors,
  getDonorProfile,
  updateDonorProfile,
  deleteDonorProfile,
  getBloodStats,
};
