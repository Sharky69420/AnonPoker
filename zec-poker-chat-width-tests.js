// Chat width proof: the log's max width ceiling was trimmed down from the
// previous, noticeably wide 340px/19vw to a narrower, better-balanced size
// sitting opposite the action panel.
const fs=require('fs'),path=require('path');
const APP_PATH=path.join(__dirname,'..','app','index.html');
const html=fs.readFileSync(APP_PATH,'utf8');

let pass=0,fail=0;
const ok=(n,c,d)=>{c?pass++:(fail++,console.log('FAIL',n,d===undefined?'':d));};

const m=html.match(/\.log-zone\{[^}]*width:clamp\(([\d.]+)px,([\d.]+)vw,([\d.]+)px\)/);
ok('.log-zone width clamp found', !!m);
if(m){
  const[,minPx,vwCoef,maxPx]=m.map(Number);
  ok('max width ceiling is narrower than the old 340px', maxPx<340, maxPx+'px');
  ok('vw coefficient is smaller than the old 19vw (proportionally narrower)', vwCoef<19, vwCoef+'vw');
  ok('minimum width still leaves room for readable chat text', minPx>=180, minPx+'px');
}
ok('preset bet-size buttons remain in the action panel (right side)',
   /preset-strip/.test(html));

console.log('─'.repeat(40));
console.log('CHAT WIDTH SUITE:',pass,'passed,',fail,'failed');
process.exit(fail?1:0);
