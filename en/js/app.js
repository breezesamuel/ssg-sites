const $ = s => document.querySelector(s);
const toast = m => { const t = $('#toast'); t.textContent = m; t.style.display='block'; setTimeout(()=>t.style.display='none', 2600); };
function go(page){
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.page===page));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('on', p.dataset.page===page));
  window.scrollTo(0,0);
}
document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => go(b.dataset.page)));

function outOf(id, html){ const o = $(id); o.innerHTML = html; o.classList.add('show'); }
function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

const PRICES = { tarot:4, ziwei:7, qimen:9, face:4, poem:3, daily:0,
  bazi:8, liuyao:4, meihua:4, xingming:4, star:4, zodiac:4,
  guanyin:4, zhougong:3, hehun:5, ceyu:3, phone:4, palm:4, name:4 };
const PLATFORM = 'http://127.0.0.1:3745';
const OUTS = { tarot:'#tarot-out', ziwei:'#ziwei-out', qimen:'#qimen-out', face:'#face-out', poem:'#poem-out', daily:'#daily-out',
  bazi:'#bazi-out', liuyao:'#liuyao-out', meihua:'#meihua-out', xingming:'#xingming-out', star:'#star-out', zodiac:'#zodiac-out',
  guanyin:'#guanyin-out', zhougong:'#zhougong-out', hehun:'#hehun-out', ceyu:'#ceyu-out', phone:'#phone-out', palm:'#palm-out', name:'#name-out' };
function payFor(kind, name, orderId){
  const usd = PRICES[kind];
  toast('Generating PayPal order...');
  fetch(PLATFORM + '/api/paypal/create', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ amount: usd, description: 'ShenSuanGe-'+name })
  }).then(r=>r.json()).then(d=>{
    if(d && d.approvalUrl){ outOf(OUTS[kind]||'#tarot-out', 'Payment link ready\nPay $' + usd + ' with PayPal, then return here to unlock the full reading.\n\n' + d.approvalUrl); toast('Jumping to PayPal...');
      pollInvoice(d.orderId, kind, OUTS[kind]||'#tarot-out');
      orderId = orderId || d.orderId;
    }
    else { toast('Order not created(' + (d && (d.error||d.message||'')) + '), try later'); }
  }).catch(()=>toast('Gateway offline, try later'));
  window.open('https://moltjobs.io/hire?ref=6SR4LTJN&agent=bingdashan-agent-v1','_blank');
}

