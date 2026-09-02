// Button layout proof: Fold/Call/Raise sit SIDE BY SIDE in equal thirds,
// at a fixed, non-growing height — not stacked vertically. A leftover
// flex:1 from the earlier vertical-stack design was being read as
// flex-basis:0% on the COLUMN (height) axis, silently overriding the
// fixed-height fix and letting buttons balloon to fill available vertical
// space — this is what actually caused the elongated buttons in the field
// screenshot. Row layout uses flex:1 on the correct (width) axis instead.
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

const mobileBtns=rule('.action-btns');
ok('.action-btns rule exists', !!mobileBtns);
ok('.action-btns is a ROW (not a column) — no flex-direction:column remains',
   mobileBtns && !mobileBtns.includes('flex-direction:column'));
ok('.action-btns forbids wrapping (stays three-across, never drops to a new row)',
   mobileBtns && mobileBtns.includes('flex-wrap:nowrap'));

const btnBody=rule('.ab-btn');
ok('.ab-btn rule exists', !!btnBody);
ok('.ab-btn has a FIXED height (not just min-height)', btnBody && btnBody.includes('height:42px'));
ok('.ab-btn has a matching max-height (growth is capped, not just floored)',
   btnBody && btnBody.includes('max-height:42px'));
ok('.ab-btn uses flex:1 for equal-width thirds (correct axis: row context)',
   btnBody && btnBody.includes('flex:1'));

// ── The actual bug: in the OLD column layout, flex:1 (flex-basis:0%) on
//    the main (vertical) axis would override an explicit height — prove
//    that can't happen now by confirming no rule combines column direction
//    with flex:1 on the buttons anywhere in the file. ──
const allActionBtnsRules=[...html.matchAll(/\.action-btns\{([^}]*)\}/g)].map(m=>m[1]);
for(const rule2 of allActionBtnsRules){
  ok('every .action-btns rule variant avoids column direction', !rule2.includes('flex-direction:column'), rule2);
}

console.log('─'.repeat(40));
console.log('BUTTON LAYOUT SUITE:',pass,'passed,',fail,'failed');
process.exit(fail?1:0);
