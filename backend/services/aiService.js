const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');

const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY or OPENAI_API_KEY is not set in .env.");
}

const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);
// 🎤 TRANSCRIPTION (Gemini 1.5 Flash)
async function transcribeAudio(filePath) {
  try {
    console.log("Uploading file to Gemini:", filePath);

    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    console.log("File size (MB):", fileSizeMB.toFixed(2));

    const ext = path.extname(filePath).toLowerCase();
    const mimeMap = {
      '.wav': 'audio/wav', '.mp3': 'audio/mp3', '.m4a': 'audio/mp4',
      '.ogg': 'audio/ogg', '.webm': 'audio/webm', '.mp4': 'video/mp4'
    };
    const mimeType = mimeMap[ext] || 'audio/mp3';

    const uploadResult = await fileManager.uploadFile(filePath, {
      mimeType: mimeType,
      displayName: path.basename(filePath),
    });
    console.log("File uploaded! URI:", uploadResult.file.uri);

    let file = await fileManager.getFile(uploadResult.file.name);
    while (file.state === "PROCESSING") {
      console.log("Waiting for Gemini to process the audio file...");
      await new Promise(r => setTimeout(r, 3000));
      file = await fileManager.getFile(uploadResult.file.name);
    }
    
    if (file.state === "FAILED") {
      throw new Error("Gemini failed to process the audio file.");
    }

    console.log("Generating transcription with speaker diarization...");
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      } 
    });
    
    const prompt = `You are a professional audio transcription and speaker diarization system.
Provide an accurate, word-for-word transcript of the audio.
If there are multiple speakers, you MUST identify them (e.g., Speaker 1, Speaker 2) and segment their speech.

Format your response exactly as this JSON structure:
{
  "full": "The entire raw combined text transcript WITHOUT any speaker labels...",
  "segments": [
    {
      "speaker": "Speaker 1",
      "text": "Hello, how are you?"
    }
  ],
  "language": "en"
}`;

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri
        }
      },
      { text: prompt },
    ]);

    let transcriptionData;
    try {
      transcriptionData = JSON.parse(result.response.text());
    } catch (err) {
      transcriptionData = {
        full: result.response.text(),
        segments: [],
        language: "en"
      };
    }
    
    try { await fileManager.deleteFile(uploadResult.file.name); } catch(e){}

    return {
      full: transcriptionData.full || "",
      segments: Array.isArray(transcriptionData.segments) ? transcriptionData.segments : [],
      language: transcriptionData.language || "en",
      duration: 0
    };

  } catch (error) {
    console.error("GEMINI TRANSCRIPTION ERROR:", error);
    throw new Error("Transcription failed");
  }
}

async function analyzeMeeting(transcript) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `You are a strict JSON generator.

RULES:
- Return ONLY valid JSON
- No explanation
- No extra text

Format:
{
  "summary": {
    "overview": "",
    "keyPoints": [],
    "topics": []
  },
  "actionItems": [{ "task": "", "assignee": "", "priority": "medium", "dueDate": null }],
  "participants": [{ "name": "", "role": "" }],
  "tags": [],
  "meetingType": "",
  "suggestedTitle": ""
}

Analyze the following transcript:
${transcript}`;

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    let data;

    try {
      data = JSON.parse(content);
    } catch (err) {
      console.error("RAW AI RESPONSE:", content);
      throw new Error("JSON parsing failed");
    }

    // 🔥 FORCE SAFE STRUCTURE

    // Fix participants
    if (!Array.isArray(data.participants)) data.participants = [];
    data.participants = data.participants.map(p => {
      if (typeof p === "string") {
        return { name: p, role: "" };
      }
      return {
        name: p.name || "",
        role: p.role || ""
      };
    });

    // Fix action items
    if (!Array.isArray(data.actionItems)) data.actionItems = [];
    data.actionItems = data.actionItems.map((item, i) => ({
      id: item.id || `ai_${i + 1}`,
      task: typeof item === 'string' ? item : (item.task || "Action item"),
      assignee: typeof item === 'object' ? (item.assignee || "") : "",
      priority: typeof item === 'object' ? (item.priority || "medium") : "medium",
      dueDate: typeof item === 'object' ? (item.dueDate || null) : null
    }));

    // Ensure summary exists
    if (!data.summary) {
      data.summary = { overview: "", keyPoints: [], topics: [] };
    }

    return data;

  } catch (error) {
    console.error("ANALYSIS ERROR:", error);
    throw new Error("Analysis failed");
  }
}

// 🧪 MOCK (OPTIONAL)
function mockTranscribe() {
  return {
    full: "Mock transcript",
    segments: [],
    duration: 60
  };
}

function mockAnalyze() {
  return {
    summary: { overview: "Mock summary" },
    actionItems: []
  };
}


module.exports = {
  transcribeAudio,
  analyzeMeeting,
  mockTranscribe,
  mockAnalyze
};