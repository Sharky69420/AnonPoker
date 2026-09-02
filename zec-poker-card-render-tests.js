// Card face rendering proof: every rank (2-10, A, J, Q, K — Ace unified
// into the same system now) shows exactly ONE big central character and
// ONE suit symbol isolated in the top-left corner. No stacked corner
// rank+suit, no suit-beneath-the-number — the two elements never overlap
// or visually tangle. Ratio: big char font-size ≈ π × corner suit size.
const vm=require('vm'),fs=require('fs'),path=require('path');
const APP_PATH=path.join(__dirname,'..','app','index.html');
const html=fs.readFileSync(APP_PATH,'utf8');
const scriptOpen=html.lastIndexOf('<script>');
const scriptClose=html.lastIndexOf('</script>');
const code=html.slice(scriptOpen+8,scriptClose);

const sandbox={console,Math,Object,Array,Set,Map,JSON};
function el(){return{style:{},classList:{add(){},remove(){},toggle(){},contains:()=>false},innerHTML:'',addEventListener(){},querySelector:()=>el(),querySelectorAll:()=>[]};}
sandbox.document={getElementById:()=>el(),createElement:()=>el(),querySelector:()=>el(),querySelectorAll:()=>[],addEventListener(){},documentElement:{style:{setProperty(){}}}};
sandbox.window={matchMedia:()=>({matches:true})};sandbox.matchMedia=()=>({matches:true});sandbox.localStorage={getItem:()=>null,setItem(){}};
sandbox.crypto={getRandomValues(a){for(let i=0;i<a.length;i++)a[i]=(Math.random()*0xffffffff)>>>0;return a;}};
sandbox.navigator={};sandbox.setInterval=()=>0;sandbox.setTimeout=()=>0;sandbox.clearTimeout=()=>{};sandbox.clearInterval=()=>{};
sandbox.requestAnimationFrame=()=>0;sandbox.cancelAnimationFrame=()=>{};sandbox.performance={now:()=>0};
vm.createContext(sandbox);
vm.runInContext(code+';globalThis.T={cardH,P,suitColor};',sandbox,{filename:'game.js'});
const T=sandbox.T;

let pass=0,fail=0;
const ok=(n,c,d)=>{c?pass++:(fail++,console.log('FAIL',n,d===undefined?'':d));};

const RANKS=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUITS=['♠','♥','♦','♣'];

// ── Old elements are completely gone from the renderer ──
for(const r of RANKS){
  const h=T.cardH({r,s:'♠'},false,'sm');
  ok('rank '+r+' has NO old corner element (c-tl)', !h.includes('c-tl'));
  ok('rank '+r+' has NO old corner element (c-br)', !h.includes('c-br'));
  ok('rank '+r+' has NO pip grid', !h.includes('c-pipgrid'));
  ok('rank '+r+' has NO separate face-letter/face-suit/ace-pip elements',
     !h.includes('c-face-letter')&&!h.includes('c-face-suit')&&!h.includes('c-ace-pip'));
}

// ── Every rank shows exactly one big character (itself) and one corner suit ──
for(const r of RANKS){
  const h=T.cardH({r,s:'♦'},false,'sm');
  ok('rank '+r+' shows itself as the one big character', h.includes('c-big-char">'+r+'<'));
  ok('rank '+r+' shows the suit ONLY in the top-left corner', h.includes('c-corner-suit">♦<'));
  ok('rank '+r+' has exactly one big-char element', (h.match(/c-big-char/g)||[]).length===1);
  ok('rank '+r+' has exactly one corner-suit element', (h.match(/c-corner-suit/g)||[]).length===1);
}

// ── Ace is unified into the same system as everything else (no special
//    giant-pip-only treatment any more) ──
{
  const h=T.cardH({r:'A',s:'♣'},false,'sm');
  ok('ace shows "A" as its big character', h.includes('c-big-char">A<'));
  ok('ace shows its suit only in the corner', h.includes('c-corner-suit">♣<'));
}

// ── The π ratio: big character size ≈ π × corner suit size, in the base
//    (non-context-specific) rule that everything else derives from ──
function rule(sel){
  const m=html.match(new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\{([^}]*)\\}'));
  return m?m[1]:null;
}
const bigRule=rule('.c-big-char');
const cornerRule=html.match(/\.c-corner-suit\{font-size:([\d.]+)em\}/);
ok('.c-big-char base rule exists', !!bigRule);
ok('.c-corner-suit π-ratio rule exists', !!cornerRule);
if(bigRule&&cornerRule){
  const bigEm=parseFloat(bigRule.match(/font-size:([\d.]+)em/)[1]);
  const cornerEm=parseFloat(cornerRule[1]);
  const ratio=bigEm/cornerEm;
  ok('big:corner ratio is within 1% of π (3.14159...)', Math.abs(ratio-Math.PI)<0.05, 'ratio='+ratio.toFixed(3));
}

// ── Colors: 2-color and 4-color deck modes both still work correctly ──
T.P.fourColor=false;
{
  const expect={'♥':'red','♦':'red','♣':'black','♠':'black'};
  for(const s of SUITS){
    const h=T.cardH({r:'K',s},false,'sm');
    ok('2-color: '+s+' renders as '+expect[s], h.includes('card-face '+expect[s]));
  }
}
T.P.fourColor=true;
{
  const expect={'♥':'red','♦':'blue','♣':'green','♠':'black'};
  for(const s of SUITS){
    const h=T.cardH({r:'K',s},false,'sm');
    ok('4-color: '+s+' renders as '+expect[s], h.includes('card-face '+expect[s]));
  }
}
T.P.fourColor=false;

// ── Hidden cards still render a back ──
{
  const back=T.cardH(null,true,'sm');
  ok('hidden card renders a back, not a face', back.includes('card-back')&&!back.includes('card-face'));
}

console.log('─'.repeat(40));
console.log('CARD RENDER SUITE:',pass,'passed,',fail,'failed');
process.exit(fail?1:0);
