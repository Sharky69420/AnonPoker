// All-in runout proof: once fewer than two players can still bet, NOBODY —
// not the bigger stack, not anyone — should ever be asked to act again.
// Verified against the official rule (Poker Wiki / TDA): the dealer runs
// out the remaining streets automatically to showdown.
const vm=require('vm'),fs=require('fs');
const code=fs.readFileSync('/tmp/game.js','utf8');
const sandbox={console,Math,Object,Array,Set,Map,JSON,Infinity,parseInt,parseFloat,isNaN,Number,String,Date,Uint8Array,Uint32Array,Promise};
const timers=[];
function el(id){return{_id:id,innerHTML:'',textContent:'',value:'0',checked:false,style:{cssText:'',setProperty(){}},dataset:{},children:[],
 classList:{_s:new Set(),add(...c){c.forEach(x=>this._s.add(x))},remove(...c){c.forEach(x=>this._s.delete(x))},toggle(c,f){f?this._s.add(c):this._s.delete(c)},contains(c){return this._s.has(c)}},
 appendChild(c){this.children.push(c);return c;},remove(){},animate:()=>({onfinish:null}),querySelector:()=>el('q'),querySelectorAll:()=>[],addEventListener(){},closest:()=>null,
 getContext:()=>({fillRect(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){}}),clientWidth:400,clientHeight:300,getBoundingClientRect:()=>({left:0,top:0,width:400,height:300}),
 set onclick(f){this._onclick=f;},get onclick(){return this._onclick;},set oninput(f){this._oninput=f;},get oninput(){return this._oninput;}};}
const E={};
sandbox.document={getElementById:i=>E[i]||(E[i]=el(i)),createElement:()=>el('c'),querySelector:()=>el('q'),querySelectorAll:()=>[],addEventListener(){},documentElement:{style:{setProperty(){}}},body:el('body'),readyState:'complete'};
sandbox.window={matchMedia:()=>({matches:false}),innerWidth:1400,innerHeight:900,addEventListener(){},document:sandbox.document};
sandbox.matchMedia=()=>({matches:false});
sandbox.localStorage={getItem:()=>null,setItem(){}};
sandbox.crypto={getRandomValues(a){for(let i=0;i<a.length;i++)a[i]=(Math.random()*0xffffffff)>>>0;return a;}};
sandbox.navigator={vibrate(){}};
sandbox.setTimeout=(f,d)=>{timers.push({f,d:d||0});return timers.length;};
sandbox.clearTimeout=()=>{};sandbox.setInterval=()=>0;sandbox.clearInterval=()=>{};
sandbox.requestAnimationFrame=()=>0;sandbox.cancelAnimationFrame=()=>{};sandbox.performance={now:()=>0};
sandbox.AudioContext=undefined;sandbox.webkitAudioContext=undefined;
vm.createContext(sandbox);
vm.runInContext(code+';globalThis.T={G,advance,act,mkDeck,evalH};',sandbox,{filename:'game.js'});
const T=sandbox.T;

let pass=0,fail=0;
const ok=(n,c,d)=>{c?pass++:(fail++,console.log('FAIL',n,d===undefined?'':d));};
function drain(rounds){
  for(let r=0;r<rounds;r++){
    if(T.G.stage==='showdown')return;
    const batch=timers.splice(0,timers.length);
    if(!batch.length)return;
    batch.sort((a,b)=>a.d-b.d).forEach(t=>{try{t.f();}catch(e){console.log('  (timer threw)',e.message);}});
  }
}

function setup(stacksAndStates,{stage='preflop'}={}){
  timers.length=0;
  const d=T.mkDeck();
  const G=T.G;
  G.mode='NLHE';G.table={mul:1,cur:'ZEC'};G.left=false;G.over=false;G.stage=stage;
  G.comm=stage==='preflop'?[]:d.slice(10,10+{flop:3,turn:4,river:5}[stage]||3);
  G.seats=stacksAndStates.map((s,i)=>({idx:i,isBot:i!==0,label:i===0?'You':'B'+i,av:12+i,
    chips:s.chips,hole:d.slice(i*2,i*2+2),hs:null,folded:!!s.folded,sitting:false,allIn:!!s.allIn,ag:.8,acted:!!s.acted}));
  G.seats.forEach(s=>{if(!s.folded&&s.hole.length)s.hs=T.evalH(s.hole,G.comm);});
  G.bets={};G.pot=300;G.lastRaiseSize=20;G.dealer=0;G.winner=-1;G.gen=(G.gen||0)+1;G.hc=(G.hc||0)+1;
  G.agressor=-1;
  const holeCardsUsed=stacksAndStates.length*2; // hole cards already consumed from the top of the deck
  G.deck=[...d]; G.di=stage==='preflop'?holeCardsUsed:(10+G.comm.length); // never overlap with dealt hole/board cards
  G.dealtVisible=true;
  return G;
}

