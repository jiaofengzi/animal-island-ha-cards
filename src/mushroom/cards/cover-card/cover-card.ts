import { islandSkin } from "../../../skin/styles";
import {
  css,
  CSSResultGroup,
  html,
  nothing,
  PropertyValues,
  TemplateResult,
} from "lit";
import { customElement, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import {
  actionHandler,
  ActionHandlerEvent,
  computeRTL,
  CoverEntity,
  handleAction,
  hasAction,
  HomeAssistant,
  isAvailable,
  LovelaceCard,
  LovelaceCardEditor,
} from "../../ha";
import "../../shared/badge-icon";
import "../../shared/button";
import "../../shared/card";
import "../../shared/shape-avatar";
import "../../shared/shape-icon";
import "../../shared/state-info";
import "../../shared/state-item";
import { computeAppearance } from "../../utils/appearance";
import { MushroomBaseCard } from "../../utils/base-card";
import { cardStyle } from "../../utils/card-styles";
import { computeEntityName } from "../../utils/compute-entity-name";
import { registerCustomCard } from "../../utils/custom-cards";
import { computeEntityPicture } from "../../utils/info";
import { Layout } from "../../utils/layout";
import {
  COVER_CARD_EDITOR_NAME,
  COVER_CARD_NAME,
  COVER_ENTITY_DOMAINS,
} from "./const";
import "./controls/cover-buttons-control";
import "./controls/cover-position-control";
import "./controls/cover-tilt-position-control";
import { CoverCardConfig } from "./cover-card-config";
import {
  displayStateObj,
  getCoverLevel,
  getPosition,
  getStateColor,
  isMoving,
} from "./utils";

type CoverCardControl =
  | "buttons_control"
  | "position_control"
  | "tilt_position_control";

const CONTROLS_ICONS: Record<CoverCardControl, string> = {
  buttons_control: "mdi:gesture-tap-button",
  position_control: "mdi:gesture-swipe-horizontal",
  tilt_position_control: "mdi:rotate-right",
};

registerCustomCard({
  type: COVER_CARD_NAME,
  name: "Animal Island Cover Card",
  description: "Card for cover entity",
});

@customElement(COVER_CARD_NAME)
export class CoverCard
  extends MushroomBaseCard<CoverCardConfig, CoverEntity>
  implements LovelaceCard
{
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("./cover-card-editor");
    return document.createElement(COVER_CARD_EDITOR_NAME) as LovelaceCardEditor;
  }

  public static async getStubConfig(
    hass: HomeAssistant
  ): Promise<CoverCardConfig> {
    const entities = Object.keys(hass.states);
    const covers = entities.filter((e) =>
      COVER_ENTITY_DOMAINS.includes(e.split(".")[0])
    );
    return {
      type: `custom:${COVER_CARD_NAME}`,
      entity: covers[0],
    };
  }

  protected get hasControls(): boolean {
    return this._controls.length > 0;
  }

  @state() private _activeControl?: CoverCardControl;

  get _nextControl(): CoverCardControl | undefined {
    if (this._activeControl) {
      return (
        this._controls[this._controls.indexOf(this._activeControl) + 1] ??
        this._controls[0]
      );
    }
    return undefined;
  }

  private _onNextControlTap(e): void {
    e.stopPropagation();
    this._activeControl = this._nextControl;
  }

  getCardSize(): number | Promise<number> {
    return 1;
  }

  setConfig(config: CoverCardConfig): void {
    super.setConfig({
      tap_action: {
        action: "toggle",
      },
      hold_action: {
        action: "more-info",
      },
      ...config,
    });
    this.updateActiveControl();
    this.updatePosition();
  }

  private get _controls(): CoverCardControl[] {
    if (!this._config || !this._stateObj) return [];
    const controls: CoverCardControl[] = [];
    if (this._config.show_buttons_control) {
      controls.push("buttons_control");
    }
    if (this._config.show_position_control) {
      controls.push("position_control");
    }
    if (this._config.show_tilt_position_control) {
      controls.push("tilt_position_control");
    }
    return controls;
  }

  updateActiveControl() {
    const isActiveControlSupported = this._activeControl
      ? this._controls.includes(this._activeControl)
      : false;
    this._activeControl = isActiveControlSupported
      ? this._activeControl
      : this._controls[0];
  }

  protected updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (this.hass && changedProperties.has("hass")) {
      this.updatePosition();
      this.updateActiveControl();
    }
  }

  @state()
  private position?: number;

  updatePosition() {
    this.position = undefined;
    const stateObj = this._stateObj;

    if (!stateObj) return;
    this.position = getPosition(stateObj);
  }

  private onCurrentPositionChange(e: CustomEvent<{ value?: number }>): void {
    if (e.detail.value != null) {
      this.position = e.detail.value;
    }
  }

  private _handleAction(ev: ActionHandlerEvent) {
    const action = ev.detail.action!;
    const stateObj = this._stateObj;
    // 轻点切换：按两端余量判断开关，停在 3% 时点一下是拉开而不是再去关
    if (
      action === "tap" &&
      this._config?.tap_action?.action === "toggle" &&
      stateObj &&
      isAvailable(stateObj)
    ) {
      const level = getCoverLevel(stateObj, this._config.end_margin);
      // 正在动时和 HA 自带的切换一样先停下（不支持停止的才反向）
      const canStop = ((stateObj.attributes.supported_features ?? 0) & 8) !== 0;
      const service =
        isMoving(stateObj) && canStop
          ? "stop_cover"
          : stateObj.state === "opening"
            ? "close_cover"
            : stateObj.state === "closing" || level === "closed"
              ? "open_cover"
              : "close_cover";
      void this.hass!.callService("cover", service, {
        entity_id: stateObj.entity_id,
      });
      return;
    }
    handleAction(this, this.hass!, this._config!, action);
  }

  /** 两端直接说“关着 / 开着”，中间说开了多少，动的时候说在开 / 在关。 */
  private _stateText(stateObj: CoverEntity): string {
    const zh = (this.hass!.locale?.language ?? this.hass!.language ?? "").startsWith("zh");
    const position = getPosition(stateObj);
    if (!isAvailable(stateObj)) return this.hass!.formatEntityState(stateObj);
    if (isMoving(stateObj)) {
      const base = this.hass!.formatEntityState(stateObj);
      return position != null ? `${base} · ${position}%` : base;
    }
    const level = getCoverLevel(stateObj, this._config?.end_margin);
    if (level === "closed") return zh ? "关着" : "Closed";
    if (level === "open") return zh ? "开着" : "Open";
    if (level === "partial" && position != null) return zh ? `开了 ${position}%` : `${position}% open`;
    return this.hass!.formatEntityState(stateObj);
  }

  /** 名字后面那个很淡的数字：停在中间写 30%，动的时候带上方向，两端不写。 */
  private _inlineNumber(stateObj: CoverEntity): string {
    const position = getPosition(stateObj);
    if (position == null) return "";
    if (stateObj.state === "opening") return `▲${position}%`;
    if (stateObj.state === "closing") return `▼${position}%`;
    return getCoverLevel(stateObj, this._config?.end_margin) === "partial" ? `${position}%` : "";
  }

  protected render() {
    if (!this.hass || !this._config || !this._config.entity) {
      return nothing;
    }

    const stateObj = this._stateObj;

    if (!stateObj) {
      return this.renderNotFound(this._config);
    }

    const name = computeEntityName(this.hass, stateObj, this._config.name);
    const icon = this._config.icon;
    const appearance = computeAppearance(this._config);
    const picture = computeEntityPicture(stateObj, appearance.icon_type);

    const stateDisplay = this._stateText(stateObj);
    const shown = displayStateObj(stateObj, this._config.end_margin);
    const moving = isMoving(stateObj);
    const partial =
      moving || getCoverLevel(stateObj, this._config.end_margin) === "partial";
    // 开了一部分或正在动：图标方块按开合比例涨水位
    const fill = partial ? getPosition(stateObj) : undefined;
    // 默认布局（名字 + 状态）时，开关交给底色和图标，只在名字后面跟一个淡淡的数字
    const inline =
      isAvailable(stateObj) &&
      appearance.primary_info === "name" &&
      appearance.secondary_info === "state";

    const rtl = computeRTL(this.hass);

    return html`
      <ha-card
        class=${classMap({
          "fill-container": appearance.fill_container,
          partial,
        })}
      >
        <island-card .appearance=${appearance} ?rtl=${rtl}>
          <island-state-item
            ?rtl=${rtl}
            .appearance=${appearance}
            @action=${this._handleAction}
            .actionHandler=${actionHandler({
              hasHold: hasAction(this._config.hold_action),
              hasDoubleClick: hasAction(this._config.double_tap_action),
            })}
          >
            ${picture
              ? this.renderPicture(picture)
              : this.renderIcon(shown, icon, fill)}
            ${this.renderBadge(stateObj)}
            ${inline
              ? this.renderInlineInfo(name, this._inlineNumber(stateObj))
              : this.renderStateInfo(stateObj, appearance, name, stateDisplay)}
          </island-state-item>
          ${this._controls.length > 0
            ? html`
                <div class="actions" ?rtl=${rtl}>
                  ${this.renderActiveControl(stateObj, appearance.layout)}
                  ${this.renderNextControlButton()}
                </div>
              `
            : nothing}
        </island-card>
      </ha-card>
    `;
  }

  protected renderIcon(
    stateObj: CoverEntity,
    icon?: string,
    fill?: number
  ): TemplateResult {
    const iconStyle = {};
    const available = isAvailable(stateObj);
    const color = getStateColor(stateObj);
    iconStyle["--icon-color"] = `rgb(${color})`;
    iconStyle["--shape-color"] = `rgba(${color}, 0.2)`;

    return html`
      <island-shape-icon
        slot="icon"
        .disabled=${!available}
        style=${styleMap(iconStyle)}
      >
        <island-state-icon
          .hass=${this.hass}
          .stateObj=${stateObj}
          .icon=${icon}
          .fill=${fill}
        ></island-state-icon
      ></island-shape-icon>
    `;
  }

  private renderNextControlButton() {
    if (!this._nextControl || this._nextControl == this._activeControl)
      return nothing;

    return html`
      <island-button @click=${this._onNextControlTap}>
        <ha-icon .icon=${CONTROLS_ICONS[this._nextControl]}></ha-icon>
      </island-button>
    `;
  }

  private renderActiveControl(stateObj: CoverEntity, layout?: Layout) {
    switch (this._activeControl) {
      case "buttons_control":
        return html`
          <island-cover-buttons-control
            .hass=${this.hass}
            .entity=${stateObj}
            .fill=${layout !== "horizontal"}
          ></island-cover-buttons-control>
        `;
      case "position_control": {
        const color = getStateColor(stateObj as CoverEntity);
        const sliderStyle = {};
        sliderStyle["--slider-color"] = `rgb(${color})`;
        sliderStyle["--slider-bg-color"] = `rgba(${color}, 0.2)`;

        return html`
          <island-cover-position-control
            .hass=${this.hass}
            .entity=${stateObj}
            @current-change=${this.onCurrentPositionChange}
            style=${styleMap(sliderStyle)}
          ></island-cover-position-control>
        `;
      }
      case "tilt_position_control": {
        const color = getStateColor(stateObj as CoverEntity);
        const sliderStyle = {};
        sliderStyle["--slider-color"] = `rgb(${color})`;
        sliderStyle["--slider-bg-color"] = `rgba(${color}, 0.2)`;

        return html`
          <island-cover-tilt-position-control
            .hass=${this.hass}
            .entity=${stateObj}
            style=${styleMap(sliderStyle)}
          ></island-cover-tilt-position-control>
        `;
      }
      default:
        return nothing;
    }
  }

  static get styles(): CSSResultGroup {
    return [[
      super.styles,
      cardStyle,
      css`
        island-state-item {
          cursor: pointer;
        }
        /* 开了一部分：卡片底色比全开淡一档 */
        ha-card.partial {
          --island-tint: 11%;
          --island-edge-mix: 28%;
        }
        island-shape-icon {
          --icon-color: rgb(var(--rgb-state-cover));
          --shape-color: rgba(var(--rgb-state-cover), 0.2);
        }
        island-cover-buttons-control,
        island-cover-position-control {
          flex: 1;
        }
        island-cover-tilt-position-control {
          flex: 1;
        }
      `,
    ], islandSkin("src/cards/cover-card/cover-card.ts")];
  }
}
