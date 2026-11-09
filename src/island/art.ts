/**
 * 小岛插画图标。全部原创绘制，48×48 画布，贴在纯色圆角方块（tile）上。
 * 画法：完全扁平，不画描边，只用色块拼；明暗靠同色系的深一档/浅一档色块，高光是一个小白点。
 * 每个图标声明默认底色 tone；动画用 class 标记，由 state-icon.ts 的样式驱动。
 */

export type Tone = "yellow" | "orange" | "red" | "pink" | "purple" | "blue" | "sky" | "teal" | "green" | "wood" | "grey";

export const TONES: Record<Tone, string> = {
  yellow: "#ffcc3d",
  orange: "#ff9a3c",
  red: "#f4695a",
  pink: "#ff8fab",
  purple: "#b48cf2",
  blue: "#5aa7f0",
  sky: "#5cc8e8",
  teal: "#3ec2ae",
  green: "#6cc96a",
  wood: "#d39a5c",
  grey: "#c4bba6",
};

interface Art { tone: Tone; svg: string }

// 五官：深棕色块眼睛、粉色腮红、小嘴（色块，不是轮廓线）
const EYE = "#6b4a2b";
const face = (cx: number, cy: number, s = 1) => `
  <ellipse cx="${cx - 4.6 * s}" cy="${cy}" rx="${1.7 * s}" ry="${2 * s}" fill="${EYE}"/>
  <ellipse cx="${cx + 4.6 * s}" cy="${cy}" rx="${1.7 * s}" ry="${2 * s}" fill="${EYE}"/>
  <ellipse cx="${cx - 8 * s}" cy="${cy + 3.6 * s}" rx="${2.4 * s}" ry="${1.5 * s}" fill="#ff8fab"/>
  <ellipse cx="${cx + 8 * s}" cy="${cy + 3.6 * s}" rx="${2.4 * s}" ry="${1.5 * s}" fill="#ff8fab"/>
  <path d="M${cx - 2.4 * s} ${cy + 3 * s}h${4.8 * s}a${2.4 * s} ${2.4 * s} 0 0 1-${4.8 * s} 0z" fill="#e0606e"/>`;

const BELL = "M24 6.5a2.8 2.8 0 0 1 2.8 2.8v.5c5.6 1.4 8.8 6 8.8 11.8v6.6l3.6 4.8H8.8l3.6-4.8v-6.6c0-5.8 3.2-10.4 8.8-11.8v-.5A2.8 2.8 0 0 1 24 6.5z";
const SHIELD = "M24 5l15 5.2v10.9c0 9.8-6.4 17.2-15 21.3C15.4 38.3 9 30.9 9 21.1V10.2z";
const SHIELD_R = "M24 5l15 5.2v10.9c0 9.8-6.4 17.2-15 21.3z";
const shield = (inner: string) => `<path d="${SHIELD}" fill="#fffaf0"/><path d="${SHIELD_R}" fill="#f1e5c8"/>${inner}`;
const CLOUD = "M13.5 37a8 8 0 0 1-.8-15.9 10.6 10.6 0 0 1 20.6-1.4A8.1 8.1 0 0 1 34.5 37z";
const DROP = (x: number, y: number) => `<path d="M${x} ${y}c1.4 2 2.4 3.4 2.4 4.6a2.4 2.4 0 0 1-4.8 0c0-1.2 1-2.6 2.4-4.6z"/>`;
const LOCK_BODY = `
  <rect x="10" y="20" width="28" height="22" rx="7" fill="#ffcc3d"/>
  <path d="M10 33h28v2a7 7 0 0 1-7 7H17a7 7 0 0 1-7-7z" fill="#f5b52e"/>
  <circle cx="24" cy="28.5" r="3.2" fill="${EYE}"/>
  <rect x="22.4" y="29" width="3.2" height="6.5" rx="1.6" fill="${EYE}"/>
  <ellipse cx="15" cy="24.5" rx="1.8" ry="2.4" fill="#fff6c8"/>`;

