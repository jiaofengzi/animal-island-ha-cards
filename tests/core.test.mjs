import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const result=await build({entryPoints:['src/core.ts'],bundle:true,format:'esm',platform:'node',write:false});
const {available,controlsFor,validate,safeImage,safePath,kinds,mediaInfo}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const entity=(id,state,attributes={})=>({entity_id:id,state,attributes});
test('23 backward-compatible registered profile tags with separate summary and chips',()=>{assert.equal(new Set(kinds).size,23);assert.ok(kinds.includes('summary')&&kinds.includes('chips'));});
test('configuration rejects invalid domains and action target overrides',()=>{assert.throws(()=>validate({type:'custom:island-light-card',entity:'switch.demo'},'light'));assert.throws(()=>validate({type:'custom:island-feeder-card',entities:[{entity:'sensor.demo'}],actions:[{label:'Go',service:'button.press',entity:'button.demo',data:{entity_id:'all'}}]},'feeder'));});
test('unknown and inaccessible entities are not actionable',()=>{assert.equal(available(undefined),false);for(const state of ['unknown','unavailable'])assert.equal(available(entity('light.demo',state)),false);});
test('media power uses 128/256 capability flags, not play_media flag',()=>{assert.equal(controlsFor('media',entity('media_player.demo','off',{supported_features:512})).commands.length,0);assert.equal(controlsFor('media',entity('media_player.demo','off',{supported_features:128})).commands[0].service,'media_player.turn_on');});
test('light brightness and color temperature reflect supported modes',()=>{assert.equal(controlsFor('light',entity('light.demo','on',{supported_color_modes:['onoff']})).ranges.length,0);assert.equal(controlsFor('light',entity('light.demo','on',{supported_color_modes:['brightness'],brightness:153})).ranges[0].field,'brightness');});
test('ranges reject missing and nonfinite limits',()=>{assert.equal(controlsFor('number',entity('number.demo','2',{})).ranges.length,0);assert.equal(controlsFor('number',entity('number.demo','2',{min:0,max:4,step:.5})).ranges[0].step,.5);});
test('cover movement is explicitly confirmed',()=>{assert.ok(controlsFor('cover',entity('cover.demo','open',{supported_features:3})).commands.every(c=>c.confirm));});
test('image and navigation URL policy',()=>{const origin='http://localhost:8123';assert.equal(safeImage('/local/a.png',origin),origin+'/local/a.png');for(const url of ['javascript:alert(1)','data:image/svg+xml,a','https://tracker.invalid/a','//tracker.invalid/a','https://a:b@example.com/a'])assert.equal(safeImage(url,origin),undefined);assert.equal(safeImage('https://images.example/a',origin,['https://images.example']),'https://images.example/a');for(const p of ['//evil.test','javascript:alert(1)','/\\evil','/%2fexample'])assert.equal(safePath(p),false);assert.equal(safePath('/lovelace/room'),true);});
test('never-run timestamp entities are callable, unavailable ones are not',()=>{for(const domain of ['scene','button','input_button']){assert.equal(available(entity(`${domain}.demo`,'unknown')),true);assert.equal(available(entity(`${domain}.demo`,'unavailable')),false);}assert.equal(available(entity('sensor.demo','unknown')),false);});
test('fan power follows TURN_ON and TURN_OFF, with direction gated separately',()=>{assert.equal(controlsFor('fan',entity('fan.demo','off',{supported_features:1})).commands.length,0);assert.equal(controlsFor('fan',entity('fan.demo','off',{supported_features:32})).commands[0].service,'fan.turn_on');assert.equal(controlsFor('fan',entity('fan.demo','on',{supported_features:16})).commands[0].service,'fan.turn_off');assert.equal(controlsFor('fan',entity('fan.demo','on',{supported_features:4,direction:'forward'})).choices[0].field,'direction');});
test('color modes and Kelvin/mired bounds gate light controls',()=>{assert.equal(controlsFor('light',entity('light.demo','on',{supported_color_modes:['onoff']})).color,undefined);assert.equal(controlsFor('light',entity('light.demo','on',{supported_color_modes:['rgb'],rgb_color:[255,0,16]})).color,'#ff0010');const r=controlsFor('light',entity('light.demo','on',{supported_color_modes:['color_temp'],min_mireds:200,max_mireds:500,color_temp:400})).ranges.find(r=>r.field==='color_temp_kelvin');assert.equal(r.min,2000);assert.equal(r.max,5000);assert.equal(r.value,2500);});
test('climate dual-target bounds and advanced capabilities',()=>{const e=entity('climate.demo','heat_cool',{supported_features:2+4+8+16+32+512,min_temp:10,max_temp:35,target_temp_low:20,target_temp_high:26,target_temp_step:.5,humidity:50,min_humidity:30,max_humidity:70,fan_modes:['auto'],fan_mode:'auto',preset_modes:['eco'],preset_mode:'eco',swing_modes:['on','off'],swing_mode:'off',swing_horizontal_modes:['on','off']});const c=controlsFor('climate',e);assert.equal(c.ranges[0].max,26);assert.deepEqual(c.ranges[0].data,{target_temp_low:20,target_temp_high:26});assert.ok(c.ranges.some(r=>r.field==='humidity'));assert.equal(c.choices.length,4);assert.equal(controlsFor('climate',{...e,attributes:{...e.attributes,supported_features:0}}).ranges.length,0);});
test('action configuration rejects unsafe targets, URLs and confirmation exemptions',()=>{const base={type:'custom:island-light-card',entity:'light.demo'};for(const a of [{action:'navigate',navigation_path:'//bad.example'},{action:'url',url_path:'javascript:alert(1)'},{action:'perform-action',perform_action:'light.turn_on',target:{entity_id:'all'}},{action:'perform-action',perform_action:'light.turn_on',data:{area_id:'all'}},{action:'toggle',confirmation:{exemptions:[{user:'demo'}]}}])assert.throws(()=>validate({...base,tap_action:a},'light'));assert.doesNotThrow(()=>validate({...base,tap_action:{action:'perform-action',perform_action:'light.turn_on',target:{area_id:'demo_room'},data:{brightness:100},confirmation:true}},'light'));});
test('template role vocabularies prevent misleading cross-domain labels',()=>{assert.doesNotThrow(()=>validate({type:'custom:island-printer-card',entities:[{entity:'sensor.demo',role:'progress'}]},'printer'));assert.throws(()=>validate({type:'custom:island-meal-card',entities:[{entity:'sensor.demo',role:'nozzle'}]},'meal'));});

