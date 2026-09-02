// Hand evaluator proof suite — every assertion is a real poker ruling.
const vm=require('vm'),fs=require('fs');
const code=fs.readFileSync('/tmp/game.js','utf8');
// Extract just the pure functions we need (RV, SUITS/RANKS, combos, sc5, evalH)
const sandbox={console,Math,Object,Array,Set,JSON};
vm.createContext(sandbox);
// Run whole script minus DOM by stubbing minimal globals
function mkEl(){return{innerHTML:'',textContent:'',value:'0',style:{setProperty(){}},dataset:{},classList:{add(){},remove(){},toggle(){},contains:()=>false},appendChild(){return mkEl();},remove(){},animate:()=>({onfinish:null}),querySelector:()=>mkEl(),querySelectorAll:()=>[],addEventListener(){},getContext:()=>({fillRect(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){}}),clientWidth:400,clientHeight:300,set onclick(f){},set oninput(f){},set onchange(f){}};}
const els={};
sandbox.document={getElementById:id=>els[id]||(els[id]=mkEl()),createElement:()=>mkEl(),querySelector:()=>mkEl(),querySelectorAll:()=>[],addEventListener(){},documentElement:{style:{setProperty(){}}}};
sandbox.window={matchMedia:()=>({matches:true}),document:sandbox.document};
sandbox.matchMedia=()=>({matches:true});
sandbox.localStorage={getItem:()=>null,setItem(){}};
sandbox.crypto={getRandomValues(a){for(let i=0;i<a.length;i++)a[i]=(Math.random()*0xffffffff)|0;return a;}};
sandbox.navigator={};sandbox.setInterval=()=>0;sandbox.setTimeout=()=>0;sandbox.clearTimeout=()=>{};sandbox.clearInterval=()=>{};
sandbox.requestAnimationFrame=()=>0;sandbox.cancelAnimationFrame=()=>{};sandbox.performance={now:()=>0};
vm.runInContext(code+'\n;globalThis.T={sc5,evalH,combos,RV};',sandbox,{filename:'game.js'});
const {sc5,evalH}=sandbox.T;

const C=(str)=>{ // 'As' 'Td' '9c' '5h'
  const RM={A:'A',K:'K',Q:'Q',J:'J',T:'10'};
  const r=RM[str[0]]||str[0];
  const s={s:'♠',h:'♥',d:'♦',c:'♣'}[str[1]];
  return {r,s};
};
const H=(...cs)=>cs.map(C);
let pass=0,fail=0;
function eq(name,got,want){ if(got===want){pass++;} else {fail++;console.log('FAIL',name,'got',got,'want',want);} }
function beats(name,a,b){ // hand a strictly beats hand b
  const ok=a.rank>b.rank||(a.rank===b.rank&&a.tb>b.tb);
  if(ok)pass++; else {fail++;console.log('FAIL',name,JSON.stringify([a.rank,a.tb,b.rank,b.tb]));}
}
function ties(name,a,b){ const ok=a.rank===b.rank&&a.tb===b.tb; if(ok)pass++; else{fail++;console.log('FAIL',name);} }

// ── Category identification (5-card) ──
eq('royal', sc5(H('As','Ks','Qs','Js','Ts')).name,'Royal Flush');
eq('straight flush', sc5(H('9h','8h','7h','6h','5h')).name,'Straight Flush');
eq('wheel SF is SF not royal', sc5(H('Ah','2h','3h','4h','5h')).name,'Straight Flush');
eq('quads', sc5(H('9c','9d','9h','9s','2c')).name,'Four of a Kind');
eq('boat', sc5(H('3c','3d','3h','Kc','Kd')).name,'Full House');
eq('flush', sc5(H('Ac','Jc','9c','6c','2c')).name,'Flush');
eq('straight', sc5(H('9c','8d','7h','6s','5c')).name,'Straight');
eq('wheel straight', sc5(H('Ac','2d','3h','4s','5c')).name,'Straight');
eq('trips', sc5(H('7c','7d','7h','Ks','2c')).name,'Three of a Kind');
eq('two pair', sc5(H('Ac','Ad','2h','2s','Kc')).name,'Two Pair');
eq('pair', sc5(H('Ac','Ad','7h','5s','2c')).name,'One Pair');
eq('high card', sc5(H('Ac','Jd','9h','6s','2c')).name,'High Card');

// ── THE KICKER BUGS: grouping must outrank raw card order ──
beats('pair 3s beats pair 2s w/ ace kicker', sc5(H('3c','3d','7h','6s','5c')), sc5(H('2c','2d','Ah','Ks','Qc')));
beats('pair aces AK beats pair aces AQ (kicker)', sc5(H('Ac','Ad','Kh','7s','2c')), sc5(H('Ah','As','Qh','7d','2d')));
beats('trips 3s beat trips 2s w/ AK', sc5(H('3c','3d','3h','7s','6c')), sc5(H('2c','2d','2h','As','Kc')));
beats('boat 333KK beats boat 222AA (trips first)', sc5(H('3c','3d','3h','Kc','Kd')), sc5(H('2c','2d','2h','Ac','Ad')));
beats('quads 3333 beat quads 2222+A', sc5(H('3c','3d','3h','3s','2c')), sc5(H('2c','2d','2h','2s','Ac')));
beats('two pair: high pair decides', sc5(H('Ac','Ad','2h','2s','3c')), sc5(H('Kc','Kd','Qh','Qs','Ac')));
beats('two pair: low pair decides', sc5(H('Ac','Ad','3h','3s','2c')), sc5(H('Ah','As','2h','2s','Kc')));
beats('two pair: kicker decides', sc5(H('Ac','Ad','3h','3s','Kc')), sc5(H('Ah','As','3c','3d','Qc')));
beats('flush compares all five', sc5(H('Ac','Jc','9c','6c','3c')), sc5(H('Ad','Jd','9d','6d','2d')));