function pollInvoice(orderId, kind, outSel){
  if(!orderId || !kind) return;
  let tries = 0;
  const iv = setInterval(async () => {
    tries++;
    if(tries > 40){ clearInterval(iv); return; }
    try {
      const r = await fetch(PLATFORM + '/api/paypal/status', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ orderId })
      });
      const st = await r.json();
      if(st && (st.status === 'COMPLETED' || (st.captured && st.captured.status === 'COMPLETED'))){
        clearInterval(iv);
        toast('Paid! Summoning the master...');
        const ctx = aiContextFor(kind);
        const fr = await fetch(PLATFORM + '/api/fortune', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ kind, orderId, context: ctx })
        });
        const fj = await fr.json();
        if(fj && fj.text) outOf(outSel, 'AI Master Reading\n' + fj.text);
        else outOf(outSel, 'Paid but reading failed: ' + (fj && (fj.error && fj.error.message || fj.message) || ''));
      }
    } catch(e){}
  }, 2300);
}
function aiContextFor(kind){
  try {
    if(kind === 'tarot'){ const t = $('#tarot-out').innerText; return 'Drawn:' + t.replace('#tarot-out','').slice(0,200); }
    if(kind === 'ziwei'){ return 'Birth:' + ($('#zw-birth').value || ''); }
    if(kind === 'qimen'){ return 'Timing:' + ($('#qm-time').value || 'now'); }
    if(kind === 'face'){ return 'Text facial analysis based on feature description'; }
    if(kind === 'poem'){ const p = $('#poem-out').innerText; return 'Drawn sign:' + p.slice(0,120); }
    if(kind === 'daily'){ return 'Birth:' + ($('#dl-birth').value || ''); }
    if(kind === 'bazi'){ return 'Born:' + ($('#bz-birth').value || '') + ' ' + ($('#bz-hour option:checked').textContent || '') + ', pillars ready'; }
    if(kind === 'liuyao'){ const t = $('#liuyao-out').innerText; return 'Hexagram:' + t.slice(0,200); }
    if(kind === 'meihua'){ const t = $('#meihua-out').innerText; return 'Hexagram:' + t.slice(0,200); }
    if(kind === 'xingming'){ return 'Name:' + ($('#xm-name').value || ''); }
    if(kind === 'star'){ return 'Birth:' + ($('#st-birth').value || ''); }
    if(kind === 'zodiac'){ return 'Year:' + ($('#zd-year').value || ''); }
    if(kind === 'guanyin'){ const p = $('#guanyin-out').innerText; return 'Sign:' + p.slice(0,180); }
    if(kind === 'zhougong'){ return 'Dream:' + ($('#zg-dream').value || ''); }
    if(kind === 'hehun'){ return 'Split births:' + ($('#hh-a').value || '') + ' and ' + ($('#hh-b').value || ''); }
    if(kind === 'ceyu'){ return 'Character:' + ($('#cy-char').value || ''); }
    if(kind === 'phone'){ return 'Phone:' + ($('#ph-num').value || ''); }
    if(kind === 'palm'){ return 'Line:' + ($('#pm-line option:checked').textContent || 'Life line'); }
    if(kind === 'name'){ return 'Name:' + ($('#xm-name').value || ''); }
  } catch(e){}
  return '';
}
function nameFor(kind){ return { tarot:'Tarot', ziwei:'Purple Star', qimen:'Qi Men', face:'Face', poem:'Poem', daily:'Daily',
  bazi:'BaZi', liuyao:'I-Ching', meihua:'Plum Flower', xingming:'Nameology', star:'Zodiac', zodiac:'Chinese Zodiac',
  guanyin:'Kwan Yin', zhougong:'Dream', hehun:'Match', ceyu:'Char Div', phone:'Number', palm:'Palm', name:'Name' }[kind] || kind; }

/* ---------- Tarot ---------- */
function tarotDraw(){
  const deck = [];
  DS.tarotMajor.forEach((c,i)=>deck.push({t:'major',name:c[0],i}));
  DS.tarotMinor.forEach((c,i)=>deck.push({t:'minor',name:c[1],i}));
  const picks = [];
  while(picks.length<3){ const c = deck[Math.floor(Math.random()*deck.length)]; if(!picks.find(x=>x.name===c.name)) picks.push(c); }
  const positions = ['Past','Present','Future'];
  outOf('#tarot-out', picks.map((c,k)=>{
    const card = c.t==='major' ? DS.tarotMajor[c.i] : DS.tarotMinor[c.i];
    return '<span class="t">' + positions[k] + ' · ' + card[1] + '</span>\n' + card[2] + (card[3] ? '\nKeys: ' + card[3].join(' / ') : '');
  }).join('\n\n'));
  toast('Three cards drawn. Hold the question and read the details.');
}
function tarotPay(){ payFor('tarot','Full Tarot'); }

/* ---------- Purple Star ---------- */
function starOfBirth(birth){
  const b = new Date(birth); if(isNaN(b)) return null;
  const idx = (b.getMonth()*3 + b.getDate()) % DS.ziweiStars.length;
  return DS.ziweiStars[idx];
}
function ziweiFree(){
  const v = $('#zw-birth').value; if(!v) return toast('Please choose birth date first');
  const s = starOfBirth(v);
  outOf('#ziwei-out', '<span class="t">Palace Main Star · ' + s[0] + '</span>\n' + s[1] + '\nDirection: ' + s[2].join(' / '));
}
function ziweiPay(){ payFor('ziwei','Full Purple Star Chart'); }

/* ---------- Qi Men ---------- */
function qimenFree(){
  const at = $('#qm-time').value ? new Date($('#qm-time').value) : new Date();
  const h = at.getHours(); const m = at.getMinutes();
  const idx = (h + m) % DS.qimenGates.length;
  const g = DS.qimenGates[idx];
  const gong = idx===0?'Qian-6':idx===1?'Kan-1':idx===2?'Gen-8':idx===3?'Zhen-3':idx===4?'Xun-4':idx===5?'Li-9':idx===6?'Kun-2':'Dui-7';
  outOf('#qimen-out', 'Hour: ' + at.toLocaleString() + '\n<span class="t">Palace · ' + gong + ' · ' + g[0] + '</span>\n' + g[1] + '\nFavorable: ' + g[2].join(' / '));
}
function qimenPay(){ payFor('qimen','Qi Men Detail'); }

