import { islandSkin } from "../../../../skin/styles";
import { HassEntity } from "home-assistant-js-websocket";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { HomeAssistant, isActive } from "../../../ha";
import "../../../shared/slider";
import { isOscillating } from "../utils";

@customElement("island-fan-direction-control")
export class FanPercentageControl extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public entity!: HassEntity;

  private _onTap(e: MouseEvent): void {
    e.stopPropagation();
    const currentDirection = this.entity.attributes.direction;
    const newDirection = currentDirection === "forward" ? "reverse" : "forward";

    this.hass.callService("fan", "set_direction", {
      entity_id: this.entity.entity_id,
      direction: newDirection,
    });
  }

  protected render(): TemplateResult {
    const currentDirection = this.entity.attributes.direction;
    const active = isActive(this.entity);

    return html`
      <island-button @click=${this._onTap} .disabled=${!active}>
        <ha-icon
          .icon=${currentDirection === "reverse"
            ? "mdi:rotate-left"
            : "mdi:rotate-right"}
        ></ha-icon>
      </island-button>
    `;
  }

  static get styles(): CSSResultGroup {
    return [css`
      :host {
        display: flex;
      }
    `, islandSkin("src/cards/fan-card/controls/fan-direction-control.ts")];
  }
}
