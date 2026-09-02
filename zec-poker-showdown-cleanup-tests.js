// Showdown cleanup proof: the "sd-glow" dimming class must NEVER survive
// into a new hand. If it does, every card renders desaturated at 50%
// opacity with no winner to glow (the exact symptom from the field
// screenshot — hero's PLO hand appeared dull grey during a fresh preflop).
const fs=require('fs'),path=require('path');
const APP_PATH=path.join(__dirname,'..','app','index.html');
const html=fs.readFileSync(APP_PATH,'utf8');

let pass=0,fail=0;
const ok=(n,c,d)=>{c?pass++:(fail++,console.log('FAIL',n,d===undefined?'':d));};

// ── The defensive fix: startHand must forcibly remove sd-glow, not just
//    rely on state (G.sdPhase) being correct by the time render() runs. ──
ok('startHand explicitly removes the sd-glow class from #felt (defensive, not just state-driven)',
   /classList\.remove\('sd-glow'\)/.test(html));
ok('the removal sits alongside the sdPhase/win5 reset (same defensive block)',
   /G\.sdPhase=null; G\.win5=null;\s*\n\s*const feltEl0=document\.getElementById\('felt'\); if\(feltEl0\)feltEl0\.classList\.remove\('sd-glow'\)/.test(html));

// ── Every intermediate showdown timeout is gen-guarded (stillOn()) so a
//    stale sequence can't run its effects into a hand that's moved on. ──
const showdownBody=html.slice(html.indexOf('function showdown('), html.indexOf('function award('));
const setTimeoutBlocks=[...showdownBody.matchAll(/setTimeout\(\(\)=>\{([\s\S]*?)\n\s*\},/g)].map(m=>m[1]);
ok('showdown() contains its expected chain of scheduled steps', setTimeoutBlocks.length>=3, setTimeoutBlocks.length);
let unguarded=0;
for(const block of setTimeoutBlocks){
  if(!block.includes('stillOn()'))unguarded++;
}
// The final cleanup step is intentionally allowed to run unconditionally
// (it's what RESETS state for the next hand) — everything else must guard.
ok('at most one showdown timeout step is unguarded (the final reset — everything else checks stillOn())',
   unguarded<=1, unguarded+' unguarded steps');

console.log('─'.repeat(40));
console.log('SHOWDOWN CLEANUP SUITE:',pass,'passed,',fail,'failed');
process.exit(fail?1:0);
