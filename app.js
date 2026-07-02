/* Body Tracker v5.0.1 */
const APP_VERSION = 'v5.0.1';
const APP_BUILD = '2026-07-01.5.1';
const DB_SCHEMA = 'v2';
const KEY = 'bodyTracker.v2';
const LEGACY_KEY = 'bodyTracker.v1';
const DB_NAME = 'bodyTrackerDB';
const DB_STORE = 'kv';

const ATTRS = [
  ['strength','Strength','💪'],
  ['endurance','Endurance','❤️'],
  ['agility','Agility','⚡'],
  ['mobility','Mobility','🤸'],
  ['recovery','Recovery','😴'],
  ['nutrition','Nutrition','🥗']
];
const ATTR_IDS = ATTRS.map(a=>a[0]);
const OLD_ATTR_MAP = { athleticism:'agility', bodyComp:null };
const RANKS = ['Novice','Beginner','Developing','Intermediate','Advanced','Expert','Elite'];
const BENCHMARKS = {
  average:{name:'Average',marker:35,desc:'Minimum viable healthy adult target'},
  active:{name:'Active',marker:55,desc:'Healthy active person target'},
  athlete:{name:'Athlete',marker:75,desc:'High-performing athletic target'}
};

function emptyScores(){ return Object.fromEntries(ATTR_IDS.map(id=>[id,0])); }
function normalizeScores(scores={}){
  const out = emptyScores();
  Object.entries(scores || {}).forEach(([k,v])=>{
    const mapped = OLD_ATTR_MAP.hasOwnProperty(k) ? OLD_ATTR_MAP[k] : k;
    if(mapped && out.hasOwnProperty(mapped)) out[mapped] += Number(v)||0;
  });
  return out;
}

const DAY_TYPES = {
  strength:{name:'Strength Day',targets:{strength:16,endurance:6,agility:6,mobility:8,recovery:8,nutrition:12}},
  endurance:{name:'Endurance Day',targets:{strength:6,endurance:16,agility:8,mobility:8,recovery:8,nutrition:12}},
  agility:{name:'Agility Day',targets:{strength:7,endurance:8,agility:16,mobility:9,recovery:8,nutrition:12}},
  mobility:{name:'Mobility Day',targets:{strength:4,endurance:5,agility:5,mobility:16,recovery:12,nutrition:12}},
  recovery:{name:'Recovery Day',targets:{strength:4,endurance:4,agility:4,mobility:14,recovery:16,nutrition:14}},
  balanced:{name:'Balanced Day',targets:{strength:10,endurance:10,agility:10,mobility:10,recovery:10,nutrition:12}},
  custom:{name:'Custom Day',targets:{strength:10,endurance:10,agility:10,mobility:10,recovery:10,nutrition:12}}
};
const WEEK_BUILDS = {
  balanced:{name:'Balanced Build',targets:{strength:70,endurance:70,agility:70,mobility:70,recovery:70,nutrition:80}},
  muscle:{name:'Rebuild Muscle',targets:{strength:95,endurance:55,agility:55,mobility:60,recovery:70,nutrition:90}},
  athletic:{name:'Athletic Base',targets:{strength:65,endurance:85,agility:90,mobility:65,recovery:65,nutrition:80}},
  lean:{name:'Lean Out',targets:{strength:65,endurance:80,agility:65,mobility:60,recovery:70,nutrition:95}},
  recovery:{name:'Recovery Week',targets:{strength:40,endurance:45,agility:40,mobility:90,recovery:95,nutrition:85}},
  custom:{name:'Custom',targets:{strength:70,endurance:70,agility:70,mobility:70,recovery:70,nutrition:80}}
};

const ACTIVITIES = {
  basketball:{name:'Basketball',cat:'Sports',fav:true,defMin:45,typical:45,defInt:'moderate',mods:['outdoor'],scores:{strength:1,endurance:4,agility:5,mobility:1,recovery:0,nutrition:0}},
  soccer:{name:'Soccer',cat:'Sports',typical:60,scores:{strength:1,endurance:5,agility:5,mobility:1,recovery:0,nutrition:0}},
  baseball:{name:'Baseball / Softball',cat:'Sports',typical:60,scores:{strength:1,endurance:2,agility:3,mobility:1,recovery:0,nutrition:0}},
  ultimate:{name:'Ultimate Frisbee',cat:'Sports',typical:60,scores:{strength:1,endurance:4,agility:5,mobility:1,recovery:0,nutrition:0}},
  tennis:{name:'Tennis',cat:'Sports',typical:45,scores:{strength:1,endurance:4,agility:4,mobility:2,recovery:0,nutrition:0}},
  pickleball:{name:'Pickleball',cat:'Sports',typical:45,scores:{strength:1,endurance:2,agility:3,mobility:1,recovery:0,nutrition:0}},
  football:{name:'Football',cat:'Sports',typical:45,scores:{strength:2,endurance:3,agility:5,mobility:1,recovery:0,nutrition:0}},
  swim:{name:'Swimming',cat:'Sports',typical:45,scores:{strength:1,endurance:5,agility:2,mobility:2,recovery:0,nutrition:0}},
  climbing:{name:'Rock Climbing',cat:'Sports',typical:60,scores:{strength:5,endurance:2,agility:4,mobility:4,recovery:0,nutrition:0}},
  lifting:{name:'Weight Lifting',cat:'Training',fav:true,defMin:45,typical:45,defInt:'moderate',scores:{strength:5,endurance:1,agility:1,mobility:1,recovery:0,nutrition:0}},
  bodyweight:{name:'Bodyweight',cat:'Training',typical:30,scores:{strength:4,endurance:2,agility:2,mobility:2,recovery:0,nutrition:0}},
  elliptical:{name:'Elliptical',cat:'Training',fav:true,defMin:30,typical:30,defInt:'hard',scores:{strength:1,endurance:5,agility:0,mobility:1,recovery:0,nutrition:0}},
  running:{name:'Running',cat:'Training',typical:30,scores:{strength:1,endurance:5,agility:2,mobility:1,recovery:0,nutrition:0}},
  walking:{name:'Walking',cat:'Training',fav:true,defMin:30,typical:30,defInt:'easy',scores:{strength:0,endurance:2,agility:0,mobility:1,recovery:1,nutrition:0}},
  cycling:{name:'Cycling',cat:'Training',typical:45,scores:{strength:1,endurance:5,agility:0,mobility:1,recovery:0,nutrition:0}},
  yoga:{name:'Yoga / Stretching',cat:'Training',fav:true,defMin:15,typical:15,defInt:'easy',mods:['lowImpact'],scores:{strength:1,endurance:0,agility:1,mobility:5,recovery:4,nutrition:0}},
  mobility:{name:'Mobility Session',cat:'Training',typical:15,scores:{strength:0,endurance:0,agility:1,mobility:5,recovery:4,nutrition:0}},
  indianClubs:{name:'Indian Clubs',cat:'Training',fav:true,defMin:10,typical:15,defInt:'easy',mods:['lowImpact','skill'],scores:{strength:1,endurance:2,agility:2,mobility:5,recovery:4,nutrition:0}},
  pt:{name:'Physical Therapy',cat:'Training',typical:20,scores:{strength:1,endurance:0,agility:1,mobility:4,recovery:5,nutrition:0}},
  garden:{name:'Gardening',cat:'Life',fav:true,defMin:90,typical:120,defInt:'moderate',mods:['outdoor'],scores:{strength:2,endurance:3,agility:1,mobility:3,recovery:1,nutrition:0}},
  yard:{name:'Yard Work',cat:'Life',typical:120,scores:{strength:3,endurance:3,agility:1,mobility:2,recovery:0,nutrition:0}},
  hiking:{name:'Hiking',cat:'Life',typical:90,scores:{strength:2,endurance:4,agility:2,mobility:2,recovery:1,nutrition:0}},
  construction:{name:'Construction',cat:'Life',typical:180,scores:{strength:4,endurance:3,agility:1,mobility:2,recovery:0,nutrition:0}},
  cleaning:{name:'Cleaning',cat:'Life',typical:60,scores:{strength:1,endurance:2,agility:1,mobility:2,recovery:0,nutrition:0}}
};
const MODS = {
  hot:{name:'Hot',effects:{endurance:1},demand:1},
  humid:{name:'Humid',effects:{endurance:1},demand:1},
  outdoor:{name:'Outdoor',effects:{recovery:.25},trait:'outdoor'},
  hills:{name:'Hills',effects:{endurance:1,strength:.5}},
  heavyCarry:{name:'Heavy Carry',effects:{strength:1.5}},
  competitive:{name:'Competitive',effects:{agility:1,endurance:.5}},
  lowImpact:{name:'Low Impact',effects:{recovery:.5}},
  highImpact:{name:'High Impact',effects:{agility:1},demand:1},
  solo:{name:'Solo',effects:{},trait:'solo'},
  team:{name:'Team',effects:{},trait:'team'},
  skill:{name:'Skill Focus',effects:{agility:1}},
  sprint:{name:'Sprint Intervals',effects:{agility:1,endurance:1}},
  long:{name:'Long Duration',effects:{endurance:1}}
};
const INTENSITY = {easy:.75,moderate:1,hard:1.25,competitive:1.4,max:1.6};
const INTENSITY_LABEL = {easy:'Easy',moderate:'Moderate',hard:'Hard',competitive:'Competitive',max:'Max Effort'};