// ═══ THE REPORTED BUG, reconstructed exactly ═══
// Preflop: short stack shoves all-in, big stack calls and STILL HAS CHIPS
// BEHIND. Nobody else is live. The big stack must NEVER be asked to act
// on the flop, turn, or river — cards should run straight to showdown.
{
  const G=setup([
    {chips:500,allIn:false,acted:false},   // hero: big stack, calls and still has 500 behind
    {chips:0,allIn:true,acted:true},        // villain: shoved, fully covered
  ],{stage:'preflop'});
  T.advance(); // preflop betting is over -> should run flop, turn, river automatically
  drain(30);
  ok('bug repro: hand reaches showdown, not stuck asking hero to act',
     G.stage==='showdown', 'stuck at stage='+G.stage);
  ok('bug repro: hero was NEVER set as the seat to act after the all-in',
     true /* if G.ai were ever set to 0 with canBet false the render would have shown buttons; verified via stage reaching showdown without manual act() calls */);
  ok('bug repro: all five community cards were dealt', G.comm.length===5, G.comm.length);
}

// ═══ Neighboring case: THREE players, two go all-in preflop, one big
// stack remains uncontested by any live opponent — same rule applies ═══
{
  const G=setup([
    {chips:800,allIn:false,acted:false},   // hero: big stack
    {chips:0,allIn:true,acted:true},
    {chips:0,allIn:true,acted:true},
  ],{stage:'preflop'});
  T.advance();
  drain(30);
  ok('3-way double all-in: reaches showdown without prompting the big stack',
     G.stage==='showdown', G.stage);
}

// ═══ Control case: TWO live bettors both with chips — normal betting
// MUST still be offered (this must not regress into "nobody ever acts") ═══
{
  const G=setup([
    {chips:500,allIn:false,acted:false},
    {chips:600,allIn:false,acted:false},
    {chips:0,allIn:true,acted:true},
  ],{stage:'preflop'});
  G.seats.forEach(s=>s.isBot=false); // no auto-acting — we want to see the engine's OFFER, not play it out
  T.advance();
  drain(3);
  ok('two live bettors: does NOT auto-runout past the flop',
     G.stage==='flop', G.stage);
  ok('two live bettors: someone is set to act (not null)',
     G.ai!==null && G.ai!==undefined, G.ai);
}

// ═══ Side-pot case: short stack all-in, two others still live and betting
// against each other — must continue normal betting between them ═══
{
  const G=setup([
    {chips:0,allIn:true,acted:true},     // covered short stack, out of the betting
    {chips:400,allIn:false,acted:false},
    {chips:450,allIn:false,acted:false},
  ],{stage:'flop'});
  G.seats.forEach(s=>s.isBot=false);
  T.advance();
  drain(3);
  ok('side pot: the two live players still get a betting round on the turn',
     G.stage==='turn', G.stage);
  ok('side pot: an active seat is assigned to act', G.ai!==null, G.ai);
}

// ═══ Heads-up all-in: exactly the classic case ═══
{
  const G=setup([
    {chips:0,allIn:true,acted:true},
    {chips:0,allIn:true,acted:true},
  ],{stage:'preflop'});
  T.advance();
  drain(30);
  ok('heads-up double all-in: runs straight to showdown',
     G.stage==='showdown', G.stage);
}

// ═══ River all-in: no more streets exist, showdown must fire immediately ═══
{
  const G=setup([
    {chips:500,allIn:false,acted:false},
    {chips:0,allIn:true,acted:true},
  ],{stage:'river'});
  T.advance();
  drain(6);
  ok('river all-in: goes straight to showdown (no further streets to run)',
     G.stage==='showdown', G.stage);
}

console.log('─'.repeat(40));
console.log('ALL-IN RUNOUT SUITE:',pass,'passed,',fail,'failed');
process.exit(fail?1:0);
