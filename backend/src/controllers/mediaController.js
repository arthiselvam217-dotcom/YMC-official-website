const { Podcast, TdcTalk } = require('../models');

/**
 * @desc    Get all podcast episodes
 * @route   GET /api/media/podcasts
 * @access  Public
 */
const getPodcasts = async (req, res, next) => {
  try {
    const podcasts = await Podcast.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: podcasts.length,
      data: podcasts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add new podcast episode
 * @route   POST /api/media/podcasts
 * @access  Private (Admin & Board)
 */
const addPodcast = async (req, res, next) => {
  try {
    const { title, link, coverImage } = req.body;

    const podcast = await Podcast.create({
      title,
      link,
      coverImage: coverImage || '/media/podlogo.jpeg',
    });

    res.status(201).json({
      success: true,
      message: 'Podcast added successfully',
      data: podcast,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all TDC (Tech Developer's Community) talks
 * @route   GET /api/media/tdc-talks
 * @access  Public
 */
const getTdcTalks = async (req, res, next) => {
  try {
    const { year } = req.query;
    const query = {};
    if (year) query.year = year;

    const talks = await TdcTalk.find(query).sort({ year: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: talks.length,
      data: talks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add new TDC talk
 * @route   POST /api/media/tdc-talks
 * @access  Private (Admin & Board)
 */
const addTdcTalk = async (req, res, next) => {
  try {
    const { title, speaker, link, year } = req.body;

    const talk = await TdcTalk.create({
      title,
      speaker,
      link,
      year: year || new Date().getFullYear().toString(),
    });

    res.status(201).json({
      success: true,
      message: 'TDC talk added successfully',
      data: talk,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPodcasts,
  addPodcast,
  getTdcTalks,
  addTdcTalk,
};