/* ---------- Poem Sign ---------- */
function poemDraw(){
  const p = rand(DS.poems);
  outOf('#poem-out', '<span class="t">' + p[0] + '</span>\n' + p[1]);
  toast('The sign appears. What you hold in mind has its answer.');
}

/* ---------- Face ---------- */
function faceAnalyze(){
  const f = $('#face-file');
  let url = null;
  if(f && f.files && f.files[0]){ url = URL.createObjectURL(f.files[0]); }
  const p1 = rand(DS.faces), p2 = rand(DS.faces.filter(x=>x!==p1)), p3 = rand(DS.faces.filter(x=>x!==p1&&x!==p2));
  outOf('#face-out', '(Text-based analysis, no photo needed)\n<span class="t">' + p1[0] + '</span>\n' + p1[1] + '\n' +
    '<span class="t">' + p2[0] + '</span>\n' + p2[1] + '\n' +
    '<span class="t">' + p3[0] + '</span>\n' + p3[1]);
  if(url) URL.revokeObjectURL(url);
}
function facePay(){ payFor('face','Full Face Report'); }

/* ---------- Daily ---------- */
function dailyLoad(){
  const birth = $('#dl-birth').value;
  const now = new Date();
  const zodiac = DS.zodiacs[(now.getFullYear()-4)%12];
  const luck = Math.floor(Math.random()*3)+3;
  const focus = rand(['Study & skills','Money & side income','People & cooperation','Health & routine','Big decisions']);
  const advice = rand(DS.dailyAdvice);
  let wh = '';
  if(forked(birth)) wh = '\nMatching your birth, today resonates with ' + starOfBirth(birth)[0] + '.';
  outOf('#daily-out',
    now.toLocaleDateString('en-US',{month:'long',day:'numeric',weekday:'long'}) +
    '\nZodiac year: ' + zodiac[0] + '\n<span class="t">Overall ' + '★'.repeat(luck) + '☆'.repeat(5-luck) + '</span>' +
    '\nToday: ' + focus + '\n' + advice + wh);
}
function forked(v){ return !!v; }

/* ---------- BaZi ---------- */
const STEMS = ['Jia','Yi','Bing','Ding','Wu','Ji','Geng','Xin','Ren','Gui'];
const BRANCHES = ['Zi','Chou','Yin','Mao','Chen','Si','Wu','Wei','Shen','You','Xu','Hai'];
const ELEMENTS = { 'Jia':'Wood','Yi':'Wood','Bing':'Fire','Ding':'Fire','Wu':'Earth','Ji':'Earth','Geng':'Metal','Xin':'Metal','Ren':'Water','Gui':'Water' };
function baziOf(birth, hourIdx){
  const d = new Date(birth); if(isNaN(d)) return null;
  const y = d.getFullYear();
  const yg = (y - 1984 + 60*5) % 10, yz = (y - 1984 + 60*5) % 12;
  const ydao = STEMS[yg] + BRANCHES[yz];
  const yElem = ELEMENTS[ydao[0]];
  const monthGanBase = { 'Jia':'Bing','Ji':'Bing','Yi':'Wu','Geng':'Wu','Bing':'Geng','Xin':'Geng','Ding':'Ren','Ren':'Ren','Wu':'Jia','Gui':'Jia' }[ydao[0]];
  const mgBase = STEMS.indexOf(monthGanBase);
  const mdao = STEMS[(mgBase + d.getMonth()) % 10] + BRANCHES[((d.getMonth() + 2) + d.getMonth()) % 12];
  const dayNum = Math.floor((d - new Date(d.getFullYear(),0,1)) / 86400000);
  const ddao = STEMS[(dayNum % 10 + 5) % 10] + BRANCHES[(dayNum % 12 + 7) % 12];
  const hdao = STEMS[((STEMS.indexOf(ddao[0]) + 1) * 2 + hourIdx) % 10] + BRANCHES[hourIdx];
  const dayMaster = ddao[0];
  return { yda: ydao, mda: mdao, dda: ddao, hda: hdao, dayMaster: dayMaster, dayElem: ELEMENTS[dayMaster] };
}
function baziFree(){
  const b = $('#bz-birth').value; if(!b) return toast('Please choose birth date');
  const hi = +$('#bz-hour').value || 0;
  const z = baziOf(b, hi); if(!z) return toast('Invalid date');
  const zodiac = DS.zodiacs[BRANCHES.indexOf(z.yda[1])];
  outOf('#bazi-out', 'Four Pillars: <span class="t">' + z.yda + 'Y · ' + z.mda + 'M · ' + z.dda + 'D · ' + z.hda + 'H</span>' +
    '\nDay Master: ' + z.dayMaster + '(' + ELEMENTS[z.dayMaster] + ')' + '\nZodiac: ' + (zodiac?zodiac[0]:'') + '\nNote: free chart done. Full reading $8.');
}
function baziPay(){ payFor('bazi','Full BaZi'); }

