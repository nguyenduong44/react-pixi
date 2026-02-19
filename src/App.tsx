/**
 * App.tsx — React entry component
 *
 * Fix: Use requestAnimationFrame (not setTimeout) to guarantee
 * the canvas element is laid out and has real pixel dimensions
 * before PixiJS tries to create RenderTextures.
 */
import { useEffect, useRef } from 'react';
import { PixiApp } from './game/PixiApp';
import './index.css';

function App() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const pixiAppRef = useRef<PixiApp | null>(null);
  const rafRef     = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || pixiAppRef.current) return;

    // Use rAF to ensure the browser has performed layout and the
    // canvas element reports correct clientWidth / clientHeight.
    rafRef.current = requestAnimationFrame(() => {
      // Double-check we haven't unmounted
      if (!canvasRef.current || pixiAppRef.current) return;

      // Manually set canvas size attributes BEFORE handing to PIXI
      // so PIXI can query them via getBoundingClientRect internally.
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;

      pixiAppRef.current = new PixiApp(canvas);
    });

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      pixiAppRef.current?.destroy();
      pixiAppRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display:         'block',
        width:           '100vw',
        height:          '100vh',
        imageRendering:  'pixelated',
      }}
    />
  );
}

export default App;
