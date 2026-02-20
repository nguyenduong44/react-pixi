import * as PIXI from 'pixi.js';
import { DODO_SHEET_URL } from '../../assets/assets';

const WALK_ROW   = 1;
const COLS       = 4;
const ROWS       = 3;
const DODO_SCALE = 3;
const DODO_FPS   = 8;
const FLOCK_SIZE = 6;
const BASE_SPEED = 2.0;

export class DodoSystem {
  private dodos: Array<{ sprite: PIXI.AnimatedSprite; speed: number }> = [];
  private screenW: number;
  private groundY: number;
  private loaded = false;

  // FIX TS1294: khai báo container là field riêng
  private container: PIXI.Container;

  constructor(app: PIXI.Application, container: PIXI.Container, groundY: number) {
    this.container = container;
    this.screenW   = app.screen.width;
    this.groundY   = groundY;
    this.load();
  }

  private async load() {
    const tex = await PIXI.Assets.load<PIXI.Texture>(DODO_SHEET_URL);
    tex.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

    const frameW = Math.floor(tex.width  / COLS);
    const frameH = Math.floor(tex.height / ROWS);

    const frames: PIXI.Texture[] = Array.from({ length: COLS }, (_, col) =>
      new PIXI.Texture(
        tex.baseTexture,
        new PIXI.Rectangle(col * frameW, WALK_ROW * frameH, frameW, frameH),
      )
    );

    const displayH = frameH * DODO_SCALE;
    const spacing  = this.screenW / FLOCK_SIZE;

    for (let i = 0; i < FLOCK_SIZE; i++) {
      const sprite = new PIXI.AnimatedSprite(frames);
      sprite.animationSpeed = DODO_FPS / 60;
      sprite.scale.set(DODO_SCALE);
      sprite.play();
      sprite.currentFrame = i % COLS;

      sprite.x = spacing * i - (i < 2 ? this.screenW : 0);
      sprite.y = this.groundY - displayH;

      const speed = BASE_SPEED * (0.9 + (i % 4) * 0.05);
      this.container.addChild(sprite);
      this.dodos.push({ sprite, speed });
    }

    this.loaded = true;
  }

  update() {
    if (!this.loaded) return;
    for (const { sprite, speed } of this.dodos) {
      sprite.x += speed;
      if (sprite.x > this.screenW + sprite.width) {
        sprite.x = -sprite.width;
      }
    }
  }

  resize(screenW: number, groundY: number) {
    this.screenW = screenW;
    this.groundY = groundY;
    if (!this.loaded) return;
    for (const { sprite } of this.dodos) {
      sprite.y = groundY - sprite.height;
    }
  }
}
