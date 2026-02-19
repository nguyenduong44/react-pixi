/**
 * LoadingScreen.ts
 *
 * Pixel-art loading screen hiện ra khi chọn difficulty.
 * Gồm:
 *   - Title "LOADING..." (3D extrude)
 *   - Pixel progress bar chạy từ 0→100%
 *   - % counter text
 *   - setTimeout random 3–4 giây rồi gọi onComplete
 *
 * Toàn bộ vẽ bằng PIXI.Graphics (không cần asset ngoài).
 */
import * as PIXI from 'pixi.js';

const PIXEL_FONT = '"Press Start 2P", "Courier New", monospace';

// Palette
const P = {
  titleFace:   0xf5a623,
  title3dA:    0x8b3a00,
  title3dB:    0x5a2200,

  barBg:       0x1a1a2e,
  barBgBorder: 0x444466,
  barFill:     0x44dd44,
  barFillMid:  0x22aa22,
  barShine:    0x88ff88,
  barDark:     0x116611,

  percent:     0xffffff,
  percentShadow: 0x003300,

  overlayBg:   0x000000,

  tipText:     0xaaaaaa,
};

const BAR_W      = 400;
const BAR_H      = 28;
const BLOCK_W    = 12;   // pixel block width inside bar
const BLOCK_GAP  = 2;

const TIPS = [
  'AVOID THE ROCKS',
  'COLLECT COINS',
  'SAVE YOUR ENERGY',
  'SPEED IS KEY',
  'STAY ALIVE!',
];

export class LoadingScreen {
  private container:   PIXI.Container;
  private barFillGfx:  PIXI.Graphics;
  private percentText: PIXI.Text;
  private tipText:     PIXI.Text;
  private overlay:     PIXI.Graphics;

  private progress  = 0;          // 0 → 1
  private targetProg = 0;
  private done      = false;
  private onComplete: () => void;

  private W: number;
  private H: number;

  constructor(
    parent:     PIXI.Container,
    W:          number,
    H:          number,
    onComplete: () => void,
  ) {
    this.W = W;
    this.H = H;
    this.onComplete = onComplete;

    this.container = new PIXI.Container();
    parent.addChild(this.container);

    this.buildScreen();
    this.startProgress();
  }

  // ── Build all visuals ───────────────────────────────────────────────────
  private buildScreen() {
    const { container: c, W, H } = this;

    // ── Full-screen dark overlay ──
    this.overlay = new PIXI.Graphics();
    this.overlay.beginFill(P.overlayBg, 0.82);
    this.overlay.drawRect(0, 0, W, H);
    this.overlay.endFill();
    c.addChild(this.overlay);

    // ── 3D Title "LOADING..." ──
    const titleY = H * 0.35;
    const titleCx = W / 2;

    const depthLayers: [number, number, number][] = [
      [P.title3dB, 5, 5],
      [P.title3dB, 4, 4],
      [P.title3dA, 3, 3],
      [P.title3dA, 2, 2],
    ];
    depthLayers.forEach(([color, dx, dy]) => {
      const t = new PIXI.Text('LOADING...', {
        fontFamily: PIXEL_FONT,
        fontSize:   36,
        fill:       color,
        align:      'center',
      } as PIXI.TextStyle);
      t.anchor.set(0.5);
      t.x = titleCx + dx;
      t.y = titleY + dy;
      c.addChild(t);
    });

    // Outline
    const outline = new PIXI.Text('LOADING...', {
      fontFamily:      PIXEL_FONT,
      fontSize:        36,
      fill:            P.titleFace,
      stroke:          0x000000,
      strokeThickness: 6,
      align:           'center',
    } as PIXI.TextStyle);
    outline.anchor.set(0.5);
    outline.x = titleCx; outline.y = titleY;
    c.addChild(outline);

    // Face
    const face = new PIXI.Text('LOADING...', {
      fontFamily: PIXEL_FONT,
      fontSize:   36,
      fill:       P.titleFace,
      align:      'center',
    } as PIXI.TextStyle);
    face.anchor.set(0.5);
    face.x = titleCx; face.y = titleY;
    c.addChild(face);

    // ── Progress bar container ──
    const barX = W / 2 - BAR_W / 2;
    const barY = H * 0.55;

    // Bar outer border (pixel style — 3px thick)
    const barBorder = new PIXI.Graphics();
    // Shadow
    barBorder.beginFill(0x000000, 0.5);
    barBorder.drawRect(barX + 4, barY + 4, BAR_W, BAR_H + 6);
    barBorder.endFill();
    // Border bg
    barBorder.beginFill(P.barBgBorder);
    barBorder.drawRect(barX - 3, barY - 3, BAR_W + 6, BAR_H + 6);
    barBorder.endFill();
    // Inner bg
    barBorder.beginFill(P.barBg);
    barBorder.drawRect(barX, barY, BAR_W, BAR_H);
    barBorder.endFill();
    // Corner accents
    [[barX - 3, barY - 3], [barX + BAR_W - 1, barY - 3],
     [barX - 3, barY + BAR_H - 1], [barX + BAR_W - 1, barY + BAR_H - 1]]
      .forEach(([cx, cy]) => {
        barBorder.beginFill(0x44dd44);
        barBorder.drawRect(cx, cy, 6, 6);
        barBorder.endFill();
      });
    c.addChild(barBorder);

    // Fill (updated every frame)
    this.barFillGfx = new PIXI.Graphics();
    this.barFillGfx.x = barX;
    this.barFillGfx.y = barY;
    c.addChild(this.barFillGfx);

    // ── Percent text ──
    const pctShadow = new PIXI.Text('0%', {
      fontFamily: PIXEL_FONT,
      fontSize:   14,
      fill:       P.percentShadow,
      align:      'center',
    } as PIXI.TextStyle);
    pctShadow.anchor.set(0.5, 0);
    pctShadow.x = W / 2 + 2;
    pctShadow.y = barY + BAR_H + 12 + 2;
    c.addChild(pctShadow);

    this.percentText = new PIXI.Text('0%', {
      fontFamily: PIXEL_FONT,
      fontSize:   14,
      fill:       P.percent,
      align:      'center',
    } as PIXI.TextStyle);
    this.percentText.anchor.set(0.5, 0);
    this.percentText.x = W / 2;
    this.percentText.y = barY + BAR_H + 12;
    c.addChild(this.percentText);

    // Sync shadow text ref
    this.percentText.on('change', () => { pctShadow.text = this.percentText.text; });

    // ── Tip text ──
    const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
    this.tipText = new PIXI.Text('TIP: ' + tip, {
      fontFamily: PIXEL_FONT,
      fontSize:   9,
      fill:       P.tipText,
      align:      'center',
    } as PIXI.TextStyle);
    this.tipText.anchor.set(0.5, 0);
    this.tipText.x = W / 2;
    this.tipText.y = barY + BAR_H + 44;
    c.addChild(this.tipText);

    // ── Fade in ──
    c.alpha = 0;
    this.fadeTo(1, 20);
  }

