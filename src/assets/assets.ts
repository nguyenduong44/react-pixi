import sheet1 from "./background_valley-Sheet1.png";
import sheet2 from "./background_valley-Sheet2.png";
import sheet3 from "./background_valley-Sheet3.png";
import sheet4 from "./background_valley-Sheet4.png";
import sheet5 from "./background_valley-Sheet5.png";

import shepherd1 from "./Shepherd_walk_1.png";
import shepherd2 from "./Shepherd_walk_2.png";
import shepherd3 from "./Shepherd_walk_3.png";
import shepherd4 from "./Shepherd_walk_4.png";
import shepherd5 from "./Shepherd_walk_5.png";
import shepherd6 from "./Shepherd_walk_6.png";

export const PARALLAX_SHEETS = [
  { url: sheet1, speed: 0.05, label: "sky" },
  { url: sheet2, speed: 0.2, label: "far-mtn" },
  { url: sheet3, speed: 0.4, label: "mid-mtn" },
  { url: sheet4, speed: 0.7, label: "ground" },
  { url: sheet5, speed: 1.1, label: "foreground" },
] as const;

// 6 frame riêng lẻ theo thứ tự animation
export const SHEPHERD_FRAMES = [
  shepherd1,
  shepherd2,
  shepherd3,
  shepherd4,
  shepherd5,
  shepherd6,
];
