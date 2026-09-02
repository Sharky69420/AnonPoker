// Capability-model proof: the action panel may only ever offer legal moves.
const vm=require('vm'),fs=require('fs');
const code=fs.readFileSync('/tmp/game.js','utf8');
const sandbox={console,Math,Object,Array,Set,JSON,Infinity,parseInt,parseFloat,isNaN,Number};
function mkEl(id){const el={_id:id,innerHTML:'',textContent:'',value:'0',style:{setProperty(){},},dataset:{},
 classList:{_s:new Set(),add(...c){c.forEach(x=>this._s.add(x))},remove(...c){c.forEach(x=>this._s.delete(x))},toggle(c,f){f?this._s.add(c):this._s.delete(c)},contains(c){return this._s.has(c)}},
 appendChild(){return mkEl('x');},remove(){},animate:()=>({onfinish:null}),querySelector:()=>mkEl('q'),querySelectorAll:()=>[],
 addEventListener(){},getContext:()=>({fillRect(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){}}),
 clientWidth:400,clientHeight:300,
 set onclick(f){this._onclick=f;},get onclick(){return this._onclick;},
 set oninput(f){this._oninput=f;},get oninput(){return this._oninput;}};return el;}
const els={};
sandbox.document={getElementById:id=>els[id]||(els[id]=mkEl(id)),createElement:()=>mkEl('c'),querySelector:()=>mkEl('q'),querySelectorAll:()=>[],addEventListener(){},documentElement:{style:{setProperty(){}}}};
sandbox.window={matchMedia:()=>({matches:true}),document:sandbox.document};
sandbox.matchMedia=()=>({matches:true});
sandbox.localStorage={getItem:()=>null,setItem(){}};
sandbox.crypto={getRandomValues(a){for(let i=0;i<a.length;i++)a[i]=(Math.random()*0xffffffff)|0;return a;}};
sandbox.navigator={};sandbox.setInterval=()=>0;sandbox.setTimeout=(f)=>0;sandbox.clearTimeout=()=>{};sandbox.clearInterval=()=>{};
sandbox.requestAnimationFrame=()=>0;sandbox.cancelAnimationFrame=()=>{};sandbox.performance={now:()=>0};
vm.createContext(sandbox);
vm.runInContext(code+'\n;globalThis.T={G,render,computeSeatLayout,mkDeck,evalH};',sandbox,{filename:'game.js'});
const {G,render,computeSeatLayout,mkDeck,evalH}=sandbox.T;

let pass=0,fail=0;
const ok=(n,c)=>{c?pass++:(fail++,console.log('FAIL',n));};

function setup({stack,call,minRaise,pot,mode='NLHE',check=false}){
  const d=mkDeck();
  computeSeatLayout(2);
  G.mode=mode;G.table=null;G.left=false;G.over=false;G.stage='flop';
  G.comm=d.slice(10,13);
  G.seats=[
    {idx:0,isBot:false,label:'You',chips:stack,hole:d.slice(0,mode==='PLO'?4:2),hs:null,folded:false,sitting:false,allIn:false,ag:0},
    {idx:1,isBot:true,label:'B',av:12,chips:5000,hole:d.slice(4,6),hs:null,folded:false,sitting:false,allIn:false,ag:.8},
  ];
  G.seats.forEach(s=>s.hs=evalH(s.hole,G.comm));
  G.bets=check?{}:{1:call};
  G.pot=pot;G.lastRaiseSize=minRaise;G.ai=0;G.dealtVisible=true;
  G.actSeq=(G.actSeq||0)+100;G.turnKey='';G.raise=999999;G.dealer=1;G.winner=-1;
  els['actionBar']=mkEl('actionBar');
  delete els['brBtn'];delete els['betSlide'];delete els['caBtn'];
  render();
  return els['actionBar'].innerHTML;
}