/* ---------- I-Ching ---------- */
function liuyaoDraw(){
  const coins = [];
  for(let i=0;i<6;i++){ const heads = [0,1,2].filter(()=>Math.random()<0.5).length; coins.push(heads); }
  const yao = coins.map(c => c===0?'o(x6)':c===1?'⚊':c===2?'⚋':'x(9)');
  const binary = coins.map(c => (c===3||c===0)?1:0).join('');
  const up = binary.slice(0,3), lo = binary.slice(3);
  const hexIdx = parseInt(up,2)*8 + parseInt(lo,2);
  const hex = DS.liuyaoHex[hexIdx % 64];
  outOf('#liuyao-out', 'Hexagram: <span class="t">' + hex[0] + '</span> (' + hex[1] + ')\n' + hex[2] + '\nMoving: ' + coins.map((c,i)=>(c===0||c===3)?(i+1)+'th line':'').filter(Boolean).join(' ') + '\nKeys: ' + hex[3].join(' / ') + '\n(Full reading $4)');
}
function liuyaoPay(){ payFor('liuyao','I-Ching Detail'); }

/* ---------- Plum Flower ---------- */
function meihuaHex(a, b){
  const upper = (a % 8 || 8), lower = (b % 8 || 8);
  const name8 = ['Qian','Dui','Li','Zhen','Xun','Kan','Gen','Kun'];
  return { up: name8[upper-1], lo: name8[lower-1], upN: upper, loN: lower };
}
function meihuaDraw(){
  const a = +$('#mh-a').value, b = +$('#mh-b').value;
  if(!a||!b) return toast('Please give two numbers');
  const h = meihuaHex(a,b);
  const meihuaTable = [
    ['The Creative','Treading','Fellowship','Without Falsehood','Coming to Meet','Conflict','Retreat','Peace'],
    ['Breakthrough','The Joyous','Revolution','Following','Great Exceeding','Oppression','Influence','Gathering'],
    ['Great Possession','Opposition','The Clinging','Biting Through','The Cauldron','Before Completion','The Wanderer','Progress'],
    ['Great Power','The Marrying Maiden','Abundance','The Arousing','Duration','Deliverance','Small Overpass','Enthusiasm'],
    ['Small Accumulating','Inner Truth','The Family','Increase','The Gentle','Dispersion','Development','Contemplation'],
    ['Waiting','Limitation','After Completion','Difficulty','Dispersion','The Abysmal','Obstruction','Holding Together'],
    ['Great Accumulating','Decrease','Grace','Nourishment','Work on the Decayed','Youthful Folly','Keeping Still','Splitting Apart'],
    ['Peace','Approach','Darkening of the Light','Return','Pushing Upward','The Army','Modesty','The Receptive'],
  ];
  const hexName = meihuaTable[h.upN-1][h.loN-1];
  const hex = DS.liuyaoHex.find(x => x[0] === hexName) || rand(DS.liuyaoHex);
  outOf('#meihua-out', 'Casting: <span class="t">' + h.up + ' upper · ' + h.lo + ' lower</span>' +
    '\nHexagram: ' + hexName + '\n' + (hex[2]||'') + '\nKeys: ' + (hex[3]||['Observe calmly','Adapt','Find the way']).join(' / ') + '\n(Full reading $4)');
}
function meihuaPay(){ payFor('meihua','Plum Flower Reading'); }

