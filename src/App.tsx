import { useEffect, useRef } from 'react';
import { PixiApp } from './game/PixiApp';
import './index.css';

function App() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const pixiAppRef = useRef<PixiApp | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || pixiAppRef.current) return;

    // Set canvas pixel dimensions trước khi PIXI đọc
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    pixiAppRef.current = new PixiApp(canvas);

    return () => {
      pixiAppRef.current?.destroy();
      pixiAppRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display:        'block',
        width:          '100vw',
        height:         '100vh',
        imageRendering: 'pixelated',
      }}
    />
  );
}

export default App;
