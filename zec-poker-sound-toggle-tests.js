// Sound toggle proof: playSound must fully mute when the toggle is off,
// funneled through the single real entry point every game sound uses —
// not a scattered per-effect check that could miss one.
const fs=require('fs'),path=require('path');
const APP_PATH=path.join(__dirname,'..','app','index.html');
const html=fs.readFileSync(APP_PATH,'utf8');

let pass=0,fail=0;
const ok=(n,c,d)=>{c?pass++:(fail++,console.log('FAIL',n,d===undefined?'':d));};

ok('a sound toggle button exists in the header', html.includes('id="soundToggle"'));
ok('the toggle sits with the other header toggles (before Wallet)',
   html.indexOf('id="soundToggle"')<html.indexOf('id="depOpenBtn"'));
ok('playSound gates on P.soundOff at its single entry point',
   /function playSound\([^)]*\)\{\s*\n\s*if\(!AC\|\|\(P&&P\.soundOff\)\) return;/.test(html));
ok('toggling updates the button label between On/Off', /textContent='Sound: '\+\(P\.soundOff\?'Off':'On'\)/.test(html));
ok('the preference persists via savePrefsIfRemember', /soundOff=!P\.soundOff;\s*\n\s*updateSoundToggleUI\(\);\s*\n\s*savePrefsIfRemember\(\)/.test(html));

console.log('─'.repeat(40));
console.log('SOUND TOGGLE SUITE:',pass,'passed,',fail,'failed');
process.exit(fail?1:0);