// ── Wheel is the LOWEST straight / straight flush ──
beats('6-high straight beats wheel', sc5(H('6c','5d','4h','3s','2c')), sc5(H('Ac','2d','3h','4s','5c')));
beats('6-high SF beats wheel SF', sc5(H('6h','5h','4h','3h','2h')), sc5(H('Ah','2h','3h','4h','5h')));
beats('any SF loses to royal', sc5(H('As','Ks','Qs','Js','Ts')), sc5(H('Kh','Qh','Jh','Th','9h')));
ties('identical straights tie', sc5(H('9c','8d','7h','6s','5c')), sc5(H('9h','8s','7c','6d','5d')));

// ── 7-card best-five (Hold'em) ──
eq('7card finds boat', evalH(H('Ac','Ad'),H('Ah','Kc','Kd','2s','7h')).name,'Full House');
eq('7card finds straight across', evalH(H('9c','8d'),H('7h','6s','5c','Ac','Ad')).name,'Straight');
eq('board flush, no hole help', evalH(H('2d','3d'),H('Ac','Kc','Qc','Jc','9c')).name,'Flush');
beats('hole flush card beats board play', evalH(H('Tc','2d'),H('Ac','Kc','Qc','Jc','9c')), evalH(H('2h','3h'),H('Ac','Kc','Qc','Jc','9c')));
ties('both play the board exactly', evalH(H('2d','3h'),H('Ac','Kc','Qc','Jc','9c')), evalH(H('2s','3s'),H('Ac','Kc','Qc','Jc','9c')));

// ── OMAHA: exactly two hole + three board ──
eq('4 suited hole + 1 board is NOT a flush', evalH(H('Ac','Kc','Qc','Jc'),H('2c','7d','9h','Ts','3d')).name==='Flush'?'FLUSH-BUG':'ok','ok');
eq('2 hole clubs + 3 board clubs IS a flush', evalH(H('Ac','Kc','2d','3h'),H('9c','7c','4c','Ts','Jd')).name,'Flush');
eq('AAAA on KQJT9 is just a pair', evalH(H('Ac','Ad','Ah','As'),H('Kc','Qd','Jh','Ts','9c')).name,'One Pair');
eq('board quads + AA hole = full house not quads', evalH(H('Ac','Ad','2h','3s'),H('9c','9d','9h','9s','Kc')).name,'Full House');
eq('omaha wheel via two hole', evalH(H('Ac','2d','Kh','Ks'),H('3h','4s','5c','9d','Td')).name,'Straight');
eq('omaha preflop placeholder', evalH(H('Ac','Ad','Kh','Ks'),[]).name,'—');
beats('omaha: nut flush beats second flush', evalH(H('Ac','2c','9d','9h'),H('Kc','7c','4c','Ts','Jd')), evalH(H('Qc','2h','9s','8h'),H('Kc','7c','4c','Ts','Jd')));

// ── Best-five card reporting (drives the showdown highlight) ──
{
  const b=evalH(H('Ac','Ad'),H('Ah','Kc','Kd','2s','7h'));
  eq('best5 has five cards', (b.cards||[]).length, 5);
  const keys=b.cards.map(c=>c.r+c.s);
  eq('boat best5 excludes junk', keys.includes('2♠')||keys.includes('7♥')?'junk':'clean','clean');
}
{
  const hole=H('Ac','Kc','2d','3h');
  const b=evalH(hole,H('9c','7c','4c','Ts','Jd'));
  const hk=new Set(hole.map(c=>c.r+c.s));
  const used=b.cards.filter(c=>hk.has(c.r+c.s)).length;
  eq('omaha best5 uses exactly 2 hole cards', used, 2);
}

// ── Cross-category sanity ladder ──
const ladder=[
  sc5(H('Ac','Jd','9h','6s','2c')), sc5(H('Ac','Ad','7h','5s','2c')),
  sc5(H('Ac','Ad','2h','2s','Kc')), sc5(H('7c','7d','7h','Ks','2c')),
  sc5(H('Ac','2d','3h','4s','5c')), sc5(H('Ac','Jc','9c','6c','2c')),
  sc5(H('3c','3d','3h','Kc','Kd')), sc5(H('9c','9d','9h','9s','2c')),
  sc5(H('Ah','2h','3h','4h','5h')), sc5(H('As','Ks','Qs','Js','Ts')),
];
for(let i=1;i<ladder.length;i++)beats('ladder '+i,ladder[i],ladder[i-1]);

console.log('─'.repeat(40));
console.log('EVAL SUITE:',pass,'passed,',fail,'failed');
process.exit(fail?1:0);
