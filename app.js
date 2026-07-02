/* Body Tracker v8.0.0 */
const APP_VERSION = 'v8.0.0';
const APP_BUILD = '2026-07-02.8.0.0';
const DB_SCHEMA = 'v4';
const KEY = 'bodyTracker.v2';
const LEGACY_KEY = 'bodyTracker.v1';
const DB_NAME = 'bodyTrackerDB';
const DB_STORE = 'kv';

const ATTRS = [
  ['strength','Strength','💪'],
  ['endurance','Endurance','❤️'],
  ['agility','Agility','⚡'],
  ['mobility','Flexibility','🤸'],
  ['recovery','Recovery','😴'],
  ['nutrition','Nutrition','🥗']
];
const ATTR_IDS = ATTRS.map(a=>a[0]);
const OLD_ATTR_MAP = { athleticism:'agility', bodyComp:null };
const RANKS = ['Novice','Beginner','Developing','Intermediate','Advanced','Expert','Elite'];
const BENCHMARKS = {
  beginner:{name:'Beginner',marker:25,desc:'Ramp-up target for new, returning, injured, or below-average users'},
  average:{name:'Average',marker:40,desc:'General adult health target'},
  active:{name:'Active',marker:60,desc:'Healthy recreationally active target'},
  athlete:{name:'Athlete',marker:78,desc:'High-performing athletic target'}
};
const TARGET_MULT = {beginner:.75,average:1,active:1.1,athlete:1.25};
const CALORIE_MODES = {
  cut:{name:'Cut',target:80,desc:'Eat noticeably less than normal to support fat loss while preserving training quality.'},
  reduced:{name:'Reduced',target:90,desc:'Eat slightly less than normal without an aggressive cut.'},
  maintain:{name:'Maintain',target:100,desc:'Eat about your normal amount while supporting performance and recovery.'},
  gain:{name:'Gain',target:115,desc:'Eat above normal to support muscle gain or high training load.'}
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
  strength:{name:'Strength Day',targets:{strength:32,endurance:8,agility:8,mobility:10,recovery:10,nutrition:30}},
  endurance:{name:'Endurance Day',targets:{strength:8,endurance:32,agility:10,mobility:9,recovery:10,nutrition:30}},
  agility:{name:'Agility Day',targets:{strength:8,endurance:18,agility:32,mobility:10,recovery:10,nutrition:30}},
  mobility:{name:'Flexibility Day',targets:{strength:5,endurance:6,agility:6,mobility:30,recovery:16,nutrition:30}},
  recovery:{name:'Recovery Day',targets:{strength:4,endurance:8,agility:4,mobility:18,recovery:30,nutrition:30}},
  balanced:{name:'Balanced Day',targets:{strength:18,endurance:18,agility:18,mobility:18,recovery:18,nutrition:30}},
  custom:{name:'Custom Day',targets:{strength:18,endurance:18,agility:18,mobility:18,recovery:18,nutrition:30}}
};
const DAY_FOCUS = {
  strength:{push:'Push / Chest',pull:'Pull / Back',lower:'Lower Body',coreCarry:'Core / Carry',balanced:'Balanced Strength'},
  endurance:{zone2:'Zone 2 Base',intervals:'Intervals',sport:'Sport Conditioning'},
  agility:{footwork:'Footwork',court:'Court / Ball Skill',sport:'Sport Agility'},
  mobility:{upper:'Upper / Shoulders',hips:'Hips / Lower',full:'Full Body'},
  recovery:{light:'Light Movement',mobility:'Mobility Reset',breathing:'Breathing / Downshift'},
  balanced:{full:'Full Body'},
  custom:{full:'Custom Focus'}
};
const DEFAULT_FOCUS = {strength:'lower',endurance:'zone2',agility:'footwork',mobility:'full',recovery:'light',balanced:'full',custom:'full'};
const WEEK_BUILDS = {
  balanced:{name:'Balanced Build',targets:{strength:125,endurance:125,agility:115,mobility:105,recovery:110,nutrition:210}},
  muscle:{name:'Rebuild Muscle',targets:{strength:150,endurance:95,agility:85,mobility:95,recovery:115,nutrition:220}},
  athletic:{name:'Athletic Base',targets:{strength:120,endurance:150,agility:150,mobility:105,recovery:105,nutrition:210}},
  lean:{name:'Lean Out',targets:{strength:115,endurance:150,agility:115,mobility:95,recovery:115,nutrition:230}},
  recovery:{name:'Recovery Week',targets:{strength:70,endurance:85,agility:60,mobility:150,recovery:170,nutrition:220}},
  custom:{name:'Custom',targets:{strength:125,endurance:125,agility:115,mobility:105,recovery:110,nutrition:210}}
};

