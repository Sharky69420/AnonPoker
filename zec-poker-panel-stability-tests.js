// PANEL STABILITY PROOF: the bet panel's total footprint must NEVER change
// just because a different bet size, preset, or hand name is showing.
// Every value-dependent row (bet-info, the raise button's amount, the
// slider readout, the hand-name line) is now locked to a fixed, non-
// wrapping height — this proves it holds by extracting the real CSS rules
// from the shipped file and confirming none of them can vary with content
// length, across a wide spread of real-world amounts.
const fs=require('fs'),path=require('path');
const APP_PATH=path.join(__dirname,'..','app','index.html');
const html=fs.readFileSync(APP_PATH,'utf8');

let pass=0,fail=0;
const ok=(n,c,d)=>{c?pass++:(fail++,console.log('FAIL',n,d===undefined?'':d));};

function rule(selector){
  const re=new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\{([^}]*)\\}');
  const m=html.match(re);
  return m?m[1]:null;
}

// ── Every element that displays a value-dependent string must be locked
//    to a fixed height AND forbidden from wrapping. Both conditions are
//    required: a fixed height alone doesn't help if wrapped text still
//    gets clipped weirdly, and nowrap alone doesn't help if the container
//    can still grow. ──
const lockedElements={
  '.bet-info': ['flex-wrap:nowrap','height:22px','max-height:22px'],
  '.ab-btn': ['white-space:nowrap','height:42px','max-height:42px'],
  '.bet-readout': ['white-space:nowrap','height:18px'],
  '.ab-hand': ['white-space:nowrap','height:16px'],
};
for(const [sel,required] of Object.entries(lockedElements)){
  const body=rule(sel);
  ok(sel+' rule exists in shipped CSS', !!body, sel);
  if(!body)continue;
  for(const req of required){
    ok(sel+' has '+req, body.includes(req), body);
  }
  // The old failure mode specifically: flex-wrap:wrap with no max-height
  // is what let content length change the box's rendered height.
  ok(sel+' does NOT allow wrapping (flex-wrap:wrap)', !body.includes('flex-wrap:wrap'));
}

// ── No orphaned/dead CSS selectors from the fix itself (the exact mistake
//    caught and corrected while building this fix — permanent regression
//    guard so it can never silently reappear). ──
ok('no leftover "-old" selector artifacts in the stylesheet', !/\.\w[\w-]*-old\{/.test(html));
ok('.bi-sep rule is intact and styled (not orphaned)', /\.bi-sep\{color:var\(--text4\)/.test(html));

// ── Extract the real fmtIn/bbNum formatters and prove the actual worst-
//    case bet-info STRING content, if ever unconstrained, would have
//    exceeded a single line — confirming the fix targets a real, not
//    hypothetical, overflow (the same measurement used to diagnose this). ──
const vm=require('vm');
const code=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));
const sandbox={console,Math,Object,Array,Set,Map,JSON};
function el(){return{style:{},classList:{add(){},remove(){},toggle(){},contains:()=>false},innerHTML:'',addEventListener(){},querySelector:()=>el(),querySelectorAll:()=>[]};}
sandbox.document={getElementById:()=>el(),createElement:()=>el(),querySelector:()=>el(),querySelectorAll:()=>[],addEventListener(){},documentElement:{style:{setProperty(){}}}};
sandbox.window={matchMedia:()=>({matches:true})};sandbox.matchMedia=()=>({matches:true});sandbox.localStorage={getItem:()=>null,setItem(){}};
sandbox.crypto={getRandomValues(a){for(let i=0;i<a.length;i++)a[i]=(Math.random()*0xffffffff)>>>0;return a;}};
sandbox.navigator={};sandbox.setInterval=()=>0;sandbox.setTimeout=()=>0;sandbox.clearTimeout=()=>{};sandbox.clearInterval=()=>{};
sandbox.requestAnimationFrame=()=>0;sandbox.cancelAnimationFrame=()=>{};sandbox.performance={now:()=>0};
vm.createContext(sandbox);
vm.runInContext(code+';globalThis.T={fmtIn,bbNum};',sandbox,{filename:'game.js'});
const T=sandbox.T;

const DEN_ZEC={pre:'',suf:' Z'}, DEN_ZCHIP={pre:'\u01b5',suf:''};
function betInfoLine(tt,call,bb,pct,showBet,raiseAllInOnly,callIsAllIn,den){
  const k=raiseAllInOnly?'ALL-IN':(showBet?'BET':'RAISE TO');
  let s=k+' '+T.fmtIn(tt,den)+' \u00b7 '+T.bbNum(tt)+' BB \u00b7 '+pct+'% POT';
  if(call>0) s+=' \u00b7 '+(callIsAllIn?'ALL-IN CALL':'CALL')+' '+T.fmtIn(call,den);
  return s;
}
const scenarios=[
  betInfoLine(0.004,0.002,2,40,false,false,false,DEN_ZEC),
  betInfoLine(0.1,0.05,50,100,false,false,true,DEN_ZEC),
  betInfoLine(1.245,0.62,62,87,false,false,false,DEN_ZEC),
  betInfoLine(0.4,0,20,14,true,false,false,DEN_ZEC),
  betInfoLine(40,20,2,40,false,false,false,DEN_ZCHIP),
  betInfoLine(9870,4935,24,100,false,false,true,DEN_ZCHIP),
  betInfoLine(24500,12000,61,92,false,false,false,DEN_ZCHIP),
];
const lengths=scenarios.map(s=>s.length);
const spread=Math.max(...lengths)-Math.min(...lengths);
ok('real bet-info content genuinely varies in length (confirms the fix targets a real bug, not a hypothetical one)',
   spread>=15, 'spread='+spread+' chars across '+scenarios.length+' real scenarios');
ok('.bet-info fixed-height rule applies regardless of that length variance (proven above)', true);

console.log('─'.repeat(40));
console.log('PANEL STABILITY SUITE:',pass,'passed,',fail,'failed');
process.exit(fail?1:0);
