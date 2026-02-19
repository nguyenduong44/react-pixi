/**
 * DodoSystem
 * ──────────────────────────────────────────────────────────────────────────
 * Manages a flock of pixel-art Dodo birds running across the screen
 * using PIXI.AnimatedSprite fed from the dodo.png sprite sheet.
 *
 * Sprite sheet layout  (4 columns × 3 rows = 12 frames):
 *   Row 0  — front-facing idle (cols 0-3)  ← not used for running
 *   Row 1  — side-view walk cycle A (cols 0-3)  ← used ✓
 *   Row 2  — side-view walk cycle B (cols 0-3)  ← used ✓
 *
 * We slice rows 1 & 2 → 8 frames for a smooth walk/run loop.
 * Frame dimensions are computed dynamically: frameW = img.width/4, frameH = img.height/3
 *
 * Dodos run left → right and wrap back when off-screen right edge.
 */
import * as PIXI from 'pixi.js';
import { DODO_SHEET_URL } from '../../assets/assets';

// ─── Config ───────────────────────────────────────────────────────────────
const COLS          = 4;
const ROWS          = 3;
const WALK_ROW_START = 1;   // First row to use (side-view)
const WALK_ROW_END   = 2;   // Last  row to use (inclusive)
const DODO_SCALE    = 3.5;  // Scale factor — keeps pixel-art chunky
const DODO_FPS      = 8;    // Animation speed (frames/sec)
const FLOCK_SIZE    = 7;    // Number of dodos
const BASE_SPEED    = 2.4;  // Base px/tick horizontal speed

interface DodoInstance {
  sprite: PIXI.AnimatedSprite;
  speed:  number;
}

export class DodoSystem {
  private container: PIXI.Container;
  private dodos: DodoInstance[] = [];
  private screenW: number;
  private groundY: number;
  private ready = false;

  constructor(
    app: PIXI.Application,
    container: PIXI.Container,
    groundY: number
  ) {
    this.container = container;
    this.screenW   = app.screen.width;
    this.groundY   = groundY;

    this.loadAndSpawn();
  }

  // ── Asset loading ────────────────────────────────────────────────────────
  private async loadAndSpawn() {
    // Load the raw base texture (NEAREST for pixel-perfect)
    const baseTexture = await PIXI.Assets.load<PIXI.Texture>(DODO_SHEET_URL);
    baseTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

    const imgW = baseTexture.width;
    const imgH = baseTexture.height;
    const frameW = Math.floor(imgW / COLS);
    const frameH = Math.floor(imgH / ROWS);

    // Slice walking frames from rows WALK_ROW_START..WALK_ROW_END
    const frames: PIXI.Texture[] = [];
    for (let row = WALK_ROW_START; row <= WALK_ROW_END; row++) {
      for (let col = 0; col < COLS; col++) {
        const rect = new PIXI.Rectangle(col * frameW, row * frameH, frameW, frameH);
        const frame = new PIXI.Texture(baseTexture.baseTexture, rect);
        frames.push(frame);
      }
    }

    this.spawnFlock(frames, frameH);
    this.ready = true;
  }

  // ── Spawn dodos ──────────────────────────────────────────────────────────
  private spawnFlock(frames: PIXI.Texture[], _frameH: number) {
    const spacing = this.screenW / FLOCK_SIZE;

    for (let i = 0; i < FLOCK_SIZE; i++) {
      const sprite = new PIXI.AnimatedSprite(frames);

      // Nearest-neighbor on each frame texture
      sprite.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

      // Slight scale variation per dodo for depth / natural herd feel
      const sizeVar = 0.80 + (i % 4) * 0.12;
      sprite.scale.set(DODO_SCALE * sizeVar);

      // Stagger animation phase
      sprite.animationSpeed = DODO_FPS / 60;
      sprite.play();
      sprite.currentFrame = Math.floor((i / FLOCK_SIZE) * frames.length);

      // Y: place feet on ground, with slight row variation
      const rowOffset = (i % 3) * 5;
      sprite.y = this.groundY - sprite.height + rowOffset;

      // X: spread across screen, some start off-screen left for stagger
      const stagger = -(i % 3) * 60;
      sprite.x = -sprite.width + spacing * i + stagger;

      // Speed variation
      const speed = BASE_SPEED * (0.85 + (i % 4) * 0.09);

      this.container.addChild(sprite);
      this.dodos.push({ sprite, speed });
    }
  }

  // ── Game loop update ─────────────────────────────────────────────────────
  update() {
    if (!this.ready) return;

    this.dodos.forEach(({ sprite, speed }) => {
      sprite.x += speed;

      // Wrap: once fully off right edge, reset to just off left edge
      if (sprite.x > this.screenW + 20) {
        sprite.x = -sprite.width - 10;
        // Small Y jitter on re-entry for liveness
        const row = Math.floor(Math.random() * 3);
        sprite.y = this.groundY - sprite.height + row * 5;
      }
    });
  }

  // ── Resize ────────────────────────────────────────────────────────────────
  resize(screenW: number, groundY: number) {
    this.screenW = screenW;
    this.groundY = groundY;
  }
}
