// Behavioral oracle derived from piitaya/lovelace-mushroom v5.2.3.
// Apache-2.0; see upstream/LICENSE. This is a research test aid, not a card implementation.
export function traditionalSizing(config, hasControls = false, active = false) {
  if (!config) return {cardSize: 1, grid: {columns: 6, rows: 1}, legacy: {grid_columns: 2, grid_rows: 1}};
  const layout = config.layout ?? (config.vertical ? 'vertical' : 'default');
  const primary = config.primary_info || (config.hide_name ? 'none' : 'name');
  const secondary = config.secondary_info || (config.hide_state ? 'none' : 'state');
  const icon = config.icon_type || (config.hide_icon ? 'none' : config.use_entity_picture || config.use_media_artwork ? 'entity-picture' : 'icon');
  const hasInfo = primary !== 'none' || secondary !== 'none';
  const hasIcon = icon !== 'none';
  const visibleControls = hasControls && (!config.collapsible_controls || active);
  const cardSize = 1 + (layout === 'vertical' ? 1 : 0) + (layout !== 'horizontal' && hasControls && !config.collapsible_controls ? 1 : 0);
  const grid = {min_rows: 1, min_columns: 4, columns: 6, rows: 0};
  const legacy = {grid_columns: 2, grid_rows: 0};
  if (layout === 'vertical') {
    grid.rows = Number(hasIcon) + Number(hasInfo) + Number(visibleControls);
    grid.min_columns = 2;
    legacy.grid_rows = grid.rows;
  }
  if (layout === 'horizontal') {grid.rows = 1; grid.columns = 12; legacy.grid_rows = 1; legacy.grid_columns = 4;}
  if (layout === 'default') {grid.rows = Number(hasInfo || hasIcon) + Number(visibleControls); legacy.grid_rows = grid.rows;}
  if (!visibleControls && !hasInfo) {grid.columns = 3; grid.rows = 1; grid.min_columns = 2; legacy.grid_columns = 1; legacy.grid_rows = 1;}
  grid.rows = Math.max(grid.rows, 1); grid.min_rows = grid.rows;
  legacy.grid_rows = Math.max(legacy.grid_rows, 1);
  return {cardSize, grid, legacy};
}
export function templateSizing(config = {}, supportsInlineFeaturesBelow = true) {
  const position = config.vertical ? 'bottom' : config.features_position || 'bottom';
  const features = config.features || [];
  const below = position === 'inline' ? supportsInlineFeaturesBelow ? features.slice(1) : [] : features;
  const cols = position === 'inline' ? Math.min(below.length, 2) : 1;
  const featureRows = Math.ceil(below.length / Math.max(cols, 1));
  const hasContent = Boolean(config.icon || config.picture || config.primary || config.secondary);
  const cardSize = Number(hasContent || position === 'inline') + Number(Boolean(config.vertical)) + featureRows;
  let columns = 6, rows = Number(hasContent);
  if (features.length) {
    if (position === 'inline') {columns = 12; rows = 1 + featureRows;} else rows += features.length;
  }
  if (config.vertical && (config.primary || (config.secondary && !config.icon))) rows++;
  return {cardSize, grid: config.multiline_secondary ? {columns} : {columns, rows}};
}
export const specialSizing = {
  empty: {cardSize: 1, grid: {columns: 6, rows: 1}},
  chips: {cardSize: 1, grid: null, note: 'No upstream getGridOptions method'},
  title: {cardSize: 1, grid: null, note: 'No upstream getGridOptions method'},
  badge: {cardSize: null, grid: null, note: 'Uses HA badge layout, not card sizing'},
};
