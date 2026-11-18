import { CoverEntity } from "../../ha";

export function getPosition(entity: CoverEntity) {
  return entity.attributes.current_position != null
    ? Math.round(entity.attributes.current_position)
    : undefined;
}

export function getTiltPosition(entity: CoverEntity) {
  return entity.attributes.current_tilt_position != null
    ? Math.round(entity.attributes.current_tilt_position)
    : undefined;
}

export function getStateColor(entity: CoverEntity) {
  const state = entity.state;
  if (state === "open" || state === "opening") {
    return "var(--rgb-state-cover-open)";
  }
  if (state === "closed" || state === "closing") {
    return "var(--rgb-state-cover-closed)";
  }
  return "var(--rgb-disabled)";
}

export const DEFAULT_END_MARGIN = 5;

export type CoverLevel = "closed" | "partial" | "open";

/** 两端留一点余量：窗帘很少正好停在 0 或 100，离两端 margin% 以内就算关 / 开。 */
export function clampMargin(margin?: number): number {
  const m = Number(margin ?? DEFAULT_END_MARGIN);
  return Number.isFinite(m) ? Math.min(Math.max(m, 0), 49) : DEFAULT_END_MARGIN;
}

export function getCoverLevel(entity: CoverEntity, margin?: number): CoverLevel | undefined {
  const position = getPosition(entity);
  if (position == null) {
    if (entity.state === "closed") return "closed";
    if (entity.state === "open") return "open";
    return undefined;
  }
  const m = clampMargin(margin);
  if (position <= m) return "closed";
  if (position >= 100 - m) return "open";
  return "partial";
}

export function isMoving(entity: CoverEntity): boolean {
  return entity.state === "opening" || entity.state === "closing";
}

/**
 * 给图标和卡片配色用的“看起来的状态”：停着时按余量把两端吸附成 0 / 100，
 * 这样 3% 的窗帘显示成关着，97% 的显示成开着。
 */
export function displayStateObj(entity: CoverEntity, margin?: number): CoverEntity {
  if (isMoving(entity)) return entity;
  const level = getCoverLevel(entity, margin);
  if (level === "closed") {
    return { ...entity, state: "closed", attributes: { ...entity.attributes, current_position: 0 } };
  }
  if (level === "open") {
    return { ...entity, state: "open", attributes: { ...entity.attributes, current_position: 100 } };
  }
  if (level === "partial") return { ...entity, state: "open" };
  return entity;
}
