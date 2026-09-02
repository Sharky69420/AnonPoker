// DECK INTEGRITY: across many real dealt hands (multi-handed and heads-up,
// both games), every card that appears at showdown — every hole card, every
// board card — must be unique. No duplicates, ever. This is the literal
// mathematical correctness guarantee behind a poker deck.
const vm=require('vm'),fs=require('fs'),path=require('path');
const APP_PATH=path.join(__dirname,'..','app','index.html');
const html=fs.readFileSync(APP_PATH,'utf8');
const scriptOpen=html.lastIndexOf('<script>');
const scriptClose=html.lastIndexOf('</script>');
const code=html.slice(scriptOpen+8,scriptClose);

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
sandbox.matchMedia=()=>({matches:false});sandbox.localStorage={getItem:()=>null,setItem(){}};
sandbox.crypto={getRandomValues(a){for(let i=0;i<a.length;i++)a[i]=(Math.random()*0xffffffff)>>>0;return a;}};
sandbox.navigator={vibrate(){}};
sandbox.setTimeout=(f,d)=>{timers.push({f,d:d||0});return timers.length;};
sandbox.clearTimeout=()=>{};sandbox.setInterval=()=>0;sandbox.clearInterval=()=>{};
sandbox.requestAnimationFrame=()=>0;sandbox.cancelAnimationFrame=()=>{};sandbox.performance={now:()=>0};
sandbox.AudioContext=undefined;sandbox.webkitAudioContext=undefined;
vm.createContext(sandbox);
vm.runInContext(code+';globalThis.T={G,startHand,mkDeck,computeSeatLayout};',sandbox,{filename:'game.js'});
const T=sandbox.T;

let pass=0,fail=0;
const ok=(n,c,d)=>{c?pass++:(fail++,console.log('FAIL',n,d===undefined?'':d));};
function drain(rounds){
  for(let r=0;r<rounds;r++){
    const batch=timers.splice(0,timers.length);
    if(!batch.length)return;
    batch.sort((a,b)=>a.d-b.d).forEach(t=>{try{t.f();}catch(e){}});
  }
}
function keyOf(c){return c.r+c.s;}

function runSession(mode,botCount){
  timers.length=0;
  const G=T.G;
  G.mode=mode;G.table={mul:1,cur:'ZEC'};G.left=false;G.sitOut=false;G.gen=(G.gen||0)+1;
  G.wallet='utest';G.bbMode=false;
  const seats=[{idx:0,isBot:false,label:'You',chips:1000,hole:[],hs:null,folded:false,sitting:false,allIn:false,ag:0}];
  for(let i=1;i<=botCount;i++)seats.push({idx:i,isBot:true,label:'B'+i,av:12+i,chips:1000,hole:[],hs:null,folded:false,sitting:false,allIn:false,ag:.75});
  G.seats=seats;G.dealer=0;G.hc=0;
  T.computeSeatLayout(seats.length);
  T.startHand();
  drain(400);
  return G;
}

let handsChecked=0;
for(const mode of ['NLHE','PLO']){
  for(const bots of [1,3,8]){
    const G=runSession(mode,bots);
    // Every hand that dealt hole cards: hole+board must have zero duplicates.
    const dealt=(G.seats||[]).filter(s=>s&&s.hole&&s.hole.length);
    if(dealt.length===0){
      ok(`${mode} ${bots+1}-max: at least one hand actually dealt`, false, 'no hole cards found after drain');
      continue;
    }
    handsChecked++;
    const allCards=[...dealt.flatMap(s=>s.hole),...(G.comm||[])];
    const keys=allCards.map(keyOf);
    const uniq=new Set(keys);
    ok(`${mode} ${bots+1}-max: no duplicate cards across hole+board`, uniq.size===keys.length,
       `${keys.length} cards dealt, ${uniq.size} unique`);
    ok(`${mode} ${bots+1}-max: every card is a real deck member`,
       allCards.every(c=>T.mkDeck().some(d=>d.r===c.r&&d.s===c.s)));
    const expectedHole=mode==='PLO'?4:2;
    ok(`${mode} ${bots+1}-max: every dealt player has exactly ${expectedHole} hole cards`,
       dealt.every(s=>s.hole.length===expectedHole));
  }
}
ok('at least 6 real hands were checked across all configurations', handsChecked>=6, handsChecked);

console.log('─'.repeat(40));
console.log('DECK INTEGRITY SUITE:',pass,'passed,',fail,'failed');
process.exit(fail?1:0);
