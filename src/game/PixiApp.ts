import * as PIXI from "pixi.js";
import { BackgroundSystem } from "./systems/BackgroundSystem";
import { ShepherdSystem } from "./systems/ShepherdSystem";
import { UISystem } from "./systems/UISystem";

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

  constructor(canvas: HTMLCanvasElement) {
    // Luôn dùng window.innerWidth/H — đảm bảo đúng kích thước trên production
    const W = window.innerWidth  || 1280;
    const H = window.innerHeight || 720;

    // FIX: PIXI.settings phải nằm SAU khi import được resolve,
    // đặt trong constructor tránh lỗi module-level trên bản minified
    PIXI.settings.SCALE_MODE   = PIXI.SCALE_MODES.NEAREST;
    PIXI.settings.ROUND_PIXELS = true;

    this.app = new PIXI.Application({
      view:            canvas,
      width:           W,
      height:          H,
      backgroundColor: 0x5cc8d8,
      antialias:       false,
      // FIX: bỏ autoDensity + resolution để tránh xung đột với CSS 100vw/100vh
      // trên production, devicePixelRatio scaling gây canvas bị offset/black
      resolution:      1,
      autoDensity:     false,
    });

    this.backgroundContainer = new PIXI.Container();
    this.horseContainer      = new PIXI.Container();
    this.uiContainer         = new PIXI.Container();

    this.app.stage.addChild(
      this.backgroundContainer,
      this.horseContainer,
      this.uiContainer,
    );

    this.asyncInit(W, H);
    window.addEventListener("resize", this.onResize.bind(this));
  }

  private async asyncInit(W: number, H: number) {
    // FIX: không dùng .catch() — để lỗi nổi lên console rõ ràng trên production
    const loadingText = this.makeLoadingText(W, H);
    this.app.stage.addChild(loadingText);

    this.backgroundSystem = new BackgroundSystem(this.backgroundContainer, W, H);
    await this.backgroundSystem.init();

    if (this.destroyed) return;

    const groundY = this.computeGroundY(H);
    this.shepherdSystem = new ShepherdSystem(this.app, this.horseContainer, groundY);
    this.uiSystem       = new UISystem(this.uiContainer, W, H);

    this.app.stage.removeChild(loadingText);
    this.app.ticker.add(this.gameLoop.bind(this));
  }

  private gameLoop(): void {
    this.backgroundSystem?.update(BASE_SCROLL_SPEED);
    this.shepherdSystem?.update();
    this.uiSystem?.update();
  }

  private computeGroundY(H: number): number {
    return Math.floor(H * 0.85);
  }

  private makeLoadingText(W: number, H: number): PIXI.Text {
    const t = new PIXI.Text("Loading…", {
      fontFamily: '"Courier New", monospace',
      fontSize:   22,
      fill:       0xffffff,
      align:      "center",
    });
    t.anchor.set(0.5);
    t.x = W / 2;
    t.y = H / 2;
    return t;
  }

  private onResize(): void {
    const W = window.innerWidth;
    const H = window.innerHeight;
    this.app.renderer.resize(W, H);
    this.backgroundSystem?.resize(W, H);
    this.shepherdSystem?.resize(W, this.computeGroundY(H));
  }

  destroy(): void {
    this.destroyed = true;
    window.removeEventListener("resize", this.onResize.bind(this));
    this.app.ticker.stop();
    this.app.destroy(false, { children: true, texture: true, baseTexture: true });
  }
}
