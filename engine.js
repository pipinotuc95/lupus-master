import {ROLES} from './roles.js';
export {ROLES};
export const clone=x=>structuredClone(x);
export const roleList=Object.keys(ROLES),specials=roleList.filter(r=>!ROLES[r].expansion&&!['wolf','villager','seer'].includes(r));
export const musicRoles=['seer','medium','guardRole','owl','copycat','wolves'];
export const audioSlots={night:'Notte',day:'Giorno',lynching:'Linciaggio',winVillage:'Vittoria del villaggio',winWolves:'Vittoria dei lupi',wolfKill:'Uccisione dei lupi',timerAlert:'Avviso del timer'};
export const wolf=r=>['wolf','lara'].includes(r), seen=r=>wolf(r)||['cow','darius'].includes(r), evil=r=>seen(r)||r==='hamster';
export const alive=g=>g.players.filter(p=>p.alive), player=(g,id)=>g.players.find(p=>p.id===id), label=p=>`${p.name} — ${ROLES[p.role].title}`;
export const actorRole=s=>({masons:'mason',guardRole:'guard',wolves:'wolf',ghostSword:null,ghostShield:null})[s]??(['ghostSword','ghostShield'].includes(s)?null:s);
export const stepTitle=s=>({ghostSword:'Fantasma con spada',ghostShield:'Fantasma con scudo',hamlet:'Amleto · teschio',dorian:'Dorian Wolf · ritratto',wolves:'Lupi mannari'})[s]||ROLES[actorRole(s)]?.title||s;
export function ensure(v,message){if(!v)throw new Error(message)}
export function timerStart(now=Date.now()/1000){return{running:true,deadline:now+120,pausedRemaining:120,warningPlayed:false,endPlayed:false}}
export function timerEmpty(){return{running:false,deadline:null,pausedRemaining:120,warningPlayed:false,endPlayed:false}}
export function remaining(t,now=Date.now()/1000){return t.running?Math.max(0,Math.min(120,(t.deadline??now)-now)):t.pausedRemaining}
export function pause(t,now=Date.now()/1000){return {...t,running:false,deadline:null,pausedRemaining:remaining(t,now)}}
export function resume(t,now=Date.now()/1000){return !t.running&&t.pausedRemaining>0&&!t.endPlayed?{...t,running:true,deadline:now+t.pausedRemaining}:t}
export function advance(t,now=Date.now()/1000){
 if(!t.running)return{timer:t,signal:null};
 if(remaining(t,now)===0)return{timer:{...t,running:false,deadline:null,pausedRemaining:0,endPlayed:true},signal:t.endPlayed?null:'end'};
 if(remaining(t,now)<=30&&!t.warningPlayed)return{timer:{...t,warningPlayed:true},signal:'thirty'};
 return{timer:t,signal:null};
}
export function parseTime(text){
 const parts=text.trim().split(':');if(parts.length<2||parts.length>3||parts.some(x=>!/^\d+$/.test(x)))return null;
 const n=parts.map(Number);if(n.at(-1)>59||(parts.length===3&&n[1]>59))return null;
 const seconds=parts.length===2?n[0]*60+n[1]:n[0]*3600+n[1]*60+n[2];return Number.isFinite(seconds)&&seconds<=2147483.647?seconds:null;
}
export const wolfCount=n=>n>=25?4:n>=16?3:2;
export function suggested(n){const min={medium:9,possessed:10,guard:11,owl:12,mason:13,hamster:15,copycat:16};return specials.filter(r=>min[r]<=n)}
export function deck(n,selected=[],expansion=false,seer=true){
 selected=new Set(selected);ensure(Number.isInteger(n)&&n>=8&&n<=(expansion?30:24),'Scegli da 8 a '+(expansion?30:24)+' giocatori.');
 if(expansion){
  ensure(!(selected.has('purple')&&selected.has('medium')),'Scegli Miss Purple oppure il Medium.');
  ensure(!(selected.has('darius')&&selected.has('hamster')),'Scegli Darius oppure il Criceto.');
  ensure(!(selected.has('dorian')&&(selected.has('hamlet')||selected.has('undead'))),'Dorian è alternativo ad Amleto e Mortovivo.');
  ensure(seer||selected.has('fortune'),'Mantieni il Veggente oppure scegli la Cartomante.');
 }
 const cards=Array(wolfCount(n)-(expansion&&selected.has('lara')?1:0)).fill('wolf');
 if(expansion&&selected.has('lara'))cards.push('lara');if(!expansion||seer)cards.push('seer');
 if(n>=9||expansion)for(const r of roleList)if(selected.has(r)&&(specials.includes(r)||(expansion&&ROLES[r].expansion&&r!=='lara')))cards.push(...Array(r==='mason'?2:1).fill(r));
 const count=n-cards.length;ensure(count>=0&&count<=(expansion?14:12),`Regola le carte: servono ${n} ruoli e sono disponibili al massimo ${expansion?14:12} Villici.`);
 return [...cards,...Array(count).fill('villager')];
}
export function emptyGame(){return{name:'Il villaggio',players:[],phase:'preparation',round:0,step:0,firstNightMercy:false,ghosts:false,simplifiedNight:false,expansion:false,choices:{},marker:null,lastLynched:null,sword:null,shield:null,owlSuspect:null,ghostSwordTarget:null,ghostShieldTarget:null,timer:timerEmpty(),log:[],winner:null,suspects:[],victoryPlayed:false,wolfKillRound:0,wolfKillPlayedRound:0,e:{baronUsed:false,jekyllUsed:false,portraitUsed:false,skullDiscarded:false,skullHolder:null,portraitHolder:null,destination:null,pendingDeaths:{},deathOrder:[],handled:[],reviveId:null,lynchedId:null,needsSkullPass:false},nightMusicRole:null,nightMusicPlayId:0,nightWolfAudioRound:0}}
export function create({name,names,roles,mercy=false,ghosts=false,simple=false,expansion=false}){
 ensure(names.length===roles.length,'Scegli un ruolo per ogni posto.');names=names.map(n=>n.trim());
 ensure(names.every(Boolean),'Inserisci il nome di tutti i giocatori.');ensure(new Set(names.map(n=>n.toLowerCase())).size===names.length,'Usa nomi diversi per tutti i giocatori.');
 ensure(roles.every(r=>ROLES[r])&&(expansion||!roles.some(r=>ROLES[r].expansion)),'Attiva l’espansione per queste carte.');
 const expected=deck(names.length,roles,expansion,roles.includes('seer'));
 ensure(JSON.stringify([...roles].sort())===JSON.stringify(expected.sort()),'Le carte assegnate non corrispondono al mazzo.');
 return{...emptyGame(),name:name.trim()||'Il villaggio',players:names.map((n,i)=>({id:String(i),name:n,original:roles[i],role:roles[i],alive:true,death:null})),firstNightMercy:mercy,ghosts,simplifiedNight:simple,expansion};
}
export function start(game){const g=clone(game);g.phase='night';g.round=1;g.log=['Notte 1 · il villaggio si addormenta'];return g}
export function steps(g){
 const has=r=>g.players.some(p=>p.original===r||p.role===r),s=[];
 if(g.expansion&&g.round===1){for(const [r,step]of[['hamlet','hamlet'],['dorian','dorian'],['mason','masons'],['cow','cow']])if(has(r))s.push(step)}
 if(g.round>=2){if(has('medium'))s.push('medium');if(g.expansion&&has('purple'))s.push('purple');if(g.expansion&&has('baron')&&!g.e.baronUsed)s.push('baron')}
 if(!g.expansion&&g.round===1&&has('mason'))s.push('masons');if(has('owl'))s.push('owl');if(!g.expansion||has('seer'))s.push('seer');
 if(g.expansion&&has('fortune'))s.push('fortune');if(g.expansion&&has('darius'))s.push('darius');
 if(g.round>=2&&has('guard'))s.push('guardRole');if(g.expansion&&g.round>=2&&has('jekyll')&&!g.e.jekyllUsed)s.push('jekyll');s.push('wolves');
 if(g.round===2&&has('copycat'))s.push('copycat');
 if(g.ghosts&&g.round>=2){if(player(g,g.sword)&&(!g.expansion||!player(g,g.sword).alive))s.push('ghostSword');if(player(g,g.shield)&&(!g.expansion||!player(g,g.shield).alive))s.push('ghostShield')}
 return s;
}
export const actors=(g,s)=>g.players.filter(p=>(p.alive||(g.expansion&&s==='baron'))&&(s==='wolves'?wolf(p.role):p.role===actorRole(s)));
export function canAct(g,s){if(['ghostSword','ghostShield'].includes(s))return true;if(s==='copycat')return actors(g,s).some(p=>g.expansion||!deaths(g)[p.id]);return actors(g,s).length>0&&!(s==='wolves'&&g.round===1&&g.firstNightMercy)}
export const simpleVictims=g=>alive(g).filter(p=>!wolf(p.role)||(g.expansion&&p.role!=='lara'&&alive(g).some(x=>x.role==='lara')));
export function targets(g,s){
 if(!canAct(g,s))return[];
 if(['medium','masons','cow','purple'].includes(s))return[];
 if(s==='baron')return g.e.baronUsed?[]:g.players.filter(p=>!p.alive&&p.id===g.marker&&p.original!=='baron');
 if(['hamlet','dorian','jekyll','guardRole'].includes(s))return alive(g).filter(p=>p.role!==actorRole(s));
 if(s==='wolves')return simpleVictims(g);
 if(s==='copycat')return alive(g).filter(p=>p.role!=='copycat'&&(g.expansion||!deaths(g)[p.id]));
 return alive(g);
}
export function choose(game,s,id){ensure(game.phase==='night'&&steps(game).includes(s),'Turno non disponibile.');if(id!=null)ensure(targets(game,s).some(p=>p.id===id),'Bersaglio non valido.');const g=clone(game);if(id==null)delete g.choices[s];else g.choices[s]=id;return g}
export function confirmWolfKill(game){const g=clone(game),p=player(g,g.choices.wolves);if(g.expansion||g.wolfKillRound===g.round||!p?.alive||wolf(p.role))return g;
 if(g.simplifiedNight?!(g.round===1&&g.firstNightMercy):(canAct(g,'wolves')&&p.role!=='hamster'&&p.id!==g.choices.guardRole))g.wolfKillRound=g.round;return g}
