/**
 * PixelArtFactory — Procedural pixel art for non-background elements.
 *
 * Now that the background comes from PNG sheets, this file only generates:
 *   - Horse animation frames (8 frames, 22×14 logical pixels each)
 *
 * All textures use NEAREST scale mode for pixel-perfect rendering.
 */
import * as PIXI from 'pixi.js';

const px = 4; // 1 logical pixel = 4 screen pixels

// ─── Palette ───────────────────────────────────────────────────────────────
const C = {
  horseBody:  0x7a3b10,
  horseDark:  0x4e2508,
  horseLegs:  0x5c2d0c,
  horseMane:  0x2a1204,
  horseTail:  0x3d1c06,
  horseEye:   0x111111,
  horseNose:  0x5a2a10,
  horseHoof:  0x1a0e04,
};

// ─── Helper: draw a filled rect in logical-pixel space ────────────────────
function rect(g: PIXI.Graphics, color: number, x: number, y: number, w: number, h: number) {
  g.beginFill(color);
  g.drawRect(x * px, y * px, w * px, h * px);
  g.endFill();
}

// ─── Horse Frames ─────────────────────────────────────────────────────────
export function createHorseFrames(app: PIXI.Application): PIXI.Texture[] {
  const FRAME_COUNT = 8;
  const frames: PIXI.Texture[] = [];

  for (let f = 0; f < FRAME_COUNT; f++) {
    const g = new PIXI.Graphics();
    drawHorse(g, f, FRAME_COUNT);

    const rt = PIXI.RenderTexture.create({
      width:     Math.max(1, 22 * px),
      height:    Math.max(1, 14 * px),
      scaleMode: PIXI.SCALE_MODES.NEAREST,
    });
    app.renderer.render(g, { renderTexture: rt });
    frames.push(rt);
  }

  return frames;
}

// ─── Draw horse for one frame ──────────────────────────────────────────────
function drawHorse(g: PIXI.Graphics, frame: number, total: number) {
  const t = frame / total;

  // Body
  rect(g, C.horseBody, 5, 4, 11, 5);
  rect(g, C.horseDark, 5, 8, 11, 1);         // belly shadow
  rect(g, 0x9e5520,   6, 4,  9, 1);          // back highlight

  // Rump
  rect(g, C.horseBody, 4, 5, 2, 3);

  // Neck
  rect(g, C.horseBody, 14, 2, 3, 4);
  rect(g, C.horseBody, 15, 1, 2, 2);

  // Head
  rect(g, C.horseBody, 16, 1, 5, 4);
  rect(g, C.horseBody, 17, 0, 4, 2);         // forehead
  rect(g, C.horseNose, 20, 3, 2, 2);         // snout
  rect(g, C.horseDark, 21, 4, 1, 1);         // nostril
  rect(g, C.horseEye,  18, 1, 1, 1);         // eye
  rect(g, C.horseBody, 17, -1, 2, 2);        // ear base
  rect(g, 0xaa4422,    17, -1, 1, 1);        // ear inner

  // Mane
  rect(g, C.horseMane, 14, 0, 4, 3);
  rect(g, C.horseMane, 15, 1, 2, 4);

  // Tail (wavy)
  const tailY = 4 + Math.round(Math.sin(t * Math.PI * 2) * 1.5);
  rect(g, C.horseTail, 2, tailY,     3, 1);
  rect(g, C.horseTail, 1, tailY + 1, 3, 2);
  rect(g, C.horseTail, 0, tailY + 2, 2, 3);

  // Legs
  drawLegs(g, t);
}

function drawLegs(g: PIXI.Graphics, t: number) {
  // [xBase, phaseOffset, isFront]
  const legDefs: [number, number, boolean][] = [
    [12, 0.0,  true ],
    [14, 0.5,  true ],
    [7,  0.25, false],
    [9,  0.75, false],
  ];

  for (const [xBase, phase, isFront] of legDefs) {
    const angle      = Math.sin((t + phase) * Math.PI * 2);
    const isExtended = angle > 0;
    const xShift     = Math.round(angle * (isFront ? 2.5 : 2));
    const yShift     = Math.abs(Math.round(angle));

    const ux = xBase + xShift;
    const uy = 9 - yShift;
    rect(g, C.horseLegs, ux, uy, 1, 3);             // upper leg

    const lx = ux + (isExtended ? 1 : -1);
    const ly = uy + 2;
    rect(g, C.horseLegs, lx, ly, 1, 2);             // lower leg

    const hx = lx + (isExtended ? 0 : -1);
    const hy = ly + 2;
    rect(g, C.horseHoof, hx, hy, 2, 1);             // hoof
  }
}
