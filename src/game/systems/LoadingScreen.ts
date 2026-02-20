/**
 * LoadingScreen.ts
 *
 * Phase 1 — Progress bar (3–4 giây)
 * Phase 2 — Màn đen, chữ "2026" nhấp nháy giữa màn hình (3–4 giây)
 * → gọi onComplete() sau khi xong phase 2
 */
import * as PIXI from "pixi.js";

const PIXEL_FONT = '"Press Start 2P", "Courier New", monospace';

const P = {
  titleFace: 0xf5a623,
  title3dA: 0x8b3a00,
  title3dB: 0x5a2200,
  barBg: 0x1a1a2e,
  barBgBorder: 0x444466,
  barFill: 0x44dd44,
  barFillMid: 0x22aa22,
  barShine: 0x88ff88,
  barDark: 0x116611,
  percent: 0xffffff,
  percentShadow: 0x003300,
  overlayBg: 0x000000,
  tipText: 0xaaaaaa,
};

const BAR_W = 400;
const BAR_H = 28;
const BLOCK_W = 12;
const BLOCK_GAP = 2;

const TIPS = [
  "AVOID THE ROCKS",
  "COLLECT COINS",
  "SAVE YOUR ENERGY",
  "SPEED IS KEY",
  "STAY ALIVE!",
];

export class LoadingScreen {
  private container: PIXI.Container;
  private phase1: PIXI.Container; // progress bar layer
  private phase2: PIXI.Container; // "2026" blink layer

  private barFillGfx: PIXI.Graphics;
  private percentText: PIXI.Text;

  private progress = 0;
  private targetProg = 0;
  private done = false;
  private inPhase2 = false;

  private blinkTimer = 0;
  private blinkText!: PIXI.Text;

  private W: number;
  private H: number;
  private onComplete: () => void;

