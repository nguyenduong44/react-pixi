/**
 * PixiApp — Main orchestrator (async-aware)
 *
 * Flow:
 *   1. Create PIXI.Application
 *   2. Show a loading text
 *   3. Await BackgroundSystem.init() (fetches PNG assets)
 *   4. Build HorseSystem + UISystem (still procedural)
 *   5. Remove loading text, start ticker
 */
import * as PIXI from "pixi.js";
import { BackgroundSystem } from "./systems/BackgroundSystem";
import { ShepherdSystem } from "./systems/ShepherdSystem";
import { UISystem } from "./systems/UISystem";

// Global pixel-perfect settings
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
PIXI.settings.ROUND_PIXELS = true;

const BASE_SCROLL_SPEED = 1.2;

export class PixiApp {
  private app: PIXI.Application;

  private backgroundContainer: PIXI.Container;
  private horseContainer: PIXI.Container;
  private uiContainer: PIXI.Container;

  private backgroundSystem!: BackgroundSystem;
  private shepherdSystem!: ShepherdSystem;
  private uiSystem!: UISystem;

  private destroyed = false;

  constructor(private canvas: HTMLCanvasElement) {
    const W = Math.max(320, canvas.width || window.innerWidth || 1280);
    const H = Math.max(180, canvas.height || window.innerHeight || 720);

    this.app = new PIXI.Application({
      view: canvas,
      width: W,
      height: H,
      backgroundColor: 0x5cc8d8, // sky-blue fallback while loading
      antialias: false,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    });

    // Containers (added in z-order)
    this.backgroundContainer = new PIXI.Container();
    this.horseContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();

    this.app.stage.addChild(
      this.backgroundContainer,
      this.horseContainer,
      this.uiContainer,
    );

    // Kick off async init
    this.asyncInit(W, H).catch((err) =>
      console.error("[PixiApp] init error:", err),
    );

    window.addEventListener("resize", this.onResize.bind(this));
  }

  // ── Async init ─────────────────────────────────────────────────────────
  private async asyncInit(W: number, H: number) {
    // Show a "Loading…" indicator while fetching PNGs
    const loadingText = this.makeLoadingText(W, H);
    this.app.stage.addChild(loadingText);

    // ── Background (async PNG load) ──
    this.backgroundSystem = new BackgroundSystem(
      this.backgroundContainer,
      W,
      H,
    );
    await this.backgroundSystem.init();

    if (this.destroyed) return;

    // ── Shepherd system (6 frame PNGs) ──
    const groundY = this.computeGroundY(H);
    this.shepherdSystem = new ShepherdSystem(
      this.app,
      this.horseContainer,
      groundY,
    );

    // ── UI system ──
    this.uiSystem = new UISystem(this.app, this.uiContainer, W, H);

    // Remove loading overlay
    this.app.stage.removeChild(loadingText);

    // ── Start game loop ──
    this.app.ticker.add(this.gameLoop.bind(this));

    console.log("[PixiApp] Ready ✓");
  }

  // ── Game loop ───────────────────────────────────────────────────────────
  private gameLoop(): void {
    this.backgroundSystem?.update(BASE_SCROLL_SPEED);
    this.shepherdSystem?.update();
    this.uiSystem?.update();
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  private computeGroundY(H: number): number {
    return Math.floor(H * 0.85);
  }

  private makeLoadingText(W: number, H: number): PIXI.Text {
    const t = new PIXI.Text("Loading…", {
      fontFamily: '"Courier New", monospace',
      fontSize: 22,
      fill: 0xffffff,
      align: "center",
      dropShadow: true,
      dropShadowDistance: 2,
    });
    t.anchor.set(0.5);
    t.x = W / 2;
    t.y = H / 2;
    return t;
  }

  // ── Resize ──────────────────────────────────────────────────────────────
  private onResize(): void {
    const W = Math.max(1, window.innerWidth);
    const H = Math.max(1, window.innerHeight);
    this.app.renderer.resize(W, H);
    this.backgroundSystem?.resize(W, H);
    this.shepherdSystem?.resize(W, this.computeGroundY(H));
  }

  destroy(): void {
    this.destroyed = true;
    window.removeEventListener("resize", this.onResize.bind(this));
    this.app.ticker.stop();
    this.app.destroy(false, {
      children: true,
      texture: true,
      baseTexture: true,
    });
  }
}
