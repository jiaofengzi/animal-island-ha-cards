/* eslint-disable @typescript-eslint/no-explicit-any -- Inspect actual HA custom elements and their dynamic hass context. */
export function collectStyles(root:Element) {
 const style=(el:Element)=>{const s=getComputedStyle(el);return {tag:el.localName,backgroundColor:s.backgroundColor,borderRadius:s.borderRadius,boxShadow:s.boxShadow,height:s.height,padding:s.padding,width:s.width,display:s.display};};
 const nodes:Element[]=[];
 const walk=(el:Element)=>{nodes.push(el);for(const child of el.children)walk(child);if(el.shadowRoot)for(const child of el.shadowRoot.children)walk(child);};walk(root);
 const containers=nodes.filter(el=>el.localName==='ha-card'||el.localName==='ha-badge'||el.localName.endsWith('-badge')||el.localName.endsWith('-chip'));
 const stateItems=nodes.filter(el=>el.localName.endsWith('-state-item')).map(el=>el.shadowRoot?.querySelector('.container')).filter((el):el is Element=>Boolean(el));
 const buttons=nodes.filter(el=>el.localName==='button'||el.localName.endsWith('-button')||el.getAttribute('role')==='button').slice(0,30);
 return {root:style(root),containers:containers.map(style),stateItems:stateItems.map(style),buttons:buttons.map(style),islandTheme:root.getAttribute('data-island-theme'),darkMode:(root as any).hass?.themes?.darkMode??null};
}
