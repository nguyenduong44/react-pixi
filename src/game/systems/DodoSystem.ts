/**
 * DodoSystem — đơn giản, chỉ dùng row 1 của dodo.png
 * Đi từ trái → phải, wrap lại khi ra khỏi màn hình
 */
import * as PIXI from 'pixi.js';
import { DODO_SHEET_URL } from '../../assets/assets';

const WALK_ROW   = 1;    // row thứ 2 (0-indexed)
const COLS       = 4;    // 4 frames mỗi row
const ROWS       = 3;    // tổng số row trong sheet

const DODO_SCALE = 3;
const DODO_FPS   = 8;
const FLOCK_SIZE = 6;
const BASE_SPEED = 2.0;

export class DodoSystem {
  private dodos: Array<{ sprite: PIXI.AnimatedSprite; speed: number }> = [];
  private screenW: number;
  private groundY: number;
  private loaded = false;

  constructor(
    app: PIXI.Application,
    private container: PIXI.Container,
    groundY: number
  ) {
    this.screenW = app.screen.width;
    this.groundY = groundY;
    this.load();
  }

  private async load() {
    const tex = await PIXI.Assets.load<PIXI.Texture>(DODO_SHEET_URL);
    tex.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

    const frameW = Math.floor(tex.width  / COLS);
    const frameH = Math.floor(tex.height / ROWS);

    // Cắt đúng 4 frame của row 1
    const frames: PIXI.Texture[] = Array.from({ length: COLS }, (_, col) =>
      new PIXI.Texture(
        tex.baseTexture,
        new PIXI.Rectangle(col * frameW, WALK_ROW * frameH, frameW, frameH)
      )
    );

    // Chiều cao thực của 1 dodo sau khi scale
    const displayH = frameH * DODO_SCALE;
    const spacing  = this.screenW / FLOCK_SIZE;

    for (let i = 0; i < FLOCK_SIZE; i++) {
      const sprite = new PIXI.AnimatedSprite(frames);
      sprite.animationSpeed = DODO_FPS / 60;
      sprite.scale.set(DODO_SCALE);
      sprite.play();
      sprite.currentFrame = i % COLS;

      // X: dàn đều, 1 số bắt đầu ngoài màn hình trái để stagger
      sprite.x = spacing * i - (i < 2 ? this.screenW : 0);

      // Y: đứng trên mặt đất — dùng displayH thay vì sprite.height
      // vì sprite.height chỉ chính xác sau khi scale được set
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

      // Khi ra khỏi màn hình phải → reset về bên trái
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
