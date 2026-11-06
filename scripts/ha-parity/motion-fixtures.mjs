export const motionCards = prefix => [
 {type:`custom:${prefix}title-card`,title:prefix==='island-'?'Island interaction':'Mushroom reference',subtitle:'Live Home Assistant · isolated demo entities'},
 {type:`custom:${prefix}chips-card`,chips:[{type:'action',icon:'mdi:power',tap_action:{action:'perform-action',perform_action:'input_boolean.toggle',target:{entity_id:'input_boolean.parity'}}},{type:'entity',entity:'input_boolean.parity',name:'Demo switch'}]},
 {type:`custom:${prefix}number-card`,entity:'input_number.parity_motion',name:'Drag a real value',display_mode:'slider'},
 {type:`custom:${prefix}number-card`,entity:'input_number.parity_motion',name:'Keyboard and buttons',display_mode:'buttons'},
 {type:`custom:${prefix}number-card`,entity:'number.motion_disabled',name:'Unavailable control',display_mode:'buttons'}
];
export const motionView=()=>({title:'Motion lab',path:'motion',type:'sections',max_columns:2,sections:['mushroom-','island-'].map(prefix=>({type:'grid',cards:motionCards(prefix)}))});
export const disabledMotionState={state:'unavailable',attributes:{friendly_name:'Unavailable control',min:0,max:100,step:1,mode:'box'}};
