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

/**
 * @desc    Delete podcast episode
 * @route   DELETE /api/media/podcasts/:id
 * @access  Private (Admin & Board)
 */
const deletePodcast = async (req, res, next) => {
  try {
    const podcast = await Podcast.findByIdAndDelete(req.params.id);
    if (!podcast) {
      return res.status(404).json({
        success: false,
        message: 'Podcast not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Podcast deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete TDC talk
 * @route   DELETE /api/media/tdc-talks/:id
 * @access  Private (Admin & Board)
 */
const deleteTdcTalk = async (req, res, next) => {
  try {
    const talk = await TdcTalk.findByIdAndDelete(req.params.id);
    if (!talk) {
      return res.status(404).json({
        success: false,
        message: 'TDC talk not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'TDC talk deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPodcasts,
  addPodcast,
  deletePodcast,
  getTdcTalks,
  addTdcTalk,
  deleteTdcTalk,
};
