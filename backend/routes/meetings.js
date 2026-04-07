const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const Meeting = require('../models/Meeting');

// Get all meetings for user
router.get('/', auth, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const query = { user: req.user._id };

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'summary.overview': { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const total = await Meeting.countDocuments(query);
    const meetings = await Meeting.find(query)
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .select('-transcript.full -transcript.segments');

    res.json({
      success: true,
      meetings,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single meeting
router.get('/:id', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, user: req.user._id });
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get meeting status (polling)
router.get('/:id/status', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, user: req.user._id })
      .select('status processingError title');
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, status: meeting.status, error: meeting.processingError, title: meeting.title });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update meeting
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, tags, participants } = req.body;
    const updates = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (tags) updates.tags = tags;
    if (participants) updates.participants = participants;

    const meeting = await Meeting.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true }
    );
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update action item
router.patch('/:id/action-items/:itemId', auth, async (req, res) => {
  try {
    const { completed, assignee, dueDate, priority } = req.body;
    const meeting = await Meeting.findOne({ _id: req.params.id, user: req.user._id });
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    const item = meeting.actionItems.find(i => i.id === req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Action item not found' });

    if (completed !== undefined) item.completed = completed;
    if (assignee !== undefined) item.assignee = assignee;
    if (dueDate !== undefined) item.dueDate = dueDate;
    if (priority !== undefined) item.priority = priority;

    await meeting.save();
    res.json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate share link
router.post('/:id/share', auth, async (req, res) => {
  try {
    const shareToken = uuidv4();
    const meeting = await Meeting.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { shareToken, isShared: true },
      { new: true }
    );
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/shared/${shareToken}`;
    res.json({ success: true, shareUrl, shareToken });
  } catch (error) {
    console.error("Share Endpoint Crash:", error);
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
});

// Get shared meeting (public)
router.get('/shared/:token', async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ shareToken: req.params.token, isShared: true })
      .select('-audioFile.path -user');
    if (!meeting) return res.status(404).json({ success: false, message: 'Shared meeting not found' });
    res.json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete meeting
router.delete('/:id', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, message: 'Meeting deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Dashboard stats
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const [total, completed, pending, thisMonth] = await Promise.all([
      Meeting.countDocuments({ user: userId }),
      Meeting.countDocuments({ user: userId, status: 'completed' }),
      Meeting.countDocuments({ user: userId, status: { $in: ['processing', 'transcribing', 'analyzing'] } }),
      Meeting.countDocuments({
        user: userId,
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      })
    ]);

    const recentMeetings = await Meeting.find({ user: userId, status: 'completed' })
      .sort('-createdAt').limit(5).select('title createdAt duration wordCount summary.overview');

    const totalActionItems = await Meeting.aggregate([
      { $match: { user: userId } },
      { $unwind: '$actionItems' },
      { $group: { _id: '$actionItems.completed', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      stats: {
        total, completed, pending, thisMonth,
        actionItems: {
          completed: totalActionItems.find(a => a._id === true)?.count || 0,
          pending: totalActionItems.find(a => a._id === false)?.count || 0
        }
      },
      recentMeetings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