const HABITS = {
  protein:{name:'Protein',info:'100% = roughly 140–170g/day. Examples: 8 oz steak/chicken ~50g, Greek yogurt ~15–25g, shake ~25–35g.',scores:{strength:3,recovery:1,nutrition:5}},
  water:{name:'Water',info:'100% = your normal daily water target. More important on hot/humid activity days.',scores:{endurance:1,recovery:3,nutrition:5}},
  veggies:{name:'Vegetables',info:'100% = meaningful vegetables in 2 meals. 150% = unusually vegetable-heavy day.',scores:{nutrition:5,recovery:1}},
  fuel:{name:'Fuel Goal',info:'100% = eating matched your selected fuel mode: standard, reduced intake, or muscle gain.',scores:{nutrition:3,strength:1,recovery:1}},
  mobility:{name:'Stretch / Mobility',info:'100% = 10–15 minutes or enough to feel meaningfully looser.',scores:{mobility:5,recovery:4,agility:1}},
  sleep:{name:'Sleep',info:'100% = your sleep target, default 7.5 hours. Use your best estimate.',scores:{recovery:5,strength:1,endurance:1,agility:1}}
};
const EXCEPTIONS = {
  lateFood:{name:'Ate after 11 PM',penalty:{nutrition:-3,recovery:-2}},
  dessert:{name:'Dessert',penalty:{nutrition:-1}},
  alcohol:{name:'Alcohol',penalty:{recovery:-3,nutrition:-1}},
  sugary:{name:'Sugary drink',penalty:{nutrition:-2}},
  junk:{name:'Junk food',penalty:{nutrition:-3}}
};
const MEASUREMENTS = {
  weight:{name:'Weight',unit:'lb'},
  waist:{name:'Waist',unit:'in'},
  bodyFat:{name:'Body Fat Est.',unit:'%'},
  bench10:{name:'Bench 10RM',unit:'lb'},
  elliptical5:{name:'5-min Elliptical',unit:'cal'},
  rhr:{name:'Resting HR',unit:'bpm'},
  pullups:{name:'Pull-ups',unit:'reps'},
  pushups:{name:'Push-ups',unit:'reps'}
};
const QUICK_GAIN = {
  strength:[
    ['10 push-ups','bodyweight',5,'moderate'],['1 set squats','bodyweight',6,'moderate'],['30-sec plank','bodyweight',3,'easy'],['5 pull-ups / assisted','bodyweight',5,'hard'],['10 min lifting circuit','lifting',10,'moderate']
  ],
  endurance:[
    ['5-min brisk walk','walking',5,'moderate'],['3-min stairs','running',3,'hard'],['5-min elliptical','elliptical',5,'hard'],['2-min jumping jacks','bodyweight',2,'hard'],['10-min easy walk','walking',10,'easy']
  ],
  agility:[
    ['3-min footwork','bodyweight',3,'hard'],['5-min jump rope','bodyweight',5,'hard'],['10 min shooting/dribbling','basketball',10,'moderate'],['5-min lateral shuffles','bodyweight',5,'hard'],['10 min Indian clubs','indianClubs',10,'easy']
  ],
  mobility:[
    ['5-min stretch','mobility',5,'easy'],['10 min Indian clubs','indianClubs',10,'easy'],['Hip opener set','mobility',6,'easy'],['Shoulder mobility','mobility',6,'easy'],['10 min yoga','yoga',10,'easy']
  ],
  recovery:[
    ['5-min breathing','mobility',5,'easy'],['10-min easy walk','walking',10,'easy'],['10 min gentle mobility','mobility',10,'easy'],['Water check-in','waterHabit',0,'easy'],['Early wind-down','sleepHabit',0,'easy']
  ],
  nutrition:[
    ['Water goal check','waterHabit',0,'easy'],['Protein serving','proteinHabit',0,'easy'],['Vegetable serving','veggiesHabit',0,'easy'],['Confirm fuel goal','fuelHabit',0,'easy'],['Avoid late snack','lateBoundary',0,'easy']
  ]
};
const ATTR_GUIDE = {
  strength:{desc:'Force production and muscle. Raised by lifting, bodyweight work, climbing, construction, heavy carries, and protein consistency.'},
  endurance:{desc:'Stamina and sustained work capacity. Raised by basketball, soccer, running, cycling, elliptical, hiking, walking, and hot/humid efforts.'},
  agility:{desc:'Quick, coordinated movement: footwork, speed, balance, rhythm, and change of direction. Raised by sports, drills, sprint intervals, jump rope, Indian clubs, and skill work.'},
  mobility:{desc:'Range of motion and quality of movement. Raised by stretching, yoga, Indian clubs, mobility sessions, PT, and climbing.'},
  recovery:{desc:'Restoration and fatigue management. Raised by sleep, easy movement, hydration, low-impact mobility, and light/restorative days.'},
  nutrition:{desc:'Fueling habits. Raised by protein, water, vegetables, fuel goal, and avoiding exceptions like late-night food or junk food.'}
};

function defaultState(){
  return {
    saveVersion:2,
    appVersion:APP_VERSION,
    profile:{name:'Jake',age:45,height:'',weight:215,sex:'male',activity:'mixed',goal:'recomp',fuelDefault:'standard'},
    settings:{dailyBaseline:.5,weeklyBaseline:.8,maxDisplay:1.5,dailyBarScale:20,weeklyBarScale:100,weekStart:1,dayChangeHour:3,benchmark:'active'},
    days:{},measurements:[],weeklyBuild:'muscle',customActivities:{},customHabits:{},lastActivity:null,lastProfileLevels:null
  };
}
let state = migrateState(loadLocalFallback());
let activeTab = 'today';
let activeDate = appTodayKey();
let selectedChart = 'weight';
let calendarOpen = false;
let calendarMonth = activeDate.slice(0,7);
let selectedAttr = null;
let form = {activity:'basketball',duration:45,intensity:'moderate',mods:['outdoor'],notes:''};

function appNow(){ return new Date(); }
function shiftedDate(d=appNow()){
  const copy = new Date(d);
  copy.setHours(copy.getHours() - (state.settings?.dayChangeHour ?? 3));
  return copy;
}
function dateKey(d=new Date()){ return d.toISOString().slice(0,10); }
function appTodayKey(){ return dateKey(shiftedDate(new Date())); }
function keyToDate(k){ const [y,m,d]=k.split('-').map(Number); return new Date(Date.UTC(y,m-1,d,12,0,0)); }
function addDays(k,n){ const d=keyToDate(k); d.setUTCDate(d.getUTCDate()+n); return dateKey(d); }
function fmtDate(k){ const d=keyToDate(k); return d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}); }

