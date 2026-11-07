import {cards,chips,badge,cardConfig} from './fixtures.mjs';
export const PREVIOUS_COMMIT='668cb1fb427786ba02860f5e5682bdfdaee39584';
export const REDESIGN_COMMIT='2bee8a6d12b0f648775008912b8d9817b31509d7';
export const variants=[{id:'official',prefix:'mushroom-',label:'官方 Mushroom'},{id:'previous',prefix:'previous-island-',label:'dot 原版'},{id:'redesign',prefix:'island-',label:'朋友新版 · 修正版'}];
export const modules=[...cards.map(c=>({id:`card:${c.name}`,tag:`${c.name}-card`,config:c.config})),...chips.map(c=>({id:`chip:${c.type}`,tag:`${c.type}-chip`,config:c})),{id:'badge:template',tag:'template-badge',config:badge.config}];
export const expectedBlank=id=>['card:empty','chip:spacer'].includes(id);
export function threeWayViews(){return variants.map(({id,prefix,label})=>({title:label,path:`three-way-${id}`,type:'masonry',badges:[{type:`custom:${prefix}template-badge`,...badge.config}],cards:cards.map(c=>cardConfig(c,prefix))}));}
