// Provably-fair proof: the commit/reveal scheme must be verifiable,
// deterministic, tamper-evident, and produce an unbiased shuffle.
const vm=require('vm'),fs=require('fs');
const code=fs.readFileSync('/tmp/game.js','utf8');
const sandbox={console,Math,Object,Array,Set,Map,JSON,Infinity,parseInt,parseFloat,isNaN,Number,String,Date,Promise,Uint8Array,Uint32Array,TextEncoder:require('util').TextEncoder};
function mkEl(){return{innerHTML:'',textContent:'',value:'0',style:{setProperty(){}},dataset:{},classList:{add(){},remove(){},toggle(){},contains:()=>false},appendChild(){return mkEl()},remove(){},animate:()=>({onfinish:null}),querySelector:()=>mkEl(),querySelectorAll:()=>[],addEventListener(){},getContext:()=>({fillRect(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){}}),clientWidth:400,clientHeight:300,set onclick(f){},set oninput(f){}};}
const els={};
sandbox.document={getElementById:id=>els[id]||(els[id]=mkEl()),createElement:()=>mkEl(),querySelector:()=>mkEl(),querySelectorAll:()=>[],addEventListener(){},documentElement:{style:{setProperty(){}}}};
sandbox.window={matchMedia:()=>({matches:true}),document:sandbox.document};
sandbox.matchMedia=()=>({matches:true});
sandbox.localStorage={getItem:()=>null,setItem(){}};
sandbox.crypto={getRandomValues(a){for(let i=0;i<a.length;i++)a[i]=(Math.random()*0xffffffff)>>>0;return a;}};
sandbox.navigator={};sandbox.setInterval=()=>0;sandbox.setTimeout=()=>0;sandbox.clearTimeout=()=>{};sandbox.clearInterval=()=>{};
sandbox.requestAnimationFrame=()=>0;sandbox.cancelAnimationFrame=()=>{};sandbox.performance={now:()=>0};
vm.createContext(sandbox);
vm.runInContext(code+'\n;globalThis.T={PF,pfCommit,pfReveal,sha256Hex,shuffleSeeded,seededRandom,mkDeck,randHex,pfDeckHex};',sandbox,{filename:'game.js'});
const T=sandbox.T;

let pass=0,fail=0;
const ok=(n,c,d)=>{c?pass++:(fail++,console.log('FAIL',n,d===undefined?'':d));};

(async()=>{
  // ── 1. Commitment integrity: hash of revealed seed == published commitment
  for(let i=0;i<5;i++){
    const commit=await T.pfCommit();
    const seed=T.PF.serverSeed;
    const rehash=await T.sha256Hex(seed);
    ok('commit matches SHA-256(seed) #'+i, rehash===commit);
    ok('commit is 64 hex chars #'+i, /^[0-9a-f]{64}$/.test(commit));
    ok('seed is 64 hex chars #'+i, /^[0-9a-f]{64}$/.test(seed));
  }

  // ── 2. Commitment precedes the deal: the seed is fixed before cards exist
  await T.pfCommit();
  const seedAtCommit=T.PF.serverSeed;
  const deckA=T.shuffleSeeded(T.mkDeck(),T.pfDeckHex());
  ok('seed unchanged by dealing', T.PF.serverSeed===seedAtCommit);

  // ── 3. Determinism: same seed always reproduces the same deck (verifiability)
  const deckB=T.shuffleSeeded(T.mkDeck(),T.pfDeckHex());
  ok('same seed → identical deck',
     deckA.map(c=>c.r+c.s).join()===deckB.map(c=>c.r+c.s).join());

  // ── 4. Tamper detection: any change to the seed changes the deck
  const tampered=T.shuffleSeeded(T.mkDeck(),T.pfDeckHex().replace(/^./,ch=>ch==='a'?'b':'a'));
  ok('altered seed → different deck',
     deckA.map(c=>c.r+c.s).join()!==tampered.map(c=>c.r+c.s).join());

  // ── 5. Different hands produce different decks
  const d1=T.shuffleSeeded(T.mkDeck(),'aa'.repeat(32)+'0001'+1);
  const d2=T.shuffleSeeded(T.mkDeck(),'aa'.repeat(32)+'0001'+2);
  ok('hand number changes the deck', d1.map(c=>c.r+c.s).join()!==d2.map(c=>c.r+c.s).join());

  // ── 6. The shuffle is a real permutation: 52 unique cards, nothing lost
  for(let i=0;i<20;i++){
    const d=T.shuffleSeeded(T.mkDeck(),T.randHex(32)+T.randHex(8)+i);
    ok('deck has 52 cards #'+i, d.length===52);
    ok('deck has no duplicates #'+i, new Set(d.map(c=>c.r+c.s)).size===52);
  }

  // ── 7. Distribution sanity: over many shuffles, every card should reach
  //      position 0 roughly uniformly (no positional bias in the PRNG).
  const firstCounts={};
  const N=5200;
  for(let i=0;i<N;i++){
    const d=T.shuffleSeeded(T.mkDeck(),T.randHex(32)+'x'+i);
    const k=d[0].r+d[0].s;
    firstCounts[k]=(firstCounts[k]||0)+1;
  }
  const seen=Object.keys(firstCounts).length;
  ok('all 52 cards appear on top at least once', seen===52, seen);
  const exp=N/52, counts=Object.values(firstCounts);
  const chi=counts.reduce((a,c)=>a+Math.pow(c-exp,2)/exp,0);
  // chi-square, 51 df: ~76 at p=0.01, ~90 is very loose. Flag gross bias only.
  ok('top-card distribution is not grossly biased (chi²<100)', chi<100, 'chi²='+chi.toFixed(1));
  const mn=Math.min(...counts),mx=Math.max(...counts);
  ok('no card dominates the top slot', mx<exp*2.2 && mn>exp*0.25, `min=${mn} max=${mx} exp=${exp.toFixed(1)}`);

  // ── 8. Seeded PRNG output stays in [0,1)
  const rnd=T.seededRandom('deadbeef'.repeat(8));
  let bad=0;
  for(let i=0;i<10000;i++){const v=rnd();if(!(v>=0&&v<1))bad++;}
  ok('PRNG output always in [0,1)', bad===0, bad);

  // ── 9. Reveal captures the right triple
  await T.pfCommit();
  const c9=T.PF.commit,s9=T.PF.serverSeed,h9=T.PF.handNo;
  T.pfReveal();
  ok('reveal exposes the committed seed', T.PF.lastReveal.seed===s9);
  ok('reveal exposes the matching commitment', T.PF.lastReveal.commit===c9);
  ok('reveal records the hand number', T.PF.lastReveal.hand===h9);
  const finalCheck=await T.sha256Hex(T.PF.lastReveal.seed);
  ok('end-to-end: player verification succeeds', finalCheck===T.PF.lastReveal.commit);

  console.log('─'.repeat(40));
  console.log('PROVABLY-FAIR SUITE:',pass,'passed,',fail,'failed');
  process.exit(fail?1:0);
})();
