import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Note: StrictMode removed intentionally to prevent double-mounting PixiApp
// (StrictMode invokes effects twice in development, causing double WebGL contexts)
createRoot(document.getElementById('root')!).render(<App />);
