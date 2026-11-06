import type { ReactiveController, ReactiveControllerHost } from "lit";

type MotionHost = HTMLElement & ReactiveControllerHost & {
  renderRoot: HTMLElement | DocumentFragment;
  disabled?: boolean;
};
type SurfaceKind = "button" | "chip" | "input-number";

/** Presentation-only controller. Never synthesizes an action or cancels an input event. */
class IslandMotion implements ReactiveController {
  private lifetime?: AbortController;
  private gesture?: AbortController;
  private media?: MediaQueryList;
  private surface?: HTMLElement;
  private pointer?: number;
  private key?: string;
  private press: Animation[] = [];
  private release: Animation[] = [];
  private visualTargets: HTMLElement[] = [];
  private ripples = new Map<HTMLElement, Animation>();

  constructor(private host: MotionHost, private kind: SurfaceKind) {
    host.addController(this);
  }

  hostConnected(): void {
    this.lifetime?.abort();
    this.lifetime = new AbortController();
    const options = { passive: true, signal: this.lifetime.signal };
    this.media = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.media.addEventListener("change", this.onPreference, options);
    this.host.addEventListener("pointerdown", this.onPointerDown, options);
    this.host.addEventListener("keydown", this.onKeyDown, options);
    this.host.addEventListener("keyup", this.onKeyUp, options);
    this.host.addEventListener("focusout", this.onFocusOut, options);
    window.addEventListener("blur", this.onCancel, options);
  }

  hostDisconnected(): void {
    this.lifetime?.abort();
    this.lifetime = undefined;
    this.reset();
    this.media = undefined;
  }

  hostUpdated(): void {
    if (this.surface && this.isDisabled(this.surface)) this.reset();
  }

  private isDisabled(surface: HTMLElement): boolean {
    // Native disabled semantics and our host are authoritative. A third-party
    // container's .disabled may disable sorting/editing, not its child controls.
    if ((surface as HTMLButtonElement).disabled || surface.hasAttribute("disabled") || this.host.disabled || this.host.hasAttribute("disabled")) return true;
    let node: HTMLElement | null = surface;
    while (node) {
      if (node.matches(":disabled") || node.getAttribute("aria-disabled") === "true" || node.hasAttribute("inert")) return true;
      const root = node.getRootNode();
      node = node.parentElement || (root instanceof ShadowRoot ? root.host as HTMLElement : null);
    }
    return false;
  }

  private getSurface(event: Event): HTMLElement | undefined {
    const selector = this.kind === "chip" ? "ha-card" : "button.button";
    const surfaces = Array.from(this.host.renderRoot?.querySelectorAll<HTMLElement>(selector) || []);
    // Input Number has separate minus/plus buttons; animate only the actual target.
    return surfaces.find(surface => event.composedPath().includes(surface)) ||
      (this.kind === "chip" ? surfaces[0] : undefined);
  }

  private getVisualTargets(surface: HTMLElement): HTMLElement[] {
    if (this.kind === "input-number") return Array.from(surface.querySelectorAll<HTMLElement>("ha-icon"));
    if (this.kind === "chip") return Array.from(surface.querySelectorAll<HTMLElement>(".content, .avatar"));
    // Animate the existing assigned icon/content, never the native button or slot box.
    const slot = surface.querySelector("slot");
    return (slot?.assignedElements({ flatten: true }) || []).filter((element): element is HTMLElement => element instanceof HTMLElement);
  }

  private cancelRelease(): void {
    for (const animation of this.release) animation.cancel();
    this.release = [];
  }

  private start(surface: HTMLElement, x: number, y: number): void {
    this.surface = surface;
    this.cancelRelease();
    for (const animation of this.press) animation.cancel();
    this.visualTargets = this.getVisualTargets(surface);
    surface.setAttribute("data-island-pressed", "");
    this.press = this.visualTargets.map(target => target.animate([{ scale: "1" }, { scale: ".96" }], {
      duration: 150, easing: "cubic-bezier(.4, 0, .2, 1)", fill: "forwards",
    }));

    const box = surface.getBoundingClientRect();
    const width = box.width;
    const height = box.height;
    const diameter = Math.hypot(Math.max(x, width - x), Math.max(y, height - y)) * 2;
    const layer = document.createElement("span");
    layer.className = "island-motion-ripple";
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = "position:absolute;inset:0;overflow:hidden;border-radius:inherit;pointer-events:none;color:var(--animal-text-color,#725d42);";
    const wave = document.createElement("span");
    wave.style.cssText = `position:absolute;pointer-events:none;border-radius:50%;background:currentColor;width:${diameter}px;height:${diameter}px;left:${x - diameter / 2}px;top:${y - diameter / 2}px;`;
    layer.append(wave);
    surface.append(layer);
    const animation = wave.animate([
      { transform: "scale(0)", opacity: .17 },
      { transform: "scale(1)", opacity: 0 },
    ], { duration: 350, easing: "cubic-bezier(.4, 0, .2, 1)" });
    this.ripples.set(layer, animation);
    // Bound concurrent layers during repeated input without waiting for timers.
    if (this.ripples.size > 3) {
      const oldest = this.ripples.keys().next().value as HTMLElement;
      this.ripples.get(oldest)?.cancel(); oldest.remove(); this.ripples.delete(oldest);
    }
    animation.finished.then(() => { layer.remove(); this.ripples.delete(layer); }, () => { layer.remove(); this.ripples.delete(layer); });
  }