function loadLocalFallback(){
  try { return JSON.parse(localStorage.getItem(KEY)) || JSON.parse(localStorage.getItem(LEGACY_KEY)) || defaultState(); }
  catch { return defaultState(); }
}
function migrateState(s){
  const base = defaultState();
  s = {...base,...(s||{})};
  s.profile = {...base.profile,...(s.profile||{})};
  s.settings = {...base.settings,...(s.settings||{})};
  s.customActivities = s.customActivities || {};
  s.customHabits = s.customHabits || {};
  s.days = s.days || {};
  s.measurements = s.measurements || [];
  s.weeklyBuild = s.weeklyBuild || 'muscle';
  s.saveVersion = 2;
  s.appVersion = APP_VERSION;
  // Normalize legacy day types and fuel modes.
  Object.values(s.days).forEach(day=>{
    if(day.dayType === 'athleticism') day.dayType = 'agility';
    day.activities = day.activities || [];
    day.habits = day.habits || {};
    day.exceptions = day.exceptions || {};
    day.fuelMode = day.fuelMode || s.profile.fuelDefault || 'standard';
    day.touched = !!(day.touched || day.activities.length || Object.keys(day.habits).length || Object.keys(day.exceptions).length);
  });
  return s;
}
function openDB(){
  return new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)){ reject(new Error('IndexedDB unavailable')); return; }
    const req = indexedDB.open(DB_NAME,1);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
const dbPromise = openDB().catch(err=>{ console.warn(err); return null; });
function idbGet(key){ return dbPromise.then(db=>new Promise((resolve,reject)=>{ if(!db){resolve(null);return;} const tx=db.transaction(DB_STORE,'readonly'); const req=tx.objectStore(DB_STORE).get(key); req.onsuccess=()=>resolve(req.result||null); req.onerror=()=>reject(req.error); })); }
function idbPut(key,val){ return dbPromise.then(db=>new Promise((resolve,reject)=>{ if(!db){resolve(false);return;} const tx=db.transaction(DB_STORE,'readwrite'); tx.objectStore(DB_STORE).put(val,key); tx.oncomplete=()=>resolve(true); tx.onerror=()=>reject(tx.error); })); }
function save(){
  state.appVersion = APP_VERSION;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e){ console.warn(e); }
  idbPut(KEY, state).catch(e=>console.warn(e));
}
function hydrateFromIndexedDB(){
  idbGet(KEY).then(found=>{
    if(found){ state = migrateState(found); save(); }
    render(false);
  });
}

function allActivities(){ return {...ACTIVITIES,...(state.customActivities||{})}; }
function allHabits(){ return {...HABITS,...(state.customHabits||{})}; }
function ensureDay(k=activeDate){
  if(!state.days[k]) state.days[k] = {dayType:'strength',fuelMode:state.profile.fuelDefault||'standard',activities:[],habits:{},exceptions:{},touched:false};
  const day = state.days[k];
  day.dayType = DAY_TYPES[day.dayType] ? day.dayType : (day.dayType === 'athleticism' ? 'agility' : 'balanced');
  day.activities = day.activities || [];
  day.habits = day.habits || {};
  day.exceptions = day.exceptions || {};
  day.fuelMode = day.fuelMode || state.profile.fuelDefault || 'standard';
  return day;
}
function getDay(k=activeDate){ return state.days[k] || null; }
function targetsForDay(day=ensureDay()){ return normalizeScores(DAY_TYPES[day.dayType]?.targets || DAY_TYPES.balanced.targets); }
function weekTargets(){ return normalizeScores(WEEK_BUILDS[state.weeklyBuild]?.targets || WEEK_BUILDS.muscle.targets); }

function durationFactor(minutes, typical=45){
  const ratio = Math.max(0, minutes / Math.max(1, typical));
  if(ratio <= .33) return .42;
  if(ratio <= .67) return .7;
  if(ratio <= 1) return 1;
  if(ratio <= 1.33) return 1.15;
  if(ratio <= 2) return 1.35;
  return Math.min(1.75, 1.35 + (ratio-2)*.12);
}
function scoreActivity(log){
  const acts = allActivities();
  const a = acts[log.activity] || ACTIVITIES.basketball;
  const base = normalizeScores(a.scores);
  const out = emptyScores();
  const dur = durationFactor(Number(log.duration)||0, Number(a.typical)||Number(a.defMin)||45);
  const int = INTENSITY[log.intensity] || 1;
  // Primary rating of 5 at a typical moderate session produces 13 points.
  const scalar = 2.6 * dur * int;
  ATTR_IDS.forEach(id=> out[id] += base[id] * scalar);
  (log.mods||[]).forEach(mid=>{
    const m = MODS[mid];
    if(!m) return;
    const effects = normalizeScores(m.effects);
    ATTR_IDS.forEach(id=> out[id] += effects[id]);
  });
  return out;
}
function scoreHabit(id,pct){
  const h = allHabits()[id]; if(!h) return emptyScores();
  const base = normalizeScores(h.scores);
  const mult = (Number(pct)||0) / 100;
  const out = emptyScores();
  ATTR_IDS.forEach(a=> out[a] = base[a] * mult);
  return out;
}
function scoreDay(k=activeDate){
  const day = getDay(k); const total=emptyScores(); const by=[];
  if(!day) return {total,by,touched:false};
  (day.activities||[]).forEach(log=>{
    const s=scoreActivity(log); addScores(total,s); by.push({type:'activity',name:allActivities()[log.activity]?.name||log.activity,scores:s,log});
  });
  Object.entries(day.habits||{}).forEach(([id,pct])=>{
    const s=scoreHabit(id,pct); addScores(total,s); by.push({type:'habit',name:allHabits()[id]?.name||id,scores:s,pct});
  });
  Object.entries(day.exceptions||{}).forEach(([id,on])=>{
    if(!on) return; const ex=EXCEPTIONS[id]; if(!ex) return;
    const s=normalizeScores(ex.penalty); addScores(total,s); by.push({type:'exception',name:ex.name,scores:s});
  });
  ATTR_IDS.forEach(id=> total[id] = Math.max(0,total[id]));
  return {total,by,touched: !!(day.touched || (day.activities||[]).length || Object.keys(day.habits||{}).length || Object.keys(day.exceptions||{}).length)};
}
function addScores(dst,src){ ATTR_IDS.forEach(id=> dst[id] = (dst[id]||0)+(src[id]||0)); return dst; }
function percentOfDay(k=activeDate){
  const day = getDay(k); if(!day) return 0;
  const scored = scoreDay(k).total, targets = targetsForDay(day);
  const totalTarget = ATTR_IDS.reduce((a,id)=>a+targets[id],0);
  const totalActual = ATTR_IDS.reduce((a,id)=>a+Math.min(scored[id],targets[id]),0);
  return totalTarget ? totalActual/totalTarget : 0;
}
function dayStatus(k){
  const day = getDay(k); const scored = scoreDay(k);
  if(!day || !scored.touched) return 'blank';
  return percentOfDay(k) >= 1 ? 'green' : 'yellow';
}
function weekStartKey(k=activeDate){
  const start = Number(state.settings.weekStart ?? 1);
  const d = keyToDate(k);
  const dow = d.getUTCDay();
  const diff = (dow - start + 7) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return dateKey(d);
}
function weekKeys(k=activeDate){ const start=weekStartKey(k); return Array.from({length:7},(_,i)=>addDays(start,i)); }
function weekProgressFraction(k=activeDate){
  const keys = weekKeys(k); const idx = Math.max(0, keys.indexOf(k));
  // Current day counts as one full day for a simple accessible pace target.
  return Math.min(1,(idx+1)/7);
}
function weekScores(k=activeDate){
  const total=emptyScores(); weekKeys(k).forEach(dayKey=> addScores(total, scoreDay(dayKey).total)); return total;
}
function avgAheadBehind(k=activeDate){
  const actual = weekScores(k), targets = weekTargets(), frac = weekProgressFraction(k);
  let sum = 0, count = 0;
  ATTR_IDS.forEach(id=>{
    const expected = targets[id] * frac;
    if(expected>0){ sum += ((actual[id]-expected)/expected)*100; count++; }
  });
  return count ? sum/count : 0;
}

