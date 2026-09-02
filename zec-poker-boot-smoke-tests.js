// BOOT SMOKE TEST — the test that would have caught the frozen table.
// Simulates the real delivery environment (no crypto.subtle, no TextEncoder,
// file:// context) and asserts the game actually REACHES A DEALT STATE.
const vm=require('vm'),fs=require('fs');
const code=fs.readFileSync('/tmp/game.js','utf8');
const s={console,Math,Object,Array,Set,Map,JSON,Infinity,parseInt,parseFloat,isNaN,Number,String,Date,Uint8Array,Uint32Array,Promise};
const timers=[];
function el(id){return{_id:id,innerHTML:'',textContent:'',value:'0',checked:false,style:{cssText:'',setProperty(){}},dataset:{},children:[],
 classList:{_s:new Set(),add(...c){c.forEach(x=>this._s.add(x))},remove(...c){c.forEach(x=>this._s.delete(x))},toggle(c,f){f?this._s.add(c):this._s.delete(c)},contains(c){return this._s.has(c)}},
 appendChild(c){this.children.push(c);return c;},remove(){},animate:()=>({onfinish:null}),querySelector:()=>el('q'),querySelectorAll:()=>[],addEventListener(){},closest:()=>null,
 getContext:()=>({fillRect(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){}}),clientWidth:400,clientHeight:300,getBoundingClientRect:()=>({left:0,top:0,width:400,height:300}),
 set onclick(f){this._onclick=f;},get onclick(){return this._onclick;},set oninput(f){this._oninput=f;},get oninput(){return this._oninput;}};}
const E={};
s.document={getElementById:i=>E[i]||(E[i]=el(i)),createElement:()=>el('c'),querySelector:()=>el('q'),querySelectorAll:()=>[],addEventListener(){},documentElement:{style:{setProperty(){}}},body:el('body'),readyState:'complete'};
s.window={matchMedia:()=>({matches:false}),innerWidth:1400,innerHeight:900,addEventListener(){},document:s.document};
s.matchMedia=()=>({matches:false});
s.localStorage={getItem:()=>null,setItem(){}};
// THE DELIVERY ENVIRONMENT: getRandomValues exists, crypto.subtle DOES NOT.
s.crypto={getRandomValues(a){for(let i=0;i<a.length;i++)a[i]=(Math.random()*0xffffffff)>>>0;return a;}};
s.navigator={vibrate(){}};
s.setTimeout=(f,d)=>{timers.push({f,d:d||0});return timers.length;};
s.clearTimeout=()=>{};s.setInterval=()=>0;s.clearInterval=()=>{};
s.requestAnimationFrame=()=>0;s.cancelAnimationFrame=()=>{};s.performance={now:()=>0};
s.AudioContext=undefined;s.webkitAudioContext=undefined;
vm.createContext(s);
let pass=0,fail=0;
const ok=(n,c,d)=>{c?pass++:(fail++,console.log('FAIL',n,d===undefined?'':d));};
try{
  vm.runInContext(code+';globalThis.T={G,startHand,mkDeck,shuffleSeeded,PF,pfCommit,sha256Hex};',s,{filename:'game.js'});
  ok('script loads without throwing',true);
}catch(e){ok('script loads without throwing',false,e.message);console.log(e);process.exit(1);}
const T=s.T;
ok('SHA-256 works without crypto.subtle', /^[0-9a-f]{64}$/.test(T.sha256Hex('abc')));
ok('commitment is produced at boot', !!T.pfCommit());
// Drive a hand the way the app does
T.G.mode='NLHE';T.G.table={mul:1,cur:'ZEC'};T.G.left=false;T.G.sitOut=false;
T.G.seats=[{idx:0,isBot:false,label:'You',chips:1000,hole:[],hs:null,folded:false,sitting:false,allIn:false,ag:0},
           {idx:1,isBot:true,label:'B1',av:12,chips:1000,hole:[],hs:null,folded:false,sitting:false,allIn:false,ag:.8},
           {idx:2,isBot:true,label:'B2',av:13,chips:1000,hole:[],hs:null,folded:false,sitting:false,allIn:false,ag:.8}];
T.G.dealer=0;T.G.hc=0;
let threw=null;
try{T.startHand();}catch(e){threw=e;}
ok('startHand does not throw', !threw, threw&&threw.message);
// Run pending timers a few rounds (deal sequence is timer-driven)
for(let round=0;round<6;round++){
  const batch=timers.splice(0,timers.length);
  batch.sort((a,b)=>a.d-b.d).forEach(t=>{try{t.f();}catch(e){}});
}
ok('a deck was dealt (cards exist)', T.G.deck && T.G.deck.length===52, T.G.deck?T.G.deck.length:'none');
ok('hero received hole cards', T.G.seats[0].hole.length===2, T.G.seats[0].hole.length);
ok('bots received hole cards', T.G.seats[1].hole.length===2 && T.G.seats[2].hole.length===2);
ok('blinds were posted (pot > 0)', T.G.pot>0, T.G.pot);
ok('a hand number advanced', T.G.hc>=1, T.G.hc);
ok('provably-fair commitment exists for the hand', !!T.PF.commit);
ok('deck derives from the committed seed',
   T.G.deck.map(c=>c.r+c.s).join()===T.shuffleSeeded(T.mkDeck(),T.PF.serverSeed+T.PF.clientSeed+T.PF.handNo).map(c=>c.r+c.s).join());
console.log('─'.repeat(40));
console.log('BOOT SMOKE:',pass,'passed,',fail,'failed');
process.exit(fail?1:0);