  private finish(bounce: boolean): void {
    this.gesture?.abort();
    this.gesture = undefined;
    this.pointer = undefined;
    this.key = undefined;
    const surface = this.surface;
    this.surface = undefined;
    surface?.removeAttribute("data-island-pressed");
    const targets = this.visualTargets;
    const scales = targets.map(target => getComputedStyle(target).scale);
    this.visualTargets = [];
    for (const animation of this.press) animation.cancel();
    this.press = [];
    if (bounce && surface && !this.media?.matches && !this.isDisabled(surface)) {
      this.cancelRelease();
      this.release = targets.filter(target => target.isConnected).map(target => {
        const currentScale = scales[targets.indexOf(target)];
        return target.animate([
          { scale: currentScale === "none" ? "1" : currentScale, offset: 0 },
          { scale: "1.015", offset: .65 },
          { scale: "1", offset: 1 },
        ], { duration: 250, easing: "cubic-bezier(.4, 0, .2, 1)" });
      });
    }
  }

  private reset(): void {
    this.finish(false);
    this.cancelRelease();
    for (const [layer, animation] of this.ripples) { animation.cancel(); layer.remove(); }
    this.ripples.clear();
  }

  private onPreference = (): void => { if (this.media?.matches) this.reset(); };
  private onCancel = (): void => { this.reset(); };
  private onFocusOut = (event: FocusEvent): void => {
    if (!this.surface) return;
    const path = event.composedPath();
    // When focus moves minus → plus, pointerdown on plus precedes minus focusout.
    // The old button must not cancel the new button's visual press.
    if (path.includes(this.surface) || (this.kind === "chip" && path[0] === this.host)) this.reset();
  };

  private onPointerDown = (event: PointerEvent): void => {
    if (!event.isPrimary || event.button !== 0 || this.media?.matches || this.pointer !== undefined || this.key) return;
    const surface = this.getSurface(event);
    if (!surface || this.isDisabled(surface) || !event.composedPath().includes(surface)) return;
    this.cancelRelease();
    const box = surface.getBoundingClientRect();
    this.pointer = event.pointerId;
    this.start(surface, Math.max(0, Math.min(box.width, event.clientX - box.left)), Math.max(0, Math.min(box.height, event.clientY - box.top)));
    this.gesture = new AbortController();
    const options = { passive: true, capture: true, signal: this.gesture.signal };
    // Document listeners observe release outside the control without pointer capture.
    this.host.ownerDocument.addEventListener("pointerup", this.onPointerUp, options);
    this.host.ownerDocument.addEventListener("pointercancel", this.onPointerCancel, options);
  };
  private onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointer) return;
    const box = this.surface?.getBoundingClientRect();
    const inside = box && event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
    if (inside) this.finish(true); else this.reset();
  };
  private onPointerCancel = (event: PointerEvent): void => { if (event.pointerId === this.pointer) this.reset(); };
  private onKeyDown = (event: KeyboardEvent): void => {
    if (!['Enter', ' '].includes(event.key) || event.repeat || this.media?.matches || this.key || this.pointer !== undefined) return;
    const surface = this.getSurface(event);
    if (!surface || this.isDisabled(surface)) return;
    this.key = event.key;
    const box = surface.getBoundingClientRect();
    this.start(surface, box.width / 2, box.height / 2);
  };
  private onKeyUp = (event: KeyboardEvent): void => { if (event.key === this.key) this.finish(true); };
}

export function installIslandMotion(host: MotionHost, kind: SurfaceKind): void {
  new IslandMotion(host, kind);
}
