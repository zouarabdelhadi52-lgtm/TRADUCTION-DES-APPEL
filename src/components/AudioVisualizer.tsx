import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  color?: string;
  barsCount?: number;
  height?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isActive,
  color = '#3b82f6',
  barsCount = 28,
  height = 42,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = Math.max(2, (canvas.width - (barsCount - 1) * 2) / barsCount);
      const centerY = canvas.height / 2;

      for (let i = 0; i < barsCount; i++) {
        const x = i * (barWidth + 2);
        let barHeight = 4;

        if (isActive) {
          // Dynamic wave oscillation
          const freq1 = Math.sin((i / 4) + phase * 4) * 0.5 + 0.5;
          const freq2 = Math.cos((i / 3) - phase * 3) * 0.5 + 0.5;
          const combined = (freq1 + freq2) / 2;
          const centerBias = 1 - Math.abs((i - barsCount / 2) / (barsCount / 2)) * 0.4;
          barHeight = Math.max(4, combined * (canvas.height - 8) * centerBias);
        } else {
          // Gentle idle pulse
          barHeight = 4 + Math.sin(phase * 2 + i * 0.2) * 1.5;
        }

        const y = centerY - barHeight / 2;

        ctx.fillStyle = isActive ? color : 'rgba(148, 163, 184, 0.3)';
        ctx.beginPath();
        // Rounded bar
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      phase += 0.04;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, color, barsCount]);

  return (
    <div className="w-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={320}
        height={height}
        className="w-full max-w-sm rounded"
      />
    </div>
  );
};