const ACTIVITIES = {
  basketball:{name:'Basketball',cat:'Sports',fav:true,defMin:45,typical:45,defInt:'moderate',mods:['outdoor'],scores:{strength:1,endurance:4,agility:5,mobility:1,recovery:0,nutrition:0},focus:['agility:sport','agility:court','endurance:sport'],patterns:{squat:1,core:.5}},
  baseball:{name:'Baseball / Softball',cat:'Sports',typical:60,scores:{strength:1,endurance:2,agility:3,mobility:1,recovery:0,nutrition:0},focus:['agility:sport'],patterns:{push:.5,pull:.5,core:.5}},
  bodyweight:{name:'Bodyweight Workout',cat:'Training',typical:30,defMin:30,scores:{strength:4,endurance:2,agility:1.5,mobility:.5,recovery:0,nutrition:0},focus:['strength:balanced'],patterns:{push:1,pull:.5,squat:1,core:1}},
  boxing:{name:'Boxing',cat:'Sports',typical:30,scores:{strength:2,endurance:4,agility:4,mobility:1,recovery:0,nutrition:0},focus:['agility:sport','endurance:intervals'],patterns:{push:1,core:1}},
  breathing:{name:'Breathing / Meditation',cat:'Recovery',typical:10,defMin:10,defInt:'easy',scores:{strength:0,endurance:0,agility:0,mobility:0,recovery:5,nutrition:0},focus:['recovery:breathing'],patterns:{}},
  cleaning:{name:'Cleaning',cat:'Life',typical:45,scores:{strength:.5,endurance:2,agility:.5,mobility:.5,recovery:.5,nutrition:0},focus:['recovery:light'],patterns:{}},
  climbing:{name:'Rock Climbing',cat:'Sports',typical:45,scores:{strength:4,endurance:2,agility:3,mobility:2,recovery:0,nutrition:0},focus:['strength:pull','agility:sport'],patterns:{pull:2,core:1,hinge:.5}},
  coldPlunge:{name:'Cold Plunge',cat:'Recovery',typical:5,defMin:5,defInt:'easy',scores:{strength:0,endurance:0,agility:0,mobility:0,recovery:2,nutrition:0},focus:['recovery:breathing'],patterns:{}},
  coneDrills:{name:'Cone Drills',cat:'Training',typical:10,defMin:10,defInt:'hard',scores:{strength:.5,endurance:2,agility:5,mobility:1,recovery:0,nutrition:0},focus:['agility:footwork'],patterns:{squat:.5}},
  construction:{name:'Construction / Build Work',cat:'Life',typical:90,scores:{strength:3,endurance:2,agility:1,mobility:.5,recovery:0,nutrition:0},focus:['strength:coreCarry','strength:balanced'],patterns:{carry:1.5,hinge:1,core:.5,push:.5,pull:.5}},
  core:{name:'Core / Crunches',cat:'Training',typical:10,defMin:10,defInt:'moderate',scores:{strength:2,endurance:1,agility:.5,mobility:0,recovery:0,nutrition:0},focus:['strength:coreCarry'],patterns:{core:2}},
  cycling:{name:'Cycling',cat:'Training',typical:45,scores:{strength:.5,endurance:5,agility:.5,mobility:0,recovery:0,nutrition:0},focus:['endurance:zone2'],patterns:{squat:.5}},
  dance:{name:'Dance',cat:'Training',typical:30,scores:{strength:.5,endurance:3,agility:3,mobility:1.5,recovery:.5,nutrition:0},focus:['agility:sport','endurance:sport'],patterns:{core:.5}},
  elliptical:{name:'Elliptical',cat:'Training',fav:true,defMin:30,typical:30,defInt:'hard',scores:{strength:.5,endurance:4.5,agility:0,mobility:0,recovery:.5,nutrition:0},focus:['endurance:zone2','endurance:intervals'],patterns:{}},
  farmerCarry:{name:'Farmer Carry',cat:'Training',typical:20,defMin:10,defInt:'hard',scores:{strength:4,endurance:2,agility:1,mobility:0,recovery:0,nutrition:0},focus:['strength:coreCarry'],patterns:{carry:2,core:1,hinge:.5}},
  foamRolling:{name:'Foam Rolling',cat:'Recovery',typical:10,defMin:10,defInt:'easy',scores:{strength:0,endurance:0,agility:0,mobility:2,recovery:4,nutrition:0},focus:['recovery:mobility','mobility:full'],patterns:{}},
  football:{name:'Football',cat:'Sports',typical:45,scores:{strength:2,endurance:3,agility:5,mobility:1,recovery:0,nutrition:0},focus:['agility:sport','endurance:sport'],patterns:{push:.5,pull:.5,squat:1,core:.5}},
  footwork:{name:'Footwork Drills',cat:'Training',typical:20,defMin:10,defInt:'hard',scores:{strength:.5,endurance:2,agility:5,mobility:1,recovery:0,nutrition:0},focus:['agility:footwork'],patterns:{squat:.5}},
  garden:{name:'Gardening',cat:'Life',fav:true,defMin:60,typical:90,defInt:'moderate',mods:['outdoor'],scores:{strength:1,endurance:2,agility:.5,mobility:1,recovery:1,nutrition:0},focus:['recovery:light'],patterns:{hinge:.5,carry:.5,squat:.5}},
  hamstringStretch:{name:'Hamstring Stretch',cat:'Mobility',typical:5,defMin:5,defInt:'easy',scores:{strength:0,endurance:0,agility:0,mobility:3,recovery:2,nutrition:0},focus:['mobility:hips'],patterns:{}},
  hiking:{name:'Hiking',cat:'Life',typical:60,scores:{strength:1,endurance:4,agility:1,mobility:.5,recovery:1,nutrition:0},focus:['endurance:zone2','recovery:light'],patterns:{squat:.5,hinge:.5}},
  hipMobility:{name:'Hip Mobility',cat:'Mobility',typical:10,defMin:10,defInt:'easy',scores:{strength:0,endurance:.5,agility:.5,mobility:5,recovery:3,nutrition:0},focus:['mobility:hips','recovery:mobility'],patterns:{}},
  indianClubs:{name:'Indian Clubs',cat:'Mobility',fav:true,defMin:10,typical:20,defInt:'easy',mods:['lowImpact','skill'],scores:{strength:.5,endurance:1,agility:1.5,mobility:4.5,recovery:3,nutrition:0},focus:['mobility:upper','mobility:full','recovery:mobility'],patterns:{push:.25,pull:.25,core:.5}},
  jogging:{name:'Easy Jog',cat:'Training',typical:20,defMin:20,defInt:'moderate',scores:{strength:.5,endurance:4,agility:1,mobility:0,recovery:0,nutrition:0},focus:['endurance:zone2'],patterns:{}},
  jumpRope:{name:'Jump Rope',cat:'Training',typical:10,defMin:5,defInt:'hard',scores:{strength:.5,endurance:4,agility:4,mobility:.5,recovery:0,nutrition:0},focus:['agility:footwork','endurance:intervals'],patterns:{squat:.5,core:.5}},
  kettlebells:{name:'Kettlebells',cat:'Training',typical:30,defMin:30,defInt:'moderate',scores:{strength:4,endurance:3,agility:2,mobility:1,recovery:0,nutrition:0},focus:['strength:lower','strength:coreCarry'],patterns:{hinge:2,squat:1,core:1,carry:.5}},
  lateralShuffles:{name:'Lateral Shuffles',cat:'Training',typical:5,defMin:5,defInt:'hard',scores:{strength:.5,endurance:2,agility:4,mobility:.5,recovery:0,nutrition:0},focus:['agility:footwork'],patterns:{squat:.5}},
  lifting:{name:'Weight Lifting',cat:'Training',fav:true,defMin:45,typical:45,defInt:'moderate',scores:{strength:5,endurance:1,agility:0,mobility:.5,recovery:0,nutrition:0},focus:['strength:balanced'],patterns:{push:1,pull:1,squat:1,hinge:1,core:.5}},
  lunges:{name:'Lunges',cat:'Training',typical:10,defMin:10,defInt:'moderate',scores:{strength:3,endurance:1.5,agility:1,mobility:.5,recovery:0,nutrition:0},focus:['strength:lower'],patterns:{squat:2,core:.5}},
  martialArts:{name:'Martial Arts',cat:'Sports',typical:45,scores:{strength:2,endurance:3.5,agility:4.5,mobility:2,recovery:0,nutrition:0},focus:['agility:sport','endurance:sport'],patterns:{push:.5,pull:.5,squat:1,core:1}},
  massage:{name:'Massage',cat:'Recovery',typical:20,defMin:20,defInt:'easy',scores:{strength:0,endurance:0,agility:0,mobility:.5,recovery:5,nutrition:0},focus:['recovery:mobility'],patterns:{}},
  mobility:{name:'Flexibility Session',cat:'Mobility',typical:20,defMin:20,defInt:'easy',scores:{strength:.5,endurance:.5,agility:.5,mobility:5,recovery:3,nutrition:0},focus:['mobility:full','recovery:mobility'],patterns:{}},
  pickleball:{name:'Pickleball',cat:'Sports',typical:45,scores:{strength:.5,endurance:2.5,agility:3.5,mobility:1,recovery:0,nutrition:0},focus:['agility:court','endurance:sport'],patterns:{}},
  pilates:{name:'Pilates',cat:'Mobility',typical:30,scores:{strength:2,endurance:1.5,agility:1,mobility:4,recovery:1,nutrition:0},focus:['mobility:full','strength:coreCarry'],patterns:{core:2,push:.5,squat:.5}},
  pt:{name:'Physical Therapy',cat:'Recovery',typical:20,scores:{strength:1,endurance:0,agility:1,mobility:4,recovery:5,nutrition:0},focus:['recovery:mobility','mobility:full'],patterns:{}},
  pullups:{name:'Pull-ups / Assisted Pull-ups',cat:'Training',typical:10,defMin:5,defInt:'hard',scores:{strength:5,endurance:1,agility:.5,mobility:0,recovery:0,nutrition:0},focus:['strength:pull'],patterns:{pull:2,core:.5}},
  pushups:{name:'Push-ups',cat:'Training',typical:10,defMin:5,defInt:'moderate',scores:{strength:4,endurance:1,agility:.5,mobility:0,recovery:0,nutrition:0},focus:['strength:push'],patterns:{push:2,core:.5}},
  resistanceBands:{name:'Resistance Bands',cat:'Training',typical:25,defMin:20,defInt:'moderate',scores:{strength:3.5,endurance:1,agility:.5,mobility:1,recovery:.5,nutrition:0},focus:['strength:push','strength:pull','mobility:upper'],patterns:{push:1,pull:1,core:.5}},
  rowing:{name:'Rowing',cat:'Training',typical:30,defMin:30,defInt:'hard',scores:{strength:2,endurance:5,agility:.5,mobility:.5,recovery:0,nutrition:0},focus:['endurance:intervals','strength:pull'],patterns:{pull:1,hinge:1,core:.5}},
  rucking:{name:'Rucking / Weighted Walk',cat:'Training',typical:45,defMin:45,defInt:'moderate',scores:{strength:2,endurance:4,agility:1,mobility:0,recovery:.5,nutrition:0},focus:['endurance:zone2','strength:coreCarry'],patterns:{carry:2,core:.5,squat:.5}},
  running:{name:'Running',cat:'Training',typical:30,scores:{strength:.5,endurance:5,agility:1,mobility:0,recovery:0,nutrition:0},focus:['endurance:zone2','endurance:intervals'],patterns:{}},
  sandbag:{name:'Sandbag Training',cat:'Training',typical:30,defMin:30,defInt:'hard',scores:{strength:4.5,endurance:2.5,agility:2,mobility:.5,recovery:0,nutrition:0},focus:['strength:lower','strength:coreCarry'],patterns:{carry:1.5,hinge:1.5,squat:1,core:1}},
  sauna:{name:'Sauna',cat:'Recovery',typical:15,defMin:15,defInt:'easy',scores:{strength:0,endurance:0,agility:0,mobility:0,recovery:3,nutrition:0},focus:['recovery:breathing'],patterns:{}},
  shoulderMobility:{name:'Shoulder Mobility',cat:'Mobility',typical:10,defMin:10,defInt:'easy',scores:{strength:0,endurance:0,agility:.5,mobility:5,recovery:3,nutrition:0},focus:['mobility:upper','recovery:mobility'],patterns:{}},
  soccer:{name:'Soccer',cat:'Sports',typical:45,scores:{strength:1,endurance:4.5,agility:5,mobility:1,recovery:0,nutrition:0},focus:['agility:sport','endurance:sport'],patterns:{squat:1,core:.5}},
  squats:{name:'Bodyweight Squats',cat:'Training',typical:10,defMin:5,defInt:'moderate',scores:{strength:3,endurance:1.5,agility:1,mobility:.5,recovery:0,nutrition:0},focus:['strength:lower'],patterns:{squat:2,core:.5}},
  stairs:{name:'Stair Climbing',cat:'Training',typical:20,defMin:10,defInt:'hard',scores:{strength:1.5,endurance:4,agility:1,mobility:0,recovery:0,nutrition:0},focus:['endurance:intervals','strength:lower'],patterns:{squat:1}},
  swim:{name:'Swimming',cat:'Sports',typical:30,scores:{strength:1.5,endurance:5,agility:1,mobility:1,recovery:.5,nutrition:0},focus:['endurance:zone2','mobility:full'],patterns:{pull:.5,push:.5,core:.5}},
  tennis:{name:'Tennis',cat:'Sports',typical:45,scores:{strength:.5,endurance:3,agility:4,mobility:1,recovery:0,nutrition:0},focus:['agility:court','endurance:sport'],patterns:{core:.5}},
  ultimate:{name:'Ultimate Frisbee',cat:'Sports',typical:45,scores:{strength:.5,endurance:4.5,agility:4.5,mobility:1,recovery:0,nutrition:0},focus:['agility:sport','endurance:sport'],patterns:{squat:.5,core:.5}},
  volleyball:{name:'Volleyball',cat:'Sports',typical:45,scores:{strength:1,endurance:2.5,agility:4,mobility:1,recovery:0,nutrition:0},focus:['agility:sport'],patterns:{squat:1,push:.5,core:.5}},
  walking:{name:'Walking',cat:'Training',fav:true,defMin:30,typical:30,defInt:'easy',scores:{strength:0,endurance:2,agility:0,mobility:0,recovery:2,nutrition:0},focus:['recovery:light','endurance:zone2'],patterns:{}},
  yard:{name:'Yard Work',cat:'Life',typical:90,scores:{strength:2,endurance:3,agility:1,mobility:.5,recovery:0,nutrition:0},focus:['strength:coreCarry','endurance:zone2'],patterns:{hinge:1,carry:1,squat:.5,push:.5}},
  yoga:{name:'Yoga / Stretching',cat:'Mobility',fav:true,defMin:20,typical:25,defInt:'easy',mods:['lowImpact'],scores:{strength:.5,endurance:1,agility:.5,mobility:5,recovery:2,nutrition:0},focus:['mobility:full','recovery:mobility'],patterns:{core:.5}},
  yogaFlow:{name:'Yoga Flow',cat:'Mobility',typical:20,defMin:10,defInt:'easy',mods:['lowImpact'],scores:{strength:.5,endurance:1,agility:.5,mobility:5,recovery:2,nutrition:0},focus:['mobility:full','recovery:mobility'],patterns:{core:.5}}
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
  water:{name:'Water',info:'100% = your normal hydration target. 150–200% can make sense on hot, humid, or long activity days.',scores:{endurance:1,recovery:2,nutrition:5}},
  foodQuality:{name:'Nutrition Quality',info:'Subjective quality check. 0% = mostly junk/low nutrient; 100% = solid mostly whole-food day; 200% = unusually high-quality day.',scores:{nutrition:8,recovery:1}},
  foodQuantity:{name:'Food Quantity',info:'Subjective intake relative to your normal amount. The target marker moves based on weekly Calorie Intake: Cut, Reduced, Maintain, or Gain.',scores:{nutrition:8}},
  protein:{name:'Protein',info:'100% = roughly your protein target for the day. For many active adults this often means a meaningful protein serving at most meals.',scores:{strength:3,recovery:1,nutrition:5}},
  veggies:{name:'Vegetables',info:'100% = meaningful vegetables in 2 meals. 150–200% = unusually vegetable-heavy day.',scores:{nutrition:5,recovery:1}}
};
const EXCEPTIONS = {
  lateFood:{name:'Ate after 11 PM',penalty:{nutrition:-3,recovery:-2}},
  dessert:{name:'Dessert',penalty:{nutrition:-1}},
  alcohol:{name:'Alcohol',penalty:{recovery:-3,nutrition:-1}},
  sugary:{name:'Sugary drink',penalty:{nutrition:-2}},
  junk:{name:'Junk food',penalty:{nutrition:-3}}
};
const MEASUREMENTS = {
  weight:{name:'Weight',unit:'lb',group:'Body'},
  waist:{name:'Waist',unit:'in',group:'Body'},
  crunches:{name:'Max Crunches',unit:'reps',group:'Body'},
  bench10:{name:'Working Bench 3×10',unit:'lb',group:'Strength'},
  elliptical5:{name:'5-min Elliptical',unit:'cal',group:'Endurance'},
  rhr:{name:'Resting HR',unit:'bpm',group:'Recovery'},
  pullups:{name:'Pull-ups',unit:'reps',group:'Strength'},
  pushups:{name:'Push-ups',unit:'reps',group:'Strength'},
  sitreach:{name:'Sit-and-Reach',unit:'in',group:'Flexibility'},
  shoulderReach:{name:'Shoulder Reach',unit:'in',group:'Flexibility'}
};
const MEASUREMENT_HELP = {
  weight:'Weigh under consistent conditions, ideally morning after bathroom and before food/drink. Same scale, same location. Trend matters more than one reading.',
  waist:'Measure at the navel/abdomen after a normal exhale, tape level and snug but not compressing skin. Use the same spot every time.',
  crunches:'Count controlled crunches with consistent form until you cannot maintain range or tempo. Do not yank the neck; keep feet and setup consistent.',
  bench10:'Use your normal working weight for 3 sets of 10 at a challenging but repeatable difficulty. This is not a max test; use the weight you could reliably train with today.',
  elliptical5:'Use the same machine/settings when possible. Warm up first, then record calories shown after exactly 5 hard minutes.',
  rhr:'Measure when calm, ideally in the morning before caffeine. Wearables are fine if measured under consistent conditions.',
  pullups:'Count full controlled reps from hang/chin-over-bar using the same grip standard each time. Assisted reps should be tracked separately as a custom benchmark later.',
  pushups:'Count controlled reps with consistent depth and body line. Stop when form breaks.',
  sitreach:'After a light warmup, sit with legs straight and reach forward slowly. Record distance beyond toes as positive, short of toes as negative.',
  shoulderReach:'Use the same shoulder reach test each time, such as hand-behind-back distance or wall shoulder flexion. Record the same side/measurement method consistently.'
};
const QUICK_GAIN = {
  strength:[
    ['Push-ups — 5 min','pushups',5,'moderate'],['Pull-ups / assisted — 5 min','pullups',5,'hard'],['Bodyweight squats — 5 min','squats',5,'moderate'],['Lunges — 10 min','lunges',10,'moderate'],['Resistance bands — 10 min','resistanceBands',10,'moderate'],['Farmer carry — 10 min','farmerCarry',10,'hard'],['Core / crunches — 5 min','core',5,'moderate']
  ],
  endurance:[
    ['Brisk walk — 10 min','walking',10,'moderate'],['Jump rope — 5 min','jumpRope',5,'hard'],['Stair climbing — 5 min','stairs',5,'hard'],['Easy jog — 10 min','jogging',10,'moderate'],['Elliptical — 10 min','elliptical',10,'hard']
  ],
  agility:[
    ['Footwork drills — 5 min','footwork',5,'hard'],['Jump rope — 5 min','jumpRope',5,'hard'],['Lateral shuffles — 5 min','lateralShuffles',5,'hard'],['Cone drills — 10 min','coneDrills',10,'hard'],['Basketball movement — 15 min','basketball',15,'moderate']
  ],
  mobility:[
    ['Indian clubs — 10 min','indianClubs',10,'easy'],['Shoulder mobility — 10 min','shoulderMobility',10,'easy'],['Hip mobility — 10 min','hipMobility',10,'easy'],['Hamstring stretch — 5 min','hamstringStretch',5,'easy'],['Yoga flow — 10 min','yogaFlow',10,'easy']
  ],
  recovery:[
    ['Breathing — 5 min','breathing',5,'easy'],['Easy walk — 10 min','walking',10,'easy'],['Foam rolling — 10 min','foamRolling',10,'easy'],['Mobility reset — 10 min','mobility',10,'easy'],['Water check-in','waterHabit',0,'easy']
  ],
  nutrition:[
    ['Water check-in','waterHabit',0,'easy'],['Protein serving','proteinHabit',0,'easy'],['Vegetable serving','veggiesHabit',0,'easy'],['Nutrition quality check','foodQualityHabit',0,'easy'],['Set food quantity','foodQuantityHabit',0,'easy']
  ]
};
const ATTR_GUIDE = {
  strength:{desc:'Force production and muscle. Raised by lifting, bodyweight work, climbing, construction, heavy carries, and protein consistency.'},
  endurance:{desc:'Stamina and sustained work capacity. Raised by basketball, soccer, running, cycling, elliptical, hiking, walking, and hot/humid efforts.'},
  agility:{desc:'Quick, coordinated movement: footwork, speed, balance, rhythm, and change of direction. Raised by sports, drills, sprint intervals, jump rope, Indian clubs, and skill work.'},
  mobility:{desc:'Range of motion and quality of movement. Raised by stretching, yoga, Indian clubs, mobility sessions, PT, and climbing.'},
  recovery:{desc:'Restoration and fatigue management. Raised by sleep, easy movement, hydration, low-impact mobility, and light/restorative days.'},
  nutrition:{desc:'Daily fueling behavior. Raised by water, nutrition quality, food quantity relative to weekly calorie target, protein, vegetables, and avoiding exceptions.'}
};

