import * as PIXI from 'pixi.js';
import { createHorseFrames } from '../utils/PixelArtFactory';

const HORSE_SCALE     = 3;
const HORSE_FPS       = 12;
const HERD_SIZE       = 6;
const BASE_SPEED      = 2.8;
// FIX TS6133: bỏ LOGICAL_HORSE_H và displayH getter vì không dùng
const LOGICAL_HORSE_W = 22;

interface HorseInstance {
  sprite: PIXI.AnimatedSprite;
  speed:  number;
}

export class HorseSystem {
  private container: PIXI.Container;
  private horses: HorseInstance[] = [];
  private frames: PIXI.Texture[]  = [];
  private screenW: number;
  private groundY: number;

  constructor(app: PIXI.Application, container: PIXI.Container, screenW: number, groundY: number) {
    this.container = container;
    this.screenW   = screenW;
    this.groundY   = groundY;
    this.frames    = createHorseFrames(app);
    this.spawnHerd();
  }

  private get displayW() { return LOGICAL_HORSE_W * HORSE_SCALE; }

  private spawnHerd() {
    const spacing = this.screenW / HERD_SIZE;

    for (let i = 0; i < HERD_SIZE; i++) {
      const sprite = new PIXI.AnimatedSprite(this.frames);
      sprite.animationSpeed = HORSE_FPS / 60;
      sprite.play();
      sprite.currentFrame = Math.floor((i / HERD_SIZE) * this.frames.length);

      const sizeVar = 0.85 + (i % 3) * 0.12;
      sprite.scale.set(HORSE_SCALE * sizeVar);

      sprite.y = this.groundY - sprite.height - (i % 3) * 4;
      sprite.x = -this.displayW + spacing * i + (i * 37 % 40) - 20;

      const speed = BASE_SPEED * (0.85 + (i % 4) * 0.1);
      this.container.addChild(sprite);
      this.horses.push({ sprite, speed });
    }
  }

  update() {
    for (const { sprite, speed } of this.horses) {
      sprite.x += speed;
      if (sprite.x > this.screenW + 20) {
        sprite.x = -sprite.width - 10;
        sprite.y = this.groundY - sprite.height - (Math.floor(Math.random() * 3)) * 6;
      }
    }
  }

  resize(screenW: number, groundY: number) {
    this.screenW = screenW;
    this.groundY = groundY;
  }
}
