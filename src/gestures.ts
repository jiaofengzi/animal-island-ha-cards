export type Gesture='tap_action'|'hold_action'|'double_tap_action';
// Own timers are cancelled on config changes, rerender, detach and interrupted gestures.
export function bindGestures(node:HTMLElement,run:(key:Gesture)=>void,hasDouble:boolean,hasHold:boolean):()=>void{
  let tap:ReturnType<typeof setTimeout>|undefined;
  let start:{x:number;y:number;time:number;id:number}|undefined;
  let suppressClick=false;
  const abort=new AbortController(),options={signal:abort.signal};
  const isControl=(event:Event)=>event.composedPath().some(n=>n instanceof Element&&n!==node&&n.matches('button,input,select,textarea,a,label,[data-no-gesture]'));
  const clearTap=()=>{clearTimeout(tap);tap=undefined;};
  node.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary||isControl(e))return;start={x:e.clientX,y:e.clientY,time:performance.now(),id:e.pointerId};suppressClick=false;},options);
  node.addEventListener('pointermove',e=>{if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>10){start=undefined;suppressClick=true;clearTap();}},options);
  node.addEventListener('pointercancel',()=>{start=undefined;suppressClick=true;clearTap();},options);
  node.addEventListener('pointerleave',()=>{if(start)suppressClick=true;start=undefined;},options);
  node.addEventListener('pointerup',e=>{if(start?.id!==e.pointerId)return;const held=performance.now()-start.time>=500;start=undefined;if(held&&hasHold){suppressClick=true;clearTap();run('hold_action');}},options);
  node.addEventListener('click',e=>{if(isControl(e))return;if(suppressClick){suppressClick=false;e.preventDefault();return;}if(!hasDouble||e.detail===0){run('tap_action');return;}if(tap){clearTap();run('double_tap_action');}else tap=setTimeout(()=>{tap=undefined;run('tap_action');},280);},options);
  node.addEventListener('contextmenu',e=>{if(!isControl(e)&&hasHold)e.preventDefault();},options);
  node.addEventListener('keydown',e=>{if(e.target!==node||e.repeat)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();clearTap();run(e.shiftKey&&hasHold?'hold_action':e.altKey&&hasDouble?'double_tap_action':'tap_action');}},options);
  return ()=>{abort.abort();clearTap();start=undefined;};
}