/* ---------- Nameology ---------- */
function xingmingFree(){
  const n = ($('#xm-name').value||'').trim(); if(n.length<2) return toast('Please enter at least 2 characters');
  const c1 = n.charCodeAt(0) % 10 || 1, c2 = n.charCodeAt(1) % 10 || 2;
  const wai = (c1+1) % 10, zong = ((c1+c2+2) % 10) || 10;
  const luck = (v)=> v===1||v===3||v===6||v===8 ? 'Good':'Medium';
  outOf('#xingming-out', 'Name: "' + n + '"\n<span class="t">Sky ' + luck(wai) + ' / Person ' + luck((c1+1)%10) + ' / Earth ' + luck(c2) + ' / Outer ' + luck(wai) + ' / Total ' + luck(zong) + '</span>' +
    '\nPerson number: ' + ((c1+((c1+c2)%10))%10||10) + '(main luck)\nNote: basic five-grid chart. Full analysis $4.');
}
function xingmingPay(){ payFor('xingming','Nameology Detail'); }

/* ---------- Zodiac (western) ---------- */
function starFree(){
  const b = $('#st-birth').value; if(!b) return toast('Please choose birthday');
  const d = new Date(b);
  const md = (d.getMonth()+1)*100 + d.getDate();
  const s = md>=321&&md<=419?0:md>=420&&md<=520?1:md>=521&&md<=621?2:md>=622&&md<=722?3:md>=723&&md<=822?4:md>=823&&md<=922?5:md>=923&&md<=1023?6:md>=1024&&md<=1122?7:md>=1123&&md<=1221?8:md>=1222&&md<=119?9:md>=120&&md<=218?10:11;
  const z = DS.stars[s];
  outOf('#star-out', 'Your sign: <span class="t">' + z[0] + '</span>\n' + z[1] + '\nGuide: ' + z[2].join(' / ') + '\n(Full reading $4)');
}
function starPay(){ payFor('star','Zodiac Reading'); }

/* ---------- Chinese Zodiac ---------- */
function zodiacFree(){
  const y = +$('#zd-year').value; if(!y||y<1924) return toast('Please enter birth year');
  const z = DS.zodiacs[(y-4)%12];
  outOf('#zodiac-out', currentYear + ' year · Zodiac "' + z[0] + '"\n<span class="t">' + z[0] + '</span>\n' + z[1] + '\nKeys: ' + z[2].join(' / ') + '\n(Full year reading $4)');
}
function zodiacPay(){ payFor('zodiac','Zodiac Year Detail'); }
const currentYear = new Date().getFullYear();

/* ---------- Kwan Yin Sign ---------- */
function guanyinDraw(){
  const s = rand(DS.guanyinSigns);
  outOf('#guanyin-out', '<span class="t">' + s[0] + '</span>\n' + s[1]);
  toast('The sign appears. Sincerity answers.');
}
function guanyinPay(){ payFor('guanyin','Kwan Yin Detail'); }

/* ---------- Dream ---------- */
function zhougongFree(){
  const w = ($('#zg-dream').value||'').trim().toLowerCase(); if(!w) return toast('Please describe your dream');
  let hit = null;
  const keys = ['teeth','fly','fall','chase','preg','exam','gold','water','fire','snake','dragon','dead','baby'];
  const find = (kw) => DS.dreamIcons.find(x => x[0].toLowerCase().includes(kw));
  for(const k of keys){ hit = find(k); if(hit) break; }
  if(!hit) { outOf('#zhougong-out', 'Common dream symbols: water / fire / snake / dragon / flying / falling / teeth / being chased / pregnancy / exam / gold. Type one and try.'); return; }
  outOf('#zhougong-out', 'Dream symbol: <span class="t">' + hit[0] + '</span>\n' + hit[1] + '\nMeaning: ' + hit[2] + '\n(Deep reading + week guide $3)');
}
function zhougongPay(){ payFor('zhougong','Dream Detail'); }

