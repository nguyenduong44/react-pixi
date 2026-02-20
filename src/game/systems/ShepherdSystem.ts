/**
 * ShepherdSystem
 * Load 6 frame PNG riêng lẻ → AnimatedSprite
 * Di chuyển từ PHẢI → TRÁI, wrap khi ra khỏi màn hình trái
 * Sprite gốc nhìn sang phải → flip ngang bằng scale.x = -1
 */
import * as PIXI from "pixi.js";
import { SHEPHERD_FRAMES } from "../../assets/assets";

const SHEPHERD_SCALE = 3;
const SHEPHERD_FPS = 10;
const BASE_SPEED = 2;

export class ShepherdSystem {
  private dogs: Array<{ sprite: PIXI.AnimatedSprite; speed: number }> = [];
  private screenW: number;
  private groundY: number;
  private loaded = false;

  constructor(
    app: PIXI.Application,
    private container: PIXI.Container,
    groundY: number,
  ) {
    this.screenW = app.screen.width;
    this.groundY = groundY;
    this.load();
  }

  private async load() {
    // Load tất cả 6 frame song song
    const textures = await Promise.all(
      SHEPHERD_FRAMES.map((url) => PIXI.Assets.load<PIXI.Texture>(url)),
    );

    // Nearest-neighbor cho từng frame
    textures.forEach((t) => {
      t.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    });

    const frameH = textures[0].height;
    const displayH = frameH * SHEPHERD_SCALE;

    const sprite = new PIXI.AnimatedSprite(textures);
    sprite.animationSpeed = SHEPHERD_FPS / 60;
    sprite.play();

      // Flip ngang để nhìn sang phải (frame gốc nhìn trái)
    sprite.scale.set(-SHEPHERD_SCALE, SHEPHERD_SCALE);
    sprite.anchor.set(1, 0); // anchor.x=1 bù lại flip ngang

      // Bắt đầu từ bên trái, ngoài màn hình
      sprite.x = 0;
      sprite.y = this.groundY - displayH;

    this.container.addChild(sprite);
    this.dogs.push({ sprite, speed: BASE_SPEED });

    this.loaded = true;
  }

  update() {
    if (!this.loaded) return;

    for (const { sprite, speed } of this.dogs) {
      // Di chuyển sang phải
      sprite.x += speed;

      // anchor.x=1 nên sprite.x là mép phải
      // Khi mép trái (x - width) vượt qua screenW → reset
      const spriteW = Math.abs(sprite.width);
      if (sprite.x > this.screenW + spriteW) {
        sprite.x = -spriteW; // reset về ngoài mép trái
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
