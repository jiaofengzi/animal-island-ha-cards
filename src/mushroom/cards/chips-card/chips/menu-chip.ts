import { islandSkin } from "../../../../skin/styles";
import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  nothing,
  TemplateResult,
} from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  actionHandler,
  computeRTL,
  fireEvent,
  HomeAssistant,
} from "../../../ha";
import {
  computeChipComponentName,
  computeChipEditorComponentName,
} from "../../../utils/lovelace/chip/chip-element";
import {
  LovelaceChip,
  MenuChipConfig,
} from "../../../utils/lovelace/chip/types";
import { LovelaceChipEditor } from "../../../utils/lovelace/types";

export const DEFAULT_MENU_ICON = "mdi:menu";

@customElement(computeChipComponentName("menu"))
export class MenuChip extends LitElement implements LovelaceChip {
  public static async getConfigElement(): Promise<LovelaceChipEditor> {
    await import("./menu-chip-editor");
    return document.createElement(
      computeChipEditorComponentName("menu")
    ) as LovelaceChipEditor;
  }

  public static async getStubConfig(
    _hass: HomeAssistant
  ): Promise<MenuChipConfig> {
    return {
      type: `menu`,
    };
  }

  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: MenuChipConfig;

  public setConfig(config: MenuChipConfig): void {
    this._config = config;
  }

  private _handleAction() {
    fireEvent(this, "hass-toggle-menu" as any);
  }

  protected render() {
    if (!this.hass || !this._config) {
      return nothing;
    }

    const icon = this._config.icon || DEFAULT_MENU_ICON;

    const rtl = computeRTL(this.hass);

    return html`
      <island-chip
        ?rtl=${rtl}
        @action=${this._handleAction}
        .actionHandler=${actionHandler()}
      >
        <island-state-icon .hass=${this.hass} .icon=${icon}></island-state-icon>
      </island-chip>
    `;
  }

  static get styles(): CSSResultGroup {
    return [css`
      island-chip {
        cursor: pointer;
      }
    `, islandSkin("src/cards/chips-card/chips/menu-chip.ts")];
  }
}