function defaultState(){
  return {
    saveVersion:3,
    appVersion:APP_VERSION,
    profile:{name:'Jake',birthdate:'',age:45,height:'',sex:'male',activity:'mixed',goal:'recomp'},
    settings:{dailyBaseline:.5,weeklyBaseline:.8,maxDisplay:1.5,dailyBarScale:40,weeklyBarScale:220,weekStart:1,dayChangeHour:3,benchmark:'active'},
    days:{},measurements:[],weeklyBuild:'muscle',weeklyCalorieMode:'maintain',customActivities:{},customHabits:{},lastActivity:null,lastProfileLevels:null
  };
}
let state = migrateState(loadLocalFallback());
let activeTab = 'today';
let activeDate = appTodayKey();
let selectedChart = 'weight';
let calendarOpen = false;
let calendarMonth = activeDate.slice(0,7);
let selectedAttr = null;
let expandedDayAttr = null;
let expandedWeekAttr = null;
let profileTopExpanded = false;
let settingsHeaderExpanded = false;
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
function fmtShortDate(k){ const d=keyToDate(k); return `${d.getUTCMonth()+1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(-2)}`; }

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
  s.weeklyCalorieMode = s.weeklyCalorieMode || ({standard:'maintain',reduced:'reduced',gain:'gain'}[s.profile?.fuelDefault] || 'maintain');
  if(!CALORIE_MODES[s.weeklyCalorieMode]) s.weeklyCalorieMode='maintain';
  s.saveVersion = 3;
  s.appVersion = APP_VERSION;
  // Normalize legacy day types and fuel modes.
  Object.values(s.days).forEach(day=>{
    if(day.dayType === 'athleticism') day.dayType = 'agility';
    day.activities = day.activities || [];
    day.habits = day.habits || {};
    day.exceptions = day.exceptions || {};
    if(day.habits && day.habits.fuel != null && day.habits.foodQuantity == null){ day.habits.foodQuantity = day.habits.fuel; delete day.habits.fuel; }
    day.focus = day.focus || DEFAULT_FOCUS[day.dayType] || 'full';
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
function sortedActivities(){ return Object.entries(allActivities()).sort((a,b)=>a[1].name.localeCompare(b[1].name)); }
function targetMultiplier(){ return TARGET_MULT[state.settings?.benchmark] || 1.1; }
function scaleScores(scores,mult){ const out=emptyScores(); ATTR_IDS.forEach(id=>out[id]=(scores[id]||0)*mult); return out; }
function allHabits(){ return {...HABITS,...(state.customHabits||{})}; }
function ensureDay(k=activeDate){
  if(!state.days[k]) state.days[k] = {dayType:'strength',focus:DEFAULT_FOCUS.strength,activities:[],habits:{},exceptions:{},touched:false};
  const day = state.days[k];
  day.dayType = DAY_TYPES[day.dayType] ? day.dayType : (day.dayType === 'athleticism' ? 'agility' : 'balanced');
  day.activities = day.activities || [];
  day.habits = day.habits || {};
  day.exceptions = day.exceptions || {};
  day.focus = DAY_FOCUS[day.dayType]?.[day.focus] ? day.focus : (DEFAULT_FOCUS[day.dayType] || 'full');
  if(day.habits && day.habits.fuel != null && day.habits.foodQuantity == null){ day.habits.foodQuantity = day.habits.fuel; delete day.habits.fuel; }
  return day;
}
function getDay(k=activeDate){ return state.days[k] || null; }
function targetsForDay(day=ensureDay()){ return scaleScores(normalizeScores(DAY_TYPES[day.dayType]?.targets || DAY_TYPES.balanced.targets), targetMultiplier()); }
function weekTargets(){ return scaleScores(normalizeScores(WEEK_BUILDS[state.weeklyBuild]?.targets || WEEK_BUILDS.muscle.targets), targetMultiplier()); }

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
  // Fitness engine v8: a profile value of 5 at a typical moderate session gives about 30 points.
  const scalar = 6 * dur * int;
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
  const out = emptyScores();
  if(id === 'foodQuantity'){
    const target = CALORIE_MODES[state.weeklyCalorieMode||'maintain']?.target || 100;
    const val = clamp(Number(pct)||0,0,200);
    const diff = Math.abs(val-target);
    // Full nutrition value near the weekly intake target; falling off gradually as the subjective estimate moves away.
    out.nutrition = clamp(8 * (1 - diff/80), 0, 8);
    return out;
  }
  const base = normalizeScores(h.scores);
  const mult = (Number(pct)||0) / 100;
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
function dayProgressForPace(){
  const now = new Date();
  const start = new Date(now); start.setHours(Number(state.settings.dayChangeHour ?? 3),0,0,0);
  if(now < start) start.setDate(start.getDate()-1);
  const full = new Date(start); full.setHours(16,0,0,0);
  if(full <= start) full.setDate(full.getDate()+1);
  return clamp((now-start)/(full-start),0,1);
}
function weekProgressFraction(k=activeDate){
  const keys = weekKeys(k); const idx = Math.max(0, keys.indexOf(k));
  const today = appTodayKey();
  let currentFraction = 1;
  if(k === today) currentFraction = dayProgressForPace();
  else if(k > today) currentFraction = 0;
  return Math.min(1,(idx + currentFraction)/7);
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
function measurementCountForAttr(attr){
  const map = {
    strength:['bench10','pullups','pushups'],
    endurance:['elliptical5','rhr'],
    agility:[],
    mobility:[],
    recovery:['rhr'],
    nutrition:['waist','weight']
  };
  const set = new Set(map[attr] || []);
  return (state.measurements||[]).filter(m=>set.has(m.type)).length;
}
function touchedDayCount(){
  return Object.values(state.days||{}).filter(d=>!!(d.touched || (d.activities||[]).length || Object.keys(d.habits||{}).length || Object.keys(d.exceptions||{}).length)).length;
}
function totalAttrPoints(attr){
  return Object.keys(state.days||{}).reduce((sum,k)=> sum + Math.max(0, scoreDay(k).total[attr]||0), 0);
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
  const wt = latestMeasurement('weight')?.value || 215;
  const bench = latestMeasurement('bench10')?.value;
  const pullups = latestMeasurement('pullups')?.value;
  const pushups = latestMeasurement('pushups')?.value;
  const ell = latestMeasurement('elliptical5')?.value;
  const rhr = latestMeasurement('rhr')?.value;
  const waist = latestMeasurement('waist')?.value;
  if(attr==='strength'){
    const vals=[];
    if(bench) vals.push(clamp((bench/wt)*70,0,90));
    if(pullups) vals.push(clamp(pullups*4,0,90));
    if(pushups) vals.push(clamp(pushups*1.2,0,90));
    return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
  }
  if(attr==='endurance'){
    const vals=[];
    if(ell) vals.push(clamp((ell-35)*2.1,20,90));
    if(rhr) vals.push(clamp(95-rhr,20,85));
    return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
  }
  if(attr==='agility') return touchedDayCount() ? 20 + recentAverageCompletion('agility',56)*45 : null;
  if(attr==='mobility') return touchedDayCount() ? 15 + recentAverageCompletion('mobility',56)*50 : null;
  if(attr==='recovery'){
    const vals=[];
    if(rhr) vals.push(clamp(95-rhr,20,85));
    if(touchedDayCount()) vals.push(15 + recentAverageCompletion('recovery',56)*50);
    return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
  }
  if(attr==='nutrition'){
    if(!touchedDayCount() && !waist && !wt) return null;
    let base = 15 + recentAverageCompletion('nutrition',56)*50;
    if(waist && wt) base += clamp((wt/waist)-4.5, -10, 10)*2;
    const bfEst = estimateBodyFat();
    if(bfEst.estimate) base += clamp(24-bfEst.estimate, -10, 15);
    return clamp(base,0,95);
  }
  return null;
}
function attrLevel(attr){
  const days = touchedDayCount();
  const measurementCount = measurementCountForAttr(attr);
  const points = totalAttrPoints(attr);
  const earnedFromWork = clamp(Math.sqrt(points) * 4.2, 0, 65);
  const consistency = clamp(recentAverageCompletion(attr,56) * 100 * Math.min(1, days/21) * 0.25, 0, 25);
  const bench = benchmarkScoreForAttr(attr);
  const measuredBoost = bench == null ? 0 : bench * 0.35;
  const evidenceCap = days <= 0 ? 3 : Math.min(99, 8 + days*4 + measurementCount*12);
  const raw = Math.max(1, earnedFromWork + consistency + measuredBoost);
  return Math.round(clamp(raw,1,evidenceCap));
}
function xpPct(attr){
  const points = totalAttrPoints(attr) + recentAverageCompletion(attr,14)*10;
  if(points <= 0) return 0;
  return clamp(Math.round((points % 12) / 12 * 100), 3, 98);
}
function rankName(level){ return RANKS[Math.min(RANKS.length-1, Math.floor(level/15))]; }
function overallLevel(){
  const days = touchedDayCount();
  if(days <= 0) return 1;
  const levels = Object.fromEntries(ATTR_IDS.map(id=>[id,attrLevel(id)]));
  let avg = ATTR_IDS.reduce((a,id)=>a+levels[id],0)/ATTR_IDS.length;
  const daily = Number(state.settings.dailyBaseline ?? .5);
  let consistency = 0;
  for(let i=0;i<28;i++) if(percentOfDay(addDays(appTodayKey(),-i)) >= daily) consistency++;
  avg = avg*.9 + (consistency/28*100)*.1;
  const overallCap = Math.min(99, 6 + days*4 + (state.measurements||[]).length*3);
  return Math.round(clamp(avg,1,overallCap));
}
function levelReasons(attr){
  const reasons=[];
  const days=touchedDayCount();
  const c=recentAverageCompletion(attr,28);
  if(days < 7) reasons.push('early level is capped until more days are logged');
  if(measurementCountForAttr(attr)===0 && ['strength','endurance','recovery','nutrition'].includes(attr)) reasons.push('benchmarks will unlock more confidence');
  if(c>=.9) reasons.push('recent targets have been consistently met');
  else if(c<.45 && days>0) reasons.push('recent targets have been missed often');
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
    reasons.push('water, nutrition quality, food quantity, protein, vegetables, and exceptions affect this');
  }
  return reasons.length ? reasons : ['recent activities, habits, and benchmarks affect this level'];
}
function profileSnapshot(){
  const levels = Object.fromEntries(ATTR_IDS.map(id=>[id,attrLevel(id)]));
  return {overall:overallLevel(), attrs:levels};
}


function parseHeightInches(v){
  if(!v) return null; const s=String(v).trim().toLowerCase();
  const ft=s.match(/(\d+)\s*['ft]+\s*(\d+(?:\.\d+)?)?/); if(ft) return Number(ft[1])*12 + Number(ft[2]||0);
  const cm=s.match(/(\d+(?:\.\d+)?)\s*cm/); if(cm) return Number(cm[1])/2.54;
  const n=parseFloat(s); if(!Number.isFinite(n)) return null; return n>100 ? n/2.54 : n;
}
function ageYears(){
  if(state.profile.birthdate){ const b=new Date(state.profile.birthdate+'T12:00:00'); if(!isNaN(b)){ const now=new Date(); let a=now.getFullYear()-b.getFullYear(); const m=now.getMonth()-b.getMonth(); if(m<0 || (m===0 && now.getDate()<b.getDate())) a--; return clamp(a,16,100); }}
  return Number(state.profile.age)||45;
}
function latestValue(type){ return latestMeasurement(type)?.value ?? null; }
function bmiValue(){ const h=parseHeightInches(state.profile.height); const w=latestValue('weight'); if(!h||!w) return null; return 703*w/(h*h); }
function estimateBodyFat(){
  const h=parseHeightInches(state.profile.height); const w=latestValue('weight'); const waist=latestValue('waist'); const age=ageYears(); const sex=state.profile.sex==='female'?'female':'male';
  const sexRfm=sex==='female'?1:0; const sexDeur=sex==='male'?1:0;
  const estimates=[]; const used=[];
  if(h && waist){ const rfm = 64 - (20*(h/waist)) + (12*sexRfm); if(Number.isFinite(rfm)){ estimates.push({v:rfm,w:.7,name:'RFM height+waist'}); used.push('height','waist','sex'); } }
  if(h && w){ const bmi=703*w/(h*h); const deur = 1.20*bmi + 0.23*age - 10.8*sexDeur - 5.4; if(Number.isFinite(deur)){ estimates.push({v:deur,w:waist?.1:.65,name:'BMI+age equation'}); used.push('height','weight','age','sex'); } }
  if(!estimates.length) return {estimate:null,label:'Add weight + height',confidence:0,confidenceLabel:'Unknown',used:[],explain:'Enter height in Settings plus weight. Add waist for a much better estimate.'};
  const totalW=estimates.reduce((a,e)=>a+e.w,0); let est=estimates.reduce((a,e)=>a+e.v*e.w,0)/totalW;
  // Training benchmarks do not override anthropometrics; they increase confidence and slightly narrow uncertainty.
  const evidence = ['bench10','pullups','pushups','elliptical5','rhr','crunches','sitreach'].filter(t=>latestValue(t)!=null).length;
  const days=touchedDayCount();
  let confidence = 25 + (h?10:0) + (w?15:0) + (waist?30:0) + Math.min(10,evidence*2) + Math.min(10,days/4);
  confidence=clamp(confidence,10,95);
  const label=`${est.toFixed(1)}%`;
  const confidenceLabel = confidence<35?'Low':confidence<60?'Learning':confidence<80?'Good':'High';
  const explain = `Estimate uses ${[...new Set(used)].join(', ')}. Waist+height drives the strongest estimate; weight/BMI and age provide a secondary estimate. Performance benchmarks increase confidence but do not fake a lower body-fat value.`;
  return {estimate:clamp(est,3,60),label,confidence:Math.round(confidence),confidenceLabel,used:[...new Set(used)],explain,components:estimates};
}
function bodyFatDisplayRange(){ return (state.profile.sex==='female') ? {min:14,max:45} : {min:8,max:35}; }
function bodyFatTargetRange(){
  const sex=state.profile.sex==='female'?'female':'male'; const target=state.settings.benchmark||'active';
  const male={beginner:{min:22,max:28},average:{min:18,max:25},active:{min:14,max:20},athlete:{min:10,max:16}};
  const female={beginner:{min:30,max:36},average:{min:25,max:32},active:{min:21,max:27},athlete:{min:14,max:22}};
  return (sex==='female'?female:male)[target] || (sex==='female'?female.active:male.active);
}

function bodyFatInterpretation(est){
  if(est == null) return 'Add height, weight, and waist to get a useful estimate. This is not a medical-grade body composition test.';
  const sex=state.profile.sex==='female'?'female':'male';
  const mode=state.settings.benchmark||'active';
  const target=bodyFatTargetRange();
  const avg = sex==='female' ? 'roughly mid-20s to low-30s for many average adult women' : 'roughly high-teens to mid-20s for many average adult men';
  if(est < target.min) return `This is below your ${BENCHMARKS[mode].name} target band. Lower is not always better; prioritize strength, recovery, and sustainable eating.`;
  if(est <= target.max) return `This sits inside your ${BENCHMARKS[mode].name} target band. For most goals, focus on maintaining performance and waist/weight trends rather than chasing a lower number.`;
  return `This is above your ${BENCHMARKS[mode].name} target band. If your goal is recomposition or fat loss, focus on a small sustainable intake reduction, protein, strength training, and consistency. Average body-fat ranges vary, but ${avg}.`;
}
function openBodyFatInfo(){
  const bf=estimateBodyFat(); const comps=(bf.components||[]).map(c=>`<li>${c.name}: ${c.v.toFixed(1)}%</li>`).join('') || '<li>No calculation yet.</li>';
  const target=bodyFatTargetRange(); const range=bodyFatDisplayRange();
  openModal(`<div class="modalHead"><div><h2>Estimated Body Fat</h2><div class="small">${bf.label} · confidence ${bf.confidence||0}% (${bf.confidenceLabel})</div></div><button class="x" onclick="closeModal()">×</button></div>
  <div class="card" style="margin-top:10px"><h3>How to interpret it</h3><p>${bodyFatInterpretation(bf.estimate)}</p><div class="small">Display range: ${range.min}%–${range.max}%. Your ${BENCHMARKS[state.settings.benchmark||'active'].name} target band is ${target.min}%–${target.max}%.</div></div>
  <div class="card"><h3>How it is calculated</h3><p>${bf.explain}</p><ul>${comps}</ul><div class="small">Height + waist drives the strongest estimate. BMI/age/sex is a fallback. Bench, pull-ups, endurance, and activity history improve confidence but do not fake a lower body-fat value.</div></div>`);
}
function confidenceForAttr(attr){
  const mc=measurementCountForAttr(attr); const days=touchedDayCount(); const pct=clamp(12 + Math.min(40,days*3) + Math.min(45,mc*18),5,95);
  const label=pct<30?'Unknown':pct<55?'Estimating':pct<75?'Learning':pct<90?'Well Understood':'Highly Accurate';
  return {pct:Math.round(pct),label};
}

function clamp(v,min,max){ return Math.min(max,Math.max(min,Number(v)||0)); }
function pct(v,scale){ return `${clamp(v/scale*100,0,100)}%`; }
function overClass(v,target){ return v>=target ? ' over' : ''; }
function htmlEscape(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function openModal(html){ const m=document.getElementById('modal'); m.innerHTML=`<div class="modalCard">${html}</div>`; m.classList.add('active'); }
function closeModal(){ const m=document.getElementById('modal'); m.classList.remove('active'); m.innerHTML=''; }
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
  const focusOpts=DAY_FOCUS[day.dayType] || DAY_FOCUS.balanced;
  document.getElementById('todayScreen').innerHTML = `
    <div class="card tight">
      <div class="dateNav">
        <button class="dateSide arrowOnly" onclick="setDate('${addDays(activeDate,-1)}')">‹</button>
        <button class="dateButton centeredDate" onclick="toggleCalendar()"><span><span class="dateMain">${activeDate===appTodayKey()?'TODAY':fmtDate(activeDate)}</span><br><span class="dateSub">${fmtShortDate(activeDate)}</span></span><span class="dateCaret">▾</span></button>
        <button class="dateSide arrowOnly" onclick="setDate('${addDays(activeDate,1)}')">›</button>
      </div>
      ${calendarOpen?calendarHtml():''}
      <div class="grid2 compactControls" style="margin-top:8px">
        <div><div class="label">Day type</div><select onchange="setDayType(this.value)">${Object.entries(DAY_TYPES).map(([id,d])=>`<option value="${id}" ${day.dayType===id?'selected':''}>${d.name}</option>`).join('')}</select></div>
        <div><div class="label">Day focus</div><select onchange="setDayFocus(this.value)">${Object.entries(focusOpts).map(([id,label])=>`<option value="${id}" ${day.focus===id?'selected':''}>${label}</option>`).join('')}</select></div>
      </div>
      <div class="focusNote small">Focus: ${focusOpts[day.focus] || 'Full Body'} · Recommendations prioritize this focus, but all activities stay available.</div>
    </div>
    <div class="card compactCard">
      <div class="cardTitle"><h2>Today's targets</h2><span class="small">tap any bar</span></div>
      ${ATTRS.map(([id,name,icon])=>attrBar(id,name,icon,scored.total[id],targets[id],40,'day')).join('')}
    </div>
    ${recommendationsHtml()}
    ${activityLoggerHtml()}
    ${habitsHtml()}
    ${measurementsQuickHtml()}
    ${todayLogsHtml()}
  `;
}
function attrBar(id,name,icon,actual,target,scale=40,context='modal'){
  const fill = Math.min(actual,scale); const marker = clamp(target/scale*100,0,100);
  const expanded = context==='day' ? expandedDayAttr===id : false;
  const handler = context==='day' ? `onclick="toggleDayAttr('${id}')"` : `onclick="openAttrGuide('${id}')"`;
  return `<div class="attrBlock"><div class="attrRow" ${handler}><div class="attrTop"><div class="attrName">${icon||''} ${name}</div><div class="attrScore">${actual.toFixed(1)} / ${target.toFixed(0)} ${expanded?'▴':'▾'}</div></div><div class="barWrap"><div class="bar"><div class="barFill${overClass(actual,target)}" style="width:${pct(fill,scale)}"></div></div><div class="targetMark" style="left:${marker}%"></div><div class="markLabel" style="left:${marker}%">target</div></div></div>${expanded?dayAttrDetailHtml(id):''}</div>`;
}
function dayAttrDetailHtml(id){
  const day=ensureDay(); const actual=scoreDay(activeDate).total[id]||0; const target=targetsForDay(day)[id]||0; const remaining=Math.max(0,target-actual);
  const contributors=scoreDay(activeDate).by.filter(b=>Math.abs(b.scores[id]||0)>0).sort((a,b)=>Math.abs(b.scores[id])-Math.abs(a.scores[id]));
  const recs=recommendActivities(3,id);
  return `<div class="inlineDetail"><div class="small">${remaining>0?`${remaining.toFixed(1)} points remaining today.`:'Target met or exceeded today.'}</div><div class="divider compactDivider"></div><div class="label">What increased this today</div>${contributors.length?contributors.map(c=>`<div class="row spread small"><span>${c.name}</span><span>${(c.scores[id]||0).toFixed(1)}</span></div>`).join(''):'<div class="small">Nothing logged yet affected this bar.</div>'}<div class="label" style="margin-top:8px">Recommended next</div><div class="row compactRow">${recs.map(r=>`<button class="chip" onclick="prepActivity('${r.id}')">${r.name}</button>`).join('')}</div></div>`;
}
function toggleDayAttr(id){ expandedDayAttr = expandedDayAttr===id ? null : id; render(false); }

function activityUseCount(id){
  return Object.values(state.days||{}).reduce((sum,d)=>sum+(d.activities||[]).filter(l=>l.activity===id).length,0);
}
function focusMatches(activity,day=ensureDay()){
  const tags=activity.focus||[]; const exact=`${day.dayType}:${day.focus}`;
  return tags.includes(exact) || tags.some(t=>t.startsWith(day.dayType+':'));
}
function recommendationScore(id,a,desiredAttr=null){
  const day=ensureDay(); const targets=targetsForDay(day); const actual=scoreDay(activeDate).total; const scores=normalizeScores(a.scores);
  let score=0;
  ATTR_IDS.forEach(attr=>{ const remain=Math.max(0,(targets[attr]||0)-(actual[attr]||0)); score += remain * (scores[attr]||0); });
  if(desiredAttr) score += 30*(scores[desiredAttr]||0);
  if(focusMatches(a,day)) score += 30;
  score += Math.min(18, activityUseCount(id)*3);
  if(a.fav) score += 8;
  if(a.cat==='Recovery' && day.dayType!=='recovery') score -= 10;
  return score;
}
function recommendActivities(limit=5,desiredAttr=null){
  return sortedActivities().map(([id,a])=>({id,name:a.name,a,score:recommendationScore(id,a,desiredAttr)}))
    .filter(r=>r.score>0).sort((a,b)=>b.score-a.score).slice(0,limit);
}
function recommendationsHtml(){
  const day=ensureDay(); const focusLabel=(DAY_FOCUS[day.dayType]||{})[day.focus] || 'Full Body';
  const recs=recommendActivities(5);
  return `<div class="card compactCard"><div class="cardTitle"><h3>Recommended Today</h3><span class="small">${focusLabel}</span></div><div class="recList">${recs.map(r=>`<button class="recItem" onclick="prepActivity('${r.id}')"><strong>${r.name}</strong><span>${recommendationReason(r.id,r.a)}</span></button>`).join('')}</div></div>`;
}
function recommendationReason(id,a){
  const day=ensureDay(); const focusLabel=(DAY_FOCUS[day.dayType]||{})[day.focus] || 'today';
  if(focusMatches(a,day)) return `Fits ${focusLabel}`;
  if(activityUseCount(id)>0) return `You use this often`;
  const top=ATTR_IDS.slice().sort((x,y)=>(normalizeScores(a.scores)[y]||0)-(normalizeScores(a.scores)[x]||0))[0];
  return `Helps ${ATTRS.find(x=>x[0]===top)?.[1] || 'today'}`;
}
function calendarHtml(){
  const [y,m]=calendarMonth.split('-').map(Number); const first=new Date(Date.UTC(y,m-1,1,12)); const days=new Date(Date.UTC(y,m,0,12)).getUTCDate();
  const startDow=Number(state.settings.weekStart??1); const offset=(first.getUTCDay()-startDow+7)%7; const names=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']; const ordered=Array.from({length:7},(_,i)=>names[(startDow+i)%7]);
  let cells=[]; for(let i=0;i<offset;i++) cells.push('<div class="calDay blank"></div>');
  for(let d=1; d<=days; d++){
    const k=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; const st=dayStatus(k); const dot=st==='blank'?'':`<span class="dot ${st}"></span>`;
    const measured=(state.measurements||[]).some(mm=>mm.date===k);
    cells.push(`<button class="calDay ${k===activeDate?'active':''} ${k===appTodayKey()?'today':''} ${measured?'hasMeasurement':''}" onclick="selectCalendarDate('${k}')">${d}${dot}</button>`);
  }
  return `<div class="calendar"><div class="row spread"><button class="btn" onclick="moveCal(-1)">‹</button><strong>${first.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</strong><button class="btn" onclick="moveCal(1)">›</button></div><div class="calGrid" style="margin-top:8px">${ordered.map(n=>`<div class="calHead">${n}</div>`).join('')}${cells.join('')}</div><div class="legend small" style="margin-top:10px"><span><i class="miniDot"></i> none</span><span><i class="miniDot yellow"></i> logged</span><span><i class="miniDot green"></i> target met</span><span><i class="miniBench"></i> benchmark</span></div></div>`;
}
function activityLoggerHtml(){
  const acts=allActivities(); const a=acts[form.activity]||ACTIVITIES.basketball;
  const primary = ATTR_IDS.slice().sort((x,y)=>(normalizeScores(a.scores)[y]||0)-(normalizeScores(a.scores)[x]||0))[0];
  const typicalScore = normalizeScores(a.scores)[primary]*6;
  return `<div class="card"><div class="cardTitle"><h3>Log activity</h3><span class="small">typical ${a.typical||a.defMin||45} min</span></div>
    <div class="label">Activity</div><select onchange="selectActivity(this.value)">${sortedActivities().map(([id,act])=>`<option value="${id}" ${form.activity===id?'selected':''}>${act.name}</option>`).join('')}</select>
    <div class="grid2" style="margin-top:8px"><div><div class="label">Duration</div><input type="number" min="1" value="${form.duration}" oninput="form.duration=Number(this.value)||0"></div><div><div class="label">Intensity</div><select onchange="setIntensity(this.value)">${Object.entries(INTENSITY_LABEL).map(([id,n])=>`<option value="${id}" ${form.intensity===id?'selected':''}>${n}</option>`).join('')}</select></div></div>
    <div class="row" style="margin-top:8px">${[15,30,45,60,90,120].map(m=>`<button class="chip ${form.duration===m?'active':''}" onclick="setDuration(${m})">${m}</button>`).join('')}</div>
    <div class="label" style="margin-top:10px">Modifiers</div><div class="row">${Object.entries(MODS).map(([id,m])=>`<button class="chip ${form.mods.includes(id)?'active':''}" onclick="toggleMod('${id}')">${m.name}</button>`).join('')}</div>
    <div class="small" style="margin-top:8px">A typical moderate ${a.name} session gives about ${typicalScore.toFixed(1)} ${ATTRS.find(x=>x[0]===primary)?.[1]} points before modifiers.</div>
    <textarea id="actNotes" placeholder="Notes" style="margin-top:8px">${htmlEscape(form.notes||'')}</textarea>
    <button class="btn primary full" style="margin-top:8px" onclick="saveActivity()">Save Activity</button>
  </div>`;
}
function todayLogsHtml(){
  const day=ensureDay(); const acts=allActivities(); const habits=allHabits();
  const dayMeasurements=(state.measurements||[]).filter(m=>m.date===activeDate);
  const items=[];
  (day.activities||[]).forEach((l,i)=>items.push(`<div class="logLine"><span>Activity · ${acts[l.activity]?.name||l.activity} · ${l.duration} min · ${INTENSITY_LABEL[l.intensity]||l.intensity}</span><button class="btn miniBtn" onclick="editActivity(${i})">edit</button><button class="btn bad miniBtn" onclick="deleteActivity(${i})">delete</button></div>`));
  Object.entries(day.habits||{}).forEach(([hid,pct])=>items.push(`<div class="logLine"><span>Habit · ${habits[hid]?.name||hid} · ${pct}%</span><button class="btn bad miniBtn" onclick="deleteHabit('${hid}')">delete</button></div>`));
  Object.entries(day.exceptions||{}).forEach(([eid,on])=>{ if(on) items.push(`<div class="logLine"><span>Exception · ${EXCEPTIONS[eid]?.name||eid}</span><button class="btn bad miniBtn" onclick="deleteException('${eid}')">delete</button></div>`); });
  dayMeasurements.forEach(m=>items.push(`<div class="logLine"><span>Benchmark · ${MEASUREMENTS[m.type]?.name||m.type}: ${m.value} ${m.unit}</span><button class="btn bad miniBtn" onclick="deleteMeasurement('${m.type}','${m.date}')">delete</button></div>`));
  return `<div class="card"><div class="cardTitle"><h3>Day log</h3><span class="small">${items.length} entries</span></div>${items.length?items.join(''):'<div class="small">No logged data for this day yet.</div>'}</div>`;
}
function habitIcon(id){ return ({water:'💧',foodQuality:'✨',foodQuantity:'🍽️',protein:'🥩',veggies:'🥦'})[id] || '◇'; }
function habitsHtml(){
  const day=ensureDay(), habits=allHabits(); const mode=CALORIE_MODES[state.weeklyCalorieMode||'maintain'];
  const chipRow=(id,vals=[0,50,100,150,200])=>`<div class="habitChips">${vals.map(p=>`<button class="chip ${Number(day.habits[id]||0)===p?'active':''}" onclick="setHabit('${id}',${p})">${p===200?'200%+':p+'%'}</button>`).join('')}</div>`;
  return `<div class="card compactCard"><div class="cardTitle"><h3>Nutrition / habits</h3><span class="small">${mode.name} week</span></div>
    <div class="habitGrid">
      <div class="habitCompact"><div class="habitHead"><span>${habitIcon('water')} Water</span><button class="infoBtn" onclick="habitInfo('water')">?</button></div>${chipRow('water')}</div>
      <div class="habitCompact"><div class="habitHead"><span>${habitIcon('foodQuality')} Nutrition Quality</span><button class="infoBtn" onclick="habitInfo('foodQuality')">?</button></div>${chipRow('foodQuality')}</div>
      <div class="habitCompact"><div class="habitHead"><span>${habitIcon('foodQuantity')} Food Quantity</span><button class="infoBtn" onclick="habitInfo('foodQuantity')">?</button></div><div class="quantityTarget"><span style="left:${mode.target/2}%"></span><em style="left:${mode.target/2}%">target ${mode.target}%</em></div>${chipRow('foodQuantity')}</div>
      <div class="habitCompact"><div class="habitHead"><span>${habitIcon('protein')} Protein</span><button class="infoBtn" onclick="habitInfo('protein')">?</button></div>${chipRow('protein')}</div>
      <div class="habitCompact"><div class="habitHead"><span>${habitIcon('veggies')} Vegetables</span><button class="infoBtn" onclick="habitInfo('veggies')">?</button></div>${chipRow('veggies')}</div>
    </div>
    <div class="divider compactDivider"></div><div class="label">Exceptions</div><div class="row compactRow">${Object.entries(EXCEPTIONS).map(([id,e])=>`<button class="chip ${day.exceptions[id]?'red active':''}" onclick="toggleException('${id}')">+ ${e.name}</button>`).join('')}</div>
  </div>`;
}
function measurementsQuickHtml(){
  const groups = {};
  Object.entries(MEASUREMENTS).forEach(([id,m])=>{ (groups[m.group||'Other'] ||= []).push([id,m]); });
  return `<div class="card"><div class="cardTitle"><h3>Benchmarks</h3><button class="btn" onclick="activeTab='trends';render()">Graphs</button></div>
    ${Object.entries(groups).map(([g,items])=>`<div class="benchGroup"><div class="label">${g}</div><div class="grid2 land3">${items.map(([id,m])=>{
      const todayVal = (state.measurements||[]).find(x=>x.date===activeDate && x.type===id)?.value;
      const latest = latestMeasurement(id)?.value;
      return `<div><button class="measureTitle" onclick="measurementInfo('${id}')">${m.name} (${m.unit})</button><input id="m_${id}" type="number" step="0.1" value="${todayVal??''}" placeholder="${latest??''}"></div>`;
    }).join('')}</div></div>`).join('')}
    <button class="btn primary full" style="margin-top:10px" onclick="saveBenchmarksForDay()">Submit Benchmarks</button>
    <div class="small" style="margin-top:6px">Submit overwrites any benchmark values already saved for this date.</div>
  </div>`;
}
function saveBenchmarksForDay(){
  let saved = 0;
  Object.keys(MEASUREMENTS).forEach(type=>{
    const el=document.getElementById('m_'+type); if(!el) return;
    const raw=String(el.value||'').trim();
    state.measurements=state.measurements.filter(m=>!(m.date===activeDate&&m.type===type));
    if(raw !== ''){
      const value=parseFloat(raw); if(Number.isFinite(value)){ state.measurements.push({date:activeDate,type,value,unit:MEASUREMENTS[type].unit}); saved++; }
    }
  });
  ensureDay().touched=true; toast(saved?`Saved ${saved} benchmark${saved===1?'':'s'}`:'No benchmark values entered'); render();
}
function measurementInfo(type){
  const m=MEASUREMENTS[type];
  openModal(`<div class="modalHead"><div><h2>${m.name}</h2><div class="small">How to measure consistently</div></div><button class="x" onclick="closeModal()">×</button></div><div class="card" style="margin-top:10px"><p>${MEASUREMENT_HELP[type]||'Use the same method every time. Consistency matters more than perfection.'}</p></div>`);
}
function renderWeek(){
  const actual=weekScores(activeDate), targets=weekTargets(), pace=avgAheadBehind(activeDate);
  const paceClass = Math.abs(pace)<5?'statusGood':pace>=0?'statusGood':'statusBad';
  const paceLabel = Math.abs(pace)<5 ? 'On pace' : pace>0 ? 'Ahead' : 'Behind';
  const mode=state.weeklyCalorieMode||'maintain';
  document.getElementById('weekScreen').innerHTML = `<div class="card"><div class="cardTitle"><h2>Weekly build</h2><span class="pacePill ${paceClass}"><strong>${pace>=0?'+':'−'}${Math.abs(pace).toFixed(0)}%</strong><em>${paceLabel}</em></span></div>
    <div class="grid2"><div><div class="label">Weekly goal</div><select onchange="state.weeklyBuild=this.value;render()">${Object.entries(WEEK_BUILDS).map(([id,w])=>`<option value="${id}" ${state.weeklyBuild===id?'selected':''}>${w.name}</option>`).join('')}</select></div><div><div class="label">Calorie intake</div><select onchange="state.weeklyCalorieMode=this.value;render()">${Object.entries(CALORIE_MODES).map(([id,m])=>`<option value="${id}" ${mode===id?'selected':''}>${m.name}</option>`).join('')}</select></div></div>
    <div class="small" style="margin:8px 0">${CALORIE_MODES[mode].desc} Food Quantity target this week: ${CALORIE_MODES[mode].target}% of normal intake.</div>
    <div class="small" style="margin:8px 0">Pace uses your week start and time of day. Today ramps from your day-start time to a full-day expectation by 4 PM.</div>
    ${ATTRS.map(([id,name,icon])=>weeklyBar(id,name,icon,actual[id],targets[id])).join('')}
    ${weeklyFocusPlanHtml()}
  </div>`;
}
function weeklyBar(id,name,icon,actual,target){
  const frac = weekProgressFraction(activeDate); const expected = target*frac; const pace = expected ? ((actual-expected)/expected*100) : 0; const paceClass=pace>=0?'statusGood':'statusBad';
  const scale=Math.max(100,target*1.2,actual*1.05); const tarPct=clamp(target/scale*100,0,100); const expanded=expandedWeekAttr===id;
  return `<div class="attrBlock"><div class="attrRow" onclick="toggleWeekAttr('${id}')"><div class="attrTop"><div class="attrName">${icon} ${name}</div><div class="attrScore"><span class="${paceClass}">${pace>=0?'+':'−'}${Math.abs(pace).toFixed(0)}%</span> · ${actual.toFixed(1)} / ${target.toFixed(0)} ${expanded?'▴':'▾'}</div></div><div class="barWrap"><div class="bar"><div class="barFill${actual>=target?' over':''}" style="width:${pct(actual,scale)}"></div></div><div class="targetMark" style="left:${tarPct}%"></div><div class="markLabel" style="left:${tarPct}%">week</div></div></div>${expanded?weekAttrDetailHtml(id,actual,target,expected):''}</div>`;
}
function toggleWeekAttr(id){ expandedWeekAttr = expandedWeekAttr===id ? null : id; render(false); }
function weekAttrDetailHtml(id,actual,target,expected){
  const remaining=Math.max(0,target-actual); const paceGap=actual-expected; const recs=recommendActivities(3,id);
  return `<div class="inlineDetail"><div class="small">${remaining.toFixed(1)} remaining this week. You are ${paceGap>=0?paceGap.toFixed(1)+' ahead of pace':Math.abs(paceGap).toFixed(1)+' behind pace'}.</div><div class="label" style="margin-top:8px">Recommended options</div><div class="row compactRow">${recs.map(r=>`<button class="chip" onclick="activeTab='today';prepActivity('${r.id}')">${r.name}</button>`).join('')}</div></div>`;
}
function weeklyFocusPlanHtml(){
  const build=state.weeklyBuild||'muscle';
  const plans={
    muscle:['Strength — Push / Chest','Endurance — Zone 2','Strength — Lower Body','Recovery — Mobility Reset','Strength — Pull / Back','Agility — Sport','Recovery — Light Movement'],
    athletic:['Agility — Footwork','Strength — Lower Body','Endurance — Intervals','Flexibility — Full Body','Strength — Push / Pull','Sport Conditioning','Recovery — Light Movement'],
    lean:['Strength — Lower Body','Endurance — Zone 2','Agility — Footwork','Strength — Push / Pull','Endurance — Intervals','Flexibility — Full Body','Recovery — Light Movement'],
    recovery:['Recovery — Light Movement','Flexibility — Hips / Lower','Recovery — Breathing','Flexibility — Upper / Shoulders','Walking / Zone 2','Mobility Reset','Restorative Day'],
    balanced:['Strength — Lower Body','Endurance — Zone 2','Strength — Push','Flexibility — Full Body','Strength — Pull','Agility — Sport','Recovery — Light'],
    custom:['Plan your own focus days']
  };
  return `<div class="divider"></div><div class="label">Suggested weekly focus plan</div><div class="weekPlan">${(plans[build]||plans.balanced).map(x=>`<span>${x}</span>`).join('')}</div>`;
}
let expandedProfile = {};
function renderProfile(){
  const snap=profileSnapshot(); const bench=BENCHMARKS[state.settings.benchmark]||BENCHMARKS.active; const bf=estimateBodyFat();
  const last=state.lastProfileLevels; const changes=[];
  if(last){ if(snap.overall!==last.overall) changes.push(`Overall ${last.overall} → ${snap.overall}`); ATTR_IDS.forEach(id=>{ if(snap.attrs[id]!==last.attrs?.[id]) changes.push(`${ATTRS.find(a=>a[0]===id)[1]} ${last.attrs?.[id]||'?'} → ${snap.attrs[id]}`); }); }
  if(activeTab === 'profile') { state.lastProfileLevels = snap; save(); }
  document.getElementById('profileScreen').innerHTML = `<div class="card rankCard" onclick="toggleProfileTop()"><div class="cardTitle"><h2>Profile</h2><span class="pill">Benchmark: ${bench.name} ${profileTopExpanded?'▴':'▾'}</span></div>
    <div class="small">Overall Fitness</div><div class="metricBig">Level ${snap.overall}</div>${rankBar(snap.overall, xpPct('strength'), bench.marker, rankName(snap.overall))}
    ${profileTopExpanded?`<div class="small" style="margin-top:10px">The purple marker is your selected benchmark target. Levels are earned from training history, habits, and benchmarks; rank confidence improves as you add benchmark evidence. Estimated body fat lives as its own expandable attribute below.</div>`:''}
  </div>
  <div class="card"><div class="cardTitle"><h3>Attribute levels</h3><span class="small">tap to expand</span></div>${ATTRS.map(([id,name,icon])=>profileAttr(id,name,icon,bench.marker)).join('')}${bodyFatProfileBar(bench)}</div>
  <div class="card"><div class="cardTitle"><h3>Level movement</h3></div>${changes.length?`<ul>${changes.slice(0,8).map(c=>`<li>${c}</li>`).join('')}</ul>`:'<div class="small">No level movement since last profile check. Levels change as recent consistency and benchmarks change.</div>'}</div>
  <div class="card"><div class="cardTitle"><h3>Traits</h3></div>${traitsHtml()}</div>`;
}
function toggleProfileTop(){ profileTopExpanded=!profileTopExpanded; render(false); }
function rankBar(level,xp,benchmark,rank){
  return `<div class="barWrap profileBar"><div class="xpBar"><div class="xpFill" style="width:${xp}%"></div></div><div class="rankTrack"><div class="rankFill" style="width:${level}%"></div></div><div class="benchMark" style="left:${benchmark}%"></div><div class="rankLabels"><span>Novice</span><span>Beginner</span><span>Developing</span><span>Intermediate</span><span>Advanced</span><span>Elite</span></div><div class="row spread"><span class="small">Rank: ${rank}</span><span class="small">XP ${xp}%</span></div></div>`;
}

function strengthPatternTotals(days=84){
  const totals={push:0,pull:0,squat:0,hinge:0,carry:0,core:0};
  for(let i=0;i<days;i++){
    const k=addDays(appTodayKey(),-i); const d=getDay(k); if(!d) continue;
    (d.activities||[]).forEach(log=>{
      const a=allActivities()[log.activity]; if(!a||!a.patterns) return;
      const dur=durationFactor(Number(log.duration)||0, Number(a.typical)||Number(a.defMin)||45);
      const int=INTENSITY[log.intensity]||1;
      Object.entries(a.patterns).forEach(([p,v])=>{ if(totals[p]!=null) totals[p]+=Number(v)*dur*int; });
    });
  }
  return totals;
}
function strengthBalanceHtml(){
  const totals=strengthPatternTotals(); const max=Math.max(1,...Object.values(totals));
  const labels={push:'Push / chest',pull:'Pull / back',squat:'Squat / legs',hinge:'Hinge / posterior',carry:'Carry / grip',core:'Core / rotation'};
  return `<div class="divider compactDivider"></div><div class="label">Strength balance</div>${Object.entries(labels).map(([id,label])=>`<div class="balanceRow"><span>${label}</span><div><i style="width:${clamp(totals[id]/max*100,0,100)}%"></i></div></div>`).join('')}<div class="small" style="margin-top:6px">The app uses this to recommend a well-rounded weekly strength plan without adding extra top-level bars.</div>`;
}
function profileAttr(id,name,icon,benchmark){
  const level=attrLevel(id), xp=xpPct(id), rank=rankName(level), expanded=!!expandedProfile[id], conf=confidenceForAttr(id);
  return `<div class="profileAttr"><div class="attrRow" onclick="toggleProfileAttr('${id}')"><div class="attrTop"><div class="attrName">${icon} ${name}</div><div class="attrScore">Level ${level} · ${rank} ${expanded?'▴':'▾'}</div></div>${rankBar(level,xp,benchmark,rank)}</div>${expanded?`<div class="profileDetail"><div class="small">Confidence: ${conf.label} · ${conf.pct}%</div><div class="miniConf"><div style="width:${conf.pct}%"></div></div><ul>${levelReasons(id).map(r=>`<li>${r}</li>`).join('')}</ul>${id==='strength'?strengthBalanceHtml():''}<button class="btn full" onclick="openAttrGuide('${id}')">What affects ${name}?</button></div>`:''}</div>`;
}
function bodyFatProfileBar(bench){
  const bf=estimateBodyFat(); const expanded=!!expandedProfile.bodyfat; const val=bf.estimate ?? 0; const range=bodyFatDisplayRange(); const pctPos = bf.estimate==null ? 0 : clamp((val-range.min)/(range.max-range.min)*100,0,100);
  const target=bodyFatTargetRange(); const t1=clamp((target.min-range.min)/(range.max-range.min)*100,0,100), t2=clamp((target.max-range.min)/(range.max-range.min)*100,0,100);
  return `<div class="profileAttr"><div class="attrRow" onclick="toggleProfileAttr('bodyfat')"><div class="attrTop"><div class="attrName">◌ Estimated Body Fat</div><div class="attrScore">${bf.label} · ${bf.confidenceLabel} ${expanded?'▴':'▾'}</div></div><div class="bodyFatBar"><div class="bfTarget" style="left:${t1}%;width:${Math.max(1,t2-t1)}%"></div><div class="bfMarker" style="left:${pctPos}%"></div></div><div class="rankLabels"><span>${range.min}%</span><span>Target</span><span>${range.max}%</span></div></div>${expanded?`<div class="profileDetail"><p>${bf.explain}</p><button class="btn full" onclick="openBodyFatInfo()">Show variables</button></div>`:''}</div>`;
}
function toggleProfileAttr(id){ expandedProfile[id]=!expandedProfile[id]; render(false); }
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
  document.getElementById('trendsScreen').innerHTML = `<div class="card"><div class="cardTitle"><h2>Benchmarks</h2><select onchange="selectedChart=this.value;render()">${Object.entries(MEASUREMENTS).map(([id,m])=>`<option value="${id}" ${selectedChart===id?'selected':''}>${m.name}</option>`).join('')}</select></div><canvas id="trendCanvas" class="spark chartWide"></canvas><div class="small" style="margin-top:8px">Rotate your phone for a wider graph.</div></div><div class="card"><table class="table"><tr><th>Date</th><th>Value</th></tr>${data.slice(-12).reverse().map(m=>`<tr><td>${m.date}</td><td>${m.value} ${m.unit}</td></tr>`).join('')}</table></div>`;
  setTimeout(drawTrend,0);
}
function drawTrend(){
  const c=document.getElementById('trendCanvas'); if(!c) return; const ctx=c.getContext('2d'); const rect=c.getBoundingClientRect(); const dpr=window.devicePixelRatio||1; c.width=rect.width*dpr; c.height=rect.height*dpr; ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,rect.width,rect.height); ctx.strokeStyle='#243524'; ctx.lineWidth=1; for(let i=1;i<5;i++){ const y=rect.height*i/5; ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(rect.width,y);ctx.stroke(); }
  const data=(state.measurements||[]).filter(m=>m.type===selectedChart).sort((a,b)=>a.date.localeCompare(b.date)).slice(-40); if(data.length<2){ ctx.fillStyle='#88a889'; ctx.fillText('Add at least two benchmarks.',12,24); return; }
  const vals=data.map(m=>Number(m.value)); const min=Math.min(...vals), max=Math.max(...vals); const pad=(max-min)||1;
  ctx.strokeStyle='#80f278'; ctx.lineWidth=2; ctx.beginPath(); data.forEach((m,i)=>{ const x=12+(rect.width-24)*(i/(data.length-1)); const y=rect.height-14-(rect.height-32)*((m.value-min)/pad); if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
  ctx.fillStyle='#e6ffe2'; ctx.fillText(`${MEASUREMENTS[selectedChart].name}: ${data[0].value} → ${data[data.length-1].value} ${MEASUREMENTS[selectedChart].unit}`,12,18);
}
function renderSettings(){
  const bench=state.settings.benchmark||'active';
  document.getElementById('settingsScreen').innerHTML = `<div class="card settingsHero" onclick="toggleSettingsHeader()"><div class="cardTitle"><h2>Body Tracker</h2><span class="versionBadge">${APP_VERSION} ${settingsHeaderExpanded?'▴':'▾'}</span></div>${settingsHeaderExpanded?`<div class="small">Build ${APP_BUILD} · Storage: IndexedDB-first · DB schema: ${DB_SCHEMA} · Save schema ${state.saveVersion||3}</div><div class="small">Cache: body-tracker-${APP_VERSION}-20260702</div>`:''}</div>
  <div class="card"><div class="cardTitle"><h3>Profile / comparison</h3></div><div class="grid2"><div><div class="label">Name</div><input value="${htmlEscape(state.profile.name||'')}" onchange="state.profile.name=this.value;render()"></div><div><div class="label">Height</div><input placeholder="e.g. 6'0 or 72" value="${htmlEscape(state.profile.height||'')}" onchange="state.profile.height=this.value;render()"></div><div><div class="label">Birthdate</div><input type="date" value="${htmlEscape(state.profile.birthdate||'')}" onchange="state.profile.birthdate=this.value;render()"></div><div><div class="label">Sex / gender baseline</div><select onchange="state.profile.sex=this.value;render()"><option value="male" ${state.profile.sex==='male'?'selected':''}>Male</option><option value="female" ${state.profile.sex==='female'?'selected':''}>Female</option></select></div><div><div class="label">Benchmark target</div><select onchange="state.settings.benchmark=this.value;render()">${Object.entries(BENCHMARKS).map(([id,b])=>`<option value="${id}" ${bench===id?'selected':''}>${b.name}</option>`).join('')}</select></div></div><div class="small" style="margin-top:8px">Beginner is an achievable ramp-up target. Weight and waist are Benchmarks because they change over time.</div></div>
  <div class="card"><div class="cardTitle"><h3>Time settings</h3></div><div class="grid2"><div><div class="label">Week starts on</div><select onchange="state.settings.weekStart=Number(this.value);render()">${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((n,i)=>`<option value="${i}" ${Number(state.settings.weekStart)===i?'selected':''}>${n}</option>`).join('')}</select></div><div><div class="label">Day changes at</div><select onchange="state.settings.dayChangeHour=Number(this.value);activeDate=appTodayKey();render()">${Array.from({length:24},(_,i)=>`<option value="${i}" ${Number(state.settings.dayChangeHour)===i?'selected':''}>${String(i).padStart(2,'0')}:00</option>`).join('')}</select></div></div></div>
  <div class="card"><div class="cardTitle"><h3>Scoring thresholds</h3></div><div class="grid2"><div><div class="label">Daily baseline %</div><input type="number" value="${Math.round(state.settings.dailyBaseline*100)}" onchange="state.settings.dailyBaseline=(Number(this.value)||50)/100;render()"></div><div><div class="label">Weekly baseline %</div><input type="number" value="${Math.round(state.settings.weeklyBaseline*100)}" onchange="state.settings.weeklyBaseline=(Number(this.value)||80)/100;render()"></div></div></div>
  ${customToolsHtml()}
  <div class="card"><div class="cardTitle"><h3>Backup</h3></div><div class="grid2"><button class="btn" onclick="exportData()">Export JSON</button><button class="btn" onclick="exportCsv()">Export CSV</button></div><input id="jsonFileImport" type="file" accept="application/json,.json" style="margin-top:8px" onchange="importJsonFile(this.files&&this.files[0])"><button class="btn full" onclick="document.getElementById('jsonFileImport').click()">Import JSON file</button><textarea id="importBox" placeholder="Or paste JSON backup here" style="margin-top:8px"></textarea><button class="btn full" onclick="importData()">Import pasted JSON</button><button class="btn full" onclick="requestPersistence()">Request persistent storage</button><button class="btn full" onclick="updateApp()">Update app</button><div class="small" style="margin-top:8px">Installed web apps can be stubborn. Update clears app caches and reloads, but if the home-screen app still shows the old version, open the GitHub Pages URL in Chrome once, refresh, then reopen the installed app.</div></div>`;
}
function toggleSettingsHeader(){ settingsHeaderExpanded=!settingsHeaderExpanded; render(false); }
function customToolsHtml(){
  return `<div class="card"><div class="cardTitle"><h3>Custom activity</h3></div><input id="customActCreateName" placeholder="New activity name"><div class="grid3" style="margin-top:8px">${ATTRS.map(([id,name])=>`<div><div class="label">${name}</div><input id="actScore_${id}" type="number" min="0" max="5" value="0"></div>`).join('')}</div><div class="grid2" style="margin-top:8px"><button class="btn" onclick="createCustomActivity()">Save activity</button><button class="btn" onclick="makePrompt()">AI prompt</button></div><pre id="promptOut" class="small" style="white-space:pre-wrap;display:none"></pre></div>
  <div class="card"><div class="cardTitle"><h3>Custom habit</h3></div><input id="customHabitName" placeholder="New habit name"><textarea id="customHabitInfo" placeholder="What counts as 100%?"></textarea><div class="grid3">${ATTRS.map(([id,name])=>`<div><div class="label">${name}</div><input id="habitScore_${id}" type="number" min="0" max="5" value="0"></div>`).join('')}</div><div class="grid2" style="margin-top:8px"><button class="btn" onclick="createCustomHabit()">Save habit</button><button class="btn" onclick="makeHabitPrompt()">AI prompt</button></div><pre id="habitPromptOut" class="small" style="white-space:pre-wrap;display:none"></pre></div>`;
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
function setDayType(v){ const day=ensureDay(); day.dayType=v; day.focus=DEFAULT_FOCUS[v] || 'full'; day.touched=true; render(); }
function setDayFocus(v){ const day=ensureDay(); day.focus=v; day.touched=true; render(); }
function setFuelMode(v){ state.weeklyCalorieMode=({standard:'maintain',reduced:'reduced',gain:'gain'}[v]||v||'maintain'); render(); }
function prepActivity(id){ const a=allActivities()[id]; form={activity:id,duration:a.defMin||a.typical||45,intensity:a.defInt||'moderate',mods:[...(a.mods||[])],notes:''}; render(false); }
function selectActivity(id){ prepActivity(id); }
function setDuration(m){ form.duration=m; render(false); }
function setIntensity(i){ form.intensity=i; render(false); }
function toggleMod(id){ form.mods=form.mods.includes(id)?form.mods.filter(x=>x!==id):[...form.mods,id]; render(false); }
function saveActivity(){ form.notes=document.getElementById('actNotes')?.value||form.notes; const day=ensureDay(); const log={...form,id:Date.now()}; day.activities.push(log); day.touched=true; state.lastActivity=log; toast('Activity saved'); render(); }
function repeatLast(){ if(!state.lastActivity){ toast('No last activity yet'); return; } const day=ensureDay(); day.activities.push({...state.lastActivity,id:Date.now()}); day.touched=true; toast('Repeated last activity'); render(); }
function editActivity(i){ const day=ensureDay(); const log=day.activities.splice(i,1)[0]; if(!log) return; form={activity:log.activity,duration:log.duration,intensity:log.intensity,mods:[...(log.mods||[])],notes:log.notes||''}; day.touched=true; toast('Activity loaded for edit. Submit to save.'); render(); }
function deleteActivity(i){ ensureDay().activities.splice(i,1); ensureDay().touched=true; render(); }
function deleteHabit(id){ const day=ensureDay(); delete day.habits[id]; day.touched=true; render(); }
function deleteException(id){ const day=ensureDay(); delete day.exceptions[id]; day.touched=true; render(); }
function deleteMeasurement(type,date){ state.measurements=(state.measurements||[]).filter(m=>!(m.type===type && m.date===date)); render(); }
function setHabit(id,pct){ const day=ensureDay(); if(pct===0) delete day.habits[id]; else day.habits[id]=pct; day.touched=true; render(); }
function toggleException(id){ const day=ensureDay(); day.exceptions[id]=!day.exceptions[id]; if(!day.exceptions[id]) delete day.exceptions[id]; day.touched=true; render(); }
function addMeasurement(type){ saveBenchmarksForDay(); }

function createCustomActivity(){ const name=(document.getElementById('customActCreateName')?.value||'').trim(); if(!name){toast('Name required');return;} const id='custom_'+slug(name)+'_'+Date.now(); state.customActivities[id]={name,cat:'Custom',fav:true,defMin:45,typical:45,defInt:'moderate',mods:[],scores:readScores('actScore')}; toast('Custom activity saved'); render(); }
function createCustomHabit(){ const name=(document.getElementById('customHabitName')?.value||'').trim(); if(!name){toast('Name required');return;} const info=(document.getElementById('customHabitInfo')?.value||'100% = personal target reached.').trim(); const id='customHabit_'+slug(name)+'_'+Date.now(); state.customHabits[id]={name,info,scores:readScores('habitScore')}; toast('Custom habit saved'); render(); }
function readScores(prefix){ const scores=emptyScores(); ATTR_IDS.forEach(id=>{scores[id]=clamp(parseFloat(document.getElementById(`${prefix}_${id}`)?.value)||0,0,5)}); return scores; }
function slug(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,24)||'custom'; }
function makePrompt(){ const name=(document.getElementById('customActCreateName')?.value||'[ACTIVITY NAME]'); const prompt=`You are creating a custom activity for Body Tracker, a fitness app with evidence-informed RPG-style scoring.\n\nActivity: ${name}\nTypical duration: [minutes]\nTypical intensity: [Easy / Moderate / Hard / Competitive / Max Effort]\n\nTrainable attributes: Strength, Endurance, Agility, Flexibility, Recovery, Nutrition.\n\nUse profile values from 0 to 5:\n0 = no meaningful effect\n1 = light effect\n2 = moderate effect\n3 = strong effect\n4 = major effect\n5 = primary effect\n\nCalibration anchors:\n- 45 min moderate weight lifting: Strength 5 and nearly completes a Strength Day.\n- 30 min moderate cardio: Endurance 5 and nearly completes an Endurance Day.\n- 45 min basketball/soccer: Agility 5, Endurance 4–5, Strength around 1.\n- 20–25 min yoga/mobility: Flexibility 5, Recovery 2–3.\n- Light Indian clubs: Flexibility 4–5, Recovery 3, Agility 1–2, Strength only 0.5.\n- Nutrition should be 0 unless this is explicitly a nutrition habit.\n- Do not expose internal categories to users; use the real activity name.\n\nAlso assign focus tags from these options when relevant:\nstrength:push, strength:pull, strength:lower, strength:coreCarry, strength:balanced, endurance:zone2, endurance:intervals, endurance:sport, agility:footwork, agility:court, agility:sport, mobility:upper, mobility:hips, mobility:full, recovery:light, recovery:mobility, recovery:breathing.\n\nReturn balanced JSON:\n{\n  "name":"",\n  "category":"",\n  "typical":0,\n  "defMin":0,\n  "defInt":"moderate",\n  "scores":{"strength":0,"endurance":0,"agility":0,"mobility":0,"recovery":0,"nutrition":0},\n  "focus":[],\n  "patterns":{"push":0,"pull":0,"squat":0,"hinge":0,"carry":0,"core":0},\n  "rationale":"",\n  "warnings":""\n}`; const out=document.getElementById('promptOut'); out.style.display='block'; out.textContent=prompt; navigator.clipboard?.writeText(prompt); toast('AI prompt copied'); }
function makeHabitPrompt(){ const name=(document.getElementById('customHabitName')?.value||'[HABIT NAME]'); const prompt=`I’m creating a new habit for Body Tracker, a personal RPG-style fitness app.\n\nHabit: ${name}\n\nAvailable trainable attributes:\nStrength, Endurance, Agility, Flexibility, Recovery, Nutrition\n\nRating scale: 0 none, 1 minor, 2 light, 3 moderate, 4 strong, 5 primary.\n\nCalibrate against:\nProtein: Strength 3, Recovery 1, Nutrition 5\nWater: Endurance 1, Recovery 3, Nutrition 5\nSleep: Strength 1, Endurance 1, Agility 1, Recovery 5\nStretch / Flexibility: Agility 1, Flexibility 5, Recovery 4\n\nPlease suggest attribute ratings, what counts as 100%, whether 0/50/100/150/200 scoring makes sense, and a short reason.`; const out=document.getElementById('habitPromptOut'); out.style.display='block'; out.textContent=prompt; navigator.clipboard?.writeText(prompt); toast('AI prompt copied'); }

function exportData(){ state.appVersion=APP_VERSION; state.saveVersion=3; downloadText('body-tracker-save-v8.json', JSON.stringify(state,null,2), 'application/json'); }
function importData(){ const txt=document.getElementById('importBox')?.value; if(!txt){toast('Paste JSON first');return;} try{ state=migrateState(JSON.parse(txt)); save(); toast('Imported'); render(); }catch(e){ console.warn(e); toast('Import failed'); } }
function importJsonFile(file){ if(!file){return;} const reader=new FileReader(); reader.onload=()=>{ try{ state=migrateState(JSON.parse(String(reader.result||''))); save(); toast('Imported JSON file'); render(); }catch(e){ console.warn(e); toast('Import failed'); } }; reader.onerror=()=>toast('File read failed'); reader.readAsText(file); }
function exportCsv(){ const rows=[['record_type','date','name','value','unit','duration_min','intensity','modifiers','notes']]; const acts=allActivities(), habits=allHabits(); Object.entries(state.days||{}).forEach(([date,day])=>{ (day.activities||[]).forEach(l=>rows.push(['activity',date,acts[l.activity]?.name||l.activity,'','',l.duration,l.intensity,(l.mods||[]).join('|'),l.notes||''])); Object.entries(day.habits||{}).forEach(([hid,pct])=>rows.push(['habit',date,habits[hid]?.name||hid,pct+'%','','','','',''])); Object.entries(day.exceptions||{}).forEach(([eid,on])=>{if(on)rows.push(['exception',date,EXCEPTIONS[eid]?.name||eid,'true','','','','','']);}); }); (state.measurements||[]).forEach(m=>rows.push(['measurement',m.date,MEASUREMENTS[m.type]?.name||m.type,m.value,m.unit,'','','',''])); downloadText('body-tracker-export-v8.csv', rows.map(r=>r.map(csvCell).join(',')).join('\n'), 'text/csv'); }
function csvCell(v){ v=String(v??''); return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; }
function downloadText(filename,text,type='text/plain'){ const blob=new Blob([text],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url); toast('Exported '+filename); }
function requestPersistence(){ if(navigator.storage?.persist){ navigator.storage.persist().then(ok=>toast(ok?'Persistent storage granted':'Persistent storage not granted')); } else toast('Not supported here'); }
function resetAll(){ if(confirm('Delete all local Body Tracker data?')){ state=defaultState(); save(); render(); } }

async function updateApp(){
  if(!confirm('Update app files from GitHub Pages? This keeps your Body Tracker save data, but clears cached app files and reloads. Export JSON first if you want an extra backup.')) return;
  toast('Updating app...');
  try{
    // Ask the currently controlling service worker to stop immediately, if it supports it.
    if(navigator.serviceWorker?.controller){
      try{ navigator.serviceWorker.controller.postMessage({type:'SKIP_WAITING'}); }catch(e){}
    }

    // Force service worker update checks before unregistering old workers.
    if('serviceWorker' in navigator){
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(async r=>{
        try{ await r.update(); }catch(e){}
        try{ if(r.waiting) r.waiting.postMessage({type:'SKIP_WAITING'}); }catch(e){}
        try{ await r.unregister(); }catch(e){}
      }));
    }

    // Remove only app-file caches. This does not touch IndexedDB save data.
    if('caches' in window){
      const keys = await caches.keys();
      await Promise.all(keys.filter(k=>k.startsWith('body-tracker-')).map(k=>caches.delete(k)));
    }

    // Bust browser + GitHub Pages caches with a fresh URL. Keep the route clean except for this update token.
    const url = new URL(location.href);
    url.searchParams.set('bt_update', String(Date.now()));
    setTimeout(()=>{ location.replace(url.toString()); }, 350);
  }catch(e){
    console.warn('App update failed', e);
    toast('Update failed. Try closing/reopening the app.');
  }
}

// Backwards compatibility if an older settings screen still references the old function name.
const reloadLatestApp = updateApp;

function setupTabs(){ document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{ activeTab=b.dataset.tab; render(false); }); }
setupTabs(); ensureDay(); render(false); hydrateFromIndexedDB();
