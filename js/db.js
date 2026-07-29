/* ==========================================================
   TravelConnect – Local database (localStorage-backed)
   All data lives in localStorage under one key: 'travelconnect_db'.
   The first time the app loads, it's seeded with sample data.
   ========================================================== */

(function () {
  const DB_KEY = 'travelconnect_db';
  const SESSION_KEY = 'travelconnect_session';
  const SCHEMA_VERSION = 3;

  // ---------- Categories (the 8 required categories) ----------
  const CATEGORIES = [
    { id: 'adventures',  name: 'Adventures',  emoji: '🎒', color: '#c0392b' },
    { id: 'nature',      name: 'Nature',      emoji: '🌿', color: '#2e8b57' },
    { id: 'food',        name: 'Food',        emoji: '🍜', color: '#e0a458' },
    { id: 'culture',     name: 'Culture',     emoji: '🏛️', color: '#8e44ad' },
    { id: 'photography', name: 'Photography', emoji: '📷', color: '#34495e' },
    { id: 'beaches',     name: 'Beaches',     emoji: '🏖️', color: '#3498db' },
    { id: 'wildlife',    name: 'Wildlife',    emoji: '🦁', color: '#d35400' },
    { id: 'mountains',   name: 'Mountains',   emoji: '⛰️', color: '#0d5c63' },
  ];

  // ---------- Seed data ----------
  const SEED_USERS = [
    { id: 'u_admin',   username: 'admin',         name: 'Admin',           email: 'admin@travelconnect.dev',        pw: 'password123', bio: 'Platform administrator.',                       role: 'admin',      avatar: null, coverColor: '#094248' },
    { id: 'u_sai',     username: 'wanderer_sai',  name: 'Sai Krishnan',    email: 'wanderer_sai@travelconnect.dev', pw: 'password123', bio: '35 countries · slow travel · storytelling',      role: 'influencer', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop', coverColor: '#0d5c63' },
    { id: 'u_nina',    username: 'nina.frames',   name: 'Nina Petrova',    email: 'nina.frames@travelconnect.dev',  pw: 'password123', bio: 'Photographer chasing golden hour.',              role: 'photographer', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop', coverColor: '#c4863d' },
    { id: 'u_arjun',   username: 'foodie_arjun',  name: 'Arjun Menon',     email: 'foodie_arjun@travelconnect.dev', pw: 'password123', bio: 'Street food · night markets · one bite at a time', role: 'foodie',   avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', coverColor: '#e0a458' },
    { id: 'u_maya',    username: 'maya.wilds',    name: 'Maya Okonkwo',    email: 'maya.wilds@travelconnect.dev',   pw: 'password123', bio: 'Field biologist · wildlife photographer',        role: 'wildlife', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop', coverColor: '#d35400' },
    { id: 'u_leo',     username: 'leo.peaks',     name: 'Leo Alvarez',     email: 'leo.peaks@travelconnect.dev',    pw: 'password123', bio: 'Alpinist. 6k+ summits in 4 continents.',         role: 'mountaineer', avatar: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=200&h=200&fit=crop', coverColor: '#0d5c63' },
    { id: 'u_yui',     username: 'yui.coasts',    name: 'Yui Tanaka',      email: 'yui.coasts@travelconnect.dev',   pw: 'password123', bio: 'Beach hopper · surf report enthusiast',         role: 'coastal',  avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop', coverColor: '#3498db' },
    { id: 'u_isa',     username: 'isa.culture',   name: 'Isabella Rossi',  email: 'isa.culture@travelconnect.dev',  pw: 'password123', bio: 'Art historian · slow city walks',                role: 'culture',  avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop', coverColor: '#8e44ad' },
  ];

  // Follow graph — each user follows several others
  const SEED_FOLLOWS = [
    ['u_sai','u_nina'],['u_sai','u_arjun'],['u_sai','u_leo'],['u_sai','u_maya'],
    ['u_nina','u_sai'],['u_nina','u_isa'],['u_nina','u_yui'],
    ['u_arjun','u_sai'],['u_arjun','u_isa'],['u_arjun','u_nina'],
    ['u_maya','u_leo'],['u_maya','u_sai'],
    ['u_leo','u_sai'],['u_leo','u_maya'],['u_leo','u_yui'],
    ['u_yui','u_nina'],['u_yui','u_leo'],
    ['u_isa','u_nina'],['u_isa','u_arjun'],['u_isa','u_sai'],
    ['u_admin','u_sai'],
  ];

  const SEED_DESTINATIONS = [
    // Adventures
    { id:'d_patagonia', name:'Patagonia', country:'Chile / Argentina', category:'adventures', image:'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=600&fit=crop', description:'Wind-carved granite spires, glacier trekking and the wildest hikes on earth.' },
    { id:'d_iceland',   name:'Iceland Ring Road', country:'Iceland',       category:'adventures', image:'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&h=600&fit=crop', description:'Waterfalls, black-sand beaches and ice caves on a 1,300 km loop.' },
    { id:'d_moab',      name:'Moab', country:'United States', category:'adventures', image:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&h=600&fit=crop', description:'Arches, canyons and slick-rock trails in the red-rock desert.' },
    // Nature
    { id:'d_amazon',    name:'Amazon Rainforest', country:'Brazil', category:'nature', image:'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&h=600&fit=crop', description:'Emerald canopy hiding 10% of the planet\u2019s known species.' },
    { id:'d_yosemite',  name:'Yosemite Valley', country:'United States', category:'nature', image:'https://images.unsplash.com/photo-1445307806294-bff7f67ff225?w=800&h=600&fit=crop', description:'Granite cliffs, giant sequoias, and thundering spring waterfalls.' },
    { id:'d_plitvice',  name:'Plitvice Lakes', country:'Croatia', category:'nature', image:'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&h=600&fit=crop', description:'16 turquoise lakes cascading through emerald forest.' },
    // Food
    { id:'d_tokyo',     name:'Tokyo', country:'Japan', category:'food', image:'https://images.unsplash.com/photo-1554797589-7241bb691973?w=800&h=600&fit=crop', description:'From tsukiji tuna auctions to standing sushi bars in Ginza.' },
    { id:'d_bangkok',   name:'Bangkok Street Food', country:'Thailand', category:'food', image:'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&h=600&fit=crop', description:'Pad thai carts, mango sticky rice, and midnight boat noodles.' },
    { id:'d_oaxaca',    name:'Oaxaca', country:'Mexico', category:'food', image:'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&h=600&fit=crop', description:'Seven moles, mezcal palenques and stone-ground chocolate.' },
    // Culture
    { id:'d_kyoto',     name:'Kyoto', country:'Japan', category:'culture', image:'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=600&fit=crop', description:'Zen gardens, tea houses and 1,600 Buddhist temples.' },
    { id:'d_rome',      name:'Rome', country:'Italy', category:'culture', image:'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop', description:'Every alley a museum, every fountain a story two millennia deep.' },
    { id:'d_marrakech', name:'Marrakech', country:'Morocco', category:'culture', image:'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800&h=600&fit=crop', description:'Souks, riads and the sensory storm of Jemaa el-Fnaa.' },
    // Photography
    { id:'d_lofoten',   name:'Lofoten Islands', country:'Norway', category:'photography', image:'https://images.unsplash.com/photo-1516466823543-c105b18ff2f2?w=800&h=600&fit=crop', description:'Red fishing huts under the northern lights.' },
    { id:'d_faroe',     name:'Faroe Islands', country:'Denmark', category:'photography', image:'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=800&h=600&fit=crop', description:'Grass-roofed churches and vertical cliffs that plunge into the sea.' },
    { id:'d_namib',     name:'Namib Desert', country:'Namibia', category:'photography', image:'https://images.unsplash.com/photo-1547235001-d703406d3b41?w=800&h=600&fit=crop', description:'Orange dunes and dead camelthorn trees at Deadvlei.' },
    // Beaches
    { id:'d_maldives',  name:'Maldives', country:'Maldives', category:'beaches', image:'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&h=600&fit=crop', description:'Overwater villas above glass-clear atolls.' },
    { id:'d_tulum',     name:'Tulum', country:'Mexico', category:'beaches', image:'https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=800&h=600&fit=crop', description:'White sand, Mayan ruins and cenotes carved into jungle.' },
    { id:'d_bali',      name:'Bali', country:'Indonesia', category:'beaches', image:'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop', description:'Surf breaks in Uluwatu, rice terraces in Ubud.' },
    // Wildlife
    { id:'d_serengeti', name:'Serengeti', country:'Tanzania', category:'wildlife', image:'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800&h=600&fit=crop', description:'The Great Migration: 2 million wildebeest on the move.' },
    { id:'d_galapagos', name:'Galápagos', country:'Ecuador', category:'wildlife', image:'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=800&h=600&fit=crop', description:'The living laboratory that inspired Darwin.' },
    { id:'d_borneo',    name:'Borneo', country:'Malaysia', category:'wildlife', image:'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&h=600&fit=crop', description:'Orangutans, pygmy elephants and river cruises through jungle.' },
    // Mountains
    { id:'d_everest',   name:'Everest Base Camp', country:'Nepal', category:'mountains', image:'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=600&fit=crop', description:'The classic 12-day trek to 5,364 m under the world\u2019s highest peak.' },
    { id:'d_dolomites', name:'Dolomites', country:'Italy', category:'mountains', image:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop', description:'Jagged pink limestone spires above green alpine meadows.' },
    { id:'d_banff',     name:'Banff', country:'Canada', category:'mountains', image:'https://images.unsplash.com/photo-1609825488888-3a766db05542?w=800&h=600&fit=crop', description:'Turquoise glacial lakes ringed by the Canadian Rockies.' },
  ];

  const SEED_COMMUNITIES = [
    { id:'c_solo',    name:'Solo Travelers',      description:'Meet other people who travel alone. Trade tips, safety and stories.', category:'adventures',  members:['u_sai','u_nina','u_maya','u_yui'] },
    { id:'c_photo',   name:'Landscape Photography', description:'Golden hour hunters, drone pilots and film shooters welcome.',  category:'photography', members:['u_nina','u_leo','u_yui','u_maya'] },
    { id:'c_streetfood', name:'Street Food Hunters', description:'From satay carts to birria trucks — share what you\u2019ve tasted.',   category:'food',        members:['u_arjun','u_isa','u_sai'] },
    { id:'c_summits', name:'High Altitude',       description:'6k, 7k, 8k. Training, gear, permits and stories from thin air.', category:'mountains',   members:['u_leo','u_sai','u_maya'] },
    { id:'c_slow',    name:'Slow Travel',         description:'One town, one month. Deep travel over checklists.',         category:'culture',    members:['u_isa','u_sai','u_arjun'] },
    { id:'c_wildlife',name:'Wildlife Watchers',   description:'Birding, big-cat sightings and ethical wildlife tourism.',  category:'wildlife',   members:['u_maya','u_nina','u_leo'] },
  ];

  // 24 seed posts — 3 per category.
  // NOTE: this factory is called fresh each time initialDb() runs,
  // so createdAt is always relative to "now" — analytics + timeAgo stay meaningful.
  function buildSeedPosts() {
    const dests = SEED_DESTINATIONS;
    const now = Date.now();
    const captions = {
      adventures: [
        'Day 4 in Patagonia. My legs are toast but I\u2019d do it again tomorrow. #FitzRoy #Patagonia #trekking',
        'Two flat tires and a snowstorm later, we made it around Iceland\u2019s ring road. #IcelandRingRoad #adventure',
        'Slot canyons in Moab feel like the earth split open just for you. #Moab #desert #adventure',
      ],
      nature: [
        'The Amazon at 5 am — mist so thick you can hear it. #Amazon #rainforest #nature',
        'Half Dome catching the last light. #Yosemite #wilderness #nature',
        'Sixteen lakes cascading into each other. Real-life screensaver. #Plitvice #Croatia',
      ],
      food: [
        'Standing sushi in Tsukiji. Best 900 yen I ever spent. #Tokyo #sushi #foodie',
        'Boat noodles at midnight. Sriracha optional, joy mandatory. #Bangkok #streetfood',
        'Mole negro is basically culinary time-travel. #Oaxaca #Mexico #food',
      ],
      culture: [
        'Fushimi Inari has 10,000 gates and 100,000 tourists. Go at 5 am. #Kyoto #culture',
        'You don\u2019t \u201cvisit\u201d Rome. You get absorbed by it. #Rome #Italy #culture',
        'The souks of Marrakech will disorient you in the best way. #Marrakech #Morocco',
      ],
      photography: [
        'Northern lights over red huts, Lofoten. Shot at f/2.8, 4 sec, ISO 3200. #Lofoten #Norway',
        'Faroe Islands look CGI in every weather. #Faroe #landscape',
        'Deadvlei at sunrise — the sky burns and the trees don\u2019t move. #Namib #photography',
      ],
      beaches: [
        'Snorkeled with a manta ray at lunch. Casual. #Maldives #ocean #beach',
        'Cenote water is the color of a swimming pool ad. #Tulum #Mexico',
        'Sunset at Uluwatu with the whole beach clapping for the sky. #Bali',
      ],
      wildlife: [
        'Great Migration — 1.5 million wildebeest and I forgot my telephoto. #Serengeti #wildlife',
        'A blue-footed booby genuinely wagged its foot at me. #Galapagos',
        'Orangutan and her baby, 6 meters up, chewing durian. #Borneo #wildlife',
      ],
      mountains: [
        'EBC. Two weeks in, thin air, all worth it. #Everest #trekking #mountains',
        'Tre Cime at first light. Nothing else exists for ten minutes. #Dolomites',
        'Moraine Lake is not photoshopped. I checked. #Banff #Canada',
      ],
    };
    const users = ['u_sai','u_nina','u_arjun','u_maya','u_leo','u_yui','u_isa'];
    const posts = [];
    let idx = 0;
    for (const cat of CATEGORIES.map(c => c.id)) {
      const catDests = dests.filter(d => d.category === cat);
      captions[cat].forEach((cap, i) => {
        const dest = catDests[i % catDests.length];
        const author = users[idx % users.length];
        posts.push({
          id: 'p_' + cat + '_' + i,
          userId: author,
          image: dest.image,
          caption: cap,
          category: cat,
          destinationId: dest.id,
          hashtags: extractHashtags(cap),
          likes: pickN(users, 2 + (idx % 5)),
          saves: pickN(users, (idx % 3)),
          shares: [],
          comments: [],
          createdAt: now - (idx * 3600_000 * 6),
        });
        idx++;
      });
    }
    // Add a couple of comments (also relative to now)
    posts[0].comments.push({ id:'cm1', userId:'u_nina', text:'This looks unreal. Which pass?', createdAt: now - 3600_000 });
    posts[0].comments.push({ id:'cm2', userId:'u_leo',  text:'Torres circuit or W?',           createdAt: now - 1800_000 });
    posts[6].comments.push({ id:'cm3', userId:'u_isa',  text:'The sushi bar name?? Please 🙏', createdAt: now - 7200_000 });
    return posts;
  }

  function extractHashtags(text) {
    return (text.match(/#\w+/g) || []).map(h => h.slice(1).toLowerCase());
  }
  function pickN(arr, n) {
    return arr.slice().sort(() => Math.random() - .5).slice(0, n);
  }

  // Seed profile-collection items
  const SEED_VISITED = [
    { id:'v1', userId:'u_sai', destinationId:'d_patagonia', title:'Torres del Paine W Trek', place:'Chile', notes:'Five days, wind that peels paint. Do it.',    rating:5, date:'2024-03', image:'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=450&fit=crop' },
    { id:'v2', userId:'u_sai', destinationId:'d_kyoto',     title:'Kyoto in cherry blossom',  place:'Japan', notes:'Arrived one week early — the best.',        rating:5, date:'2024-04', image:'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&h=450&fit=crop' },
    { id:'v3', userId:'u_nina', destinationId:'d_lofoten',  title:'Lofoten aurora chase',     place:'Norway', notes:'Six nights, four with clear sky.',          rating:5, date:'2024-02', image:'https://images.unsplash.com/photo-1516466823543-c105b18ff2f2?w=600&h=450&fit=crop' },
  ];
  const SEED_BUCKET = [
    { id:'b1', userId:'u_sai',   destinationId:'d_everest',   title:'Everest Base Camp trek', place:'Nepal',    notes:'12 days, October window.',              priority:'high',   image:'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=450&fit=crop' },
    { id:'b2', userId:'u_sai',   destinationId:'d_serengeti', title:'Great Migration',        place:'Tanzania', notes:'Ideally August in the Mara triangle.',  priority:'medium', image:'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=600&h=450&fit=crop' },
    { id:'b3', userId:'u_arjun', destinationId:'d_oaxaca',    title:'Oaxaca food tour',       place:'Mexico',   notes:'Day of the Dead season.',               priority:'high',   image:'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&h=450&fit=crop' },
  ];
  const SEED_FOOD = [
    { id:'f1', userId:'u_arjun', title:'Boat noodles',    place:'Bangkok, Thailand', notes:'Beef, dark broth, chili vinegar. Eat two bowls.', rating:5, image:'https://images.unsplash.com/photo-1552611052-33e04de081de?w=600&h=450&fit=crop' },
    { id:'f2', userId:'u_arjun', title:'Standing sushi',  place:'Tokyo, Japan',      notes:'Chef points, you eat. No English required.',      rating:5, image:'https://images.unsplash.com/photo-1554797589-7241bb691973?w=600&h=450&fit=crop' },
    { id:'f3', userId:'u_sai',   title:'Mole negro',      place:'Oaxaca, Mexico',    notes:'27 ingredients. Eat with fresh tortillas.',        rating:5, image:'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&h=450&fit=crop' },
  ];
  const SEED_ADV = [
    { id:'a1', userId:'u_sai', title:'W Circuit', place:'Torres del Paine, Chile', notes:'5 days, refugios booked ahead.', difficulty:'hard',    image:'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=450&fit=crop' },
    { id:'a2', userId:'u_leo', title:'Cerro Aconcagua', place:'Argentina',         notes:'19 days, no oxygen. Type-2 fun.', difficulty:'expert',  image:'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=600&h=450&fit=crop' },
    { id:'a3', userId:'u_maya', title:'Kayak Sundarbans', place:'India',           notes:'Tigers, mangroves, huge tides.', difficulty:'medium', image:'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=600&h=450&fit=crop' },
  ];

  function buildSeedReports() {
    return [
      { id:'r1', reporterId:'u_nina', targetType:'post', targetId:'p_food_1', reason:'spam', status:'pending', createdAt: Date.now() - 86400_000 },
    ];
  }

  function initialDb() {
    // Build follows map: userId -> [followed ids]
    const follows = {};
    SEED_USERS.forEach(u => follows[u.id] = []);
    SEED_FOLLOWS.forEach(([a, b]) => {
      if (!follows[a].includes(b)) follows[a].push(b);
    });

    return {
      schema: SCHEMA_VERSION,
      users:        SEED_USERS.map(u => ({ ...u })),
      categories:   CATEGORIES.slice(),
      destinations: SEED_DESTINATIONS.map(d => ({ ...d })),
      communities:  SEED_COMMUNITIES.map(c => ({ ...c, members: c.members.slice() })),
      posts:        buildSeedPosts(),   // fresh timestamps each reset
      follows:      follows,            // { userId: [followedIds] }
      visited:      SEED_VISITED.map(v => ({ ...v })),
      bucket:       SEED_BUCKET.map(v => ({ ...v })),
      food:         SEED_FOOD.map(v => ({ ...v })),
      adventures:   SEED_ADV.map(v => ({ ...v })),
      reports:      buildSeedReports(),
    };
  }

  // ---------- Public API ----------
  const DB = {
    load() {
      try {
        const raw = localStorage.getItem(DB_KEY);
        if (!raw) return this.reset();
        const parsed = JSON.parse(raw);
        if (parsed.schema !== SCHEMA_VERSION) return this.reset();
        return parsed;
      } catch (e) {
        console.warn('DB corrupt, reseeding', e);
        return this.reset();
      }
    },
    save(db) {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    },
    reset() {
      const db = initialDb();
      this.save(db);
      return db;
    },
    // Session (currently-logged-in user id)
    getSession() {
      try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
      catch { return null; }
    },
    setSession(userId) {
      if (userId) localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }));
      else localStorage.removeItem(SESSION_KEY);
    },
    // Handy id generator
    uid(prefix) {
      return prefix + '_' + Math.random().toString(36).slice(2, 10);
    },
  };

  window.DB = DB;
  window.CATEGORIES = CATEGORIES;
})();
