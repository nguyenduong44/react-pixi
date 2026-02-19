/**
 * UISystem — Classic Arcade Text Menu
 *
 * FIX: Items left-aligned at a fixed column (not center-anchored).
 *      Cursor ► sits in its own fixed column to the LEFT of all items.
 *      Gap between cursor and text is always constant.
 *
 *  col layout:
 *    [CURSOR_COL]  [ITEMS_LEFT_COL] ← text starts here
 *        ►           START
 *                    EXIT
 *
 * States: 'main' | 'difficulty' | 'loading'
 */
import * as PIXI from "pixi.js";
import { soundManager } from "../utils/SoundManager";
import { LoadingScreen } from "./LoadingScreen";

const PIXEL_FONT = '"Ysabeau Infant", "Courier New", monospace';

const P = {
  titleFill: 0xf5a623,
  title3dA: 0x8b3a00,
  title3dB: 0x5a2200,
  itemNormal: 0xffffff,
  itemHover: 0xf5e642,
  itemShadow: 0x112200,
  cursorColor: 0xf5e642,
  cursorShadow: 0x5a4a00,
};

type MenuState = "main" | "difficulty";

interface MenuItem {
  label: string;
  onClick: () => void;
}

const TITLE_SIZE = 250;
const ITEM_SIZE = 60;
const ITEM_SPACING = 70;
const ITEM_WEIGHT = "700";

// ── Layout constants ──────────────────────────────────────────────────────
// All items are LEFT-aligned starting at ITEMS_LEFT (relative to center).
// Cursor sits CURSOR_GAP pixels to the left of ITEMS_LEFT.
const ITEMS_HALF_OFFSET = 90; // items start at  cx - ITEMS_HALF_OFFSET
const CURSOR_GAP = 36; // cursor sits that many px left of item text

export class UISystem {
  private app: PIXI.Application;
  private container: PIXI.Container;
  private menus = new Map<MenuState, PIXI.Container>();
  private state: MenuState = "main";
  private W: number;
  private H: number;

  private cursorIndex = 0;
  private cursorSprites = new Map<MenuState, PIXI.Text>();
  private menuItems = new Map<MenuState, MenuItem[]>();
  private itemTexts = new Map<MenuState, PIXI.Text[]>();
  private itemBaseY = new Map<MenuState, number>();

  private blinkTimer = 0;
  private blinkOn = true;

  private loadingScreen: LoadingScreen | null = null;

  private tween: {
    active: boolean;
    dir: "in" | "out";
    container: PIXI.Container;
    duration: number;
    elapsed: number;
    onComplete?: () => void;
  } | null = null;