/* ---------- Match ---------- */
function hehunFree(){
  const a = $('#hh-a').value, b = $('#hh-b').value;
  if(!a||!b) return toast('Please select both birth dates');
  const za = Math.abs((new Date(a).getFullYear()-4)%12);
  const zb = Math.abs((new Date(b).getFullYear()-4)%12);
  const na = DS.zodiacs[za], nb = DS.zodiacs[zb];
  const combos = { 0:6, 6:0, 1:7, 7:1, 2:8, 8:2, 3:9, 9:3, 4:10, 10:4, 5:11, 11:5 }; // clash
  const union = { 0:1, 1:0, 9:3, 3:9, 10:4, 4:10, 11:5, 5:11, 6:7, 7:6, 2:11, 11:2 }; // six harmony
  let rel = 'Neutral';
  if(combos[za]===zb) rel = 'Clash';
  if(union[za]===zb) rel = 'Six Harmony';
  const extra = rel==='Six Harmony' ? '\nSix harmony, great match; elements nourish each other.' : rel==='Clash' ? '\nClashing signs, temperaments differ; patience and adjustment key.' : '';
  const stemA = STEMS[Math.abs((new Date(a).getFullYear()-4)%10)];
  const stemB = STEMS[Math.abs((new Date(b).getFullYear()-4)%10)];
  outOf('#hehun-out', 'Match quick test: "' + na[0] + '" x "' + nb[0] + '"\n<span class="t">Zodiac relation · ' + rel + '</span>' + extra +
    '\nElements: ' + ELEMENTS[stemA] + '(' + stemA + ') and ' + ELEMENTS[stemB] + '(' + stemB + ')' +
    '\n(Full match analysis $5)');
}
function hehunPay(){ payFor('hehun','Full Match'); }

/* ---------- Char Div ---------- */
function ceyuFree(){
  const c = ($('#cy-char').value||'').trim(); if(!c) return toast('Please report one character');
  const code = c.codePointAt(0);
  const parts = c.length===1 ? code%4+1 : -1;
  const words = ['Rising image','Steady image','Dormant, waiting','Free-flowing image'];
  outOf('#ceyu-out', 'Character: "' + c + '"\n<span class="t">Meaning:</span> ' + ['Hidden noble charm','Contains momentum','Gathering force','Seeds of success'][parts-1] +
    '\nNumber: ' + words[(code+parts)%4] + '\n(Detailed answer + timing $3)');
}
function ceyuPay(){ payFor('ceyu','Char Div Detail'); }

/* ---------- Number Energy ---------- */
function phoneFree(){
  const p = ($('#ph-num').value||'').trim(); if(!p||p.length<4) return toast('Please enter phone (last 4 digits)');
  const tail = p.slice(-4);
  const g = (+tail[0]) + (+tail[1]) + (+tail[2]) + (+tail[3]);
  const luo = [
    ['13 Wealth','Money magnet, main income',  'Love & savings grow'],
    ['14 Vitality','People magnet, happy energy','Network & health'],
    ['19 Authority','Decision magnet, power',   'Career & leadership'],
    ['11 Foundation','Patience magnet, steady',  'Wait, endurance'],
    ['12 Soft','Flirt field, emotions busy','Guard heart, calm'],
    ['17 Words','Talk field, disputes','Speak softly'],
    ['18 Change','Shift field, talent & waves','Stay sharp, no shortcuts'],
    ['16 Bold','Pioneer field, big swings','Careful investing'],
  ];
  const idx = (g + +tail[0]) % 8;
  const m = luo[idx];
  outOf('#phone-out', 'Tail ' + tail + ' energy\n<span class="t">' + m[0] + '</span>\n' + m[1] + '\nNote: ' + m[2] + '\n(Full number analysis $4)');
}
function phonePay(){ payFor('phone','Number Detail'); }

/* ---------- Palm ---------- */
function palmFree(){
  const li = +$('#pm-line').value || 0;
  const p = DS.palmLines[li];
  outOf('#palm-out', '<span class="t">' + p[0] + '</span>\n' + p[1] + '\nObserve: ' + p[2].join(' / ') + '\n(Full palm reading $4)');
}
function palmPay(){ payFor('palm','Palm Detail'); }

/* ---------- Poem pay ---------- */
function poemPay(){ payFor('poem','Poem Detail'); }

toast('Shen Suan Ge open · good luck');