function latestMeasurement(type){
  const arr=(state.measurements||[]).filter(m=>m.type===type).sort((a,b)=>a.date.localeCompare(b.date));
  return arr[arr.length-1] || null;
}
function recentAverageCompletion(attr, days=42){
  let sum=0, count=0;
  for(let i=0;i<days;i++){
    const k=addDays(appTodayKey(),-i); const day=getDay(k); if(!day) continue;
    const target=targetsForDay(day)[attr]||1; const actual=scoreDay(k).total[attr]||0;
    sum += Math.min(actual/target,1.2); count++;
  }
  return count ? sum/count : 0;
}
function benchmarkScoreForAttr(attr){
  const wt = latestMeasurement('weight')?.value || Number(state.profile.weight)||215;
  const bench = latestMeasurement('bench10')?.value;
  const pullups = latestMeasurement('pullups')?.value;
  const pushups = latestMeasurement('pushups')?.value;
  const ell = latestMeasurement('elliptical5')?.value;
  const rhr = latestMeasurement('rhr')?.value;
  const waist = latestMeasurement('waist')?.value;
  const bf = latestMeasurement('bodyFat')?.value;
  if(attr==='strength'){
    const b = bench ? clamp((bench/wt)*70,0,90) : 35;
    const p = pullups ? clamp(pullups*4,0,90) : 35;
    const pu = pushups ? clamp(pushups*1.2,0,90) : 35;
    return (b+p+pu)/3;
  }
  if(attr==='endurance'){
    const e = ell ? clamp((ell-35)*2.1,20,90) : 35;
    const hr = rhr ? clamp(95-rhr,20,85) : 35;
    return (e+hr)/2;
  }
  if(attr==='agility') return 30 + recentAverageCompletion('agility',56)*45;
  if(attr==='mobility') return 25 + recentAverageCompletion('mobility',56)*50;
  if(attr==='recovery'){
    const hr = rhr ? clamp(95-rhr,20,85) : 40;
    return (hr + 25 + recentAverageCompletion('recovery',56)*50)/2;
  }
  if(attr==='nutrition'){
    let base = 30 + recentAverageCompletion('nutrition',56)*50;
    if(waist && wt) base += clamp((wt/waist)-4.5, -10, 10)*2;
    if(bf) base += clamp(25-bf, -10, 15);
    return clamp(base,0,95);
  }
  return 35;
}
function attrLevel(attr){
  const consistency = recentAverageCompletion(attr,56)*100;
  const bench = benchmarkScoreForAttr(attr);
  return Math.round(clamp(0.55*consistency + 0.45*bench, 1, 99));
}
function xpPct(attr){
  const comp = recentAverageCompletion(attr,14)*100;
  return clamp(Math.round((comp % 10) * 10), 5, 98);
}
function rankName(level){ return RANKS[Math.min(RANKS.length-1, Math.floor(level/15))]; }
function overallLevel(){
  const levels = Object.fromEntries(ATTR_IDS.map(id=>[id,attrLevel(id)]));
  let avg = ATTR_IDS.reduce((a,id)=>a+levels[id],0)/ATTR_IDS.length;
  const daily = Number(state.settings.dailyBaseline ?? .5); const weekly = Number(state.settings.weeklyBaseline ?? .8);
  let consistency = 0;
  for(let i=0;i<28;i++) if(percentOfDay(addDays(appTodayKey(),-i)) >= daily) consistency++;
  avg = avg*.85 + (consistency/28*100)*.15;
  return Math.round(clamp(avg,1,99));
}
function levelReasons(attr){
  const reasons=[];
  const c=recentAverageCompletion(attr,28);
  if(c>=.9) reasons.push('recent targets have been consistently met');
  else if(c<.45) reasons.push('recent targets have been missed often');
  if(attr==='strength'){
    if(latestMeasurement('bench10')) reasons.push('bench 10RM is included');
    if(latestMeasurement('pullups')) reasons.push('pull-ups are included');
    if(latestMeasurement('pushups')) reasons.push('push-ups are included');
  }
  if(attr==='endurance'){
    if(latestMeasurement('elliptical5')) reasons.push('5-min elliptical sprint is included');
    if(latestMeasurement('rhr')) reasons.push('resting heart rate is included');
  }
  if(attr==='nutrition'){
    reasons.push('protein, water, vegetables, fuel goal, and exceptions affect this');
  }
  return reasons.length ? reasons : ['recent activities, habits, and benchmark measurements affect this level'];
}
function profileSnapshot(){
  const levels = Object.fromEntries(ATTR_IDS.map(id=>[id,attrLevel(id)]));
  return {overall:overallLevel(), attrs:levels};
}

function clamp(v,min,max){ return Math.min(max,Math.max(min,Number(v)||0)); }
function pct(v,scale){ return `${clamp(v/scale*100,0,100)}%`; }
function overClass(v,target){ return v>=target ? ' over' : ''; }
function htmlEscape(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function toast(msg){ const el=document.getElementById('toast'); el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),1700); }

