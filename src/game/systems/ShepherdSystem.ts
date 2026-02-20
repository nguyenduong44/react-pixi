import * as PIXI from "pixi.js";
import { SHEPHERD_FRAMES } from "../../assets/assets";

const SHEPHERD_SCALE = 3;
const SHEPHERD_FPS   = 10;
const BASE_SPEED     = 2.0;

export class ShepherdSystem {
  private dogs: Array<{ sprite: PIXI.AnimatedSprite; speed: number }> = [];
  private screenW: number;
  private groundY: number;
  private loaded = false;

  // FIX TS1294: khai báo container là field riêng, không dùng parameter property
  private container: PIXI.Container;

  constructor(app: PIXI.Application, container: PIXI.Container, groundY: number) {
    this.container = container;
    this.screenW   = app.screen.width;
    this.groundY   = groundY;
    this.load();
  }

  private async load() {
    const textures = await Promise.all(
      SHEPHERD_FRAMES.map((url) => PIXI.Assets.load<PIXI.Texture>(url)),
    );

    textures.forEach((t) => {
      t.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    });

    const frameH   = textures[0].height;
    const displayH = frameH * SHEPHERD_SCALE;

    const sprite = new PIXI.AnimatedSprite(textures);
    sprite.animationSpeed = SHEPHERD_FPS / 60;
    sprite.play();

    // Flip ngang: frame gốc nhìn trái → scale.x âm để nhìn phải
    sprite.scale.set(-SHEPHERD_SCALE, SHEPHERD_SCALE);
    // anchor.x = 1 bù lại việc flip ngang
    sprite.anchor.set(1, 0);

    sprite.x = 0;
    sprite.y = this.groundY - displayH;

    this.container.addChild(sprite);
    this.dogs.push({ sprite, speed: BASE_SPEED });
    this.loaded = true;
  }

  update() {
    if (!this.loaded) return;

    for (const { sprite, speed } of this.dogs) {
      sprite.x += speed;

      // anchor.x=1 → sprite.x là mép phải của sprite
      const spriteW = Math.abs(sprite.width);
      if (sprite.x > this.screenW + spriteW) {
        sprite.x = -spriteW;
      }
    }
  }

  resize(screenW: number, groundY: number) {
    this.screenW = screenW;
    this.groundY = groundY;

    if (!this.loaded) return;
    for (const { sprite } of this.dogs) {
      sprite.y = groundY - Math.abs(sprite.height);
    }
  }
}
