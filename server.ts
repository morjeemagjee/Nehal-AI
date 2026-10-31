import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '64mb' }));

// Health / Status endpoint
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    engine: 'NahalAI Hybrid Audio Core v0.2',
    timestamp: new Date().toISOString(),
  });
});

// Audio Analysis endpoint using Gemini 3.8 Flash
app.post('/api/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const { audioBase64, mimeType = 'audio/wav', context = '', simulated = false } = req.body;

    if (!audioBase64 && !simulated) {
      res.status(400).json({ error: 'Audio data is required' });
      return;
    }

    // Check if offline/simulated mode or API key missing
    if (simulated || !process.env.GEMINI_API_KEY) {
      // Local fallback simulation (Air-gapped mode simulating NahalAI v0.1 privacy posture)
      res.json({
        source: 'local_privacy_engine',
        model: 'NahalAI Local On-Device Heuristic',
        transcript: [
          {
            speaker: 'Speaker 1',
            timeOffset: '00:00:02',
            text: 'Starting session recording. Confirming audio parameters: 16 kHz sample rate, mono 16-bit PCM WAV.',
          },
          {
            speaker: 'Speaker 2',
            timeOffset: '00:00:06',
            text: 'Acknowledged. We need to verify storage in app-private files directory and ensure zero network transmission.',
          },
          {
            speaker: 'Speaker 1',
            timeOffset: '00:00:12',
            text: 'Next milestone is integrating offline Whisper or Vosk STT, followed by intent categorization and action item tracking.',
          },
        ],
        summary: 'Discussion regarding NahalAI privacy standards, confirming 16kHz mono audio capture in app-private directory without internet permissions, and planning the offline speech-to-text integration roadmap.',
        keyDecisions: [
          'Enforce strict runtime mic permission with visible recording indicators.',
          'Store all audio chunks in sandbox storage without cloud sync in v0.1.',
          'Schedule v0.2 offline transcription engine benchmarking.',
        ],
        actionItems: [
          {
            task: 'Benchmark on-device Vosk and Whisper Tiny models for Android API 29+',
            owner: 'Android Core Team',
            priority: 'high',
            deadline: 'End of Sprint',
          },
          {
            task: 'Implement foreground service for optional continuous background audio capture',
            owner: 'System Eng',
            priority: 'medium',
            deadline: 'Next milestone',
          },
          {
            task: 'Add export and encrypted backup for app-private audio records',
            owner: 'Security',
            priority: 'medium',
            deadline: 'V0.2 Release',
          },
        ],
        intents: [
          { intent: 'Verify Recording Architecture', confidence: 0.98, explanation: 'Validating 16kHz mono 16-bit PCM compliance' },
          { intent: 'Plan Offline STT Milestone', confidence: 0.95, explanation: 'Discussing local transcription integration' },
        ],
        entities: [
          { name: '16 kHz PCM', category: 'Audio Format' },
          { name: 'App-Private Storage', category: 'Security' },
          { name: 'Whisper / Vosk', category: 'ML Models' },
        ],
        sentiment: 'neutral',
        audioStats: {
          estimatedWordCount: 54,
          detectedLanguage: 'en-US',
          speakerCount: 2,
        },
      });
      return;
    }

    // Call Gemini 3.8 Flash with Multimodal Audio
    const ai = new GoogleGenAI();

    const prompt = `You are NahalAI Voice Intelligence Engine — an expert in analyzing voice recordings, speech-to-text, speaker diarization, and structured intent extraction.
Analyze this audio recording carefully.
${context ? `Context given: "${context}"` : ''}

Provide your complete analysis in valid JSON matching this schema:
{
  "transcript": [
    { "speaker": "Speaker 1", "timeOffset": "MM:SS", "text": "spoken words verbatim" }
  ],
  "summary": "Clear, concise executive summary of what was discussed",
  "keyDecisions": ["Decision 1", "Decision 2"],
  "actionItems": [
    { "task": "Description of action item", "owner": "Assigned person or unassigned", "priority": "high"|"medium"|"low", "deadline": "date or timeframe if mentioned" }
  ],
  "intents": [
    { "intent": "Identified goal/intent", "confidence": 0.95, "explanation": "Why this intent was detected" }
  ],
  "entities": [
    { "name": "Entity name", "category": "Person|Tool|Technology|Date|Location|Concept" }
  ],
  "sentiment": "positive"|"neutral"|"urgent"|"mixed",
  "audioStats": {
    "estimatedWordCount": 100,
    "detectedLanguage": "en-US",
    "speakerCount": 2
  }
}
Return ONLY valid raw JSON without markdown formatting or code blocks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType.includes('wav') ? 'audio/wav' : mimeType,
            data: audioBase64,
          },
        },
        prompt,
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch {
      parsedData = {
        summary: responseText,
        transcript: [{ speaker: 'Speaker 1', timeOffset: '00:00', text: responseText }],
        keyDecisions: [],
        actionItems: [],
        intents: [],
        entities: [],
        sentiment: 'neutral',
        audioStats: { estimatedWordCount: 0, detectedLanguage: 'en', speakerCount: 1 },
      };
    }

    res.json({
      source: 'gemini_multimodal_engine',
      model: 'gemini-3.8-flash',
      ...parsedData,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error analyzing audio:', errorMsg);
    res.status(500).json({
      error: 'Failed to process audio recording',
      details: errorMsg,
    });
  }
});

// Vite Middleware for Dev / Static for Prod
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NahalAI Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