  constructor(
    parent: PIXI.Container,
    W: number,
    H: number,
    onComplete: () => void,
  ) {
    this.W = W;
    this.H = H;
    this.onComplete = onComplete;

    this.container = new PIXI.Container();
    parent.addChild(this.container);

    this.phase1 = new PIXI.Container();
    this.phase2 = new PIXI.Container();
    this.container.addChild(this.phase1);
    this.container.addChild(this.phase2);
    this.phase2.visible = false;

    this.buildPhase1();
    this.buildPhase2();
    this.startProgress();
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE 1 — Progress bar
  // ══════════════════════════════════════════════════════════════
  private buildPhase1() {
    const c = this.phase1;
    const { W, H } = this;

    // Full-screen dark overlay
    const overlay = new PIXI.Graphics();
    overlay.beginFill(P.overlayBg, 0.85);
    overlay.drawRect(0, 0, W, H);
    overlay.endFill();
    c.addChild(overlay);

    // Title "LOADING..."
    const titleY = H * 0.35;
    const titleCx = W / 2;

    (
      [
        [P.title3dB, 5, 5],
        [P.title3dB, 4, 4],
        [P.title3dA, 3, 3],
        [P.title3dA, 2, 2],
      ] as [number, number, number][]
    ).forEach(([color, dx, dy]) => {
      const t = new PIXI.Text("Đang tải thế giới...", {
        fontFamily: PIXEL_FONT,
        fontSize: 36,
        fill: color,
        align: "center",
      } as PIXI.TextStyle);
      t.anchor.set(0.5);
      t.x = titleCx + dx;
      t.y = titleY + dy;
      c.addChild(t);
    });

    ["stroke", "face"].forEach((layer) => {
      const t = new PIXI.Text("Đang tải thế giới...", {
        fontFamily: PIXEL_FONT,
        fontSize: 36,
        fill: P.titleFace,
        ...(layer === "stroke" ? { stroke: 0x000000, strokeThickness: 6 } : {}),
        align: "center",
      } as PIXI.TextStyle);
      t.anchor.set(0.5);
      t.x = titleCx;
      t.y = titleY;
      c.addChild(t);
    });

    // Progress bar
    const barX = W / 2 - BAR_W / 2;
    const barY = H * 0.55;

    const barBorder = new PIXI.Graphics();
    barBorder.beginFill(0x000000, 0.5);
    barBorder.drawRect(barX + 4, barY + 4, BAR_W, BAR_H + 6);
    barBorder.endFill();
    barBorder.beginFill(P.barBgBorder);
    barBorder.drawRect(barX - 3, barY - 3, BAR_W + 6, BAR_H + 6);
    barBorder.endFill();
    barBorder.beginFill(P.barBg);
    barBorder.drawRect(barX, barY, BAR_W, BAR_H);
    barBorder.endFill();

    [
      [barX - 3, barY - 3],
      [barX + BAR_W - 1, barY - 3],
      [barX - 3, barY + BAR_H - 1],
      [barX + BAR_W - 1, barY + BAR_H - 1],
    ].forEach(([cx, cy]) => {
      barBorder.beginFill(0x44dd44);
      barBorder.drawRect(cx, cy, 6, 6);
      barBorder.endFill();
    });
    c.addChild(barBorder);

    this.barFillGfx = new PIXI.Graphics();
    this.barFillGfx.x = barX;
    this.barFillGfx.y = barY;
    c.addChild(this.barFillGfx);

    // Percent text
    this.percentText = new PIXI.Text("0%", {
      fontFamily: PIXEL_FONT,
      fontSize: 14,
      fill: P.percent,
      align: "center",
    } as PIXI.TextStyle);
    this.percentText.anchor.set(0.5, 0);
    this.percentText.x = W / 2;
    this.percentText.y = barY + BAR_H + 12;
    c.addChild(this.percentText);

    // Tip
    const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
    const tipT = new PIXI.Text("TIP: " + tip, {
      fontFamily: PIXEL_FONT,
      fontSize: 12,
      fill: P.tipText,
      align: "center",
    } as PIXI.TextStyle);
    tipT.anchor.set(0.5, 0);
    tipT.x = W / 2;
    tipT.y = barY + BAR_H + 44;
    c.addChild(tipT);

    // Fade in
    c.alpha = 0;
    this.fadeTo(c, 1, 20);
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE 2 — Màn đen + "2026" nhấp nháy
  // ══════════════════════════════════════════════════════════════
  private buildPhase2() {
    const c = this.phase2;
    const { W, H } = this;

    // Màn đen hoàn toàn
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 1);
    bg.drawRect(0, 0, W, H);
    bg.endFill();
    c.addChild(bg);

    // "2026" — 3D extrude
    const cx = W / 2;
    const cy = H / 2;
    const SIZE = 150;

    (
      [
        [P.title3dB, 8, 8],
        [P.title3dB, 6, 6],
        [P.title3dA, 4, 4],
        [P.title3dA, 2, 2],
      ] as [number, number, number][]
    ).forEach(([color, dx, dy]) => {
      const t = new PIXI.Text("2026", {
        fontFamily: PIXEL_FONT,
        fontSize: SIZE,
        fontWeight: "700",
        fill: color,
        align: "center",
      } as PIXI.TextStyle);
      t.anchor.set(0.5);
      t.x = cx + dx;
      t.y = cy + dy;
      c.addChild(t);
    });

    // Outline
    const outline = new PIXI.Text("2026", {
      fontFamily: PIXEL_FONT,
      fontSize: SIZE,
      fontWeight: "700",
      fill: P.titleFace,
      stroke: 0x000000,
      strokeThickness: 8,
      align: "center",
    } as PIXI.TextStyle);
    outline.anchor.set(0.5);
    outline.x = cx;
    outline.y = cy;
    c.addChild(outline);

    // Face — đây là text nhấp nháy
    this.blinkText = new PIXI.Text("2026", {
      fontFamily: PIXEL_FONT,
      fontSize: SIZE,
      fontWeight: "700",
      fill: P.titleFace,
      align: "center",
    } as PIXI.TextStyle);
    this.blinkText.anchor.set(0.5);
    this.blinkText.x = cx;
    this.blinkText.y = cy;
    c.addChild(this.blinkText);
  }

  // ══════════════════════════════════════════════════════════════
  // PROGRESS SCHEDULING
  // ══════════════════════════════════════════════════════════════
  private startProgress() {
    const total = 3000 + Math.random() * 1000;
    const start = performance.now();

    const step = () => {
      if (this.done) return;
      const elapsed = performance.now() - start;
      const raw = Math.min(1, elapsed / total);

      let eased: number;
      if (raw < 0.85) {
        eased = this.easeOut(raw / 0.85) * 0.92;
      } else {
        eased = 0.92 + ((raw - 0.85) / 0.15) * 0.08;
      }

      this.targetProg = eased;

      if (raw < 1) {
        requestAnimationFrame(step);
      } else {
        this.targetProg = 1;
        // Sau 400ms snap 100% → chuyển sang phase 2
        setTimeout(() => this.enterPhase2(), 400);
      }
    };

    requestAnimationFrame(step);
  }

  private enterPhase2() {
    if (this.done) return;
    this.inPhase2 = true;
    this.blinkTimer = 0;

    // Fade out phase 1, fade in phase 2
    this.fadeTo(this.phase1, 0, 20, () => {
      this.phase1.visible = false;
    });

    this.phase2.visible = true;
    this.phase2.alpha = 0;
    this.fadeTo(this.phase2, 1, 25);

    // 3–4 giây sau → fade out phase 2 → complete
    const holdMs = 3000 + Math.random() * 1000;
    setTimeout(() => {
      if (this.done) return;
      this.fadeTo(this.phase2, 0, 30, () => {
        this.complete();
      });
    }, holdMs);
  }

  // ══════════════════════════════════════════════════════════════
  // UPDATE — gọi mỗi ticker tick từ UISystem
  // ══════════════════════════════════════════════════════════════
  update() {
    if (this.done) return;

    if (!this.inPhase2) {
      // Update progress bar
      this.progress += (this.targetProg - this.progress) * 0.06;
      this.drawBar(this.progress);
      this.percentText.text = Math.round(this.progress * 100) + "%";
    } else {
      // Nhấp nháy "2026": đổi alpha mỗi 20 frame (~0.33s)
      this.blinkTimer++;
      if (this.blinkTimer % 20 === 0) {
        this.blinkText.alpha = this.blinkText.alpha > 0.5 ? 0 : 1;
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════
  private drawBar(progress: number) {
    const g = this.barFillGfx;
    const fillW = Math.floor(BAR_W * progress);
    g.clear();
    if (fillW <= 0) return;

    let x = 0;
    while (x < fillW) {
      const bw = Math.min(BLOCK_W, fillW - x);
      const col =
        Math.floor(x / (BLOCK_W + BLOCK_GAP)) % 2 === 0
          ? P.barFill
          : P.barFillMid;

      g.beginFill(col);
      g.drawRect(x, 0, bw, BAR_H);
      g.endFill();

      g.beginFill(P.barShine, 0.5);
      g.drawRect(x, 0, bw, 4);
      g.endFill();

      g.beginFill(P.barDark, 0.7);
      g.drawRect(x, BAR_H - 4, bw, 4);
      g.endFill();

      x += BLOCK_W + BLOCK_GAP;
    }

    if (progress > 0.95) {
      g.beginFill(0xffffff, ((progress - 0.95) / 0.05) * 0.3);
      g.drawRect(0, 0, BAR_W, BAR_H);
      g.endFill();
    }
  }

  private easeOut(t: number) {
    return 1 - Math.pow(1 - t, 2.5);
  }

  private complete() {
    this.done = true;
    this.container.destroy({ children: true });
    this.onComplete();
  }

  private fadeTo(
    target: PIXI.Container,
    to: number,
    frames: number,
    cb?: () => void,
  ) {
    const from = target.alpha;
    const delta = to - from;
    let elapsed = 0;

    const tick = () => {
      elapsed++;
      target.alpha = from + delta * Math.min(1, elapsed / frames);
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