function render(doSave=true){
  if(doSave) save();
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(`${activeTab}Screen`).classList.add('active');
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===activeTab));
  document.getElementById('levelBadge').textContent = `LV ${overallLevel()}`;
  renderToday(); renderWeek(); renderProfile(); renderTrends(); renderSettings();
}
function renderToday(){
  const day=ensureDay(); const scored=scoreDay(activeDate); const targets=targetsForDay(day);
  document.getElementById('todayScreen').innerHTML = `
    <div class="card tight">
      <button class="dateButton" onclick="toggleCalendar()"><span><span class="dateMain">${activeDate===appTodayKey()?'TODAY':fmtDate(activeDate)}</span><br><span class="dateSub">${activeDate} · tap for calendar</span></span><span>▾</span></button>
      ${calendarOpen?calendarHtml():''}
      <div class="grid2" style="margin-top:8px">
        <div><div class="label">Day type</div><select onchange="setDayType(this.value)">${Object.entries(DAY_TYPES).map(([id,d])=>`<option value="${id}" ${day.dayType===id?'selected':''}>${d.name}</option>`).join('')}</select></div>
        <div><div class="label">Fuel mode</div><select onchange="setFuelMode(this.value)"><option value="standard" ${day.fuelMode==='standard'?'selected':''}>Standard</option><option value="reduced" ${day.fuelMode==='reduced'?'selected':''}>Reduced Intake</option><option value="gain" ${day.fuelMode==='gain'?'selected':''}>Muscle Gain</option></select></div>
      </div>
    </div>
    <div class="card">
      <div class="cardTitle"><h2>Character bars</h2><span class="small">tap any bar for help</span></div>
      ${ATTRS.map(([id,name,icon])=>attrBar(id,name,icon,scored.total[id],targets[id],20,true)).join('')}
    </div>
    <div class="card">
      <div class="cardTitle"><h3>Quick log</h3><button class="btn" onclick="repeatLast()">Repeat last</button></div>
      <div class="row">${Object.entries(allActivities()).filter(([id,a])=>a.fav).slice(0,10).map(([id,a])=>`<button class="chip" onclick="prepActivity('${id}')">${a.name}</button>`).join('')}</div>
    </div>
    ${activityLoggerHtml()}
    ${todayLogsHtml()}
    ${habitsHtml()}
    ${measurementsQuickHtml()}
  `;
}
function attrBar(id,name,icon,actual,target,scale=20,clickable=false){
  const fill = Math.min(actual,scale); const marker = clamp(target/scale*100,0,100); const click = clickable?`onclick="openAttrGuide('${id}')"`:'';
  return `<div class="attrRow" ${click}><div class="attrTop"><div class="attrName">${icon||''} ${name}</div><div class="attrScore">${actual.toFixed(1)} / ${target}</div></div><div class="barWrap"><div class="bar"><div class="barFill${overClass(actual,target)}" style="width:${pct(fill,scale)}"></div></div><div class="targetMark" style="left:${marker}%"></div><div class="markLabel" style="left:${marker}%">target</div></div></div>`;
}
function calendarHtml(){
  const [y,m]=calendarMonth.split('-').map(Number); const first=new Date(Date.UTC(y,m-1,1,12)); const days=new Date(Date.UTC(y,m,0,12)).getUTCDate();
  const startDow=Number(state.settings.weekStart??1); const offset=(first.getUTCDay()-startDow+7)%7; const names=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']; const ordered=Array.from({length:7},(_,i)=>names[(startDow+i)%7]);
  let cells=[]; for(let i=0;i<offset;i++) cells.push('<div class="calDay blank"></div>');
  for(let d=1; d<=days; d++){
    const k=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; const st=dayStatus(k); const dot=st==='blank'?'':`<span class="dot ${st}"></span>`;
    cells.push(`<button class="calDay ${k===activeDate?'active':''}" onclick="selectCalendarDate('${k}')">${d}${dot}</button>`);
  }
  return `<div class="calendar"><div class="row spread"><button class="btn" onclick="moveCal(-1)">‹</button><strong>${first.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</strong><button class="btn" onclick="moveCal(1)">›</button></div><div class="calGrid" style="margin-top:8px">${ordered.map(n=>`<div class="calHead">${n}</div>`).join('')}${cells.join('')}</div><div class="legend small" style="margin-top:10px"><span><i class="miniDot"></i> none</span><span><i class="miniDot yellow"></i> logged</span><span><i class="miniDot green"></i> target met</span></div></div>`;
}
function activityLoggerHtml(){
  const acts=allActivities(); const a=acts[form.activity]||ACTIVITIES.basketball;
  const primary = ATTR_IDS.slice().sort((x,y)=>(normalizeScores(a.scores)[y]||0)-(normalizeScores(a.scores)[x]||0))[0];
  const typicalScore = normalizeScores(a.scores)[primary]*2.6;
  return `<div class="card"><div class="cardTitle"><h3>Log activity</h3><span class="small">typical ${a.typical||a.defMin||45} min</span></div>
    <div class="label">Activity</div><select onchange="selectActivity(this.value)">${Object.entries(acts).map(([id,act])=>`<option value="${id}" ${form.activity===id?'selected':''}>${act.name}</option>`).join('')}</select>
    <div class="grid2" style="margin-top:8px"><div><div class="label">Duration</div><input type="number" min="1" value="${form.duration}" oninput="form.duration=Number(this.value)||0"></div><div><div class="label">Intensity</div><select onchange="setIntensity(this.value)">${Object.entries(INTENSITY_LABEL).map(([id,n])=>`<option value="${id}" ${form.intensity===id?'selected':''}>${n}</option>`).join('')}</select></div></div>
    <div class="row" style="margin-top:8px">${[15,30,45,60,90,120].map(m=>`<button class="chip ${form.duration===m?'active':''}" onclick="setDuration(${m})">${m}</button>`).join('')}</div>
    <div class="label" style="margin-top:10px">Modifiers</div><div class="row">${Object.entries(MODS).map(([id,m])=>`<button class="chip ${form.mods.includes(id)?'active':''}" onclick="toggleMod('${id}')">${m.name}</button>`).join('')}</div>
    <div class="small" style="margin-top:8px">A typical moderate ${a.name} session gives about ${typicalScore.toFixed(1)} ${ATTRS.find(x=>x[0]===primary)?.[1]} points before modifiers.</div>
    <textarea id="actNotes" placeholder="Notes" style="margin-top:8px">${htmlEscape(form.notes||'')}</textarea>
    <button class="btn primary full" style="margin-top:8px" onclick="saveActivity()">Save Activity</button>
  </div>`;
}
function todayLogsHtml(){
  const day=ensureDay(); const acts=allActivities();
  return `<div class="card"><div class="cardTitle"><h3>Today log</h3><span class="small">${(day.activities||[]).length} activities</span></div>${(day.activities||[]).length?day.activities.map((l,i)=>`<div class="row spread"><span>${acts[l.activity]?.name||l.activity} · ${l.duration} min · ${INTENSITY_LABEL[l.intensity]||l.intensity}</span><button class="btn bad" onclick="deleteActivity(${i})">delete</button></div>`).join(''):'<div class="small">No activity logged yet.</div>'}</div>`;
}
function habitsHtml(){
  const day=ensureDay(), habits=allHabits();
  return `<div class="card"><div class="cardTitle"><h3>Nutrition / habits</h3><span class="small">vices assumed absent</span></div>
    ${Object.entries(habits).map(([id,h])=>`<div class="attrRow"><div class="attrTop"><div class="attrName">${h.name}</div><button class="btn ghost" onclick="habitInfo('${id}')">?</button></div><div class="row">${[0,50,100,150].map(p=>`<button class="chip ${Number(day.habits[id]||0)===p?'active':''}" onclick="setHabit('${id}',${p})">${p===150?'150%+':p+'%'}</button>`).join('')}</div></div>`).join('')}
    <div class="divider"></div><div class="label">Exceptions</div><div class="row">${Object.entries(EXCEPTIONS).map(([id,e])=>`<button class="chip ${day.exceptions[id]?'red active':''}" onclick="toggleException('${id}')">+ ${e.name}</button>`).join('')}</div>
  </div>`;
}
function measurementsQuickHtml(){
  return `<div class="card"><div class="cardTitle"><h3>Measurements</h3><button class="btn" onclick="activeTab='trends';render()">Graphs</button></div><div class="grid2 land3">${Object.entries(MEASUREMENTS).map(([id,m])=>`<div><div class="label">${m.name} (${m.unit})</div><div class="row"><input id="m_${id}" type="number" step="0.1" placeholder="${latestMeasurement(id)?.value||''}"><button class="btn" onclick="addMeasurement('${id}')">+</button></div></div>`).join('')}</div></div>`;
}
function renderWeek(){
  const actual=weekScores(activeDate), targets=weekTargets(), frac=weekProgressFraction(activeDate), pace=avgAheadBehind(activeDate);
  const paceClass = pace>=0?'statusGood':'statusBad'; const paceText = `${Math.abs(pace).toFixed(0)}% ${pace>=0?'ahead/on pace':'behind schedule'}`;
  document.getElementById('weekScreen').innerHTML = `<div class="card"><div class="cardTitle"><h2>Weekly build</h2><span class="pill ${paceClass}">${paceText}</span></div>
    <div class="grid2"><div><div class="label">Weekly goal</div><select onchange="state.weeklyBuild=this.value;render()">${Object.entries(WEEK_BUILDS).map(([id,w])=>`<option value="${id}" ${state.weeklyBuild===id?'selected':''}>${w.name}</option>`).join('')}</select></div><div><div class="label">Expected by today</div><div class="metricBig">${Math.round(frac*100)}%</div></div></div>
    <div class="small" style="margin:8px 0">Blue marker = expected progress by today. Yellow marker = full weekly target.</div>
    ${ATTRS.map(([id,name,icon])=>weeklyBar(id,name,icon,actual[id],targets[id],targets[id]*frac)).join('')}
  </div>`;
}
function weeklyBar(id,name,icon,actual,target,expected){
  const scale=Math.max(100,target*1.2,actual*1.05); const exPct=clamp(expected/scale*100,0,100); const tarPct=clamp(target/scale*100,0,100);
  return `<div class="attrRow"><div class="attrTop"><div class="attrName">${icon} ${name}</div><div class="attrScore">${actual.toFixed(1)} / ${target} · ${expected?((actual-expected)/expected*100).toFixed(0):0}% pace</div></div><div class="barWrap"><div class="bar"><div class="barFill${actual>=target?' over':''}" style="width:${pct(actual,scale)}"></div></div><div class="paceMark" style="left:${exPct}%"></div><div class="targetMark" style="left:${tarPct}%"></div><div class="markLabel" style="left:${exPct}%">today</div><div class="markLabel" style="left:${tarPct}%">week</div></div></div>`;
}
function renderProfile(){
  const snap=profileSnapshot(); const bench=BENCHMARKS[state.settings.benchmark]||BENCHMARKS.active;
  const last=state.lastProfileLevels; const changes=[];
  if(last){ if(snap.overall!==last.overall) changes.push(`Overall ${last.overall} → ${snap.overall}`); ATTR_IDS.forEach(id=>{ if(snap.attrs[id]!==last.attrs?.[id]) changes.push(`${ATTRS.find(a=>a[0]===id)[1]} ${last.attrs?.[id]||'?'} → ${snap.attrs[id]}`); }); }
  if(activeTab === 'profile') { state.lastProfileLevels = snap; save(); } // stored only when profile is viewed
  document.getElementById('profileScreen').innerHTML = `<div class="card rankCard"><div class="cardTitle"><h2>Profile</h2><span class="pill">Benchmark: ${bench.name}</span></div>
    <div class="small">Overall Fitness</div><div class="metricBig">Level ${snap.overall}</div>${rankBar(snap.overall, xpPct('strength'), bench.marker, rankName(snap.overall))}
    <div class="small" style="margin-top:10px">${bench.desc}. The purple marker is the selected benchmark, like targets on the daily bars.</div>
  </div>
  <div class="card"><div class="cardTitle"><h3>Attribute levels</h3><span class="small">rank + XP</span></div>${ATTRS.map(([id,name,icon])=>profileAttr(id,name,icon,bench.marker)).join('')}</div>
  <div class="card"><div class="cardTitle"><h3>Level movement</h3></div>${changes.length?`<ul>${changes.slice(0,8).map(c=>`<li>${c}</li>`).join('')}</ul>`:'<div class="small">No level movement since last profile check. Levels change as recent consistency and benchmark measurements change.</div>'}</div>
  <div class="card"><div class="cardTitle"><h3>Traits</h3></div>${traitsHtml()}</div>`;
}
function rankBar(level,xp,benchmark,rank){
  return `<div class="barWrap"><div class="rankTrack"><div class="rankFill" style="width:${level}%"></div></div><div class="benchMark" style="left:${benchmark}%"></div><div class="markLabel" style="left:${benchmark}%">benchmark</div><div class="xpBar"><div class="xpFill" style="width:${xp}%"></div></div><div class="rankLabels"><span>Novice</span><span>Beginner</span><span>Developing</span><span>Intermediate</span><span>Advanced</span><span>Elite</span></div><div class="row spread"><span class="small">Rank: ${rank}</span><span class="small">XP ${xp}%</span></div></div>`;
}
function profileAttr(id,name,icon,benchmark){
  const level=attrLevel(id), xp=xpPct(id), rank=rankName(level);
  return `<div class="attrRow" onclick="openAttrGuide('${id}')"><div class="attrTop"><div class="attrName">${icon} ${name}</div><div class="attrScore">Level ${level} · ${rank}</div></div>${rankBar(level,xp,benchmark,rank)}<div class="tiny">${levelReasons(id).slice(0,2).join(' · ')}</div></div>`;
}
function traitsHtml(){
  const traits=[];
  const acts=Object.values(state.days||{}).flatMap(d=>d.activities||[]).map(l=>l.activity);
  const count=id=>acts.filter(a=>a===id).length;
  if(count('basketball')>=2) traits.push(['Hooper',count('basketball')>=8?'III':count('basketball')>=4?'II':'I']);
  if(count('garden')+count('yard')+count('construction')>=3) traits.push(['Builder',count('garden')+count('yard')+count('construction')>=10?'III':'II']);
  if((latestMeasurement('weight')||latestMeasurement('waist')) && recentAverageCompletion('nutrition',28)>.6) traits.push(['Recomp Focus','I']);
  let daily=0; for(let i=0;i<20;i++) if(percentOfDay(addDays(appTodayKey(),-i))>=Number(state.settings.dailyBaseline)) daily++;
  if(daily>=10) traits.push(['Consistent',daily>=18?'III':'II']);
  if(recentAverageCompletion('recovery',28)>.75) traits.push(['Recovery-Minded','I']);
  if(recentAverageCompletion('endurance',28)>.75) traits.push(['Engine Builder','I']);
  return traits.length?`<div class="row">${traits.map(t=>`<span class="pill">${t[0]} ${t[1]}</span>`).join('')}</div>`:'<div class="small">Traits emerge after repeated behavior patterns.</div>';
}
function renderTrends(){
  const data=(state.measurements||[]).filter(m=>m.type===selectedChart).sort((a,b)=>a.date.localeCompare(b.date));
  document.getElementById('trendsScreen').innerHTML = `<div class="card"><div class="cardTitle"><h2>Trends</h2><select onchange="selectedChart=this.value;render()">${Object.entries(MEASUREMENTS).map(([id,m])=>`<option value="${id}" ${selectedChart===id?'selected':''}>${m.name}</option>`).join('')}</select></div><canvas id="trendCanvas" class="spark chartWide"></canvas><div class="small" style="margin-top:8px">Rotate your phone for a wider graph.</div></div><div class="card"><table class="table"><tr><th>Date</th><th>Value</th></tr>${data.slice(-12).reverse().map(m=>`<tr><td>${m.date}</td><td>${m.value} ${m.unit}</td></tr>`).join('')}</table></div>`;
  setTimeout(drawTrend,0);
}
function drawTrend(){
  const c=document.getElementById('trendCanvas'); if(!c) return; const ctx=c.getContext('2d'); const rect=c.getBoundingClientRect(); const dpr=window.devicePixelRatio||1; c.width=rect.width*dpr; c.height=rect.height*dpr; ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,rect.width,rect.height); ctx.strokeStyle='#243524'; ctx.lineWidth=1; for(let i=1;i<5;i++){ const y=rect.height*i/5; ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(rect.width,y);ctx.stroke(); }
  const data=(state.measurements||[]).filter(m=>m.type===selectedChart).sort((a,b)=>a.date.localeCompare(b.date)).slice(-40); if(data.length<2){ ctx.fillStyle='#88a889'; ctx.fillText('Add at least two measurements.',12,24); return; }
  const vals=data.map(m=>Number(m.value)); const min=Math.min(...vals), max=Math.max(...vals); const pad=(max-min)||1;
  ctx.strokeStyle='#80f278'; ctx.lineWidth=2; ctx.beginPath(); data.forEach((m,i)=>{ const x=12+(rect.width-24)*(i/(data.length-1)); const y=rect.height-14-(rect.height-32)*((m.value-min)/pad); if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
  ctx.fillStyle='#e6ffe2'; ctx.fillText(`${MEASUREMENTS[selectedChart].name}: ${data[0].value} → ${data[data.length-1].value} ${MEASUREMENTS[selectedChart].unit}`,12,18);
}
function renderSettings(){
  const bench=state.settings.benchmark||'active';
  document.getElementById('settingsScreen').innerHTML = `<div class="card"><div class="cardTitle"><h2>Body Tracker</h2><span class="versionBadge">${APP_VERSION}</span></div><div class="small">Build ${APP_BUILD} · Storage: IndexedDB-first · DB schema: ${DB_SCHEMA}</div></div>
  <div class="card"><div class="cardTitle"><h3>Profile / comparison</h3></div><div class="grid2"><div><div class="label">Name</div><input value="${htmlEscape(state.profile.name||'')}" onchange="state.profile.name=this.value;render()"></div><div><div class="label">Weight</div><input type="number" value="${state.profile.weight||''}" onchange="state.profile.weight=Number(this.value)||'';render()"></div><div><div class="label">Height</div><input value="${htmlEscape(state.profile.height||'')}" onchange="state.profile.height=this.value;render()"></div><div><div class="label">Benchmark target</div><select onchange="state.settings.benchmark=this.value;render()">${Object.entries(BENCHMARKS).map(([id,b])=>`<option value="${id}" ${bench===id?'selected':''}>${b.name}</option>`).join('')}</select></div></div></div>
  <div class="card"><div class="cardTitle"><h3>Time settings</h3></div><div class="grid2"><div><div class="label">Week starts on</div><select onchange="state.settings.weekStart=Number(this.value);render()">${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((n,i)=>`<option value="${i}" ${Number(state.settings.weekStart)===i?'selected':''}>${n}</option>`).join('')}</select></div><div><div class="label">Day changes at</div><select onchange="state.settings.dayChangeHour=Number(this.value);activeDate=appTodayKey();render()">${Array.from({length:24},(_,i)=>`<option value="${i}" ${Number(state.settings.dayChangeHour)===i?'selected':''}>${String(i).padStart(2,'0')}:00</option>`).join('')}</select></div></div></div>
  <div class="card"><div class="cardTitle"><h3>Scoring thresholds</h3></div><div class="grid2"><div><div class="label">Daily baseline %</div><input type="number" value="${Math.round(state.settings.dailyBaseline*100)}" onchange="state.settings.dailyBaseline=(Number(this.value)||50)/100;render()"></div><div><div class="label">Weekly baseline %</div><input type="number" value="${Math.round(state.settings.weeklyBaseline*100)}" onchange="state.settings.weeklyBaseline=(Number(this.value)||80)/100;render()"></div></div></div>
  ${customToolsHtml()}
  <div class="card"><div class="cardTitle"><h3>Backup</h3></div><div class="grid2"><button class="btn" onclick="exportData()">Export JSON</button><button class="btn" onclick="exportCsv()">Export CSV</button></div><textarea id="importBox" placeholder="Paste JSON backup here" style="margin-top:8px"></textarea><button class="btn full" onclick="importData()">Import pasted JSON</button><button class="btn full" onclick="requestPersistence()">Request persistent storage</button><button class="btn full" onclick="reloadLatestApp()">Reload latest app version</button><div class="small" style="margin-top:8px">Reload latest clears cached app files and the service worker, then reloads. It does not delete your Body Tracker save data.</div><button class="btn bad full" onclick="resetAll()">Reset local data</button></div>`;
}
function customToolsHtml(){
  return `<div class="card"><div class="cardTitle"><h3>Custom activity</h3></div><input id="customActCreateName" placeholder="New activity name"><div class="grid3" style="margin-top:8px">${ATTRS.map(([id,name])=>`<div><div class="label">${name}</div><input id="actScore_${id}" type="number" min="0" max="5" value="0"></div>`).join('')}</div><div class="grid2" style="margin-top:8px"><button class="btn" onclick="createCustomActivity()">Save activity</button><button class="btn" onclick="makePrompt()">ChatGPT prompt</button></div><pre id="promptOut" class="small" style="white-space:pre-wrap;display:none"></pre></div>
  <div class="card"><div class="cardTitle"><h3>Custom habit</h3></div><input id="customHabitName" placeholder="New habit name"><textarea id="customHabitInfo" placeholder="What counts as 100%?"></textarea><div class="grid3">${ATTRS.map(([id,name])=>`<div><div class="label">${name}</div><input id="habitScore_${id}" type="number" min="0" max="5" value="0"></div>`).join('')}</div><div class="grid2" style="margin-top:8px"><button class="btn" onclick="createCustomHabit()">Save habit</button><button class="btn" onclick="makeHabitPrompt()">ChatGPT prompt</button></div><pre id="habitPromptOut" class="small" style="white-space:pre-wrap;display:none"></pre></div>`;
}

function openAttrGuide(id){
  selectedAttr=id; const [_,name,icon]=ATTRS.find(a=>a[0]===id); const day=ensureDay(); const target=targetsForDay(day)[id]; const actual=scoreDay(activeDate).total[id]; const remaining=Math.max(0,target-actual); const scored=scoreDay(activeDate);
  const contributors=scored.by.filter(b=>Math.abs(b.scores[id]||0)>0).sort((a,b)=>Math.abs(b.scores[id])-Math.abs(a.scores[id]));
  const acts=Object.entries(allActivities()).filter(([aid,a])=>(normalizeScores(a.scores)[id]||0)>0).sort((a,b)=>normalizeScores(b[1].scores)[id]-normalizeScores(a[1].scores)[id]).slice(0,7);
  const habits=Object.entries(allHabits()).filter(([hid,h])=>(normalizeScores(h.scores)[id]||0)>0).sort((a,b)=>normalizeScores(b[1].scores)[id]-normalizeScores(a[1].scores)[id]).slice(0,5);
  const quick=(QUICK_GAIN[id]||[]).map(q=>`<button class="btn quickAction" onclick="quickGain('${id}','${q[1]}',${q[2]},'${q[3]}')">${q[0]}</button>`).join('');
  showModal(`<div class="modalHead"><div><h2>${icon} ${name}</h2><div class="small">${ATTR_GUIDE[id].desc}</div></div><button class="x" onclick="closeModal()">×</button></div>
    <div class="divider"></div><div class="metricBig">${actual.toFixed(1)} / ${target}</div><div class="small">${remaining>0?`${remaining.toFixed(1)} remaining today`:'Target met or exceeded today.'}</div>
    <div class="divider"></div><h3>Quick gain</h3><div class="quickList">${quick}</div>
    <div class="divider"></div><h3>What affected this today</h3>${contributors.length?contributors.map(c=>`<div class="row spread"><span>${c.name}</span><span>${(c.scores[id]||0).toFixed(1)}</span></div>`).join(''):'<div class="small">Nothing logged yet affected this trait.</div>'}
    <div class="divider"></div><h3>Best full activities</h3>${acts.map(([aid,a])=>`<button class="chip" onclick="closeModal();prepActivity('${aid}')">${a.name}</button>`).join(' ')}
    <div class="divider"></div><h3>Helpful habits</h3>${habits.map(([hid,h])=>`<button class="chip" onclick="closeModal();setHabit('${hid}',100)">${h.name}</button>`).join(' ')}`);
}
function showModal(html){ const m=document.getElementById('modal'); m.innerHTML=`<div class="modalCard">${html}</div>`; m.classList.add('active'); }
function closeModal(){ document.getElementById('modal').classList.remove('active'); }
function habitInfo(id){ const h=allHabits()[id]; if(!h)return; showModal(`<div class="modalHead"><h2>${h.name}</h2><button class="x" onclick="closeModal()">×</button></div><p>${htmlEscape(h.info||'')}</p>`); }
function quickGain(attr, activity, minutes, intensity){
  if(activity.endsWith('Habit')){ const hid=activity.replace('Habit',''); setHabit(hid,100); closeModal(); return; }
  if(activity==='lateBoundary'){ closeModal(); toast('Avoiding late food is assumed unless you log the exception.'); return; }
  const day=ensureDay(); day.activities.push({id:Date.now(),activity,duration:minutes,intensity,mods:[],notes:`Quick gain: ${attr}`}); day.touched=true; closeModal(); toast('Quick gain added'); render();
}
function showAttrIfBehind(){ if(selectedAttr) openAttrGuide(selectedAttr); }

function setDate(k){ activeDate=k; ensureDay(); calendarMonth=k.slice(0,7); render(); }
function toggleCalendar(){ calendarOpen=!calendarOpen; render(false); }
function selectCalendarDate(k){ activeDate=k; ensureDay(); calendarOpen=false; render(); }
function moveCal(n){ const [y,m]=calendarMonth.split('-').map(Number); const d=new Date(Date.UTC(y,m-1+n,1,12)); calendarMonth=`${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`; render(false); }
function setDayType(v){ ensureDay().dayType=v; ensureDay().touched=true; render(); }
function setFuelMode(v){ ensureDay().fuelMode=v; ensureDay().touched=true; render(); }
function prepActivity(id){ const a=allActivities()[id]; form={activity:id,duration:a.defMin||a.typical||45,intensity:a.defInt||'moderate',mods:[...(a.mods||[])],notes:''}; render(false); }
function selectActivity(id){ prepActivity(id); }
function setDuration(m){ form.duration=m; render(false); }
function setIntensity(i){ form.intensity=i; render(false); }
function toggleMod(id){ form.mods=form.mods.includes(id)?form.mods.filter(x=>x!==id):[...form.mods,id]; render(false); }
function saveActivity(){ form.notes=document.getElementById('actNotes')?.value||form.notes; const day=ensureDay(); const log={...form,id:Date.now()}; day.activities.push(log); day.touched=true; state.lastActivity=log; toast('Activity saved'); render(); }
function repeatLast(){ if(!state.lastActivity){ toast('No last activity yet'); return; } const day=ensureDay(); day.activities.push({...state.lastActivity,id:Date.now()}); day.touched=true; toast('Repeated last activity'); render(); }
function deleteActivity(i){ ensureDay().activities.splice(i,1); ensureDay().touched=true; render(); }
function setHabit(id,pct){ const day=ensureDay(); if(pct===0) delete day.habits[id]; else day.habits[id]=pct; day.touched=true; render(); }
function toggleException(id){ const day=ensureDay(); day.exceptions[id]=!day.exceptions[id]; if(!day.exceptions[id]) delete day.exceptions[id]; day.touched=true; render(); }
function addMeasurement(type){ const el=document.getElementById('m_'+type); const value=parseFloat(el.value); if(!value){toast('Enter a value');return;} state.measurements=state.measurements.filter(m=>!(m.date===activeDate&&m.type===type)); state.measurements.push({date:activeDate,type,value,unit:MEASUREMENTS[type].unit}); ensureDay().touched=true; el.value=''; toast(`${MEASUREMENTS[type].name} saved`); render(); }

function createCustomActivity(){ const name=(document.getElementById('customActCreateName')?.value||'').trim(); if(!name){toast('Name required');return;} const id='custom_'+slug(name)+'_'+Date.now(); state.customActivities[id]={name,cat:'Custom',fav:true,defMin:45,typical:45,defInt:'moderate',mods:[],scores:readScores('actScore')}; toast('Custom activity saved'); render(); }
function createCustomHabit(){ const name=(document.getElementById('customHabitName')?.value||'').trim(); if(!name){toast('Name required');return;} const info=(document.getElementById('customHabitInfo')?.value||'100% = personal target reached.').trim(); const id='customHabit_'+slug(name)+'_'+Date.now(); state.customHabits[id]={name,info,scores:readScores('habitScore')}; toast('Custom habit saved'); render(); }
function readScores(prefix){ const scores=emptyScores(); ATTR_IDS.forEach(id=>{scores[id]=clamp(parseFloat(document.getElementById(`${prefix}_${id}`)?.value)||0,0,5)}); return scores; }
function slug(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,24)||'custom'; }
function makePrompt(){ const name=(document.getElementById('customActCreateName')?.value||'[ACTIVITY NAME]'); const prompt=`I’m creating a new activity for Body Tracker, a personal RPG-style fitness app.\n\nActivity: ${name}\nTypical duration: [DURATION]\nTypical intensity: [Easy / Moderate / Hard / Competitive / Max Effort]\n\nAvailable trainable attributes:\nStrength, Endurance, Agility, Mobility, Recovery, Nutrition\n\nRating scale: 0 none, 1 minor, 2 light, 3 moderate, 4 strong, 5 primary.\n\nCalibrate against:\nWeight Lifting: Strength 5, Endurance 1, Agility 1, Mobility 1, Recovery 0, Nutrition 0\nBasketball: Strength 1, Endurance 4, Agility 5, Mobility 1, Recovery 0, Nutrition 0\nIndian Clubs: Strength 1, Endurance 2, Agility 2, Mobility 5, Recovery 4, Nutrition 0\nYoga: Strength 1, Endurance 0, Agility 1, Mobility 5, Recovery 4, Nutrition 0\nWalking: Strength 0, Endurance 2, Agility 0, Mobility 1, Recovery 1, Nutrition 0\n\nPlease suggest attribute ratings, useful modifiers, typical duration, and a short reason. Avoid over-scoring; most activities should have 1–2 primary attributes.`; const out=document.getElementById('promptOut'); out.style.display='block'; out.textContent=prompt; navigator.clipboard?.writeText(prompt); toast('Prompt copied'); }
function makeHabitPrompt(){ const name=(document.getElementById('customHabitName')?.value||'[HABIT NAME]'); const prompt=`I’m creating a new habit for Body Tracker, a personal RPG-style fitness app.\n\nHabit: ${name}\n\nAvailable trainable attributes:\nStrength, Endurance, Agility, Mobility, Recovery, Nutrition\n\nRating scale: 0 none, 1 minor, 2 light, 3 moderate, 4 strong, 5 primary.\n\nCalibrate against:\nProtein: Strength 3, Recovery 1, Nutrition 5\nWater: Endurance 1, Recovery 3, Nutrition 5\nSleep: Strength 1, Endurance 1, Agility 1, Recovery 5\nMobility / Stretching: Agility 1, Mobility 5, Recovery 4\n\nPlease suggest attribute ratings, what counts as 100%, whether 0/50/100/150 scoring makes sense, and a short reason.`; const out=document.getElementById('habitPromptOut'); out.style.display='block'; out.textContent=prompt; navigator.clipboard?.writeText(prompt); toast('Habit prompt copied'); }

