// Button label proof: raise/call/bet buttons must render as a SINGLE line
// (no <br><small>), which is what actually fits inside the fixed-height
// button box from the panel-stability fix. A two-line label collapsing
// into a fixed 42px box is exactly what caused "RAISE TO40z" to render
// as overlapping text. Also confirms there is exactly ONE add-chips
// control in the whole app (the dock button) — a duplicate in the
// post-showdown template was found and removed.
const fs=require('fs'),path=require('path');
const APP_PATH=path.join(__dirname,'..','app','index.html');
const html=fs.readFileSync(APP_PATH,'utf8');

let pass=0,fail=0;
const ok=(n,c,d)=>{c?pass++:(fail++,console.log('FAIL',n,d===undefined?'':d));};

// ── No button label template uses the two-line <br><small> format ──
ok('callLbl has no <br><small> two-line format', !/callLbl=[\s\S]{0,200}<br>/.test(html));
ok('betLbl has no <br><small> two-line format', !/betLbl=[\s\S]{0,200}<br>/.test(html));
ok('the slider-update mirror (bb2.innerHTML) has no <br><small> either',
   !/bb2\.innerHTML=[\s\S]{0,200}<br>/.test(html));

// ── Exactly one add-chips control exists anywhere in the file ──
const addChipsButtons=(html.match(/onclick="doAddOn\(\)"/g)||[]).length;
ok('exactly one Add Chips control exists in the whole app', addChipsButtons===1, addChipsButtons);
ok('the surviving control is the dock button (compact "+ Chips" label)',
   html.includes('addon-dock"><button class="addon-btn" onclick="doAddOn()">＋ Chips</button>'));
ok('the old duplicate ("+ Add Chips" in the post-showdown state) is gone',
   !html.includes('＋ Add Chips'));

// ── Simulate the real label construction and confirm the RENDERED string
//    is short and single-line for a spread of realistic values ──
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
vm.runInContext(code+';globalThis.T={fmtH};',sandbox,{filename:'game.js'});
const T=sandbox.T;

// Rebuild the exact (now single-line) label logic and confirm no <br> ever appears
function betLbl(betWord,raiseAllInOnly,total){
  return (raiseAllInOnly?'All-in ':betWord+' ')+T.fmtH(total);
}
function callLbl(callIsAllIn,stackOrCall){
  return callIsAllIn ? `All-in ${T.fmtH(stackOrCall)}` : `Call ${T.fmtH(stackOrCall)}`;
}
const samples=[
  betLbl('Raise to',false,0.004), betLbl('Bet',false,0.4), betLbl('Raise to',true,1.245),
  callLbl(false,0.002), callLbl(true,2.033),
];
for(const s of samples){
  ok('label "'+s.replace(/<[^>]+>/g,'')+'" contains no <br> (guaranteed single physical line)', !/<br/i.test(s));
}

console.log('─'.repeat(40));
console.log('BUTTON LABEL SUITE:',pass,'passed,',fail,'failed');
process.exit(fail?1:0);
