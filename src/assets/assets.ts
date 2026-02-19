/**
 * assets.ts — Vite asset imports
 * Importing PNG files this way lets Vite resolve & hash them,
 * and gives us valid URLs that PIXI.Assets can fetch at runtime.
 */
import sheet1 from './background_valley-Sheet1.png';
import sheet2 from './background_valley-Sheet2.png';
import sheet3 from './background_valley-Sheet3.png';
import sheet4 from './background_valley-Sheet4.png';
import sheet5 from './background_valley-Sheet5.png';
import dodoSheet from './dodo.png';

export const PARALLAX_SHEETS = [
  { url: sheet1, speed: 0.05, label: 'sky'         },
  { url: sheet2, speed: 0.20, label: 'far-mtn'     },
  { url: sheet3, speed: 0.40, label: 'mid-mtn'     },
  { url: sheet4, speed: 0.70, label: 'ground'      },
  { url: sheet5, speed: 1.10, label: 'foreground'  },
] as const;

export const DODO_SHEET_URL = dodoSheet;
