// Blind sound sync proof: each blind must play its sound EXACTLY ONCE, at
// the moment it actually posts (not when the seat merely fades in), and
// the big blind's sound must be weighted to the BB amount, not SB's.
const fs=require('fs'),path=require('path');
const APP_PATH=path.join(__dirname,'..','app','index.html');
const html=fs.readFileSync(APP_PATH,'utf8');

let pass=0,fail=0;
const ok=(n,c,d)=>{c?pass++:(fail++,console.log('FAIL',n,d===undefined?'':d));};

const seq=html.slice(html.indexOf('// ── Blind posting sequence'), html.indexOf('// ── Deal sequence'));
ok('blind-posting sequence block found', seq.length>0);

const soundCalls=[...seq.matchAll(/playSound\('blind',(\w+),false\)/g)].map(m=>m[1]);
ok('exactly TWO blind sound calls total (one per blind, not one per step)',
   soundCalls.length===2, soundCalls.length+' calls: '+soundCalls.join(','));
ok('the SB sound is weighted to SB', soundCalls[0]==='SB', soundCalls);
ok('the BB sound is weighted to BB, not SB (the actual bug)', soundCalls[1]==='BB', soundCalls);

ok('fadePosIn(sbi) does not trigger a sound on the same line',
   !/fadePosIn\(sbi\); playSound/.test(seq));
ok('fadePosIn(bbi) does not trigger a sound on the same line',
   !/fadePosIn\(bbi\); playSound/.test(seq));
ok('the SB sound fires alongside postBlindChip(sbi,...) — the moment it actually posts',
   /postBlindChip\(sbi, SB\); playSound\('blind',SB,false\)/.test(seq));
ok('the BB sound fires alongside postBlindChip(bbi,...) — the moment it actually posts',
   /playSound\('blind',BB,false\); render\(\); \/\/ BB sound/.test(seq));

console.log('─'.repeat(40));
console.log('BLIND SOUND SUITE:',pass,'passed,',fail,'failed');
process.exit(fail?1:0);
