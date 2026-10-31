/**
 * NahalAI Local Storage Vault
 * Stores recordings in browser IndexedDB (analogous to Android app-private files directory)
 * Zero telemetry, zero unauthorized external sync.
 */

export interface VoiceAnalysisResult {
  source: string;
  model: string;
  transcript: Array<{
    speaker: string;
    timeOffset: string;
    text: string;
  }>;
  summary: string;
  keyDecisions: string[];
  actionItems: Array<{
    task: string;
    owner: string;
    priority: 'high' | 'medium' | 'low';
    deadline: string;
  }>;
  intents: Array<{
    intent: string;
    confidence: number;
    explanation: string;
  }>;
  entities: Array<{
    name: string;
    category: string;
  }>;
  sentiment: 'positive' | 'neutral' | 'urgent' | 'mixed';
  audioStats: {
    estimatedWordCount: number;
    detectedLanguage: string;
    speakerCount: number;
  };
}

export interface StoredRecording {
  id: string;
  title: string;
  createdAt: number;
  duration: number; // in seconds
  sizeBytes: number;
  sampleRate: number; // 16000
  channels: number; // 1 (mono)
  bitDepth: number; // 16
  blob?: Blob;
  base64?: string;
  analysis?: VoiceAnalysisResult;
  notes?: string;
  isFavorite?: boolean;
}

const DB_NAME = 'NahalAIVault';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveRecordingToVault(recording: StoredRecording): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(recording);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllRecordings(): Promise<StoredRecording[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('createdAt');
    const req = index.getAll();
    req.onsuccess = () => {
      const results = (req.result as StoredRecording[]).sort((a, b) => b.createdAt - a.createdAt);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getRecordingById(id: string): Promise<StoredRecording | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteRecordingFromVault(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function updateRecordingInVault(
  id: string,
  updates: Partial<StoredRecording>
): Promise<void> {
  const existing = await getRecordingById(id);
  if (!existing) return;
  const updated = { ...existing, ...updates };
  await saveRecordingToVault(updated);
}

/**
 * Generates an authentic 16kHz Mono 16-bit WAV audio tone buffer for sample files
 */
export function createSyntheticWav(durationSeconds: number, frequency = 440): { blob: Blob; base64: string } {
  const sampleRate = 16000;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);

  // RIFF header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + totalSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, totalSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    // Generate gentle harmonic audio tone with speech-like modulation
    const t = i / sampleRate;
    const cadence = 0.5 + 0.5 * Math.sin(2 * Math.PI * 2 * t);
    const tone = Math.sin(2 * Math.PI * frequency * t) * 0.4 * cadence;
    const s = Math.max(-1, Math.min(1, tone));
    const int16 = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  const blob = new Blob([view], { type: 'audio/wav' });

  // Convert to base64
  let binary = '';
  const bytes = new Uint8Array(view.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  return { blob, base64 };
}