  constructor(
    app: PIXI.Application,
    container: PIXI.Container,
    W: number,
    H: number,
  ) {
    this.app = app;
    this.container = container;
    this.W = W;
    this.H = H;

    this.buildMain();
    this.buildDifficulty();
    this.showMenu("main", false);
    this.bindKeyboard();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN MENU
  // ═══════════════════════════════════════════════════════════════════════════
  private buildMain() {
    const c = new PIXI.Container();
    c.alpha = 0;
    c.visible = false;

    const items: MenuItem[] = [
      {
        label: "bắt đầu",
        onClick: () => {
          soundManager.playMenuOpen();
          this.transitionTo("difficulty");
        },
      },
      {
        label: "thoát",
        onClick: () => {
          soundManager.playClick();
          this.fadeOutAll();
        },
      },
    ];
    this.menuItems.set("main", items);

    // Title
    c.addChild(this.make3DTitle("2026", this.W / 2, this.H * 0.22));

    // Items
    const startY = this.H * 0.52;
    this.itemBaseY.set("main", startY);
    const { root, cursor } = this.makeItemList(items, startY, "main");
    c.addChild(root);
    this.cursorSprites.set("main", cursor);

    this.container.addChild(c);
    this.menus.set("main", c);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DIFFICULTY MENU
  // ═══════════════════════════════════════════════════════════════════════════
  private buildDifficulty() {
    const c = new PIXI.Container();
    c.alpha = 0;
    c.visible = false;

    const items: MenuItem[] = [
      {
        label: "dễ",
        onClick: () => {
          soundManager.playClick();
          this.startLoading("EASY");
        },
      },
      {
        label: "bình thường",
        onClick: () => {
          soundManager.playClick();
          this.startLoading("MEDIUM");
        },
      },
      {
        label: "khó",
        onClick: () => {
          soundManager.playClick();
          this.startLoading("HARD");
        },
      },
      {
        label: "châu á",
        onClick: () => {
          soundManager.playClick();
          this.startLoading("ASIA");
        },
      },
      {
        label: "< QUAY LẠI",
        onClick: () => {
          soundManager.playMenuBack();
          this.transitionTo("main");
        },
      },
    ];
    this.menuItems.set("difficulty", items);

    // Title
    c.addChild(this.make3DTitle("2026", this.W / 2, this.H * 0.18));

    // Items
    const startY = this.H * 0.4;
    this.itemBaseY.set("difficulty", startY);
    const { root, cursor } = this.makeItemList(items, startY, "difficulty");
    c.addChild(root);
    this.cursorSprites.set("difficulty", cursor);

    this.container.addChild(c);
    this.menus.set("difficulty", c);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOADING SCREEN TRIGGER
  // ═══════════════════════════════════════════════════════════════════════════
  private startLoading(level: string) {
    // Hide all menus first
    this.menus.forEach((c) => {
      c.visible = false;
    });

    console.log(`[Game] Starting: ${level}`);

    this.loadingScreen = new LoadingScreen(
      this.container,
      this.W,
      this.H,
      () => {
        // Loading complete → back to main (in a real game: launch game scene)
        this.loadingScreen = null;
        this.showMenu("main", true);
        console.log(`[Game] ${level} loaded — launching game!`);
      },
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3-D EXTRUDED TITLE
  // ═══════════════════════════════════════════════════════════════════════════
  private make3DTitle(text: string, cx: number, cy: number): PIXI.Container {
    const c = new PIXI.Container();

    const depthLayers: [number, number, number][] = [
      [P.title3dB, 6, 6],
      [P.title3dB, 5, 5],
      [P.title3dA, 4, 4],
      [P.title3dA, 3, 3],
      [P.title3dA, 2, 2],
    ];

    depthLayers.forEach(([color, dx, dy]) => {
      const t = new PIXI.Text(text, {
        fontFamily: PIXEL_FONT,
        fontSize: TITLE_SIZE,
        fontWeight: ITEM_WEIGHT,
        fill: color,
        align: "center",
      } as PIXI.TextStyle);
      t.anchor.set(0.5);
      t.x = cx + dx;
      t.y = cy + dy;
      c.addChild(t);
    });

    // Black outline
    const outline = new PIXI.Text(text, {
      fontFamily: PIXEL_FONT,
      fontSize: TITLE_SIZE,
      fill: P.titleFill,
      stroke: 0x000000,
      strokeThickness: 6,
      align: "center",
      fontWeight: ITEM_WEIGHT,
    } as PIXI.TextStyle);
    outline.anchor.set(0.5);
    outline.x = cx;
    outline.y = cy;
    c.addChild(outline);

    // Face
    const face = new PIXI.Text(text, {
      fontFamily: PIXEL_FONT,
      fontSize: TITLE_SIZE,
      fill: P.titleFill,
      align: "center",
      fontWeight: ITEM_WEIGHT,
    } as PIXI.TextStyle);
    face.anchor.set(0.5);
    face.x = cx;
    face.y = cy;
    c.addChild(face);

    return c;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ITEM LIST — LEFT-ALIGNED with separate cursor column
  // ═══════════════════════════════════════════════════════════════════════════
  private makeItemList(
    items: MenuItem[],
    startY: number,
    state: MenuState,
  ): { root: PIXI.Container; cursor: PIXI.Text } {
    const root = new PIXI.Container();
    const texts: PIXI.Text[] = [];

    // Fixed columns
    const itemsLeft = this.W / 2 - ITEMS_HALF_OFFSET; // text left edge
    const cursorX = itemsLeft - CURSOR_GAP; // cursor right edge

    items.forEach((item, i) => {
      const y = startY + i * ITEM_SPACING;

      // Shadow (offset 2px right-down)
      const shadow = new PIXI.Text(item.label, {
        fontFamily: PIXEL_FONT,
        fontSize: ITEM_SIZE,
        fontWeight: ITEM_WEIGHT,
        fill: P.itemShadow,
      } as PIXI.TextStyle);
      shadow.anchor.set(0, 0.5); // LEFT-align
      shadow.x = itemsLeft + 2;
      shadow.y = y + 2;
      root.addChild(shadow);

      // Main text
      const t = new PIXI.Text(item.label, {
        fontFamily: PIXEL_FONT,
        fontSize: ITEM_SIZE,
        fontWeight: ITEM_WEIGHT,
        fill: P.itemNormal,
      } as PIXI.TextStyle);
      t.anchor.set(0, 0.5); // LEFT-align
      t.x = itemsLeft;
      t.y = y;
      t.interactive = true;
      t.cursor = "pointer";

      t.on("pointerover", () => {
        if (this.state !== state) return;
        this.moveCursor(i, state);
      });
      t.on("pointerup", () => {
        if (this.state !== state) return;
        soundManager.playClick();
        items[i].onClick();
      });

      root.addChild(t);
      texts.push(t);
    });

    this.itemTexts.set(state, texts);

    // Cursor ► — RIGHT-aligned flush against cursorX
    const cursor = new PIXI.Text("►", {
      fontFamily: PIXEL_FONT,
      fontSize: ITEM_SIZE,
      fill: P.cursorColor,
      dropShadow: true,
      dropShadowColor: P.cursorShadow,
      dropShadowDistance: 2,
    } as PIXI.TextStyle);
    cursor.anchor.set(1, 0.5); // RIGHT-align so it doesn't shift text
    cursor.x = cursorX;
    cursor.y = startY; // starts at first item

    root.addChild(cursor);
    return { root, cursor };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CURSOR MOVEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  private moveCursor(index: number, state: MenuState) {
    const items = this.menuItems.get(state)!;
    const texts = this.itemTexts.get(state)!;
    const cursor = this.cursorSprites.get(state)!;

    this.cursorIndex = Math.max(0, Math.min(items.length - 1, index));
    cursor.y = texts[this.cursorIndex].y;
    cursor.alpha = 1;

    texts.forEach((t, i) => {
      t.style.fill = i === this.cursorIndex ? P.itemHover : P.itemNormal;
    });

    soundManager.playHover();
  }

  private selectCurrent() {
    this.menuItems.get(this.state)?.[this.cursorIndex]?.onClick();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // KEYBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  private bindKeyboard() {
    window.addEventListener("keydown", (e) => {
      if (this.loadingScreen) return; // disable input during loading
      const items = this.menuItems.get(this.state);
      if (!items) return;

      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        this.moveCursor(this.cursorIndex + 1, this.state);
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        this.moveCursor(this.cursorIndex - 1, this.state);
      } else if (e.key === "Enter" || e.key === " ") {
        this.selectCurrent();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSITIONS
  // ═══════════════════════════════════════════════════════════════════════════
  private showMenu(state: MenuState, animated: boolean) {
    const c = this.menus.get(state)!;
    c.visible = true;
    this.cursorIndex = 0;
    this.moveCursor(0, state);

    if (!animated) {
      c.alpha = 1;
    } else {
      this.startTween(c, "in", 20);
    }

    this.state = state;
  }

  private hideMenu(state: MenuState, then?: () => void) {
    const c = this.menus.get(state)!;
    this.startTween(c, "out", 14, () => {
      c.visible = false;
      then?.();
    });
  }

  private transitionTo(next: MenuState) {
    this.hideMenu(this.state, () => this.showMenu(next, true));
  }

  private startTween(
    container: PIXI.Container,
    dir: "in" | "out",
    duration: number,
    onComplete?: () => void,
  ) {
    this.tween = {
      active: true,
      dir,
      container,
      duration,
      elapsed: 0,
      onComplete,
    };
  }

  private fadeOutAll() {
    this.menus.forEach((c) => this.startTween(c, "out", 30));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE (every ticker tick)
  // ═══════════════════════════════════════════════════════════════════════════
  update() {
    // Loading screen drives itself
    this.loadingScreen?.update();

    // Cursor blink (every 30 frames ≈ 0.5s)
    if (!this.loadingScreen) {
      this.blinkTimer++;
      if (this.blinkTimer % 30 === 0) {
        this.blinkOn = !this.blinkOn;
        const cursor = this.cursorSprites.get(this.state);
        if (cursor) cursor.alpha = this.blinkOn ? 1 : 0;
      }
    }

    // Menu fade tween
    if (!this.tween?.active) return;
    const t = this.tween;
    t.elapsed++;
    const p = Math.min(1, t.elapsed / t.duration);
    const e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
    t.container.alpha = t.dir === "in" ? e : 1 - e;
    if (p >= 1) {
      t.container.alpha = t.dir === "in" ? 1 : 0;
      t.active = false;
      t.onComplete?.();
    }
  }
}
