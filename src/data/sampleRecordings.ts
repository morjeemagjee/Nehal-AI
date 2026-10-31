import { StoredRecording, createSyntheticWav } from '../utils/storage';

export function getSampleRecordings(): StoredRecording[] {
  const sample1Audio = createSyntheticWav(32, 220);
  const sample2Audio = createSyntheticWav(45, 260);
  const sample3Audio = createSyntheticWav(28, 300);

  return [
    {
      id: 'sample-standup-01',
      title: 'NahalAI Core Team Sync — Zero Cloud & 16kHz Pipeline',
      createdAt: Date.now() - 3600000 * 2, // 2 hours ago
      duration: 32.4,
      sizeBytes: 1036800, // ~1MB
      sampleRate: 16000,
      channels: 1,
      bitDepth: 16,
      blob: sample1Audio.blob,
      base64: sample1Audio.base64,
      isFavorite: true,
      notes: 'Initial alignment on v0.1 air-gapped capture and milestone roadmap.',
      analysis: {
        source: 'gemini_multimodal_engine',
        model: 'gemini-3.8-flash',
        transcript: [
          {
            speaker: 'Tariq (Android Lead)',
            timeOffset: '00:00:02',
            text: 'Good morning everyone. We just pushed the NahalAI v0.1 prototype. Core specification is locked: 16 kilohertz sample rate, mono channel, 16-bit PCM WAV.',
          },
          {
            speaker: 'Maya (Security Arch)',
            timeOffset: '00:00:09',
            text: 'I audited the AndroidManifest.xml. Zero INTERNET permission, no background telemetry, and files are restricted strictly to context.filesDir private storage.',
          },
          {
            speaker: 'Danish (Product)',
            timeOffset: '00:00:18',
            text: 'Perfect. For v0.2, our top priority is speech-to-text without sacrificing the privacy guarantee. We need to evaluate offline Whisper or Vosk before testing Gemini hybrid modes.',
          },
          {
            speaker: 'Tariq (Android Lead)',
            timeOffset: '00:00:26',
            text: 'Agreed. I will package the benchmark APK with Android SDK 36 and test on Android 10+ devices by Thursday.',
          },
        ],
        summary: 'Review of the NahalAI v0.1 audio capture prototype confirming 16kHz mono WAV format and strict zero-internet security posture in app-private storage. Next milestone focuses on offline speech-to-text integration and speaker diarization benchmarks.',
        keyDecisions: [
          'Maintain absolute zero-internet permission for v0.1 release.',
          'Adopt 16kHz 16-bit linear PCM as universal audio standard across Android and web client.',
          'Benchmark on-device Vosk and Whisper Tiny prior to testing cloud models.',
        ],
        actionItems: [
          {
            task: 'Run Android SDK 36 build on physical device via adb install -r',
            owner: 'Tariq',
            priority: 'high',
            deadline: 'Thursday EOD',
          },
          {
            task: 'Conduct memory footprint audit on 16kHz PCM buffer during continuous capture',
            owner: 'Maya',
            priority: 'medium',
            deadline: 'Friday',
          },
          {
            task: 'Draft consent disclosure modal text for multi-party recording compliance',
            owner: 'Danish',
            priority: 'high',
            deadline: 'Next Monday',
          },
        ],
        intents: [
          {
            intent: 'Verify Security & Manifest Compliance',
            confidence: 0.99,
            explanation: 'Checked absence of INTERNET permission and verified scoped file storage.',
          },
          {
            intent: 'Schedule STT Engine Benchmark',
            confidence: 0.94,
            explanation: 'Allocated tasks to test offline transcription on Android 10+ hardware.',
          },
        ],
        entities: [
          { name: '16 kHz PCM', category: 'Technology' },
          { name: 'AndroidManifest.xml', category: 'Tool' },
          { name: 'Whisper / Vosk', category: 'ML Models' },
          { name: 'Android SDK 36', category: 'Platform' },
        ],
        sentiment: 'positive',
        audioStats: {
          estimatedWordCount: 88,
          detectedLanguage: 'en-US',
          speakerCount: 3,
        },
      },
    },
    {
      id: 'sample-medical-02',
      title: 'Clinical Consultation — Dr. Aris & Patient Follow-up',
      createdAt: Date.now() - 3600000 * 24, // yesterday
      duration: 45.0,
      sizeBytes: 1440000,
      sampleRate: 16000,
      channels: 1,
      bitDepth: 16,
      blob: sample2Audio.blob,
      base64: sample2Audio.base64,
      isFavorite: false,
      notes: 'Demonstrates high-stakes conversational intake and medical action extraction.',
      analysis: {
        source: 'gemini_multimodal_engine',
        model: 'gemini-3.8-flash',
        transcript: [
          {
            speaker: 'Dr. Aris',
            timeOffset: '00:00:01',
            text: 'How have you been feeling since starting the 20mg Lisinopril three weeks ago?',
          },
          {
            speaker: 'Patient',
            timeOffset: '00:00:07',
            text: 'My blood pressure readings have dropped to 124 over 82, but I have noticed a dry cough in the evenings.',
          },
          {
            speaker: 'Dr. Aris',
            timeOffset: '00:00:16',
            text: 'The dry cough is a known side effect of ACE inhibitors. Let us switch you to an ARB, Losartan 50mg once daily. Get blood work done in two weeks to check renal function.',
          },
          {
            speaker: 'Patient',
            timeOffset: '00:00:32',
            text: 'Understood doctor. Should I stop the Lisinopril immediately?',
          },
          {
            speaker: 'Dr. Aris',
            timeOffset: '00:00:36',
            text: 'Yes, stop Lisinopril tonight and begin Losartan tomorrow morning with breakfast.',
          },
        ],
        summary: 'Follow-up appointment reviewing blood pressure management. Patient noted resolution of hypertension (124/82) with new onset ACE inhibitor-induced dry cough. Discontinued Lisinopril 20mg and initiated Losartan 50mg daily with lab follow-up.',
        keyDecisions: [
          'Discontinue Lisinopril 20mg due to drug-induced dry cough.',
          'Initiate Losartan 50mg daily starting tomorrow morning.',
          'Schedule renal function lab panel in 14 days.',
        ],
        actionItems: [
          {
            task: 'Discontinue Lisinopril 20mg immediately',
            owner: 'Patient',
            priority: 'high',
            deadline: 'Tonight',
          },
          {
            task: 'Pick up and begin Losartan 50mg once daily with food',
            owner: 'Patient',
            priority: 'high',
            deadline: 'Tomorrow morning',
          },
          {
            task: 'Complete basic metabolic panel (BMP) blood work',
            owner: 'Patient',
            priority: 'medium',
            deadline: 'In 2 weeks',
          },
        ],
        intents: [
          {
            intent: 'Medication Adjustment',
            confidence: 0.98,
            explanation: 'Prescribing alternative medication due to adverse side effects.',
          },
          {
            intent: 'Symptom Triage',
            confidence: 0.92,
            explanation: 'Evaluating patient cough symptoms relative to ACE inhibitor therapy.',
          },
        ],
        entities: [
          { name: 'Lisinopril 20mg', category: 'Medication' },
          { name: 'Losartan 50mg', category: 'Medication' },
          { name: 'Blood Pressure 124/82', category: 'Vital Sign' },
          { name: 'Renal Function Panel', category: 'Lab Test' },
        ],
        sentiment: 'neutral',
        audioStats: {
          estimatedWordCount: 92,
          detectedLanguage: 'en-US',
          speakerCount: 2,
        },
      },
    },
    {
      id: 'sample-client-03',
      title: 'Strategy Briefing — Mobile Voice Assistant UI',
      createdAt: Date.now() - 3600000 * 48,
      duration: 28.0,
      sizeBytes: 896000,
      sampleRate: 16000,
      channels: 1,
      bitDepth: 16,
      blob: sample3Audio.blob,
      base64: sample3Audio.base64,
      isFavorite: false,
      notes: 'Design review on Jetpack Compose visualizer and haptic feedback.',
      analysis: {
        source: 'gemini_multimodal_engine',
        model: 'gemini-3.8-flash',
        transcript: [
          {
            speaker: 'Elena (UX Designer)',
            timeOffset: '00:00:01',
            text: 'We want the recording state to be unmistakable. In Android, a pulsing red halo with live amplitude scaling reassures the user that recording is active.',
          },
          {
            speaker: 'Marcus (Product)',
            timeOffset: '00:00:10',
            text: 'And what about participant consent? The README explicitly highlights ethical audio capture.',
          },
          {
            speaker: 'Elena (UX Designer)',
            timeOffset: '00:00:16',
            text: 'We added an un-dismissible amber status banner: "All participants must be informed and agree before session starts."',
          },
        ],
        summary: 'Design critique for NahalAI mobile interface, locking down an animated amplitude-driven pulse indicator for recording transparency and prominent consent messaging.',
        keyDecisions: [
          'Implement visual amplitude pulse indicator in Jetpack Compose.',
          'Feature mandatory on-screen recording disclosure to prevent covert use.',
        ],
        actionItems: [
          {
            task: 'Integrate animateFloatAsState in RecordingScreen.kt',
            owner: 'Elena',
            priority: 'medium',
            deadline: 'Tomorrow',
          },
        ],
        intents: [
          {
            intent: 'UI/UX Approval',
            confidence: 0.95,
            explanation: 'Finalizing recording animation and ethical consent placement.',
          },
        ],
        entities: [
          { name: 'Jetpack Compose', category: 'Framework' },
          { name: 'RecordingScreen.kt', category: 'File' },
          { name: 'Consent Banner', category: 'UI Component' },
        ],
        sentiment: 'positive',
        audioStats: {
          estimatedWordCount: 56,
          detectedLanguage: 'en-US',
          speakerCount: 2,
        },
      },
    },
  ];
}
