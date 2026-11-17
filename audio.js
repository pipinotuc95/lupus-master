import {audioSlot,musicCharacter,parseTime,stepTitle} from './engine.js';
export class AudioController{
 constructor({wolfEnd,error,status}){this.wolfEnd=wolfEnd;this.error=error;this.status=status;this.files={};this.urls={};this.key='';this.bg=null;this.fx=null;this.horn=null;this.segment=0;this.wolf=false;this.blocked=false;this.last=null;this.intent=0;this.effectIntent=0;
  if('mediaSession'in navigator){navigator.mediaSession.setActionHandler('pause',()=>this.bg?.pause());navigator.mediaSession.setActionHandler('play',()=>{if(!this.wolf)this.play(this.bg)})}
 }
 setFiles(files){for(const u of Object.values(this.urls))URL.revokeObjectURL(u);this.files=files;this.urls=Object.fromEntries(Object.entries(files).map(([k,v])=>[k,URL.createObjectURL(v.blob)]));this.key=''}
 invalidate(){this.key=''}
 src(slot){return this.urls[slot]||(slot==='timerAlert'?'./boat-horn.mp3':null)}
 async play(a){if(!a)return;try{await a.play();this.blocked=false;this.status(false)}catch(e){if(e.name==='NotAllowedError'){this.blocked=true;this.status(true)}else if(e.name!=='AbortError')this.error('Audio non riproducibile. Prova un file MP3 o M4A.')}}
 stop(){this.intent++;this.effectIntent++;for(const a of[this.bg,this.fx,this.horn]){a?.pause();if(a)a.removeAttribute('src')}this.bg=null;this.fx=null;this.horn=null;this.key='';this.last=null}
 make(src){if(!src)return null;const a=new Audio(src);a.preload='auto';a.playsInline=true;return a}
 sync(g,settings,{kill=false,victory=false}={}){
  this.last={g,settings};const slot=audioSlot(g),character=musicCharacter(g),position=parseTime(settings.timestamps[character]||'')??0;
  const context=g.phase==='night'?`${g.round}:${g.simplifiedNight?'manual'+g.nightMusicPlayId:'guided'+g.step}:${character}:${position}`:g.phase;
  const key=`${slot}:${context}:${settings.backgrounds}:${this.src(slot)}`;
  if(key!==this.key){this.key=key;this.intent++;this.bg?.pause();this.bg=null;this.segment=position;this.wolf=character==='wolves';
   const win=['winVillage','winWolves'].includes(slot),ended=this.wolf&&g.nightWolfAudioRound===g.round;
   if(settings.backgrounds&&!ended&&(!win||victory)&&this.src(slot)){
    const a=this.make(this.src(slot)),intent=this.intent;this.bg=a;
    const begin=()=>{if(this.bg!==a||this.intent!==intent)return;a.currentTime=Math.min(position,Math.max(0,a.duration-.01));if(!this.fx)this.play(a)};
    a.addEventListener('loadedmetadata',begin,{once:true});
    a.onended=()=>{if(this.bg!==a)return;if(this.wolf){this.bg=null;this.wolfEnd(g.round);return}if(win)return;a.currentTime=this.segment;this.play(a)};
    a.onerror=()=>{if(this.bg===a)this.error('Traccia non riproducibile: importa un file MP3 o M4A.')};
    if('mediaSession'in navigator&&window.MediaMetadata)navigator.mediaSession.metadata=new MediaMetadata({title:'Lupus in Tabula',artist:character?stepTitle(character):slot});
   }
  }
  if(kill&&settings.effects&&this.src('wolfKill')){this.bg?.pause();this.fx?.pause();const a=this.make(this.src('wolfKill'));this.fx=a;const token=++this.effectIntent;
   const done=()=>{if(this.effectIntent!==token)return;this.fx=null;this.play(this.bg)};a.onended=done;a.onerror=done;
   a.play().catch(e=>{if(e.name!=='AbortError')this.error('L’effetto uccisione non è partito. Tocca un comando audio prima della prossima notte.');done()});
  }
 }
 resume(){if(this.bg){this.play(this.bg);return}if(this.last){const {g,settings}=this.last;const slot=audioSlot(g);if(!['winVillage','winWolves'].includes(slot)){this.invalidate();this.sync(g,settings)}}}
 alert(settings){this.horn?.pause();this.horn=this.make(this.src('timerAlert'));this.play(this.horn)}
}
export async function readAudio(file){const url=URL.createObjectURL(file);try{return await new Promise((resolve,reject)=>{const a=new Audio();let timeout=setTimeout(()=>reject(new Error('Impossibile leggere il file audio.')),15000);a.onloadedmetadata=()=>{clearTimeout(timeout);Number.isFinite(a.duration)&&a.duration>0?resolve(a.duration):reject(new Error('Durata della traccia non valida.'))};a.onerror=()=>{clearTimeout(timeout);reject(new Error('Formato non riproducibile. Prova MP3 o M4A.'))};a.src=url})}finally{URL.revokeObjectURL(url)}}
