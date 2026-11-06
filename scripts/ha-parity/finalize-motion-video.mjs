import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {HA_VERSION} from './fixtures.mjs';
export async function finalizeMotionVideo(input,start,duration){
 if(!Number.isFinite(start)||!Number.isFinite(duration)||start<0||duration<1||duration>60)throw Error('Invalid motion capture window');
 await mkdir('ha-evidence/motion',{recursive:true});
 const output='ha-evidence/motion/island-motion.webm';
 // Only trim the verified authenticated window. Never upload the raw recording.
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',String(start),'-i',input,'-t',String(duration),'-an','-c:v','libvpx-vp9','-crf','34','-b:v','0',output],{stdio:'pipe'});
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',output],{encoding:'utf8'}));
 const stream=probe.streams.find(s=>s.codec_type==='video');const seconds=Number(probe.format.duration);
 if(!stream||stream.width!==1280||stream.height!==720||seconds<1||seconds>60)throw Error('Unexpected finalized motion video geometry/duration');
 // First/middle/last evidence frames allow human review before publishing.
 for(const [name,time] of [['first',0],['middle',seconds/2],['last',Math.max(0,seconds-.15)]])execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',String(time),'-i',output,'-frames:v','1',`ha-evidence/motion/review-${name}.png`],{stdio:'pipe'});
 await writeFile('ha-evidence/motion-evidence.json',JSON.stringify({commit:process.env.GITHUB_SHA||null,haVersion:HA_VERSION,host:'Home Assistant',status:'captured',video:'motion/island-motion.webm',authenticatedSyntheticDashboard:true,width:1280,height:720,durationSeconds:seconds,observed:['press-scale','pointer-ripple','slider-sync','backend-state-change','reduced-motion']},null,2));
}