test('media shuffle, repeat and volume step are independently capability gated',()=>{
 const e=entity('media_player.demo','playing',{supported_features:32768+262144+1024,shuffle:false,repeat:'all'}),c=controlsFor('media',e);
 assert.deepEqual(c.commands.map(x=>[x.service,x.data]),[['media_player.shuffle_set',{shuffle:true}],['media_player.volume_down',undefined],['media_player.volume_up',undefined]]);
 assert.equal(c.ranges.length,0);assert.deepEqual(c.choices[0].options,['off','all','one']);assert.equal(c.choices[0].value,'all');
 assert.equal(controlsFor('media',{...e,attributes:{...e.attributes,supported_features:0}}).commands.length,0);
 assert.equal(controlsFor('media',{...e,attributes:{supported_features:32768}}).commands.length,0);
 assert.equal(controlsFor('media',e,{media_controls:[],volume_controls:['volume_buttons']}).commands.length,2);
 assert.equal(controlsFor('media',e,{media_controls:[],volume_controls:[]}).choices.length,0);
});
test('media config rejects unknown controls and metadata has safe state fallbacks',()=>{
 const base={type:'custom:island-media-card',entity:'media_player.demo'};
 for(const extra of [{media_controls:['seek']},{volume_controls:['volume_buttons','volume_buttons']},{use_media_info:'yes'}])assert.throws(()=>validate({...base,...extra},'media'));
 const e=entity(base.entity,'playing',{friendly_name:'Radio',media_title:'Song',media_artist:'Artist',volume_level:.35});
 assert.deepEqual(mediaInfo(e,{use_media_info:true,show_volume_level:true}),{title:'Song',detail:'Artist',status:'播放中 · 35%'});
 assert.equal(mediaInfo(e,{}).title,'Radio');assert.equal(mediaInfo({...e,state:'unavailable'},{use_media_info:true}).detail,'');
 assert.equal(mediaInfo({...e,attributes:{...e.attributes,media_title:{bad:true},volume_level:NaN}},{use_media_info:true,show_volume_level:true}).title,'Radio');
 assert.equal(mediaInfo({...e,attributes:{media_content_type:'tvshow',media_series_title:'Show',media_season:2,media_episode:3}},{use_media_info:true}).detail,'Show · 季 2 · 集 3');
 assert.equal(mediaInfo({...e,attributes:{media_content_type:'playlist',media_playlist:'Playlist'}},{use_media_info:true}).detail,'Playlist');
});

