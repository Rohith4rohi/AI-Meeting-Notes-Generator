const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const Meeting = require('../models/Meeting');
const { transcribeAudio, analyzeMeeting, mockTranscribe, mockAnalyze } = require('../services/aiService');
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = uuidv4();
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // audio
    "audio/mpeg",
    "audio/wav",
    "audio/mp4",
    "audio/x-m4a",
    "audio/ogg",
    "audio/webm",

    // video
    "video/mp4",
    "video/webm",
    "video/x-matroska",
    "video/quicktime"
  ];

  const allowedExtensions = /\.(mp3|wav|m4a|ogg|webm|mp4|mkv|mov)$/i;

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error("Only audio and video files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});

const convertVideoToAudio = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec("libmp3lame")
      .audioBitrate("64")
      .save(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", reject);
  });
};

// Upload and process audio
router.post('/', auth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file provided' });
  }

  try {
    const { title, description, recordedAt } = req.body;

    const isVideo = req.file.mimetype?.startsWith("video");  
    let filePath = req.file.path;

    if (isVideo) {
      const audioPath = req.file.path + ".mp3";
      await convertVideoToAudio(req.file.path, audioPath);
      filePath = audioPath;
    }

    // Create meeting record
    const meeting = new Meeting({
      user: req.user._id,
      title: title || req.file.originalname.replace(/\.[^/.]+$/, ''),
      description: description || '',
      audioFile: {
        originalName: req.file.originalname,
        filename: path.basename(filePath),
        path: filePath,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      status: 'processing',
      metadata: { recordedAt: recordedAt ? new Date(recordedAt) : new Date() }
    });

    await meeting.save();

    // Respond immediately, process async
    res.json({ success: true, meeting, message: 'Upload successful, processing started' });
    
    console.log("Processing file:", filePath); // ✅ ADD THIS
    // Process in background
    processMeeting(
      meeting._id,
      filePath,
      false // Set to true to use mock data instead of actual processing (for testing)
    );

  } catch (error) {
  console.error("UPLOAD ERROR:", error); // ✅ ADD THIS
  res.status(500).json({ success: false, message: error.message });
  }
});

async function processMeeting(meetingId, filePath, useMock = false) {
  try {
    await Meeting.findByIdAndUpdate(meetingId, { status: 'transcribing' });

    let transcriptData, analysisData;

    if (useMock) {
      // Simulate processing delay
      await new Promise(r => setTimeout(r, 2000));
      transcriptData = mockTranscribe();
      await Meeting.findByIdAndUpdate(meetingId, { status: 'analyzing' });
      await new Promise(r => setTimeout(r, 1500));
      analysisData = mockAnalyze();
    } else {
      transcriptData = await transcribeAudio(filePath);
      await Meeting.findByIdAndUpdate(meetingId, { status: 'analyzing' });
      analysisData = await analyzeMeeting(transcriptData.full);
    }

    const wordCount = transcriptData.full.split(' ').length;

    await Meeting.findByIdAndUpdate(meetingId, {
      status: 'completed',
      transcript: {
        full: transcriptData.full,
        segments: transcriptData.segments
      },
      summary: analysisData.summary || {},
      actionItems: (analysisData.actionItems || []).map(item => ({
        ...item,
        id: item.id || uuidv4()
      })),
      participants: analysisData.participants || [],
      tags: analysisData.tags || [],
      duration: transcriptData.duration || 0,
      wordCount,
      ...(analysisData.suggestedTitle && { title: analysisData.suggestedTitle }),
      'metadata.meetingType': analysisData.meetingType || 'general'
    });

    console.log(`✅ Meeting ${meetingId} processed successfully`);
  } catch (error) {
    console.error(`❌ Processing failed for meeting ${meetingId}:`, error.message);
    await Meeting.findByIdAndUpdate(meetingId, {
      status: 'failed',
      processingError: error.message
    });
  }
}

module.exports = router;