  // ── Pixel progress bar renderer ─────────────────────────────────────────
  private drawBar(progress: number) {
    const g    = this.barFillGfx;
    const fillW = Math.floor(BAR_W * progress);

    g.clear();
    if (fillW <= 0) return;

    // Draw pixel blocks
    let x = 0;
    while (x < fillW) {
      const bw = Math.min(BLOCK_W, fillW - x);

      // Main fill colour (alternating shade for texture)
      const col = Math.floor(x / (BLOCK_W + BLOCK_GAP)) % 2 === 0
        ? P.barFill : P.barFillMid;

      g.beginFill(col);
      g.drawRect(x, 0, bw, BAR_H);
      g.endFill();

      // Top shine strip
      g.beginFill(P.barShine, 0.5);
      g.drawRect(x, 0, bw, 4);
      g.endFill();

      // Bottom dark strip
      g.beginFill(P.barDark, 0.7);
      g.drawRect(x, BAR_H - 4, bw, 4);
      g.endFill();

      x += BLOCK_W + BLOCK_GAP;
    }

    // Right-edge glow when almost full
    if (progress > 0.95) {
      g.beginFill(0xffffff, (progress - 0.95) / 0.05 * 0.3);
      g.drawRect(0, 0, BAR_W, BAR_H);
      g.endFill();
    }
  }

  // ── Progress scheduling ─────────────────────────────────────────────────
  private startProgress() {
    // Total duration: random 3000–4000ms
    const total   = 3000 + Math.random() * 1000;
    const start   = performance.now();

    // Drive progress through requestAnimationFrame (independent of PIXI ticker)
    const step = () => {
      if (this.done) return;

      const elapsed = performance.now() - start;
      const raw     = Math.min(1, elapsed / total);

      // Easing: fast at start, slows near 90%, then snaps to 100%
      let eased: number;
      if (raw < 0.85) {
        eased = this.easeOut(raw / 0.85) * 0.92;
      } else {
        eased = 0.92 + (raw - 0.85) / 0.15 * 0.08;
      }

      this.targetProg = eased;

      if (raw < 1) {
        requestAnimationFrame(step);
      } else {
        // Snap to 100% then call complete after brief pause
        this.targetProg = 1;
        setTimeout(() => this.complete(), 400);
      }
    };

    requestAnimationFrame(step);
  }

  private easeOut(t: number) {
    return 1 - Math.pow(1 - t, 2.5);
  }

  // ── Called every PIXI ticker tick ───────────────────────────────────────
  update() {
    if (this.done) return;

    // Smooth interpolation toward targetProg
    this.progress += (this.targetProg - this.progress) * 0.06;

    this.drawBar(this.progress);

    const pct = Math.round(this.progress * 100);
    this.percentText.text = pct + '%';
  }

  // ── Complete: fade out then invoke callback ──────────────────────────────
  private complete() {
    this.done = true;
    this.drawBar(1);
    this.percentText.text = '100%';

    this.fadeTo(0, 25, () => {
      this.container.destroy({ children: true });
      this.onComplete();
    });
  }

  // ── Simple alpha tween (self-contained rAF) ─────────────────────────────
  private fadeTo(target: number, frames: number, cb?: () => void) {
    const start    = this.container.alpha;
    const delta    = target - start;
    let   elapsed  = 0;

    const tick = () => {
      elapsed++;
      this.container.alpha = start + delta * Math.min(1, elapsed / frames);
      if (elapsed < frames) requestAnimationFrame(tick);
      else cb?.();
    };
    requestAnimationFrame(tick);
  }

  destroy() {
    this.done = true;
    this.container.destroy({ children: true });
  }
}