const familyBuild=await build({entryPoints:['src/families.ts'],bundle:true,format:'esm',platform:'node',write:false});
const {resolveKind,familyForKind,canonicalProfiles}=await import('data:text/javascript;base64,'+Buffer.from(familyBuild.outputFiles[0].text).toString('base64'));
test('23 legacy entries map to 8 interaction families and 3 display primitives',()=>{
 assert.equal(Object.keys(familyForKind).length,23);
 assert.equal(new Set(Object.values(familyForKind).filter(f=>!['chips','picture','spacer'].includes(f))).size,8);
 for(const kind of kinds)assert.equal(resolveKind({type:`custom:island-${kind}-card`},kind),kind);
});
test('canonical profiles resolve without mutating canonical type',()=>{
 for(const [type,profiles] of Object.entries(canonicalProfiles))for(const profile of profiles){
  const c={type,profile,entity:({light:'light',fan:'fan',number:'number',select:'select',vacuum:'vacuum',scene:'scene',camera:'camera'})[profile]+'.demo',entities:[{entity:'sensor.demo'}]};
  if(!['light','fan','number','select','vacuum','scene','camera'].includes(profile))delete c.entity;
  if(profile==='entity')c.entity='sensor.demo';
  assert.equal(resolveKind(c,'entity'),profile);assert.equal(validate(c,'entity').type,type);
 }
});
test('canonical inference is explicit and monitor never guesses role schema',()=>{
 for(const [domain,profile] of [['light','light'],['fan','fan'],['input_number','number'],['input_select','select'],['sensor','entity']])assert.equal(resolveKind({type:'custom:island-control-card',entity:`${domain}.demo`},'entity'),profile);
 assert.equal(resolveKind({type:'custom:island-task-card',entity:'vacuum.demo'},'entity'),'vacuum');
 assert.equal(resolveKind({type:'custom:island-action-card',entity:'camera.demo'},'entity'),'camera');
 assert.throws(()=>resolveKind({type:'custom:island-monitor-card',entities:[{entity:'sensor.demo'}]},'entity'));
 assert.throws(()=>resolveKind({type:'custom:island-action-card',entity:'button.demo'},'entity'));
 assert.throws(()=>resolveKind({type:'custom:island-task-card',profile:'light'},'entity'));
 assert.throws(()=>validate({type:'custom:island-light-card',profile:'fan',entity:'light.demo'},'light'));
});
test('explicit severity and action roles are validated, not inferred from order',()=>{
 const c={type:'custom:island-action-card',profile:'feeder',description:'投喂两份',entities:[{entity:'sensor.demo',role:'portion',severity:'warning'}],actions:[{label:'投喂',service:'button.press',entity:'button.demo',role:'primary'}]};
 assert.doesNotThrow(()=>validate(c,'entity'));
 assert.throws(()=>validate({...c,description:1},'entity'));
 assert.throws(()=>validate({...c,entities:[{entity:'sensor.demo',severity:'healthy'}]},'entity'));
 assert.throws(()=>validate({...c,actions:[{...c.actions[0],role:'automatic'}]},'entity'));
 assert.throws(()=>validate({...c,actions:[...c.actions,...c.actions]},'entity'));
});

test('conditional primary task actions must be nonempty, bound to status and mutually exclusive',()=>{
 const base={type:'custom:island-task-card',profile:'printer',entities:[{entity:'sensor.demo',role:'status'}]};
 const action={label:'暂停',role:'primary',service:'button.press',entity:'button.demo',when_states:['printing']};
 assert.doesNotThrow(()=>validate({...base,actions:[action,{...action,label:'继续',when_states:['paused']}]},'entity'));
 for(const when_states of [[],[''],['printing','printing'],['printing',2]])assert.throws(()=>validate({...base,actions:[{...action,when_states}]},'entity'));
 assert.throws(()=>validate({...base,actions:[action,{...action,when_states:['printing','paused']}]},'entity'));
 assert.throws(()=>validate({...base,entities:[{entity:'sensor.demo',role:'progress'}],actions:[action]},'entity'));
});

test('missing light readings never fabricate brightness zero or minimum Kelvin',()=>{
 const c=controlsFor('light',entity('light.demo','on',{supported_color_modes:['brightness','color_temp'],min_color_temp_kelvin:2200,max_color_temp_kelvin:6500}));
 assert.equal(c.ranges.length,0);
 const actual=controlsFor('light',entity('light.demo','on',{supported_color_modes:['brightness'],brightness:0}));assert.equal(actual.ranges[0].value,0);
});

// Validate the actual acceptance fixture module, not a second hand-copied set of configs.
test('all 23 acceptance fixtures validate with production navigation and image policies',async()=>{
 for(const href of ['http://127.0.0.1:4173/_acceptance/','http://127.0.0.1:4173/_acceptance/index.html','file:///tmp/island-acceptance/offline.html']){
  const url=new URL(href);
  const fixture=await build({entryPoints:['demo/acceptance-model.js'],bundle:true,format:'esm',platform:'node',write:false,define:{location:JSON.stringify({href,pathname:url.pathname,origin:url.origin,protocol:url.protocol}),window:'{}'}});
  const {configs,profiles}=await import('data:text/javascript;base64,'+Buffer.from(fixture.outputFiles[0].text).toString('base64'));
  assert.equal(configs.length,23);assert.equal(new Set(profiles).size,23);
  for(const [index,config] of configs.entries()){
   assert.doesNotThrow(()=>validate(config,profiles[index]),`${href} ${profiles[index]}`);
   assert.doesNotThrow(()=>validate({...config,read_only:true},profiles[index]),`${href} readonly ${profiles[index]}`);
   for(const item of config.entities??[])if(item.path){assert.equal(safePath(item.path),true);assert.equal(item.path.startsWith(url.pathname+'#module-'),true);}
   if(config.image){
    assert.equal(config.image,new URL('./assets/local-landscape.svg',href).href);
    assert.equal(safeImage(config.image,url.origin),url.protocol==='file:'?undefined:config.image);
   }
  }
 }
});
