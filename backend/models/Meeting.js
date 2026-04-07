const mongoose = require('mongoose');

const actionItemSchema = new mongoose.Schema({
  id: String,
  task: { type: String, required: true },
  assignee: { type: String, default: '' },
  dueDate: { type: Date },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const speakerSegmentSchema = new mongoose.Schema({
  speaker: String,
  text: String,
  startTime: Number,
  endTime: Number
});

const meetingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  audioFile: {
    originalName: String,
    filename: String,
    path: String,
    size: Number,
    mimetype: String,
    duration: Number
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'transcribing', 'analyzing', 'completed', 'failed'],
    default: 'uploading'
  },
  transcript: {
    full: { type: String, default: '' },
    segments: [speakerSegmentSchema]
  },
  summary: {
    overview: { type: String, default: '' },
    keyPoints: [String],
    topics: [String]
  },
  actionItems: [actionItemSchema],
  participants: [{ name: String, email: String, role: String }],
  tags: [String],
  shareToken: { type: String, unique: true, sparse: true },
  isShared: { type: Boolean, default: false },
  duration: { type: Number, default: 0 },
  wordCount: { type: Number, default: 0 },
  processingError: { type: String },
  metadata: {
    recordedAt: Date,
    location: String,
    meetingType: { type: String, default: 'general' }
  }
}, { timestamps: true });

meetingSchema.index({ user: 1, createdAt: -1 });
meetingSchema.index({ user: 1, status: 1 });
meetingSchema.index({ title: 'text', 'summary.overview': 'text' });

module.exports = mongoose.model('Meeting', meetingSchema);
