export interface Entity { entity_id: string; state: string; attributes: Record<string, unknown>; last_changed?: string }
export interface Hass {
  config?: {unit_system?: {temperature?: string}};
  states: Record<string, Entity | undefined>;
  services?: Record<string, Record<string, unknown>>;
  callService(domain: string, service: string, data: Record<string, unknown>, target?: Target): Promise<unknown>;
  language?: string;
}
export interface Action { when_states?: string[]; role?: 'primary'|'secondary'|'danger'; label: string; service: string; entity: string; data?: Record<string, unknown> }
export interface Target { entity_id?: string|string[]; device_id?: string|string[]; area_id?: string|string[]; floor_id?: string|string[]; label_id?: string|string[] }
export interface Confirmation { text?:string; title?:string; confirm_text?:string; dismiss_text?:string }
export interface DashboardAction {
  action:'none'|'more-info'|'toggle'|'navigate'|'url'|'perform-action'|'call-service';
  entity?:string; navigation_path?:string; navigation_replace?:boolean; url_path?:string;
  perform_action?:string; service?:string; data?:Record<string,unknown>; service_data?:Record<string,unknown>;
  target?:Target; confirmation?:boolean|Confirmation;
}
export interface Item { severity?: 'normal'|'warning'|'error'; entity: string; name?: string; attribute?: string; path?: string; role?:string; unit?:string; min?:number; max?:number }
export interface Config {
  type: string; profile?: string; description?: string; entity?: string; name?: string; entities?: Item[];
  actions?: Action[]; read_only?: boolean; image?: string; alt?: string;
  allowed_image_origins?: string[]; height?: number;
  use_media_info?:boolean; show_volume_level?:boolean;
  media_controls?:('on_off'|'shuffle'|'previous'|'play_pause_stop'|'next'|'repeat')[];
  volume_controls?:('volume_mute'|'volume_set'|'volume_buttons')[];
  tap_action?:DashboardAction; hold_action?:DashboardAction; double_tap_action?:DashboardAction;
}
export interface Command { label: string; service: string; data?: Record<string, unknown>; confirm?: boolean }
export interface RangeControl { label: string; min: number; max: number; step: number; value: number; service: string; field: string; data?:Record<string,unknown> }
export interface ChoiceControl { label: string; options: string[]; value: string; service: string; field: string }
export interface Controls { commands: Command[]; ranges: RangeControl[]; choices: ChoiceControl[]; color?:string }
