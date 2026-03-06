import React, { useEffect, useRef } from 'react';

export const CyberBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let t = 0;
    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;

      // Wave 1 - pink/magenta
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y = h * 0.35 + Math.sin(x / w * Math.PI * 2.5 + t * 0.4) * 80
          + Math.sin(x / w * Math.PI * 1.2 + t * 0.25) * 40;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(255, 45, 120, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Wave 2 - purple
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y = h * 0.65 + Math.sin(x / w * Math.PI * 2 + t * 0.3 + 1) * 60
          + Math.sin(x / w * Math.PI * 3 + t * 0.5) * 25;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(155, 77, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();

      t += 0.008;
      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <div className="stars" />
      <div className="scanline" />
      <canvas ref={canvasRef} className="wave-canvas" />
    </>
  );
};
