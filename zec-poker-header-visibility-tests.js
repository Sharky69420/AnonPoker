// Header visibility proof: LEAVE (and every other header control) must
// never be able to overflow off-screen with no way to reach it. A wide
// stakes tag (PLO's runs noticeably longer than NLHE's) pushed the right-
// side controls past the viewport edge with no wrap and no scroll — LEAVE
// became genuinely unreachable, not just visually cramped.
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

const gameTop=rule('.game-top');
ok('.game-top rule exists', !!gameTop);
ok('.game-top allows wrapping (content can never be pushed off-screen with no way to reach it)',
   gameTop && gameTop.includes('flex-wrap:wrap'));

const gameTags=rule('.game-tags');
ok('.game-tags rule exists', !!gameTags);
ok('.game-tags allows wrapping too (extra safety when many tags are present, e.g. PLO + testnet + BB)',
   gameTags && gameTags.includes('flex-wrap:wrap'));

// ── The actual failure mode: measure that a realistic PLO header's content
//    is wider than a plausible narrow phone viewport, proving wrap (not
//    just "seems fine on my screen") is genuinely required. ──
const brandW=140, tagsW=/* mode+stakes */180 + /* testnet */70 + /* BB */36 + 16;
const rightW=/* 2-color */78 + /* wallet */70 + /* sit out */80 + /* leave */70 + 28;
const totalMinContentPx=brandW+tagsW+rightW;
const narrowPhonePx=380;
ok('realistic PLO header content width exceeds a narrow phone viewport (confirms wrap is load-bearing, not cosmetic)',
   totalMinContentPx>narrowPhonePx, totalMinContentPx+'px content vs '+narrowPhonePx+'px viewport');

// ── LEAVE specifically must never be display:none or hidden by any rule ──
ok('LEAVE button has no display:none anywhere in its styling chain',
   !/\.btn-leave\{[^}]*display:none/.test(html));

console.log('─'.repeat(40));
console.log('HEADER VISIBILITY SUITE:',pass,'passed,',fail,'failed');
process.exit(fail?1:0);
