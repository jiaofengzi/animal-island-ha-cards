import {randomBytes} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {HA_VERSION,states} from './fixtures.mjs';
const base='http://127.0.0.1:8123';
for(let i=0;i<180;i++) {try {const r=await fetch(`${base}/api/onboarding`);if(r.ok)break;}catch{} if(i===179)throw Error('HA readiness timed out');await new Promise(r=>setTimeout(r,2000));}
async function post(path,body,token){const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});if(!r.ok)throw Error(`HA ${path}: HTTP ${r.status}`);return r.json();}
const password=randomBytes(32).toString('hex');
const {auth_code}=await post('/api/onboarding/users',{client_id:base+'/',name:'Parity laboratory',username:'parity-ci',password,language:'en'});
const r=await fetch(`${base}/auth/token`,{method:'POST',body:new URLSearchParams({grant_type:'authorization_code',code:auth_code,client_id:base+'/'})});
if(!r.ok)throw Error('Ephemeral token exchange failed');
const tokens=await r.json();
// GitHub runner consumes add-mask commands; never emit secret values outside CI.
if(process.env.GITHUB_ACTIONS==='true')for(const secret of [tokens.access_token,tokens.refresh_token,password])if(secret)process.stdout.write(`::add-mask::${String(secret).replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A')}\n`);
for(const step of ['core_config','analytics','integration']){
 const body=step==='integration'?{client_id:base+'/',redirect_uri:base+'/?auth_callback=1'}:{};
 await post(`/api/onboarding/${step}`,body,tokens.access_token);
}
for(const [id,state] of Object.entries(states))await post(`/api/states/${id}`,state,tokens.access_token);
const config=await fetch(base+'/api/config',{headers:{Authorization:`Bearer ${tokens.access_token}`}}).then(r=>r.json());
if(config.version!==HA_VERSION)throw Error(`Expected HA ${HA_VERSION}, got ${config.version}`);
await mkdir('.ha-secrets',{recursive:true,mode:0o700});
await writeFile('.ha-secrets/auth.json',JSON.stringify({hassUrl:base,clientId:base+'/',...tokens,expires:Date.now()+tokens.expires_in*1000}),{mode:0o600});
await mkdir('ha-evidence',{recursive:true});
await writeFile('ha-evidence/runtime.json',JSON.stringify({version:config.version,entities:Object.keys(states),host:'official Home Assistant container',syntheticEntities:true},null,2));
console.log(`Bootstrapped isolated Home Assistant ${config.version}; credentials excluded from evidence.`);