export const ART: Record<string, Art> = {
  bulb: {
    tone: "orange",
    svg: `
      <g class="glow" stroke="#fff3c4" stroke-width="3" stroke-linecap="round">
        <path d="M24 1.8v3M8.6 7.8l2.1 2.1M39.4 7.8l-2.1 2.1M3.6 20.5h3M41.4 20.5h3"/>
      </g>
      <path d="M24 7a12.3 12.3 0 0 0-7.4 22.1c1.1.9 1.8 2.2 1.8 3.6v.8h11.2v-.8c0-1.4.7-2.7 1.8-3.6A12.3 12.3 0 0 0 24 7z" fill="#fff3a6"/>
      <path d="M24 7a12.3 12.3 0 0 1 7.4 22.1c-1.1.9-1.8 2.2-1.8 3.6v.8H25V7z" fill="#ffe36e"/>
      <path d="M20.2 26l2-3.4 1.8 2.4 1.8-2.4 2 3.4" fill="none" stroke="#ff9a3c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <ellipse cx="18.6" cy="15.6" rx="2.2" ry="3.6" transform="rotate(32 18.6 15.6)" fill="#fff"/>
      <rect x="18" y="33.5" width="12" height="3.6" rx="1.8" fill="#c7d6e3"/>
      <rect x="18.6" y="37" width="10.8" height="3.4" rx="1.7" fill="#a3b8cb"/>
      <path d="M21.2 40.2h5.6l-1.2 2.6h-3.2z" fill="#8299ae"/>`,
  },
  fan: {
    tone: "teal",
    svg: `
      <circle cx="24" cy="20" r="15.5" fill="#c9f2e9"/>
      <circle cx="24" cy="20" r="12.8" fill="#f4fffc"/>
      <g class="spin">
        <path d="M24 20c-3.6-4.2-3.2-10.8.9-11.8 4.2-1 6.3 4.8-.9 11.8z" fill="#ff8fab"/>
        <path d="M24 20c-3.6-4.2-3.2-10.8.9-11.8 4.2-1 6.3 4.8-.9 11.8z" fill="#ffcc3d" transform="rotate(120 24 20)"/>
        <path d="M24 20c-3.6-4.2-3.2-10.8.9-11.8 4.2-1 6.3 4.8-.9 11.8z" fill="#5aa7f0" transform="rotate(240 24 20)"/>
      </g>
      <circle cx="24" cy="20" r="3.2" fill="#fff"/>
      <circle cx="24" cy="20" r="1.4" fill="#3ec2ae"/>
      <rect x="21.8" y="34" width="4.4" height="5.5" fill="#c9f2e9"/>
      <rect x="13.5" y="38.5" width="21" height="6" rx="3" fill="#f4fffc"/>
      <rect x="13.5" y="41.5" width="21" height="3" rx="1.5" fill="#c9f2e9"/>`,
  },
  aircon: {
    tone: "blue",
    svg: `
      <rect x="4.5" y="8" width="39" height="21" rx="7.5" fill="#fff"/>
      <path d="M4.5 20.5h39v1a7.5 7.5 0 0 1-7.5 7.5H12a7.5 7.5 0 0 1-7.5-7.5z" fill="#dde9f5"/>
      <rect x="10" y="23" width="28" height="2.6" rx="1.3" fill="#b5c9dc"/>
      <rect x="30.5" y="12.2" width="8" height="3.4" rx="1.7" fill="#6cc96a"/>
      <circle cx="11" cy="13.9" r="1.8" fill="#ffcc3d"/>
      <g class="wind" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none">
        <path d="M14 33.5c2.4 2.1 0 4.4 2.4 6.6"/>
        <path d="M24 33.5c2.4 2.1 0 4.4 2.4 6.6"/>
        <path d="M34 33.5c2.4 2.1 0 4.4 2.4 6.6"/>
      </g>`,
  },
  "curtain-open": {
    tone: "green",
    svg: `
      <rect x="8.5" y="8" width="31" height="33" rx="4.5" fill="#c4ecff"/>
      <circle cx="24" cy="18.5" r="4.8" fill="#ffcc3d"/>
      <path d="M8.5 34.5c5-5.5 9.5-5.5 13.5-2.4 4.4 3.3 9.4 2.4 17.5-2.6V36.5a4.5 4.5 0 0 1-4.5 4.5H13a4.5 4.5 0 0 1-4.5-4.5z" fill="#8fdc8a"/>
      <path d="M8.5 8h9.5c-1.3 10 1.1 23 3.7 33H8.5z" fill="#ff8fab"/>
      <path d="M39.5 8H30c1.3 10-1.1 23-3.7 33h13.2z" fill="#ff8fab"/>
      <path d="M8.5 8h3.6c-.4 11 .4 22 1.6 33H8.5zM39.5 8h-3.6c.4 11-.4 22-1.6 33h5.2z" fill="#ffb3c4"/>
      <rect x="4.5" y="5.5" width="39" height="4.4" rx="2.2" fill="#c98d55"/>
      <circle cx="5.5" cy="7.7" r="2.8" fill="#a5713f"/><circle cx="42.5" cy="7.7" r="2.8" fill="#a5713f"/>`,
  },
  "curtain-closed": {
    tone: "green",
    svg: `
      <rect x="8.5" y="8" width="31" height="33" rx="4.5" fill="#ff8fab"/>
      <path d="M8.5 8h5v33h-.5a4.5 4.5 0 0 1-4.5-4.5zM18.5 8h5v33h-5zM28.5 8h5v33h-5z" fill="#ffb3c4"/>
      <rect x="23.4" y="8" width="1.2" height="33" fill="#e06d8c"/>
      <rect x="4.5" y="5.5" width="39" height="4.4" rx="2.2" fill="#c98d55"/>
      <circle cx="5.5" cy="7.7" r="2.8" fill="#a5713f"/><circle cx="42.5" cy="7.7" r="2.8" fill="#a5713f"/>`,
  },
  speaker: {
    tone: "purple",
    svg: `
      <rect x="9" y="6.5" width="23" height="35" rx="6.5" fill="#ffcc3d"/>
      <path d="M25 6.5h.5A6.5 6.5 0 0 1 32 13v22a6.5 6.5 0 0 1-6.5 6.5H25z" fill="#f5b52e"/>
      <circle cx="20.5" cy="15" r="4.4" fill="${EYE}"/>
      <circle cx="20.5" cy="15" r="1.8" fill="#8a6a48"/>
      <circle cx="20.5" cy="29.5" r="8" fill="${EYE}"/>
      <circle cx="20.5" cy="29.5" r="4.6" fill="#8a6a48"/>
      <circle cx="20.5" cy="29.5" r="2" fill="#ffcc3d"/>
      <ellipse cx="13.6" cy="11.2" rx="1.6" ry="2.4" fill="#fff6c8"/>
      <g class="notes" fill="#fff">
        <g class="n1"><rect x="36.2" y="8.5" width="2.6" height="11" rx="1.3"/><path d="M36.2 8.5l6 2.2v3.4l-6-2.2z"/><ellipse cx="35" cy="19.8" rx="3.2" ry="2.6"/></g>
        <g class="n2"><rect x="40" y="24.5" width="2.2" height="8" rx="1.1"/><ellipse cx="39" cy="32.6" rx="2.6" ry="2.1"/></g>
      </g>`,
  },
  note: {
    tone: "purple",
    svg: `
      <g class="bob" fill="#fff">
        <rect x="17" y="12" width="3.4" height="22" rx="1.7"/>
        <rect x="33.6" y="7.5" width="3.4" height="22" rx="1.7"/>
        <path d="M17 12.4l20-4.9v6.2l-20 4.9z" fill="#ffcc3d"/>
        <ellipse cx="13.6" cy="34.4" rx="6" ry="4.8"/>
        <ellipse cx="30.2" cy="30" rx="6" ry="4.8"/>
        <ellipse cx="11.4" cy="33" rx="1.4" ry="1" fill="#e9dcff"/>
      </g>`,
  },
  vacuum: {
    tone: "orange",
    svg: `
      <ellipse cx="24" cy="41" rx="14" ry="3.2" fill="#d97a26"/>
      <g class="wiggle">
        <circle cx="24" cy="24.5" r="16" fill="#e3eaf0"/>
        <circle cx="24" cy="26.3" r="14.6" fill="#fff"/>
        <rect x="19.5" y="10.6" width="9" height="3.2" rx="1.6" fill="#6cc96a"/>
        ${face(24, 27, 1)}
      </g>`,
  },
  lock: {
    tone: "green",
    svg: `
      <path d="M15.5 21.5v-6a8.5 8.5 0 0 1 17 0v6h-4.6v-6a3.9 3.9 0 0 0-7.8 0v6z" fill="#cfdbe6"/>
      ${LOCK_BODY}`,
  },
  "lock-open": {
    tone: "red",
    svg: `
      <path d="M15.5 21.5v-8a8.5 8.5 0 0 1 16.6-2.6l-4.4 1.4a3.9 3.9 0 0 0-7.6 1.2v8z" fill="#cfdbe6"/>
      ${LOCK_BODY}`,
  },
  "shield-off": {
    tone: "sky",
    svg: shield(`<path d="M24 33.5c-5.6-3.4-6.8-10-1.2-14.6 4.6 3 6.2 9.4 1.2 14.6z" fill="#6cc96a"/><path d="M24 33.5c-.8-4.6-1.2-9-1.2-14.6 1.6 1.2 2.6 2.6 3.2 4.2" fill="#4fae4d"/>`),
  },
  "shield-home": {
    tone: "green",
    svg: shield(`<path d="M16 25.5l8-7 8 7z" fill="#f4695a"/><rect x="18" y="25" width="12" height="9" fill="#ff8fab"/><rect x="22.2" y="28" width="3.6" height="6" rx="1.2" fill="${EYE}"/>`),
  },
  "shield-away": {
    tone: "purple",
    svg: shield(`<path d="M19.6 24v-2.4a4.4 4.4 0 0 1 8.8 0V24h-2.6v-2.4a1.8 1.8 0 0 0-3.6 0V24z" fill="#cfdbe6"/><rect x="17" y="23.5" width="14" height="11" rx="3.4" fill="#ffcc3d"/><circle cx="24" cy="28.6" r="1.7" fill="${EYE}"/>`),
  },
  "shield-night": {
    tone: "blue",
    svg: shield(`<path d="M28 18a7.6 7.6 0 1 0 3.8 12A6.6 6.6 0 0 1 28 18z" fill="#ffcc3d"/><circle cx="19" cy="18.5" r="1.3" fill="#ffcc3d"/><circle cx="31" cy="24.5" r="1" fill="#ffcc3d"/>`),
  },
  bell: {
    tone: "yellow",
    svg: `
      <g class="ring">
        <path d="${BELL}" fill="#fff3a6"/>
        <path d="M24 6.5a2.8 2.8 0 0 1 2.8 2.8v.5c5.6 1.4 8.8 6 8.8 11.8v6.6l3.6 4.8H24z" fill="#ffe36e"/>
        <rect x="8.8" y="31.2" width="30.4" height="4.4" rx="2.2" fill="#f5b52e"/>
        <circle cx="24" cy="38.5" r="4" fill="#f4695a"/>
        <ellipse cx="18.4" cy="17" rx="1.8" ry="3.4" transform="rotate(25 18.4 17)" fill="#fff"/>
      </g>`,
  },
  alarm: {
    tone: "red",
    svg: `
      <g class="ring">
        <path d="${BELL}" fill="#ffd95a"/>
        <path d="M24 6.5a2.8 2.8 0 0 1 2.8 2.8v.5c5.6 1.4 8.8 6 8.8 11.8v6.6l3.6 4.8H24z" fill="#ffc53a"/>
        <rect x="8.8" y="31.2" width="30.4" height="4.4" rx="2.2" fill="#f0a020"/>
        <circle cx="24" cy="38.5" r="4" fill="#fff"/>
      </g>
      <path d="M6 15c.8-3.2 2.6-5.6 5-7.4M42 15c-.8-3.2-2.6-5.6-5-7.4" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/>`,
  },
  person: {
    tone: "pink",
    svg: `
      <circle cx="24" cy="26" r="15.5" fill="#ffe1bd"/>
      <path d="M8.6 23.5C9.4 14.6 16 9.6 24 9.6s14.6 5 15.4 13.9c-3.4-2.4-6.4-3.4-9.4-3.6l-2 2.6-1.6-2.8c-5.6 0-11.6 1-17.8 3.8z" fill="#8a5a33"/>
      <path d="M24 9.8c.6-3.8 3.6-6 7.6-5.2-.8 3.6-3.8 5.6-7.6 5.2z" fill="#6cc96a"/>
      ${face(24, 28, 1)}`,
  },
  "person-away": {
    tone: "blue",
    svg: `
      <path d="M18.5 15.5v-4.6a2.6 2.6 0 0 1 2.6-2.6h5.8a2.6 2.6 0 0 1 2.6 2.6v4.6h-3.2v-4h-4.6v4z" fill="#8a5a33"/>
      <rect x="7.5" y="14.5" width="33" height="25" rx="6" fill="#ffcc3d"/>
      <rect x="15.5" y="14.5" width="3.6" height="25" fill="#f0a020"/>
      <rect x="28.9" y="14.5" width="3.6" height="25" fill="#f0a020"/>
      <circle cx="24" cy="26" r="4" fill="#ff8fab"/>
      <path d="M34.6 31l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z" fill="#5aa7f0"/>
      <ellipse cx="11.6" cy="19.5" rx="1.6" ry="2.6" fill="#fff6c8"/>
      <circle cx="13.5" cy="42" r="2.4" fill="${EYE}"/><circle cx="34.5" cy="42" r="2.4" fill="${EYE}"/>`,
  },
  cat: {
    tone: "yellow",
    svg: `
      <path d="M11 17.5L12.8 6.5l8.2 6h6l8.2-6 1.8 11c2.4 3 3.6 6.2 3.6 9.2 0 9.6-7.4 15.4-16.6 15.4S7.4 36.3 7.4 26.7c0-3 1.2-6.2 3.6-9.2z" fill="#ffad66"/>
      <path d="M14.2 10.5l5 3.8-4.2 2.6zM33.8 10.5l-5 3.8 4.2 2.6z" fill="#ff8fab"/>
      <path d="M20.6 13h2v4.5a1 1 0 0 1-2 0zM25.4 13h2v4.5a1 1 0 0 1-2 0z" fill="#e88a3e"/>
      <ellipse cx="24" cy="32.5" rx="7.6" ry="5.4" fill="#fff2df"/>
      ${face(24, 26, 1)}
      <path d="M22.4 30h3.2L24 32z" fill="#e0606e"/>`,
  },
  washer: {
    tone: "blue",
    svg: `
      <rect x="8.5" y="6" width="31" height="36" rx="7" fill="#fff"/>
      <path d="M8.5 13a7 7 0 0 1 7-7h17a7 7 0 0 1 7 7v1.5h-31z" fill="#dde9f5"/>
      <circle cx="14.4" cy="10.4" r="1.8" fill="#ff8fab"/><circle cx="19.6" cy="10.4" r="1.8" fill="#6cc96a"/>
      <rect x="26.5" y="9" width="8.5" height="2.8" rx="1.4" fill="#a3b8cb"/>
      <circle cx="24" cy="28.4" r="10.2" fill="#dde9f5"/>
      <circle cx="24" cy="28.4" r="7.8" fill="#c8eeff"/>
      <path class="slosh" d="M16.2 29.4c2.6-1.8 5.2 1.8 7.8 0s5.2-1.8 7.8 0a7.8 7.8 0 0 1-15.6 0z" fill="#5aa7f0"/>
      <circle cx="21" cy="25" r="1.6" fill="#fff"/><circle cx="26.4" cy="23.6" r="1" fill="#fff"/>`,
  },
  gift: {
    tone: "purple",
    svg: `
      <g class="bob">
        <rect x="9.5" y="20.5" width="29" height="21" rx="4" fill="#ff8fab"/>
        <rect x="7" y="14.5" width="34" height="8" rx="3.4" fill="#ffb3c4"/>
        <rect x="21" y="14.5" width="6" height="27" fill="#ffcc3d"/>
        <rect x="9.5" y="22.5" width="29" height="2.4" fill="#e0708f"/>
        <rect x="21" y="22.5" width="6" height="2.4" fill="#f5b52e"/>
        <path d="M24 14.5c-6.4-8-12.4-3.6-9.2-.4 2.2 1.4 5.6 1.4 9.2.4zM24 14.5c6.4-8 12.4-3.6 9.2-.4-2.2 1.4-5.6 1.4-9.2.4z" fill="#ffcc3d"/>
        <circle cx="24" cy="14" r="2.6" fill="#f5b52e"/>
      </g>`,
  },
  thermo: {
    tone: "red",
    svg: `
      <path d="M19.4 29.2V10.8a4.6 4.6 0 0 1 9.2 0v18.4a8.2 8.2 0 1 1-9.2 0z" fill="#fff"/>
      <rect x="22" y="15.5" width="4" height="19" rx="2" fill="#f4695a"/>
      <circle cx="24" cy="35.4" r="5" fill="#f4695a"/>
      <rect x="31" y="12" width="5" height="2.4" rx="1.2" fill="#fff6c8"/>
      <rect x="31" y="17.4" width="3.6" height="2.4" rx="1.2" fill="#fff6c8"/>
      <rect x="31" y="22.8" width="5" height="2.4" rx="1.2" fill="#fff6c8"/>
      <circle cx="21.8" cy="34" r="1.4" fill="#ffb3a8"/>`,
  },
  drop: {
    tone: "sky",
    svg: `
      <g class="bob">
        <path d="M24 5.5c6.8 8.8 12.2 15 12.2 21.8a12.2 12.2 0 0 1-24.4 0c0-6.8 5.4-13 12.2-21.8z" fill="#bfeaff"/>
        <path d="M24 5.5c6.8 8.8 12.2 15 12.2 21.8A12.2 12.2 0 0 1 24 39.5z" fill="#a3dcfa"/>
        <ellipse cx="17.4" cy="23" rx="1.8" ry="3.2" transform="rotate(20 17.4 23)" fill="#fff"/>
        ${face(24, 29, .8)}
      </g>`,
  },
  humidifier: {
    tone: "sky",
    svg: `
      <g class="puff" fill="#fff">
        <circle cx="18.6" cy="11" r="3.8"/><circle cx="25.4" cy="8.4" r="4.8"/><circle cx="31.6" cy="11.8" r="3.4"/>
      </g>
      <rect x="19.5" y="17" width="9" height="6" rx="2.2" fill="#c7d6e3"/>
      <path d="M13 22.5h22l-2.2 17.4a3.2 3.2 0 0 1-3.2 2.8H18.4a3.2 3.2 0 0 1-3.2-2.8z" fill="#fff"/>
      <path d="M27 22.5h8l-2.2 17.4a3.2 3.2 0 0 1-3.2 2.8H27z" fill="#e7eff6"/>
      <rect x="18.5" y="28.5" width="11" height="8" rx="2.4" fill="#a8e2ff"/>`,
  },
  kettle: {
    tone: "red",
    svg: `
      <g class="steam" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none">
        <path d="M16.5 8.5c-1.7 1.7 1.7 3.4 0 5.1"/><path d="M21.8 6.5c-1.7 1.7 1.7 3.4 0 5.1"/>
      </g>
      <path d="M16.6 23c0-6 3.2-9.2 7.4-9.2s7.4 3.2 7.4 9.2h-3.2c0-4-1.6-6-4.2-6s-4.2 2-4.2 6z" fill="#3fae8f"/>
      <path d="M10.5 40.5c0-10.6 5-18.5 13.5-18.5s13.5 7.9 13.5 18.5z" fill="#a6ecd9"/>
      <path d="M24 22c8.5 0 13.5 7.9 13.5 18.5H24z" fill="#8fe0c9"/>
      <path d="M34.5 28.6l6.4-5.4 1.8 2.2-6.2 6.4z" fill="#8fe0c9"/>
      <rect x="10" y="38.5" width="28" height="3.6" rx="1.8" fill="#3fae8f"/>
      <circle cx="24" cy="21" r="2.4" fill="#ffcc3d"/>
      <ellipse cx="16.5" cy="31" rx="1.8" ry="3.2" transform="rotate(18 16.5 31)" fill="#fff"/>`,
  },
  plug: {
    tone: "green",
    svg: `
      <rect x="7.5" y="7.5" width="33" height="33" rx="10" fill="#fff"/>
      <path d="M7.5 30h33v.5a10 10 0 0 1-10 10h-13a10 10 0 0 1-10-10z" fill="#ecf3e6"/>
      <rect x="16.6" y="15" width="3.8" height="9" rx="1.9" fill="${EYE}"/>
      <rect x="27.6" y="15" width="3.8" height="9" rx="1.9" fill="${EYE}"/>
      <path d="M20.6 29h6.8a3.4 3.4 0 0 1-6.8 0z" fill="#e0606e"/>
      <ellipse cx="13.6" cy="28.6" rx="2.6" ry="1.6" fill="#ff8fab"/><ellipse cx="34.4" cy="28.6" rx="2.6" ry="1.6" fill="#ff8fab"/>`,
  },
  sofa: {
    tone: "orange",
    svg: `
      <path d="M12 24v-7.2a5 5 0 0 1 5-5h14a5 5 0 0 1 5 5V24z" fill="#a6e59a"/>
      <path d="M6 25.5a4.6 4.6 0 0 1 9.2 0v3.8h17.6v-3.8a4.6 4.6 0 0 1 9.2 0V37H6z" fill="#6cc96a"/>
      <rect x="15.2" y="27" width="17.6" height="4.6" rx="2" fill="#8fdc8a"/>
      <rect x="9" y="37" width="3.4" height="5" rx="1.2" fill="#a5713f"/>
      <rect x="35.6" y="37" width="3.4" height="5" rx="1.2" fill="#a5713f"/>
      <rect x="6" y="34" width="36" height="3" fill="#4fae4d"/>
      <circle cx="17" cy="16.5" r="1.6" fill="#fff"/>`,
  },
  sun: {
    tone: "sky",
    svg: `
      <g class="rays" fill="#fff3a6">
        <rect x="22" y="2" width="4" height="7" rx="2"/><rect x="22" y="39" width="4" height="7" rx="2"/>
        <rect x="2" y="22" width="7" height="4" rx="2"/><rect x="39" y="22" width="7" height="4" rx="2"/>
        <rect x="22" y="2" width="4" height="7" rx="2" transform="rotate(45 24 24)"/><rect x="22" y="39" width="4" height="7" rx="2" transform="rotate(45 24 24)"/>
        <rect x="2" y="22" width="7" height="4" rx="2" transform="rotate(45 24 24)"/><rect x="39" y="22" width="7" height="4" rx="2" transform="rotate(45 24 24)"/>
      </g>
      <circle cx="24" cy="24" r="12" fill="#ffcc3d"/>
      ${face(24, 24, .78)}`,
  },
  cloud: {
    tone: "sky",
    svg: `
      <g class="bob">
        <circle cx="32" cy="15" r="7.2" fill="#ffcc3d"/>
        <path d="${CLOUD}" fill="#fff"/>
        <path d="M13.5 37a8 8 0 0 1-7.6-5.6h34.4a8.1 8.1 0 0 1-5.8 5.6z" fill="#e7f1f8"/>
        ${face(22.5, 28, .7)}
      </g>`,
  },
  rain: {
    tone: "blue",
    svg: `
      <g transform="translate(0 -6)"><path d="${CLOUD}" fill="#fff"/><path d="M13.5 37a8 8 0 0 1-7.6-5.6h34.4a8.1 8.1 0 0 1-5.8 5.6z" fill="#e7f1f8"/></g>
      <g class="drops" fill="#bfeaff">${DROP(16, 35)}${DROP(24, 36.5)}${DROP(32, 35)}</g>`,
  },
  house: {
    tone: "green",
    svg: `
      <rect x="30" y="9.5" width="5" height="9" rx="1" fill="#a5713f"/>
      <path d="M11 22h26v17a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fffaf0"/>
      <path d="M11 22h26v3H11z" fill="#efe3c6"/>
      <path d="M5.6 23.6L24 8.4l18.4 15.2a2 2 0 0 1-2.6 3.1L24 13.6 8.2 26.7a2 2 0 0 1-2.6-3.1z" fill="#f4695a"/>
      <path d="M24 8.4l18.4 15.2a2 2 0 0 1-2.6 3.1L24 13.6z" fill="#d9554a"/>
      <rect x="20" y="29" width="8" height="13" rx="2.4" fill="#d39a5c"/>
      <circle cx="26" cy="36" r="1" fill="#fffaf0"/>
      <rect x="30.4" y="27.5" width="4.4" height="4.4" rx="1" fill="#a8e2ff"/>`,
  },
  leaf: {
    tone: "green",
    svg: `
      <g class="bob">
        <path d="M8.5 39.5C8.5 21 19.5 8.5 40 7.5c0 20.5-12.5 32-31.5 32z" fill="#a6e36a"/>
        <path d="M8.5 39.5C27 39.5 39.5 28 40 7.5z" fill="#86d052"/>
        <path d="M9 39C17.5 30 25 22.5 34 14" stroke="#5fb43a" stroke-width="2.4" stroke-linecap="round" fill="none"/>
        <path d="M16.5 31.5l-.8-6.4M22 26.2l-.4-6.8M27.5 21l5.6.4M22.4 26.5l6.4 1" stroke="#5fb43a" stroke-width="2" stroke-linecap="round"/>
      </g>`,
  },
  bed: {
    tone: "teal",
    svg: `
      <rect x="4.5" y="9" width="8.5" height="33" rx="3.6" fill="#d39a5c"/>
      <rect x="10" y="11" width="3" height="31" fill="#b97f45"/>
      <rect x="36" y="22" width="7.5" height="20" rx="3.2" fill="#d39a5c"/>
      <rect x="11" y="24.5" width="27" height="10" rx="3" fill="#fff"/>
      <rect x="13.5" y="17.5" width="11" height="8.5" rx="4.2" fill="#fffaf0"/>
      <path d="M20.5 22h14.5a3 3 0 0 1 3 3v9.5H20.5z" fill="#ff8fab"/>
      <rect x="20.5" y="30.5" width="17.5" height="4" fill="#e0708f"/>
      <rect x="11" y="34.5" width="27" height="4" fill="#a5713f"/>
      <path d="M30 8.5h6l-6 6h6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  robot: {
    tone: "grey",
    svg: `
      <rect x="22.6" y="5.5" width="2.8" height="7" rx="1.4" fill="#a3b8cb"/>
      <circle cx="24" cy="5.5" r="2.8" fill="#ffcc3d"/>
      <rect x="9" y="12" width="30" height="26" rx="9" fill="#fff"/>
      <path d="M9 30h30a9 9 0 0 1-9 8H18a9 9 0 0 1-9-8z" fill="#e7eff6"/>
      ${face(24, 23, 1)}`,
  },
};

// ---------- 把 HA 的 mdi 图标名 / 实体状态映射到插画 ----------

const MDI_RULES: [RegExp, string][] = [
  // 只有“灯泡”类图标画成灯泡插画；灯带、吸顶灯、台灯、射灯等具体灯具保留 HA 原图标（放进同款彩色方块），
  // 这样一屏灯卡片能靠图标区分，而不是全是同一个灯泡。
  [/^(lightbulb|light$|light-.*bulb)/, "bulb"],
  [/^(fan|ceiling-fan)/, "fan"],
  [/^(thermostat|air-conditioner|hvac|snowflake|sun-snowflake|home-thermometer)/, "aircon"],
  [/^(curtains-closed|blinds-closed|window-shutter-closed|roller-shade-closed)/, "curtain-closed"],
  [/^(curtains|blinds|window-shutter|roller-shade|window-open|window)/, "curtain-open"],
  [/^(robot-vacuum)/, "vacuum"],
  [/^(speaker|cast|radio|television|tv|boombox|cd-player|play-circle)/, "speaker"],
  [/^(music|playlist-music|headphones)/, "note"],
  [/^(lock-open)/, "lock-open"],
  [/^(lock|door-closed-lock|key)/, "lock"],
  [/^(shield-home)/, "shield-home"],
  [/^(shield-lock|shield-airplane)/, "shield-away"],
  [/^(shield-moon)/, "shield-night"],
  [/^(shield)/, "shield-off"],
  [/^(bell-ring|alarm-light|alarm-bell|alert)/, "alarm"],
  [/^(bell)/, "bell"],
  [/^(account-arrow-right|bag-suitcase|suitcase|airplane)/, "person-away"],
  [/^(account|face|human|home-account|baby)/, "person"],
  [/^(cat|paw|dog|food-drumstick|bowl)/, "cat"],
  [/^(washing-machine|tumble-dryer|dishwasher)/, "washer"],
  [/^(package|gift|update|cellphone-arrow-down|archive-arrow)/, "gift"],
  [/^(thermometer|temperature)/, "thermo"],
  [/^(air-humidifier|air-purifier)/, "humidifier"],
  [/^(water|cup-water|watering-can|humidity)/, "drop"],
  [/^(kettle|coffee|tea|stove|microwave)/, "kettle"],
  [/^(power-plug|power-socket|toggle-switch|power|light-switch|electric-switch)/, "plug"],
  [/^(bed|bunk-bed|sleep)/, "bed"],
  [/^(sofa|seat|table-furniture|chair)/, "sofa"],
  [/^(weather-sunny|white-balance-sunny|sun)/, "sun"],
  [/^(weather-rainy|weather-pouring|weather-lightning-rainy|umbrella)/, "rain"],
  [/^(weather|cloud)/, "cloud"],
  [/^(home|house|garage|door)/, "house"],
  [/^(leaf|sprout|flower|tree|palm-tree|grass|pot-mix|cactus)/, "leaf"],
  [/^(robot)/, "robot"],
];

// eslint 不允许 any；属性值类型各异，这里用 unknown 并在使用处收窄。
export interface StateLike { entity_id: string; state: string; attributes: Record<string, unknown> & { icon?: string; device_class?: string; current_position?: number; rgb_color?: number[] } }

const ALARM: Record<string, string> = { disarmed: "shield-off", armed_home: "shield-home", armed_away: "shield-away", armed_vacation: "shield-away", armed_night: "shield-night", armed_custom_bypass: "shield-home", triggered: "alarm", arming: "shield-off", pending: "alarm" };
const CLIMATE_TONE: Record<string, Tone> = { cool: "blue", heat: "orange", heat_cool: "green", auto: "green", dry: "teal", fan_only: "teal", off: "grey" };
const WEATHER: Record<string, string> = { sunny: "sun", "clear-night": "shield-night", partlycloudy: "cloud", cloudy: "cloud", fog: "cloud", rainy: "rain", pouring: "rain", "lightning-rainy": "rain", snowy: "cloud", "snowy-rainy": "rain", windy: "cloud" };

export const INACTIVE = new Set(["off", "unavailable", "unknown", "standby", "idle", "docked", "none"]);

function fromIcon(icon?: string): string | undefined {
  // icon: island:cat 这种写法直接指定插画
  if (icon?.startsWith("island:")) return ART[icon.slice(7)] ? icon.slice(7) : undefined;
  if (!icon || !icon.startsWith("mdi:")) return undefined;
  const name = icon.slice(4);
  return MDI_RULES.find(([re]) => re.test(name))?.[1];
}

function fromState(s?: StateLike): string | undefined {
  if (!s) return undefined;
  const [domain] = s.entity_id.split(".");
  const dc = s.attributes.device_class;
  switch (domain) {
    case "light": return "bulb";
    case "switch": case "input_boolean": return "plug";
    case "climate": case "water_heater": return "aircon";
    case "cover": return s.state === "closed" || s.attributes.current_position === 0 ? "curtain-closed" : "curtain-open";
    case "fan": return "fan";
    case "humidifier": return "humidifier";
    case "media_player": return "speaker";
    case "vacuum": case "lawn_mower": return "vacuum";
    case "lock": return s.state === "locked" || s.state === "locking" ? "lock" : "lock-open";
    case "alarm_control_panel": return ALARM[s.state] ?? "shield-off";
    case "person": case "device_tracker": return s.state === "home" ? "person" : "person-away";
    case "update": return "gift";
    case "weather": return WEATHER[s.state] ?? "cloud";
    case "sun": return "sun";
    case "zone": return "house";
    case "sensor": case "number": case "input_number":
      if (dc === "temperature") return "thermo";
      if (dc === "humidity" || dc === "moisture") return "drop";
      return undefined;
    case "binary_sensor":
      if (dc === "door" || dc === "garage_door" || dc === "presence" || dc === "occupancy") return "house";
      if (dc === "moisture") return "drop";
      return undefined;
    default: return undefined;
  }
}

/** 先看用户配置的图标，再看实体本身配置的图标，最后按实体类型推断。 */
export function resolveArt(icon: string | undefined, stateObj?: StateLike): string | undefined {
  // 配置了图标就只认这个图标，认不出来就交回 HA 原生图标，不擅自替换成别的意思。
  if (icon) return fromIcon(icon);
  const own = stateObj?.attributes?.icon as string | undefined;
  if (own) return fromIcon(own);
  return fromState(stateObj);
}

export function resolveTone(art: string | undefined, stateObj?: StateLike): Tone {
  if (stateObj?.entity_id.startsWith("climate.")) return CLIMATE_TONE[stateObj.state] ?? "blue";
  if (stateObj?.entity_id.startsWith("person.") && stateObj.state !== "home") return "blue";
  if (art && ART[art]) return ART[art].tone;
  if (stateObj) {
    const domain = stateObj.entity_id.split(".")[0];
    const byDomain: Record<string, Tone> = { sensor: "green", number: "orange", input_number: "orange", select: "blue", input_select: "blue", scene: "purple", script: "purple", automation: "teal", button: "pink", binary_sensor: "teal" };
    if (byDomain[domain]) return byDomain[domain];
  }
  return "teal";
}