export function confirmStep(game){let g=clone(game),s=steps(g)[g.step];if(s==='hamlet')g.e.skullHolder=g.choices[s]??null;if(s==='dorian')g.e.portraitHolder=g.choices[s]??null;if(s==='wolves'&&!g.expansion)g=confirmWolfKill(g);return g}
export function forward(game){const g=confirmStep(game),s=steps(g)[g.step],p=player(g,g.choices[s]);if(p)g.log.push(`Notte ${g.round} · ${stepTitle(s)}: ${p.name}`);g.step=Math.min(g.step+1,steps(g).length-1);return g}
export function revival(g){const p=player(g,g.choices.baron);return g.expansion&&g.round>=2&&!g.e.baronUsed&&actors(g,'baron').length&&p&&!p.alive&&p.id===g.marker&&p.original!=='baron'?p.id:null}
export function deaths(g){
 const result={},revived=revival(g),kill=(id,reason)=>{if(id!=null&&id!==revived&&player(g,id)?.alive&&!result[id])result[id]=reason};
 const p=player(g,g.choices.wolves);
 if(canAct(g,'wolves')&&p&&simpleVictims(g).some(x=>x.id===p.id)&&(g.simplifiedNight||(p.role!=='hamster'&&p.id!==g.choices.guardRole)))kill(p.id,'Sbranato dai lupi');
 if(g.simplifiedNight){if(g.expansion)for(const id of(g.choices.EXTRA_DEATHS||'').split(',').filter(Boolean))kill(id,'Potere notturno · esito del master');return result}
 for(const s of['seer','fortune'])if((s==='seer'||g.expansion)&&canAct(g,s)&&player(g,g.choices[s])?.role==='hamster')kill(g.choices[s],'Criceto scoperto');
 if(g.players.length>=20&&canAct(g,'owl')){const p=player(g,g.choices.owl);if(p&&(g.expansion?!evil(p.role):!['wolf','hamster'].includes(p.role)))kill(p.id,'Gufo letale')}
 if(g.expansion&&g.round>=2&&!g.e.jekyllUsed&&canAct(g,'jekyll'))kill(g.choices.jekyll,'Pozione di Jekyll');return result;
}
export function orderedDeaths(g,d){const ids=[];if(g.choices.wolves!=null&&d[g.choices.wolves])ids.push(g.choices.wolves);for(const p of g.players)if(d[p.id]&&!ids.includes(p.id))ids.push(p.id);return ids}
export function finishNight(game,now=Date.now()/1000){let g=confirmStep(game);
 if(g.expansion){if(g.round===1){g.e.skullHolder=g.choices.hamlet??null;g.e.portraitHolder=g.choices.dorian??null}
 const revived=revival(g),potion=g.round>=2&&!g.e.jekyllUsed&&actors(g,'jekyll').length>0&&(g.choices.jekyll!=null||(g.simplifiedNight&&g.choices.POTION_USED==='yes'));
 g.e.destination='DAWN';g.e.pendingDeaths=deaths(g);g.e.deathOrder=orderedDeaths(g,g.e.pendingDeaths);g.e.handled=[];g.e.reviveId=revived;g.e.lynchedId=null;g.e.baronUsed||=revived!=null;g.e.jekyllUsed||=potion;
 if(potion)g.log.push(`Notte ${g.round} · pozione di Jekyll utilizzata`);g.phase='resolution';return advanceResolution(g,now)}
 g=confirmWolfKill(g);let d=deaths(g);if(g.simplifiedNight){d={};const p=player(g,g.choices.wolves);if(!(g.round===1&&g.firstNightMercy)&&p&&simpleVictims(g).some(x=>x.id===p.id))d[p.id]='Scelto dal master'}
 return applyDeaths(g,d,null,true,now);
}
export function question(g){for(const[r,kind,used,holder]of[['dorian','DORIAN',g.e.portraitUsed,g.e.portraitHolder],['hamlet','HAMLET',g.e.skullDiscarded,g.e.skullHolder]]){const p=g.players.find(p=>p.alive&&p.role===r&&g.e.pendingDeaths[p.id]&&!g.e.handled.includes(`${kind}:${p.id}`));if(!used&&holder!=null&&p)return{kind,player:p}}
 if(g.e.needsSkullPass&&player(g,g.e.skullHolder))return{kind:'SKULL',player:player(g,g.e.skullHolder)};
 if(g.e.destination==='DAWN'&&Object.keys(g.e.pendingDeaths).length>1&&!g.e.pendingDeaths[g.choices.WELCOME]){const p=player(g,g.e.deathOrder[0]);if(p)return{kind:'WELCOME',player:p}}return null;
}
export function revelation(game,reveal,now=Date.now()/1000){const g=clone(game),q=question(g);if(!q||!['DORIAN','HAMLET'].includes(q.kind))return g;g.e.handled.push(`${q.kind}:${q.player.id}`);
 if(reveal){const reason=g.e.pendingDeaths[q.player.id]||'',holder=q.kind==='DORIAN'?g.e.portraitHolder:g.e.skullHolder;
 if(q.kind==='DORIAN'){delete g.e.pendingDeaths[q.player.id];g.e.portraitUsed=true}else g.e.skullDiscarded=true;
 if(holder!=null&&holder!==g.e.reviveId&&player(g,holder)?.alive)g.e.pendingDeaths[holder]=q.kind==='DORIAN'?`${reason} · ritratto di Dorian Wolf`:'Teschio di Amleto'}
 g.e.deathOrder=orderedDeaths(g,g.e.pendingDeaths);g.log.push(`${g.e.destination==='DAWN'?'Notte':'Linciaggio'} ${g.round} · ${q.player.name} ${reveal?'rivela la carta':'non rivela la carta'}`);return advanceResolution(g,now);
}
export function chooseWelcome(game,id,now=Date.now()/1000){const g=clone(game);if(question(g)?.kind!=='WELCOME'||!g.e.pendingDeaths[id])return g;g.choices.WELCOME=id;return advanceResolution(g,now)}
export function passSkull(game,id){const g=clone(game);if(!g.e.needsSkullPass||!alive(g).some(p=>p.id===id&&p.id!==g.e.skullHolder))return g;g.e.skullHolder=id;g.e.needsSkullPass=false;g.phase='night';g.log.push(`Giorno ${g.round-1} · teschio passato a ${player(g,id).name}`);return g}
export function advanceResolution(g,now){return question(g)?g:applyDeaths(g,g.e.pendingDeaths,g.e.reviveId,g.e.destination==='DAWN',now)}
export function applyDeaths(game,d,revived,night,now){let g=clone(game);const order=orderedDeaths(g,d),oldRound=g.round;
 for(const p of g.players)if(p.id===revived){p.alive=true;p.death=null}else if(d[p.id]){p.alive=false;p.death=night?`Notte ${g.round} · ${d[p.id]}`:d[p.id]}
 if(night){if(g.round===2){const p=player(g,g.choices.copycat);if(p?.alive){const r=wolf(p.role)?'wolf':(p.role==='seer'||g.expansion&&p.role==='fortune')?p.role:null;if(r)for(const c of g.players)if(c.alive&&c.role==='copycat')c.role=r}}
 g.marker=(d[g.choices.WELCOME]?g.choices.WELCOME:null)??order[0]??g.marker;g.owlSuspect=player(g,g.choices.owl)?.alive?g.choices.owl:null;g.ghostSwordTarget=g.choices.ghostSword??null;g.ghostShieldTarget=g.choices.ghostShield??null;g.timer=timerStart(now);g.phase='day';
 if(g.expansion&&Object.values(d).some(x=>x.includes('Sbranato dai lupi')))g.wolfKillRound=g.round;
 }else{const lynched=g.expansion?order.find(id=>d[id]?.includes(`Linciaggio ${oldRound}`)):order[0];g.lastLynched=player(game,lynched)??null;g.phase='night';g.round++;g.choices={};g.timer=timerEmpty();g.owlSuspect=null;g.ghostSwordTarget=null;g.ghostShieldTarget=null;g.nightMusicRole=null;g.nightMusicPlayId=0;g.nightWolfAudioRound=0}
 g.step=0;g.suspects=[];if(g.ghosts)for(const id of order)if(g.sword==null)g.sword=id;else if(g.shield==null&&id!==g.sword)g.shield=id;
 Object.assign(g.e,{destination:null,pendingDeaths:{},deathOrder:[],handled:[],reviveId:null,lynchedId:null});
 g.log.push(`${night?'Alba':'Linciaggio'} ${oldRound} · ${order.length?order.map(id=>player(g,id)?.name).filter(Boolean).join(', '):'nessuna eliminazione'}`);
 if(revived)g.log.push(`Alba ${oldRound} · ${player(g,revived)?.name||''} torna in vita`);g=finishIfNeeded(g);
 if(g.expansion&&!night&&g.phase==='night'&&!g.e.skullDiscarded&&player(g,g.e.skullHolder)&&alive(g).some(p=>p.id!==g.e.skullHolder)){g.phase='resolution';g.e.needsSkullPass=true}return g;
}
export function setSuspects(game,ids){ensure(game.phase==='lynching'&&ids.length<=2&&new Set(ids).size===ids.length&&ids.every(id=>alive(game).some(p=>p.id===id)),'Scegli due indiziati diversi e vivi.');ensure(game.owlSuspect==null||ids.includes(game.owlSuspect),'Il bersaglio del Gufo deve restare fra gli indiziati.');return{...clone(game),suspects:[...ids]}}
export function lynchPhase(game,now=Date.now()/1000,allowEarly=false){ensure(game.phase==='day','Non è giorno.');ensure(remaining(game.timer,now)===0||allowEarly,'Conferma il passaggio anticipato al linciaggio.');const g=clone(game);g.phase='lynching';g.timer=pause(g.timer,now);g.suspects=g.owlSuspect?[g.owlSuspect]:[];g.log.push(`Giorno ${g.round} · inizio votazioni${g.timer.pausedRemaining>0?` anticipato: ${Math.ceil(g.timer.pausedRemaining)} secondi rimanenti`:''}`);return g}
export function lynch(game,id,now=Date.now()/1000){ensure(game.phase==='lynching'&&game.suspects.length===2,'Seleziona due indiziati.');ensure(id!=null&&game.suspects.includes(id)&&player(game,id)?.alive,'Scegli l’eliminato fra i due indiziati.');const g=clone(game),d={[id]:`Linciaggio ${g.round}`};if(g.expansion){g.phase='resolution';Object.assign(g.e,{destination:'LYNCH',pendingDeaths:d,deathOrder:[id],handled:[],reviveId:null,lynchedId:id});return advanceResolution(g,now)}return applyDeaths(g,d,null,false,now)}
export function finishIfNeeded(game){const g=clone(game);if(['summary','finished'].includes(g.phase))return g;const counted=alive(g).filter(p=>!g.expansion||p.role!=='undead'),wolves=counted.filter(p=>g.expansion?wolf(p.role):p.role==='wolf').length;
 if(wolves!==0&&wolves<counted.length-wolves)return g;let winner=wolves===0?'Il villaggio':'I lupi mannari';if(counted.some(p=>p.role==='hamster'))winner='Il Criceto mannaro · vittoria solitaria';if(g.expansion&&counted.length<=2&&counted.some(p=>p.role==='darius'))winner='Darius · vittoria solitaria';g.phase='summary';g.winner=winner;g.timer.running=false;g.timer.deadline=null;g.victoryPlayed=false;g.log.push(`Partita conclusa · ${winner}`);return g;
}
export function showVictory(game){const g=clone(game);if(g.phase==='summary'){g.phase='finished';g.victoryPlayed=false}return g}
export function setCopycat(game,id,r){ensure(game.simplifiedNight&&game.round>=2&&player(game,id)?.original==='copycat'&&player(game,id)?.alive,'Mitomane non disponibile.');ensure(['copycat','wolf','seer'].includes(r)||(game.expansion&&r==='fortune'),'Ruolo non copiabile.');const g=clone(game);player(g,id).role=r;g.log.push(`${g.phase==='night'?'Notte':'Giorno'} ${g.round} · ${player(g,id).name}: ${ROLES[r].title}`);return ['day','lynching'].includes(g.phase)?finishIfNeeded(g):g}
export function investigation(g,s){if(s==='medium'){const p=g.lastLynched;return p?`${p.name}: ${(g.expansion?seen(p.role):p.role==='wolf')?'era un mannaro':'non era un mannaro'}.`:'Nessun linciato precedente.'}if(s==='purple')return `Malvagi vivi: ${alive(g).filter(p=>evil(p.role)).length}`;if(['masons','cow'].includes(s))return `Si riconoscono: ${g.players.filter(p=>s==='masons'?p.role==='mason':p.alive&&(wolf(p.role)||p.original==='copycat')).map(p=>p.name).join(', ')}`;const p=player(g,g.choices[s]);return p?`${p.name}: ${(g.expansion?seen(p.role):p.role==='wolf')?'mannaro':'non mannaro'}.`:'Scegli una persona.'}
export function tieOrder(g){const index=g.players.findIndex(p=>p.id===g.marker);return g.players.map((_,i)=>g.players[(index+i+1)%g.players.length]).filter(p=>p.alive)}
export function audioSlot(g){if(['night','summary'].includes(g.phase))return'night';if(['day','lynching'].includes(g.phase))return g.phase;if(g.phase==='resolution')return g.e.destination==='LYNCH'?'lynching':'night';if(g.phase==='finished')return g.winner==='Il villaggio'?'winVillage':g.winner==='I lupi mannari'?'winWolves':null;return null}
export function musicCharacter(g){if(g.phase!=='night')return null;const s=g.simplifiedNight?g.nightMusicRole:steps(g)[g.step];return musicRoles.includes(s)?s:null}
export function selectMusic(game,s){ensure(game.phase==='night'&&game.simplifiedNight&&steps(game).includes(s)&&musicRoles.includes(s),'Richiamo non disponibile.');const g=clone(game);g.nightMusicRole=s;g.nightMusicPlayId++;g.nightWolfAudioRound=0;return g}
