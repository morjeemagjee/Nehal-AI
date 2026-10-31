import React, { useEffect, useRef } from 'react';
import { AudioVisualizerData } from '../utils/audioRecorder';

interface AudioVisualizerCanvasProps {
  data: AudioVisualizerData | null;
  isRecording: boolean;
  isPaused: boolean;
  className?: string;
}

export const AudioVisualizerCanvas: React.FC<AudioVisualizerCanvasProps> = ({
  data,
  isRecording,
  isPaused,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0a0f1d');
    bgGrad.addColorStop(1, '#050811');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Center horizontal line
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    // Vertical grid ticks
    for (let x = 0; x < width; x += 40) {
      ctx.moveTo(x, height / 2 - 4);
      ctx.lineTo(x, height / 2 + 4);
    }
    ctx.stroke();

    if (!isRecording || isPaused || !data) {
      // Idle / Paused wave (gentle baseline)
      ctx.strokeStyle = isPaused ? '#f59e0b' : '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      return;
    }

    // Draw Frequency Bars in background
    if (data.frequency) {
      const barCount = 48;
      const barWidth = (width / barCount) - 2;
      const step = Math.floor(data.frequency.length / barCount);

      for (let i = 0; i < barCount; i++) {
        const value = data.frequency[i * step] || 0;
        const percent = value / 255;
        const barHeight = percent * (height * 0.45);
        const x = i * (barWidth + 2);
        const y = height - barHeight;

        const barGrad = ctx.createLinearGradient(0, y, 0, height);
        barGrad.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
        barGrad.addColorStop(1, 'rgba(16, 185, 129, 0.05)');
        ctx.fillStyle = barGrad;
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    }

    // Draw Time Domain Oscilloscope Waveform
    if (data.timeDomain) {
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = data.clipping ? '#ef4444' : '#10b981';
      ctx.shadowColor = data.clipping ? 'rgba(239, 68, 68, 0.8)' : 'rgba(16, 185, 129, 0.8)';
      ctx.shadowBlur = 8;
      ctx.beginPath();

      const sliceWidth = width / data.timeDomain.length;
      let x = 0;

      for (let i = 0; i < data.timeDomain.length; i++) {
        const v = data.timeDomain[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }, [data, isRecording, isPaused]);

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 ${className}`}>
      <canvas
        ref={canvasRef}
        width={720}
        height={180}
        className="w-full h-36 md:h-44 block object-cover"
      />
      {/* Decibel Meter & Clip Indicator Overlay */}
      <div className="absolute top-2 right-3 flex items-center gap-3 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">LEVEL:</span>
          <span className={`font-semibold ${data && data.decibels > -6 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {data ? `${data.decibels.toFixed(1)} dB` : '-60.0 dB'}
          </span>
        </div>
        {data?.clipping && (
          <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase animate-pulse">
            CLIP
          </span>
        )}
      </div>

      <div className="absolute bottom-2 left-3 flex items-center gap-2 text-[11px] font-mono text-slate-500">
        <span>16,000 Hz</span>
        <span>•</span>
        <span>1-CH MONO</span>
        <span>•</span>
        <span>16-BIT PCM</span>
      </div>
    </div>
  );
};
