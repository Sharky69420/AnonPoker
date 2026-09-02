// Table-geometry proof: at every table size, in both games, every chip zone
// (1) clears its own seat's card+nameplate footprint, (2) stays on the felt,
// (3) never enters the pot row from above, (4) never collides with ANOTHER seat's box.
const vm=require('vm'),fs=require('fs');
const code=fs.readFileSync('/tmp/game.js','utf8');
const sandbox={console,Math,Object,Array,Set,JSON,Infinity,parseInt,parseFloat,isNaN,Number};
function mkEl(){return{innerHTML:'',textContent:'',value:'0',style:{setProperty(){}},dataset:{},classList:{add(){},remove(){},toggle(){},contains:()=>false},appendChild(){return mkEl()},remove(){},animate:()=>({onfinish:null}),querySelector:()=>mkEl(),querySelectorAll:()=>[],addEventListener(){},getContext:()=>({fillRect(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){}}),clientWidth:400,clientHeight:300,set onclick(f){},set oninput(f){}};}
const els={};
sandbox.document={getElementById:id=>els[id]||(els[id]=mkEl()),createElement:()=>mkEl(),querySelector:()=>mkEl(),querySelectorAll:()=>[],addEventListener(){},documentElement:{style:{setProperty(){}}}};
sandbox.window={matchMedia:()=>({matches:true}),document:sandbox.document};
sandbox.matchMedia=()=>({matches:true});
sandbox.localStorage={getItem:()=>null,setItem(){}};
sandbox.crypto={getRandomValues(a){for(let i=0;i<a.length;i++)a[i]=(Math.random()*0xffffffff)|0;return a;}};
sandbox.navigator={};sandbox.setInterval=()=>0;sandbox.setTimeout=()=>0;sandbox.clearTimeout=()=>{};sandbox.clearInterval=()=>{};
sandbox.requestAnimationFrame=()=>0;sandbox.cancelAnimationFrame=()=>{};sandbox.performance={now:()=>0};
vm.createContext(sandbox);
vm.runInContext(code+'\n;globalThis.T={G,computeSeatLayout,S:()=>SPOS,C:()=>CHIP_POS};',sandbox,{filename:'game.js'});
const {G,computeSeatLayout,S,C}=sandbox.T;

let pass=0,fail=0;
const ok=(n,c,d)=>{c?pass++:(fail++,console.log('FAIL',n,d||''));};

for(const mode of ['NLHE','PLO']){
  const w2=mode==='PLO'?13:10, h2=11;
  G.mode=mode;
  for(let n=2;n<=9;n++){
    computeSeatLayout(n);
    const seats=S(),chips=C();
    ok(`${mode} n=${n} counts`, seats.length===n&&chips.length===n);
    for(let i=0;i<n;i++){
      const s=seats[i],[cx,cy]=chips[i];
      const dx=Math.abs(cx-s.x),dy=Math.abs(cy-s.y);
      ok(`${mode} n=${n} seat${i} chip clears OWN box`, dx>=w2||dy>=h2, `d=(${dx.toFixed(1)},${dy.toFixed(1)})`);
      ok(`${mode} n=${n} seat${i} chip on felt`, cx>=4&&cx<=96&&cy>=8&&cy<=90, `(${cx},${cy})`);
      if(s.y<40) ok(`${mode} n=${n} seat${i} top chip below-clamped`, cy<=37, cy);
      // pot pill footprint on desktop ≈ x 40-60, y 29-45
      ok(`${mode} n=${n} seat${i} chip clear of pot label`, !(cx>40&&cx<60&&cy>28.5&&cy<45), `(${cx},${cy})`);
      // UI corner boxes: chat (x<24,y>77) and bet panel (x>62,y>56)
      ok(`${mode} n=${n} seat${i} SEAT clear of chat box`, i===0||!(s.x<24&&s.y>77), `seat(${s.x},${s.y})`);
      ok(`${mode} n=${n} seat${i} SEAT clear of bet panel`, i===0||!(s.x>62&&s.y>56), `seat(${s.x},${s.y})`);
      ok(`${mode} n=${n} seat${i} chip clear of bet panel`, !(cx>62&&cy>56), `(${cx},${cy})`);
      for(let j=0;j<n;j++){ if(j===i)continue;
        const o=seats[j];
        const odx=Math.abs(cx-o.x),ody=Math.abs(cy-o.y);
        ok(`${mode} n=${n} seat${i} chip clear of seat${j} box`, odx>=w2||ody>=h2, `d=(${odx.toFixed(1)},${ody.toFixed(1)})`);
      }
    }
  }
}
// ── Chip-to-seat distance is bounded: no chip drifts far from its own
//    seat regardless of table position (the Nakamoto calibration fix) ──
for(const mode of ['NLHE','PLO']){
  G.mode=mode;
  for(let n=2;n<=9;n++){
    computeSeatLayout(n);
    const seats=S(),chips=C();
    for(let i=0;i<n;i++){
      const s=seats[i],[cx,cy]=chips[i];
      const dist=Math.hypot(cx-s.x,cy-s.y);
      ok(`${mode} n=${n} seat${i} chip stays close to its own seat`, dist<=22, dist.toFixed(1));
    }
  }
}
console.log('─'.repeat(40));
console.log('GEOMETRY SUITE:',pass,'passed,',fail,'failed');
process.exit(fail?1:0);