function exportData(){ downloadText('body-tracker-save-v5.json', JSON.stringify(state,null,2), 'application/json'); }
function importData(){ const txt=document.getElementById('importBox')?.value; if(!txt){toast('Paste JSON first');return;} try{ state=migrateState(JSON.parse(txt)); save(); toast('Imported'); render(); }catch(e){ toast('Import failed'); } }
function exportCsv(){ const rows=[['record_type','date','name','value','unit','duration_min','intensity','modifiers','notes']]; const acts=allActivities(), habits=allHabits(); Object.entries(state.days||{}).forEach(([date,day])=>{ (day.activities||[]).forEach(l=>rows.push(['activity',date,acts[l.activity]?.name||l.activity,'','',l.duration,l.intensity,(l.mods||[]).join('|'),l.notes||''])); Object.entries(day.habits||{}).forEach(([hid,pct])=>rows.push(['habit',date,habits[hid]?.name||hid,pct+'%','','','','',''])); Object.entries(day.exceptions||{}).forEach(([eid,on])=>{if(on)rows.push(['exception',date,EXCEPTIONS[eid]?.name||eid,'true','','','','','']);}); }); (state.measurements||[]).forEach(m=>rows.push(['measurement',m.date,MEASUREMENTS[m.type]?.name||m.type,m.value,m.unit,'','','',''])); downloadText('body-tracker-export-v5.csv', rows.map(r=>r.map(csvCell).join(',')).join('\n'), 'text/csv'); }
function csvCell(v){ v=String(v??''); return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; }
function downloadText(filename,text,type='text/plain'){ const blob=new Blob([text],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url); toast('Exported '+filename); }
function requestPersistence(){ if(navigator.storage?.persist){ navigator.storage.persist().then(ok=>toast(ok?'Persistent storage granted':'Persistent storage not granted')); } else toast('Not supported here'); }
function resetAll(){ if(confirm('Delete all local Body Tracker data?')){ state=defaultState(); save(); render(); } }

async function reloadLatestApp(){
  if(!confirm('Reload the latest app files? This clears cached app files only. Your Body Tracker save data stays on this device. Export JSON first if you want an extra backup.')) return;
  toast('Clearing app cache...');
  try{
    if('caches' in window){
      const keys = await caches.keys();
      await Promise.all(keys.filter(k=>k.startsWith('body-tracker-')).map(k=>caches.delete(k)));
    }
    if('serviceWorker' in navigator){
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r=>r.unregister()));
    }
  }catch(e){ console.warn('Reload latest failed to clear some caches', e); }
  const url = new URL(location.href);
  url.searchParams.set('refresh', Date.now());
  location.replace(url.toString());
}

function setupTabs(){ document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{ activeTab=b.dataset.tab; render(false); }); }
setupTabs(); ensureDay(); render(false); hydrateFromIndexedDB();
