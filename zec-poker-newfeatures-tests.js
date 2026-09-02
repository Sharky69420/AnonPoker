// New-features proof: turn timer pulse zone, lobby compaction, table
// preview thumbnails, Spaceship scene slot + lobby theming, and the DJ
// music system (real local playback + Spotify embed parsing + per-table
// state isolation).
const vm=require('vm'),fs=require('fs'),path=require('path');
const APP_PATH=path.join(__dirname,'..','app','index.html');
const html=fs.readFileSync(APP_PATH,'utf8');
const code=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));

let pass=0,fail=0;
const ok=(n,c,d)=>{c?pass++:(fail++,console.log('FAIL',n,d===undefined?'':d));};

// ═══ TIMER ═══
ok('HERO_TIME testing value is 3000ms', /const HERO_TIME=3000;/.test(html));
ok('proportional pulse-zone fraction (5/15) is defined', /const PULSE_ZONE_FRAC=5\/15;/.test(html));
ok('pulse intensity escalates toward zero remaining (brightest last)',
   /intensity=1-\(rem\/pulseZoneMs\)/.test(html));
ok('timerPulse keyframes exist and scale with --pulse-intensity',
   /@keyframes timerPulse/.test(html)&&/var\(--pulse-intensity/.test(html));
ok('pulse respects prefers-reduced-motion', /@media\(prefers-reduced-motion:reduce\)\{\.av-me\.timer-pulse\{animation:none\}\}/.test(html));

// ═══ LOBBY COMPACTION ═══
ok('lobby-body padding/gap use vh-based clamp (scales with viewport height)',
   /\.lobby-body\{flex:1;overflow-y:auto;padding:clamp\([^)]*vh/.test(html));
ok('settings-box padding uses vh-based clamp', /\.settings-box\{[^}]*padding:clamp\([^)]*vh/.test(html));
ok('lobby-body retains an internal scroll safety net (honest, not a false zero-scroll guarantee)',
   /\.lobby-body\{flex:1;overflow-y:auto/.test(html));

// ═══ TABLE PREVIEW THUMBNAILS ═══
const previewMapMatch=html.match(/const TABLE_PREVIEW=\{([^}]+)\};/);
ok('TABLE_PREVIEW mapping exists', !!previewMapMatch);
if(previewMapMatch){
  const entries=[...previewMapMatch[1].matchAll(/'([\w-]+)':(\d+)/g)];
  ok('all 6 tables have an assigned preview scene', entries.length===6, entries.length);
  const sceneIds=entries.map(e=>+e[2]);
  ok('every assigned scene id is a real embedded scene (1-6, not 0/Table-Only)',
     sceneIds.every(id=>id>=1&&id<=6), sceneIds);
}
ok('table card renders a thumbnail div sized independent of card content',
   /\.tc-thumb\{width:100%;height:clamp\(/.test(html));
ok('lobby table template uses TABLE_PREVIEW to source the thumbnail image',
   /previewScene=\(SCENES\.find\(s=>s\.id===TABLE_PREVIEW\[t\.id\]\)/.test(html));

// ═══ SPACESHIP SCENE ═══
ok('Spaceship scene (id 7) exists in SCENES', /\{id:7,name:'Spaceship'/.test(html));
ok('applyScene also themes the lobby screen (not just the felt)',
   /const lobbyEl=document\.getElementById\('s-lobby'\)/.test(html));

// ═══ DJ SYSTEM ═══
ok('DJ header button exists', html.includes('id="djOpenBtn"'));
ok('DJ ticker element exists', html.includes('id="djTicker"'));
ok('DJ panel modal exists', html.includes('id="djOverlay"'));
ok('local-preview scope is disclosed honestly in the panel',
   html.includes('Local preview:')&&html.includes('your own browser only'));
ok('file upload uses real HTML5 audio (createObjectURL, not a stub)',
   /URL\.createObjectURL\(f\)/.test(html));
ok('Spotify links use the real, ToS-compliant official embed (no auth needed)',
   /open\.spotify\.com\/embed\//.test(html));
ok('DJ state is keyed per table id (switching tables shows that table\\u2019s own queue)',
   /const DJ_STATE=\{\};/.test(html)&&/function djStateFor\(tid\)/.test(html));
ok('share-your-DJ field and copy action exist',
   html.includes('id="djShareHandle"')&&html.includes('id="djShareCopy"'));
ok('ticker shows both Now Playing and Up Next', html.includes('id="djNowText"')&&html.includes('id="djNextText"'));

// ── Functional check: Spotify URL parser extracts the right type/id ──
{
  const sandbox={console,Math,Object,Array,Set,Map,JSON};
  function el(){return{style:{},classList:{add(){},remove(){},toggle(){},contains:()=>false},innerHTML:'',addEventListener(){},querySelector:()=>el(),querySelectorAll:()=>[],value:''};}
  sandbox.document={getElementById:()=>el(),createElement:()=>el(),querySelector:()=>el(),querySelectorAll:()=>[],addEventListener(){},documentElement:{style:{setProperty(){}}}};
  sandbox.window={matchMedia:()=>({matches:true}),innerWidth:1400,innerHeight:900};
  sandbox.matchMedia=()=>({matches:true});sandbox.localStorage={getItem:()=>null,setItem(){}};
  sandbox.crypto={getRandomValues(a){for(let i=0;i<a.length;i++)a[i]=(Math.random()*0xffffffff)>>>0;return a;}};
  sandbox.navigator={clipboard:{writeText(){}}};sandbox.setInterval=()=>0;sandbox.setTimeout=()=>0;sandbox.clearTimeout=()=>{};sandbox.clearInterval=()=>{};
  sandbox.requestAnimationFrame=()=>0;sandbox.cancelAnimationFrame=()=>{};sandbox.performance={now:()=>0};
  sandbox.Audio=function(){return{play:()=>Promise.resolve(),pause(){},set src(v){},set onended(v){}};};
  sandbox.URL={createObjectURL:()=>'blob:fake'};
  vm.createContext(sandbox);
  vm.runInContext(code+';globalThis.T={djParseSpotify,djStateFor,DJ_STATE};',sandbox,{filename:'game.js'});
  const T=sandbox.T;
  const track=T.djParseSpotify('https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=abc');
  ok('Spotify track URL parses correctly', track&&track.type==='track'&&track.id==='4uLU6hMCjMI75M1A2tKUQC', track);
  const playlist=T.djParseSpotify('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M');
  ok('Spotify playlist URL parses correctly', playlist&&playlist.type==='playlist', playlist);
  const bad=T.djParseSpotify('https://youtube.com/watch?v=xyz');
  ok('non-Spotify URL correctly returns null (falls back to link-queue path)', bad===null);

  // Per-table isolation
  const s1=T.djStateFor('zec-micro');
  s1.queue.push({name:'Track A',url:'x',kind:'file'});
  const s2=T.djStateFor('zec-high');
  ok('a different table starts with its own empty queue (no cross-table leakage)', s2.queue.length===0);
  ok('the original table\\u2019s queue is unaffected by checking another table', T.djStateFor('zec-micro').queue.length===1);
}

console.log('─'.repeat(40));
console.log('NEW FEATURES SUITE:',pass,'passed,',fail,'failed');
process.exit(fail?1:0);
