import JSZip from 'jszip';

export interface ProjectFile {
  path: string;
  name: string;
  language: string;
  content: string;
  description: string;
  isOriginalAttachment?: boolean;
}

export const ANDROID_FILES: ProjectFile[] = [
  {
    path: 'build.gradle.kts',
    name: 'build.gradle.kts',
    language: 'kotlin',
    isOriginalAttachment: true,
    description: 'Root Gradle build script with Android Application & Kotlin Compose plugins.',
    content: `plugins {
    id("com.android.application") version "8.13.2" apply false
    id("org.jetbrains.kotlin.android") version "2.2.20" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.2.20" apply false
}`,
  },
  {
    path: 'gradle.properties',
    name: 'gradle.properties',
    language: 'properties',
    isOriginalAttachment: true,
    description: 'JVM args (3GB max heap, UTF-8), AndroidX enabled, and parallel build execution.',
    content: `org.gradle.jvmargs=-Xmx3g -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
org.gradle.parallel=true`,
  },
  {
    path: 'settings.gradle.kts',
    name: 'settings.gradle.kts',
    language: 'kotlin',
    isOriginalAttachment: true,
    description: 'Plugin and dependency repositories with FAIL_ON_PROJECT_REPOS mode.',
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "NahalAI"
include(":app")`,
  },
  {
    path: 'README.md',
    name: 'README.md',
    language: 'markdown',
    isOriginalAttachment: true,
    description: 'Official NahalAI v0.1 specification, consent ethics, and architecture guidelines.',
    content: `# NahalAI v0.1 — Android local audio capture prototype

## What this version does
- Kotlin + Jetpack Compose Android app.
- Requests microphone permission at runtime.
- Records 16 kHz, mono, 16-bit PCM WAV while the app is open.
- Saves recordings in the app-private files directory.
- Provides a delete action.
- Has no INTERNET permission and no cloud upload code.

## What this version does NOT do yet
- No speech-to-text model is integrated yet.
- No LLM / intent analysis is integrated yet.
- No background recording service.
- No cellular call recording. Android generally restricts third-party access to call downlink audio.
- No speaker diarization.

This is an honest, buildable V0.1 foundation. Offline transcription and reasoning are the next integration milestones.

## Requirements
- Android Studio with Android SDK Platform 36.
- JDK 17 (Android Studio's bundled JBR is suitable).
- Windows 11.
- Android device with Android 10/API 29 or later.

## Open and build
1. Extract the ZIP.
2. Open Android Studio.
3. Choose File > Open and select the \`NahalAI\` folder.
4. Allow Gradle sync to complete.
5. In SDK Manager, install Android SDK Platform 36 and Build Tools.
6. Connect the phone with USB debugging enabled.
7. Select the phone in the device dropdown.
8. Press Run.

## Build an APK
In Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s).

Or in the project folder, after Gradle is installed/configured:
    gradlew.bat assembleDebug

APK output:
    app/build/outputs/apk/debug/app-debug.apk

Install via USB:
    adb install -r app/build/outputs/apk/debug/app-debug.apk

## Find recordings
Recordings are saved under the app's private files directory. They are not exposed as public media files. Uninstalling the app removes its private app data.

## Consent and safety
Only record a conversation when all participants have been informed and have agreed. The app shows an on-screen recording state. Do not use it for covert recording.`,
  },
  {
    path: 'app/build.gradle.kts',
    name: 'app/build.gradle.kts',
    language: 'kotlin',
    description: 'App module build script with Android SDK 36, Compose BOM, and Coroutines.',
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "ai.nahal.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "ai.nahal.app"
        minSdk = 29
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            applicationIdSuffix = ".debug"
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.10.01")
    implementation(composeBom)
    androidTestImplementation(composeBom)

    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3:1.3.1")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
}`,
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    language: 'xml',
    description: 'Strict manifest with RECORD_AUDIO and zero INTERNET permissions for air-gapped security.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- NahalAI v0.1: Strictly requests microphone. Zero INTERNET permission. -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />

    <application
        android:allowBackup="false"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="false"
        android:icon="@mipmap/ic_launcher"
        android:label="NahalAI"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.NahalAI">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.NahalAI">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>`,
  },
  {
    path: 'app/src/main/java/ai/nahal/app/audio/AudioRecorder.kt',
    name: 'AudioRecorder.kt',
    language: 'kotlin',
    description: 'Kotlin AudioRecord implementation capturing 16 kHz Mono 16-bit PCM into app-private storage.',
    content: `package ai.nahal.app.audio

import android.annotation.SuppressLint
import android.content.Context
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.RandomAccessFile
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.atomic.AtomicBoolean

class AudioRecorder(private val context: Context) {

    companion object {
        const val SAMPLE_RATE = 16000
        const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
        const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
    }

    private var audioRecord: AudioRecord? = null
    private val isRecording = AtomicBoolean(false)
    private var currentFile: File? = null

    @SuppressLint("MissingPermission")
    suspend fun startRecording(onAmplitudeUpdate: (Float) -> Unit): File = withContext(Dispatchers.IO) {
        val minBufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT)
        val bufferSize = (minBufferSize * 2).coerceAtLeast(4096)

        audioRecord = AudioRecord(
            MediaRecorder.AudioSource.MIC,
            SAMPLE_RATE,
            CHANNEL_CONFIG,
            AUDIO_FORMAT,
            bufferSize
        )

        val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
        val outputDir = File(context.filesDir, "recordings").apply { if (!exists()) mkdirs() }
        val wavFile = File(outputDir, "nahal_capture_$timestamp.wav")
        currentFile = wavFile

        audioRecord?.startRecording()
        isRecording.set(true)

        val buffer = ShortArray(bufferSize / 2)
        val rawPcmFile = File(outputDir, "temp_raw.pcm")

        FileOutputStream(rawPcmFile).use { output ->
            while (isRecording.get()) {
                val readShorts = audioRecord?.read(buffer, 0, buffer.size) ?: 0
                if (readShorts > 0) {
                    var maxAmp = 0
                    val byteBuffer = ByteArray(readShorts * 2)
                    for (i in 0 until readShorts) {
                        val sample = buffer[i]
                        val abs = Math.abs(sample.toInt())
                        if (abs > maxAmp) maxAmp = abs
                        byteBuffer[i * 2] = (sample.toInt() and 0x00FF).toByte()
                        byteBuffer[i * 2 + 1] = ((sample.toInt() shr 8) and 0x00FF).toByte()
                    }
                    output.write(byteBuffer)
                    onAmplitudeUpdate(maxAmp / 32768.0f)
                }
            }
        }

        // Convert raw PCM to proper 44-byte RIFF WAV
        WavWriter.writeWavFile(rawPcmFile, wavFile, SAMPLE_RATE, 1, 16)
        rawPcmFile.delete()

        wavFile
    }

    fun stopRecording() {
        isRecording.set(false)
        try {
            audioRecord?.stop()
            audioRecord?.release()
        } catch (_: Exception) {}
        audioRecord = null
    }

    fun isCurrentlyRecording(): Boolean = isRecording.get()
}`,
  },
  {
    path: 'app/src/main/java/ai/nahal/app/audio/WavWriter.kt',
    name: 'WavWriter.kt',
    language: 'kotlin',
    description: 'Header writer synthesizing standard 44-byte RIFF WAV container for 16-bit linear PCM.',
    content: `package ai.nahal.app.audio

import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream

object WavWriter {
    fun writeWavFile(pcmFile: File, wavFile: File, sampleRate: Int, channels: Int, bitDepth: Int) {
        val pcmSize = pcmFile.length()
        val totalDataLen = pcmSize + 36
        val byteRate = sampleRate * channels * bitDepth / 8

        FileInputStream(pcmFile).use { input ->
            FileOutputStream(wavFile).use { output ->
                val header = ByteArray(44)
                // RIFF/WAVE header
                header[0] = 'R'.code.toByte(); header[1] = 'I'.code.toByte()
                header[2] = 'F'.code.toByte(); header[3] = 'F'.code.toByte()
                header[4] = (totalDataLen and 0xff).toByte()
                header[5] = ((totalDataLen shr 8) and 0xff).toByte()
                header[6] = ((totalDataLen shr 16) and 0xff).toByte()
                header[7] = ((totalDataLen shr 24) and 0xff).toByte()
                header[8] = 'W'.code.toByte(); header[9] = 'A'.code.toByte()
                header[10] = 'V'.code.toByte(); header[11] = 'E'.code.toByte()
                // 'fmt ' chunk
                header[12] = 'f'.code.toByte(); header[13] = 'm'.code.toByte()
                header[14] = 't'.code.toByte(); header[15] = ' '.code.toByte()
                header[16] = 16; header[17] = 0; header[18] = 0; header[19] = 0 // 16 for PCM
                header[20] = 1; header[21] = 0 // PCM format = 1
                header[22] = channels.toByte(); header[23] = 0
                header[24] = (sampleRate and 0xff).toByte()
                header[25] = ((sampleRate shr 8) and 0xff).toByte()
                header[26] = ((sampleRate shr 16) and 0xff).toByte()
                header[27] = ((sampleRate shr 24) and 0xff).toByte()
                header[28] = (byteRate and 0xff).toByte()
                header[29] = ((byteRate shr 8) and 0xff).toByte()
                header[30] = ((byteRate shr 16) and 0xff).toByte()
                header[31] = ((byteRate shr 24) and 0xff).toByte()
                header[32] = (channels * bitDepth / 8).toByte(); header[33] = 0
                header[34] = bitDepth.toByte(); header[35] = 0
                // 'data' chunk
                header[36] = 'd'.code.toByte(); header[37] = 'a'.code.toByte()
                header[38] = 't'.code.toByte(); header[39] = 'a'.code.toByte()
                header[40] = (pcmSize and 0xff).toByte()
                header[41] = ((pcmSize shr 8) and 0xff).toByte()
                header[42] = ((pcmSize shr 16) and 0xff).toByte()
                header[43] = ((pcmSize shr 24) and 0xff).toByte()

                output.write(header, 0, 44)
                input.copyTo(output)
            }
        }
    }
}`,
  },
  {
    path: 'app/src/main/java/ai/nahal/app/MainActivity.kt',
    name: 'MainActivity.kt',
    language: 'kotlin',
    description: 'Jetpack Compose Material 3 UI with runtime mic permission launcher, capture button, and privacy banner.',
    content: `package ai.nahal.app

import android.Manifest
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import ai.nahal.app.audio.AudioRecorder
import kotlinx.coroutines.launch
import java.io.File

class MainActivity : ComponentActivity() {
    private val audioRecorder by lazy { AudioRecorder(this) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            NahalTheme {
                MainScreen(audioRecorder = audioRecorder)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(audioRecorder: AudioRecorder) {
    val scope = rememberCoroutineScope()
    var isRecording by remember { mutableStateOf(false) }
    var amplitude by remember { mutableFloatStateOf(0f) }
    var recordings by remember { mutableStateOf(listOf<File>()) }
    var hasMicPermission by remember { mutableStateOf(false) }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        hasMicPermission = isGranted
        if (isGranted) {
            isRecording = true
            scope.launch {
                audioRecorder.startRecording { amp -> amplitude = amp }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("NahalAI v0.1") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Privacy & Consent Card
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        text = "Zero Cloud · Local Only",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "16 kHz Mono PCM WAV. Recordings are stored privately on device. Inform all participants before recording.",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Animated Visualizer Pulse
            val pulseScale by animateFloatAsState(
                targetValue = if (isRecording) 1f + amplitude * 0.4f else 1f,
                label = "pulse"
            )

            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(160.dp)
                    .scale(pulseScale)
                    .background(
                        if (isRecording) Color(0xFFEF4444).copy(alpha = 0.2f) else Color.Transparent,
                        CircleShape
                    )
            ) {
                FloatingActionButton(
                    onClick = {
                        if (isRecording) {
                            audioRecorder.stopRecording()
                            isRecording = false
                        } else {
                            permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                        }
                    },
                    modifier = Modifier.size(80.dp),
                    shape = CircleShape,
                    containerColor = if (isRecording) Color(0xFFDC2626) else MaterialTheme.colorScheme.primary
                ) {
                    Icon(
                        imageVector = if (isRecording) Icons.Filled.Stop else Icons.Filled.Mic,
                        contentDescription = if (isRecording) "Stop Recording" else "Start Recording",
                        tint = Color.White
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = if (isRecording) "Recording (16 kHz WAV)..." else "Tap Mic to Record",
                style = MaterialTheme.typography.titleMedium
            )
        }
    }
}

@Composable
fun NahalTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Color(0xFF10B981),
            surface = Color(0xFF0F172A),
            surfaceVariant = Color(0xFF1E293B)
        ),
        content = content
    )
}`,
  },
];

export async function generateAndroidProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  // Add standard Gradle Wrapper files
  zip.file(
    'gradlew',
    `#!/usr/bin/env sh
# Gradle wrapper script for Unix
exec gradle "$@"
`
  );
  zip.file(
    'gradlew.bat',
    `@rem Gradle wrapper script for Windows
gradle %*
`
  );

  // Add all Android files
  for (const file of ANDROID_FILES) {
    zip.file(file.path, file.content);
  }

  // Generate ZIP blob
  return await zip.generateAsync({ type: 'blob' });
}
