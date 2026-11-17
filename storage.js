import {emptyGame,ROLES,ensure,steps} from './engine.js';
const KEY='lupus-master-web-v1';
export const defaults=()=>({game:null,history:[],showRoles:false,audio:{backgrounds:false,effects:true,timestamps:{},files:{}},reusedNames:[],setup:null,wake:false});
export function validateState(input){
 ensure(input&&typeof input==='object'&&!Array.isArray(input),'Backup non valido.');
 const state={...defaults(),...input};ensure(typeof state.showRoles==='boolean'&&Array.isArray(state.history)&&state.history.length<=100,'Impostazioni non valide.');
 ensure(state.audio&&typeof state.audio.backgrounds==='boolean'&&typeof state.audio.effects==='boolean'&&state.audio.timestamps&&state.audio.files,'Impostazioni audio non valide.');
 function game(g){if(g===null)return;ensure(g&&['preparation','night','day','lynching','summary','finished','resolution'].includes(g.phase)&&typeof g.name==='string'&&Array.isArray(g.players)&&g.players.length>=8&&g.players.length<=30,'Partita non valida.');
  ensure(g.players.every(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&ROLES[p.role]&&ROLES[p.original]&&typeof p.alive==='boolean')&&new Set(g.players.map(p=>p.id)).size===g.players.length,'Giocatori non validi.');
  ensure(Number.isInteger(g.round)&&g.round>=0&&g.round<10000&&Number.isInteger(g.step)&&g.step>=0&&Array.isArray(g.suspects)&&g.suspects.length<=2&&g.choices&&Array.isArray(g.log)&&g.log.every(t=>typeof t==='string')&&g.timer&&Number.isFinite(g.timer.pausedRemaining)&&g.timer.pausedRemaining>=0&&g.timer.pausedRemaining<=120&&(g.timer.deadline==null||Number.isFinite(g.timer.deadline)),'Stato partita non valido.');
  ensure(g.e&&Array.isArray(g.e.handled)&&Array.isArray(g.e.deathOrder)&&g.e.pendingDeaths&&typeof g.e.pendingDeaths==='object','Espansione non valida.');
  ensure(g.phase!=='night'||g.step<steps(g).length,'Turno non valido.');
 }
 game(state.game);state.history.forEach(game);
 ensure(Array.isArray(state.reusedNames)&&state.reusedNames.length<=30&&state.reusedNames.every(n=>typeof n==='string'),'Nomi non validi.');
 return state;
}
export function loadState(){try{const raw=localStorage.getItem(KEY);return raw?validateState(JSON.parse(raw)):defaults()}catch(e){try{localStorage.setItem(KEY+'-unreadable-'+Date.now(),localStorage.getItem(KEY)||'')}catch{}window.dispatchEvent(new CustomEvent('storage-warning',{detail:'Il salvataggio non è leggibile. Usa un backup per ripristinarlo.'}));return defaults()}}
export function saveState(state){localStorage.setItem(KEY,JSON.stringify(state))}
let dbPromise;
function db(){return dbPromise??=new Promise((resolve,reject)=>{const r=indexedDB.open('lupus-master-audio-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('files');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function getFiles(){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('files'),store=tx.objectStore('files'),request=store.getAll(),keys=store.getAllKeys();tx.oncomplete=()=>resolve(Object.fromEntries(keys.result.map((k,i)=>[k,request.result[i]])));tx.onerror=()=>reject(tx.error)})}
export async function putFile(slot,value){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('files','readwrite');value===null?tx.objectStore('files').delete(slot):tx.objectStore('files').put(value,slot);tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||new Error('Spazio esaurito'));tx.onerror=()=>reject(tx.error)})}
export async function replaceFiles(files){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('files','readwrite'),s=tx.objectStore('files');s.clear();for(const[k,v]of Object.entries(files))s.put(v,k);tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||new Error('Ripristino audio non riuscito'));tx.onerror=()=>reject(tx.error)})}
export function blobToData(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(blob)})}
