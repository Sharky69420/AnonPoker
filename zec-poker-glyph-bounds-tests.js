// CARD GLYPH BOUNDS DIAGNOSTIC: proves, from the CSS values actually shipped
// in index.html, that the ace's centre pip and every rank's suit symbol
// never exceed the card's own width — at any viewport from a small phone
// to a 4K desktop, at any of the app's UI-zoom tiers.
//
// This directly follows the root-cause fix: card WIDTH is defined in
// px/vw (zoom-independent); card FONT-SIZE — which drives every internal
// glyph — used to be defined in em (zoom-dependent), so at high desktop
// zoom the glyphs could outgrow a card whose width never moved. Font-size
// is now px-based too, matching width's unit system. This test proves that
// held, rather than assuming it from the one worst-case point it was
// solved against.
const fs=require('fs'),path=require('path');
const APP_PATH=path.join(__dirname,'..','app','index.html');
const html=fs.readFileSync(APP_PATH,'utf8');

let pass=0,fail=0;
const ok=(n,c,d)=>{c?pass++:(fail++,console.log('FAIL',n,d===undefined?'':d));};

function findPxClamps(selector){
  const re=new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\{[^}]*font-size:clamp\\(([\\d.]+)px,([\\d.]+)vw,([\\d.]+)px\\)','g');
  return [...html.matchAll(re)].map(m=>({minPx:parseFloat(m[1]),vwCoef:parseFloat(m[2]),maxPx:parseFloat(m[3])}));
}
function findWidthClamps(selector){
  const re=new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\{width:clamp\\(([\\d.]+)px,([\\d.]+)vw,([\\d.]+)px\\)','g');
  return [...html.matchAll(re)].map(m=>({minPx:parseFloat(m[1]),vwCoef:parseFloat(m[2]),maxPx:parseFloat(m[3])}));
}

const fontClamps={
  'comm-cards': findPxClamps('.comm-cards .card'),
  's-cards': findPxClamps('.s-cards .card'),
};
ok('comm-cards: mobile + desktop font clamps found (px-based)', fontClamps['comm-cards'].length>=2, fontClamps['comm-cards'].length);
ok('s-cards: mobile + desktop font clamps found (px-based)', fontClamps['s-cards'].length>=2, fontClamps['s-cards'].length);
const myRowFont=html.match(/\.my-cards-row \.card\{[^}]*font-size:clamp\(([\d.]+)px,([\d.]+)vw,([\d.]+)px\)/);
ok('my-cards-row: font clamp found (px-based)', !!myRowFont);
fontClamps['my-cards-row']=[{minPx:+myRowFont[1],vwCoef:+myRowFont[2],maxPx:+myRowFont[3]}];

const widthClamps={
  'comm-cards': findWidthClamps('.comm-cards .card,.comm-cards .card-ph'),
  's-cards': findWidthClamps('.s-cards .card,.s-cards .card-ph'),
};
ok('comm-cards: mobile + desktop width clamps found', widthClamps['comm-cards'].length>=2, widthClamps['comm-cards'].length);
ok('s-cards: mobile + desktop width clamps found', widthClamps['s-cards'].length>=2, widthClamps['s-cards'].length);
const myRowWidth=html.match(/\.my-cards-row \.card\{width:clamp\(([\d.]+)px,([\d.]+)vw,([\d.]+)px\)/);
ok('my-cards-row: width clamp found', !!myRowWidth);
widthClamps['my-cards-row']=[{minPx:+myRowWidth[1],vwCoef:+myRowWidth[2],maxPx:+myRowWidth[3]}];

const bigCharEm={};
const cornerSuitEm={};
for(const ctx of ['comm-cards','s-cards','my-cards-row']){
  const bc=html.match(new RegExp('\\.'+ctx+' \\.c-big-char\\{font-size:([\\d.]+)em'));
  const cs=html.match(new RegExp('\\.'+ctx+' \\.c-corner-suit\\{font-size:([\\d.]+)em'));
  ok(ctx+': big-char em found', !!bc);
  ok(ctx+': corner-suit em found', !!cs);
  bigCharEm[ctx]=bc?+bc[1]:0;
  cornerSuitEm[ctx]=cs?+cs[1]:0;
}

function ev(clamp,vw){return Math.max(clamp.minPx,Math.min((clamp.vwCoef/100)*vw,clamp.maxPx));}

const VW=[320,375,414,600,768,839,840,900,1080,1280,1440,1499,1500,1600,1920,2560];

for(const ctx of ['comm-cards','s-cards','my-cards-row']){
  const fClamps=fontClamps[ctx], wClamps=widthClamps[ctx];
  for(const vw of VW){
    const idx=vw<840?0:(fClamps.length>1?1:0); // mobile clamp below 840px, desktop clamp at/above (if one exists)
    const fontPx=ev(fClamps[idx],vw);
    const widthPx=ev(wClamps[idx],vw);
    const bigCharPx=bigCharEm[ctx]*fontPx;
    const cornerSuitPx=cornerSuitEm[ctx]*fontPx;
    ok(`${ctx} @ vw${vw}: big-char (${bigCharPx.toFixed(1)}px) fits within card width (${widthPx.toFixed(1)}px)`,
       bigCharPx <= widthPx*0.95, `char=${bigCharPx.toFixed(1)} width=${widthPx.toFixed(1)}`);
    ok(`${ctx} @ vw${vw}: corner-suit (${cornerSuitPx.toFixed(1)}px) fits within card width (${widthPx.toFixed(1)}px)`,
       cornerSuitPx <= widthPx*0.95, `suit=${cornerSuitPx.toFixed(1)} width=${widthPx.toFixed(1)}`);
  }
}

// Card font-size itself is now proven zoom-independent: verify the clamp
// values contain no 'em' units left in these three contexts (the actual
// mechanism of the fix, checked directly against the shipped file).
for(const ctx of ['comm-cards','s-cards','my-cards-row']){
  const re=new RegExp('\\.'+ctx+' \\.card\\{[^}]*font-size:clamp\\([\\d.]+em');
  ok(ctx+": font-size clamp uses px not em (zoom-independent, matches width unit system)", !re.test(html));
}

console.log('─'.repeat(40));
console.log('CARD GLYPH BOUNDS DIAGNOSTIC:',pass,'passed,',fail,'failed');
process.exit(fail?1:0);