// S1 — THE SCREENSHOT: stack 55, call 925. Only Fold or All-in-call may exist.
let html=setup({stack:55,call:925,minRaise:200,pot:1375});
ok('S1 call is all-in for stack, not 925', html.includes('All-in')&&!html.includes('>925<'));
ok('S1 no raise button', !html.includes('id="brBtn"'));
ok('S1 no slider', !html.includes('id="betSlide"'));
ok('S1 no presets', !html.includes('preset-btn'));
ok('S1 all-in shows the real 55', html.includes('</span>55<'));

// S2 — exact-cap raise: stack 300, call 100, min 200 → raise exists but only to 300 total, no range.
html=setup({stack:300,call:100,minRaise:200,pot:400});
ok('S2 raise button exists', html.includes('id="brBtn"'));
ok('S2 raise-to equals full stack total 300', html.includes('</span>300<'));
ok('S2 no slider (no range)', !html.includes('id="betSlide"'));

// S3 — short all-in raise: stack 300, call 100, min 250 → only legal raise is all-in.
html=setup({stack:300,call:100,minRaise:250,pot:400});
ok('S3 raise renders as All-in', /id="brBtn"[^>]*>All-in/.test(html));
ok('S3 all-in total is 300 not 350', html.includes('</span>300<')&&!html.includes('>350<'));

// S4 — healthy stack: everything present, call uncapped, raise-to = call+min default.
html=setup({stack:2000,call:100,minRaise:200,pot:400});
ok('S4 call shows 100', html.includes('</span>100<'));
ok('S4 slider present', html.includes('id="betSlide"'));
ok('S4 presets present', html.includes('preset-btn'));
ok('S4 default raise-to is 300 (call+min)', html.includes('</span>300<'));

// S5 — PLO pot-limit honors stack: stack 150, call 100, pot 1000 → max raise size = 50, all-in only.
html=setup({stack:150,call:100,minRaise:200,pot:1000,mode:'PLO'});
ok('S5 PLO short stack: raise is all-in to 150', /All-in/.test(html)&&html.includes('</span>150<'));
ok('S5 PLO no slider', !html.includes('id="betSlide"'));

// S6 — check spot with huge stack: Bet path, presets dedupe sane.
html=setup({stack:5000,call:0,minRaise:20,pot:60,check:true});
ok('S6 check button present', html.includes('id="ckBtn"'));
ok('S6 bet button present', html.includes('id="brBtn"'));


// ── S7: opening postflop action is a BET, not a raise (text + audio path) ──
{
  const d=mkDeck();
  computeSeatLayout(2);
  G.mode='NLHE';G.table=null;G.left=false;G.over=false;G.stage='flop';
  G.comm=d.slice(10,13);
  G.seats=[
    {idx:0,isBot:false,label:'You',chips:2000,hole:d.slice(0,2),hs:null,folded:false,sitting:false,allIn:false,ag:0,acted:false},
    {idx:1,isBot:true,label:'B',av:12,chips:2000,hole:d.slice(4,6),hs:null,folded:false,sitting:false,allIn:false,ag:.8,acted:false}];
  G.seats.forEach(x=>x.hs=evalH(x.hole,G.comm));
  G.bets={};G.pot=100;G.lastRaiseSize=20;G.ai=0;G.dealtVisible=true;G.agressor=-1;
  G.actSeq=(G.actSeq||0)+100;G.turnKey='';G.raise=999999;G.dealer=1;G.winner=-1;
  els['actionBar']=mkEl('actionBar');
  delete els['brBtn'];
  render();
  const html=els['actionBar'].innerHTML;
  ok('S7 hero opening action reads Bet', /id="brBtn"[^>]*>Bet/.test(html)||html.includes('>Bet<')||/Bet<br/.test(html), html.slice(0,200));
  ok('S7 no "Raise to" when opening', !html.includes('Raise to'));
}
console.log('─'.repeat(40));
console.log('CAPABILITY SUITE:',pass,'passed,',fail,'failed');
process.exit(fail?1:0);
