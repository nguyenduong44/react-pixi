/**
 * BackgroundSystem — PNG-based parallax scroller
 *
 * Each layer is a PIXI.TilingSprite stretching the full screen width.
 * The sprite tiles the source PNG horizontally so it loops seamlessly.
 *
 * Layer order (back→front): Sheet1…Sheet5
 * Each layer scrolls at its own speed; tilePosition.x decrements every tick.
 *
 * IMPORTANT: init() must be awaited before update() is called.
 */
import * as PIXI from 'pixi.js';
import { PARALLAX_SHEETS } from '../../assets/assets';

interface Layer {
  sprite: PIXI.TilingSprite;
  speed:  number;
}

export class BackgroundSystem {
  private container: PIXI.Container;
  private layers:    Layer[] = [];
  private W:         number;
  private H:         number;
  private ready =    false;

  constructor(container: PIXI.Container, W: number, H: number) {
    this.container = container;
    this.W = W;
    this.H = H;
  }

  // ── Async init: load all PNGs then build TilingSprites ─────────────────
  async init(): Promise<void> {
    // Load all sheet URLs in parallel
    const textures = await Promise.all(
      PARALLAX_SHEETS.map(({ url }) =>
        PIXI.Assets.load<PIXI.Texture>(url)
      )
    );

    PARALLAX_SHEETS.forEach(({ speed, label }, i) => {
      const tex = textures[i];

      // Force nearest-neighbor on the loaded texture
      tex.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

      // ── Compute display dimensions ──────────────────────────────────
      // We want the layer to fill the screen height, then calculate
      // the proportional width to maintain aspect ratio.
      const srcW = tex.width;
      const srcH = tex.height;

      // Scale so the texture height == screen height
      const scale    = this.H / srcH;
      const scaledW  = Math.ceil(srcW * scale);
      const scaledH  = this.H;

      // TilingSprite width = screen width (tiles will repeat if scaledW < W)
      // We set tileScale so the tile renders at `scale` factor
      const sprite = new PIXI.TilingSprite(tex, this.W, scaledH);
      sprite.tileScale.set(scale);
      sprite.y = 0;    // all layers pin to top; PNG already has correct sky/ground placement
      sprite.name = label;

      this.container.addChild(sprite);
      this.layers.push({ sprite, speed });

      console.log(`[BG] ${label}: src=${srcW}×${srcH}  scaled=${scaledW}×${scaledH}  tileScale=${scale.toFixed(3)}`);
    });

    this.ready = true;
  }

  // ── Called every ticker tick ────────────────────────────────────────────
  update(baseSpeed: number) {
    if (!this.ready) return;
    for (const { sprite, speed } of this.layers) {
      sprite.tilePosition.x -= baseSpeed * speed;
    }
  }

  // ── Window resize ───────────────────────────────────────────────────────
  resize(W: number, H: number) {
    this.W = W;
    this.H = H;
    if (!this.ready) return;

    for (const { sprite } of this.layers) {
      const srcH = sprite.texture.height;
      const scale = H / srcH;
      sprite.tileScale.set(scale);
      sprite.width  = W;
      sprite.height = H;
    }
  }
}
