import React, { useState, useEffect } from 'react';
import { 
  Briefcase, ShoppingBag, Home, Trophy, 
  Clock, CheckCircle, Zap, LogOut, Scissors, 
  Users, Activity, TrendingUp, AlertCircle
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { 
  getFirestore, doc, setDoc, getDoc, updateDoc, 
  onSnapshot, arrayUnion, increment, collection, query, where 
} from "firebase/firestore";

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyB-j2PlwHFzwKWHRNyIFR1aNZqdVRHS_l4",
  authDomain: "stable-talk.firebaseapp.com",
  projectId: "stable-talk",
  storageBucket: "stable-talk.firebasestorage.app",
  messagingSenderId: "261641732141",
  appId: "1:261641732141:web:8d30751226507e179cb8a4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- ASSETS ---
const SHOP_ITEMS = [
  // Headware
  { id: 'baseball_cap', name: 'Baseball Cap', type: 'headware', price: 15, thumb: '/assets/headware/baseball_cap_tn.png', overlay: '/assets/headware/baseball_cap.png' },
  { id: 'butterfly_clip', name: 'Butterfly Clip', type: 'headware', price: 10, thumb: '/assets/headware/butterfly_clip_tn.png', overlay: '/assets/headware/butterfly_clip.png' },
  { id: 'pucca_buns', name: 'Pucca Buns', type: 'headware', price: 30, thumb: '/assets/headware/pucca_buns_tn.png', overlay: '/assets/headware/pucca_buns.png' },
  { id: 'rocker_hair', name: 'Rocker Hair', type: 'headware', price: 35, thumb: '/assets/headware/rocker_hair_tn.png', overlay: '/assets/headware/rocker_hair.png' },
  { id: 'unicorn_horn', name: 'Unicorn Horn', type: 'headware', price: 50, thumb: '/assets/headware/unicorn_horn_tn.png', overlay: '/assets/headware/unicorn_horn.png' },

  // Neckware
  { id: 'fancy_necklace', name: 'Fancy Necklace', type: 'neckware', price: 25, thumb: '/assets/neckware/fancy_necklace_tn.png', overlay: '/assets/neckware/fancy_necklace.png' },
  { id: 'locket', name: 'Gold Locket', type: 'neckware', price: 15, thumb: '/assets/neckware/locket_tn.png', overlay: '/assets/neckware/locket.png' },

  // Shoes
  { id: 'cool_sneakers', name: 'Cool Sneakers', type: 'shoes', price: 20, thumb: '/assets/shoes/cool_shoes_tn.png', overlay: '/assets/shoes/cool_shoes.png' },
  { id: 'flip_flops', name: 'Flip Flops', type: 'shoes', price: 10, thumb: '/assets/shoes/flip_flops_tn.png', overlay: '/assets/shoes/flip_flops.png' },
  { id: 'ruby_slippers', name: 'Ruby Slippers', type: 'shoes', price: 40, thumb: '/assets/shoes/ruby_slippers_tn.png', overlay: '/assets/shoes/ruby_slippers.png' },
  { id: 'vans', name: 'Skater Vans', type: 'shoes', price: 25, thumb: '/assets/shoes/vans_tn.png', overlay: '/assets/shoes/vans.png' },

  // Accessories
  { id: 'mustache', name: 'Mustache', type: 'accessories', price: 12, thumb: '/assets/accessories/mustache_tn.png', overlay: '/assets/accessories/mustache.png' },
  { id: 'shaker', name: 'Protein Shaker', type: 'accessories', price: 15, thumb: '/assets/accessories/shaker_tn.png', overlay: '/assets/accessories/shaker.png' },
  { id: 'tote_bag', name: 'Tote Bag', type: 'accessories', price: 18, thumb: '/assets/accessories/tote_bag_tn.png', overlay: '/assets/accessories/tote_bag.png' },
];

const COAT_COLORS = [
  { id: 'white', name: 'Cloud White', price: 0, img: '/assets/horses/white_horse.png' },
  { id: 'brown', name: 'Chestnut Brown', price: 100, img: '/assets/horses/brown_horse.png' },
  { id: 'blue', name: 'Mystic Blue', price: 250, img: '/assets/horses/blue_horse.png' },
];

const INITIAL_TASKS = [
  { id: 1, title: "Q3 Financial Report", type: "Deep Work", reward_hay: 200, reward_stat: "stamina" }, 
  { id: 2, title: "Client Email Sync", type: "Admin", reward_hay: 50, reward_stat: "speed" }
];

const INITIAL_TOWN = [
  { id: 'chat_barn', name: 'Chat Barn', cost: 300, current: 0, icon: '💬', description: 'Unlocks Team Chat', unlocked: false },
  { id: 'salon', name: 'The Mane Salon', cost: 500, current: 0, icon: '✂️', description: 'Unlocks Coat Colors', unlocked: false }
];

const DEFAULT_USER_STATE = {
  currency: { sugar: 50, hay: 100 },
  stats: { speed: 10, stamina: 10, mood: null },
  inventory: [], ownedCoats: ['white'], horseColor: 'white',
  equipped: { headware: null, neckware: null, shoes: null, accessories: null },
  activeTasks: INITIAL_TASKS, digestingTask: null,
  role: 'jockey' // Default role
};

// --- COMPONENTS ---
const GameButton = ({ children, onClick, color = 'blue', className = '', disabled = false, active = false, icon: Icon }) => {
  const colors = {
    blue: 'bg-sky-400 hover:bg-sky-500 border-sky-600 text-white',
    rose: 'bg-rose-400 hover:bg-rose-500 border-rose-600 text-white',
    emerald: 'bg-emerald-400 hover:bg-emerald-500 border-emerald-600 text-white',
    amber: 'bg-amber-400 hover:bg-amber-500 border-amber-600 text-white',
    purple: 'bg-purple-400 hover:bg-purple-500 border-purple-600 text-white',
    white: 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
  };
  return (
    <button 
      onClick={onClick} disabled={disabled}
      className={`relative px-4 py-3 rounded-2xl font-black transition-all transform border-b-4 active:border-b-0 active:translate-y-1 flex items-center justify-center gap-2 ${colors[color]} ${disabled ? 'opacity-50 cursor-not-allowed border-b-0 translate-y-1 grayscale' : ''} ${active ? 'translate-y-1 border-b-0 brightness-95' : ''} ${className}`}
    >
      {Icon && <Icon size={20} strokeWidth={3} />}
      {children}
    </button>
  );
};

// --- MAIN APP ---
export default function StableGoals() {
  const [session, setSession] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('work'); 
  const [userData, setUserData] = useState(null);
  const [townData, setTownData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]); // For Managers
  const [showWellness, setShowWellness] = useState(false);
  const [shopFilter, setShopFilter] = useState('all');

  useEffect(() => {
    const initApp = async () => {
      await signInAnonymously(auth);
      const saved = localStorage.getItem('stable_goals_creds');
      if (saved) {
        const { name, teamCode } = JSON.parse(saved);
        await connectToGame({ name, teamCode });
      } else {
        setLoading(false);
      }
    };
    initApp();
  }, []);

  const connectToGame = async ({ name, teamCode, role = 'jockey', stableName = 'My Stable' }) => {
    const safeCode = teamCode.replace(/[^0-9]/g, ''); 
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const userDocId = `${safeCode}_${safeName}`;
    const townDocId = `${safeCode}_town`;

    setLoading(true);

    // 1. Setup User
    const userRef = doc(db, "users", userDocId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, { 
        ...DEFAULT_USER_STATE, 
        name, 
        teamCode: safeCode, 
        role 
      });
    }

    // 2. Setup Town (Create if Manager, Read if Jockey)
    const townRef = doc(db, "towns", townDocId);
    const townSnap = await getDoc(townRef);
    if (!townSnap.exists()) {
      await setDoc(townRef, { 
        buildings: INITIAL_TOWN, 
        stableName: stableName 
      });
    }

    // 3. Listeners
    onSnapshot(userRef, (doc) => setUserData(doc.data()));
    onSnapshot(townRef, (doc) => setTownData(doc.data()));

    // 4. If Manager, listen to all team members
    // We use a query to get everyone with the same teamCode
    const q = query(collection(db, "users"), where("teamCode", "==", safeCode));
    onSnapshot(q, (snapshot) => {
      const members = snapshot.docs.map(doc => doc.data());
      setTeamMembers(members);
    });

    // 5. Save Session
    const sessionData = { name, teamCode: safeCode, docId: userDocId, townDocId };
    setSession(sessionData);
    localStorage.setItem('stable_goals_creds', JSON.stringify({ name, teamCode: safeCode }));
    
    // Only show wellness if JOCKEY and not checked in
    if ((!userSnap.exists() || !userSnap.data().stats?.mood) && role !== 'manager') {
      setShowWellness(true);
    }
    
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('stable_goals_creds');
    setSession(null); setUserData(null); setTownData(null); setTeamMembers([]);
  };

  // --- ACTIONS (Jockey) ---
  const feedHorse = async (task) => {
    if (userData.digestingTask) return;
    const taskData = { ...task, startTime: Date.now(), duration: 3000 };
    const userRef = doc(db, "users", session.docId);
    await updateDoc(userRef, { 
      activeTasks: userData.activeTasks.filter(t => t.id !== task.id), 
      digestingTask: taskData 
    });
  };

  useEffect(() => {
    if (!userData?.digestingTask) return;
    const interval = setInterval(async () => {
      const { digestingTask } = userData;
      if (Date.now() - digestingTask.startTime >= digestingTask.duration) {
        const userRef = doc(db, "users", session.docId);
        await updateDoc(userRef, {
          "currency.hay": increment(digestingTask.reward_hay),
          [`stats.${digestingTask.reward_stat}`]: increment(1),
          digestingTask: null
        });
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [userData?.digestingTask, session]);

  const buyItem = async (item) => {
    if (userData.currency.sugar >= item.price) {
      const userRef = doc(db, "users", session.docId);
      await updateDoc(userRef, {
        "currency.sugar": increment(-item.price), inventory: arrayUnion(item.id)
      });
    }
  };

  const buyCoat = async (coat) => {
    if (userData.currency.sugar >= coat.price) {
      const userRef = doc(db, "users", session.docId);
      await updateDoc(userRef, {
        "currency.sugar": increment(-coat.price), ownedCoats: arrayUnion(coat.id), horseColor: coat.id
      });
    }
  };

  const equipItem = async (item) => {
    const userRef = doc(db, "users", session.docId);
    await updateDoc(userRef, { [`equipped.${item.type}`]: item.id });
  };
  
  const equipCoat = async (coatId) => {
    const userRef = doc(db, "users", session.docId);
    await updateDoc(userRef, { horseColor: coatId });
  };

  const contributeToTown = async (buildingId) => {
    const building = townData.buildings.find(b => b.id === buildingId);
    if (userData.currency.hay >= 50) {
      const userRef = doc(db, "users", session.docId);
      const townRef = doc(db, "towns", session.townDocId);
      await updateDoc(userRef, { "currency.hay": increment(-50) });
      const newCurrent = Math.min(building.current + 50, building.cost);
      const newBuildings = townData.buildings.map(b => b.id === buildingId ? { ...b, current: newCurrent, unlocked: newCurrent >= building.cost } : b);
      await updateDoc(townRef, { buildings: newBuildings });
    }
  };

  const handleWellness = async (mood) => {
    const userRef = doc(db, "users", session.docId);
    await updateDoc(userRef, { "stats.mood": mood, "currency.sugar": increment(10) });
    setShowWellness(false);
  };

  const getEquippedOverlay = (user, type) => {
    const itemId = user.equipped?.[type];
    if (!itemId) return null;
    return SHOP_ITEMS.find(i => i.id === itemId)?.overlay;
  };

  // --- RENDER ---

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-sky-50 text-sky-400 font-bold text-xl animate-pulse">Loading Stable...</div>;
  if (!session) return <LoginScreen onLogin={connectToGame} />;
  if (!userData || !townData) return null;

  // --- MANAGER VIEW ---
  if (userData.role === 'manager') {
    const moods = teamMembers.map(m => m.stats?.mood).filter(Boolean);
    const moodCounts = { fire: 0, happy: 0, ok: 0, tired: 0 };
    moods.forEach(m => moodCounts[m] = (moodCounts[m] || 0) + 1);
    const totalHay = teamMembers.reduce((acc, m) => acc + (m.currency?.hay || 0), 0);

    return (
      <div className="min-h-screen bg-[#F0F4F8] font-sans text-slate-800 p-8">
        <header className="flex justify-between items-center mb-8">
           <div>
             <h1 className="text-3xl font-black text-slate-800">{townData.stableName || "My Stable"}</h1>
             <div className="text-slate-400 font-bold">Manager Dashboard • Code: <span className="bg-slate-200 px-2 py-1 rounded text-slate-600 font-mono">{userData.teamCode}</span></div>
           </div>
           <button onClick={handleLogout} className="flex items-center gap-2 text-rose-500 font-bold hover:bg-rose-50 px-4 py-2 rounded-xl transition-colors"><LogOut size={20} /> Logout</button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           {/* Card 1: Vibe Check */}
           <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4 text-slate-400 font-bold uppercase text-xs tracking-wider"><Activity size={16} /> Stable Vibe</div>
              <div className="flex justify-between items-end">
                 <div className="text-center"><div className="text-3xl">🔥</div><div className="font-bold text-slate-600">{moodCounts.fire}</div></div>
                 <div className="text-center"><div className="text-3xl">😄</div><div className="font-bold text-slate-600">{moodCounts.happy}</div></div>
                 <div className="text-center"><div className="text-3xl">😐</div><div className="font-bold text-slate-600">{moodCounts.ok}</div></div>
                 <div className="text-center"><div className="text-3xl">😴</div><div className="font-bold text-slate-600">{moodCounts.tired}</div></div>
              </div>
           </div>

           {/* Card 2: Productivity */}
           <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4 text-slate-400 font-bold uppercase text-xs tracking-wider"><TrendingUp size={16} /> Total Production</div>
              <div className="text-5xl font-black text-amber-500">{totalHay} <span className="text-2xl text-amber-300">Hay</span></div>
              <div className="text-sm text-slate-400 mt-2">Team contributions to town</div>
           </div>

           {/* Card 3: Team Size */}
           <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4 text-slate-400 font-bold uppercase text-xs tracking-wider"><Users size={16} /> Active Jockeys</div>
              <div className="text-5xl font-black text-sky-500">{teamMembers.length}</div>
              <div className="text-sm text-slate-400 mt-2">Members in stable</div>
           </div>
        </div>

        <h2 className="text-xl font-black text-slate-700 mb-4">Team Roster</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {teamMembers.map((member, idx) => (
             <div key={idx} className="bg-white p-4 rounded-3xl border-2 border-slate-100 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center relative overflow-hidden border border-sky-100">
                   {/* Mini Horse Preview */}
                   <img src={`/assets/horses/${member.horseColor || 'white'}_horse.png`} className="absolute w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                   <div className="flex justify-between">
                     <div className="font-bold text-slate-700">{member.name}</div>
                     {member.role === 'manager' && <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold uppercase">MGR</span>}
                   </div>
                   <div className="flex gap-2 mt-1 text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1"><Zap size={10} /> {member.stats?.speed || 0}</span>
                      <span className="flex items-center gap-1"><Activity size={10} /> {member.stats?.stamina || 0}</span>
                   </div>
                </div>
                {member.stats?.mood && (
                  <div className="text-2xl" title={member.stats.mood}>
                    {member.stats.mood === 'fire' ? '🔥' : member.stats.mood === 'happy' ? '😄' : member.stats.mood === 'ok' ? '😐' : '😴'}
                  </div>
                )}
             </div>
           ))}
        </div>
      </div>
    );
  }

  // --- JOCKEY VIEW ---
  return (
    <div className="min-h-screen bg-[#F0F4F8] font-sans text-slate-800 flex flex-col overflow-hidden">
      {/* HEADER */}
      <header className="bg-white border-b-2 border-slate-200 px-6 py-3 flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-sky-500 text-white p-2 rounded-xl"><Zap size={24} fill="currentColor" /></div>
          <h1 className="text-xl font-black text-slate-700 hidden md:block">{townData.stableName || "Stable Goals"}</h1>
        </div>
        <div className="flex items-center gap-6">
           <div className="bg-amber-50 border-2 border-amber-100 px-4 py-1.5 rounded-xl flex items-center gap-2"><span className="text-2xl">🌾</span><div><div className="text-[10px] font-black text-amber-400 uppercase">Hay</div><div className="font-black text-amber-800">{userData.currency.hay}</div></div></div>
           <div className="bg-pink-50 border-2 border-pink-100 px-4 py-1.5 rounded-xl flex items-center gap-2"><span className="text-2xl">🍬</span><div><div className="text-[10px] font-black text-pink-400 uppercase">Sugar</div><div className="font-black text-pink-800">{userData.currency.sugar}</div></div></div>
           <button onClick={handleLogout} className="text-slate-400 hover:text-rose-500"><LogOut size={20} /></button>
        </div>
      </header>

      {/* GAME GRID */}
      <main className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <section className="lg:col-span-5 relative bg-gradient-to-b from-sky-100 to-sky-50 flex flex-col border-r-2 border-slate-200">
          <div className="flex-1 relative flex items-center justify-center p-8">
            <div className="relative z-10 w-[300px] h-[300px] flex items-center justify-center">
              <img src={`/assets/horses/${userData.horseColor || 'white'}_horse.png`} alt="Horse" className="absolute w-full h-full object-contain z-10" />
              {getEquippedOverlay(userData, 'shoes') && <img src={getEquippedOverlay(userData, 'shoes')} className="absolute w-full h-full object-contain z-20" />}
              {getEquippedOverlay(userData, 'neckware') && <img src={getEquippedOverlay(userData, 'neckware')} className="absolute w-full h-full object-contain z-30" />}
              {getEquippedOverlay(userData, 'headware') && <img src={getEquippedOverlay(userData, 'headware')} className="absolute w-full h-full object-contain z-40" />}
              {getEquippedOverlay(userData, 'accessories') && <img src={getEquippedOverlay(userData, 'accessories')} className="absolute w-full h-full object-contain z-50" />}
              {userData.digestingTask && <div className="absolute -bottom-10 bg-white px-6 py-3 rounded-2xl shadow-xl border-b-4 border-emerald-200 flex items-center gap-3 z-50 animate-bounce"><Clock size={20} className="text-emerald-500" /><span className="font-bold text-slate-700">Digesting...</span></div>}
            </div>
          </div>
        </section>

        <section className="lg:col-span-7 bg-[#F0F4F8] flex flex-col h-full overflow-hidden">
          <div className="px-8 pt-8 pb-4 flex gap-4 overflow-x-auto no-scrollbar">
             <GameButton active={view === 'work'} onClick={() => setView('work')} color="emerald" icon={Briefcase}>Work</GameButton>
             <GameButton active={view === 'town'} onClick={() => setView('town')} color="blue" icon={Home}>Town</GameButton>
             <GameButton active={view === 'shop'} onClick={() => setView('shop')} color="rose" icon={ShoppingBag}>Shop</GameButton>
             <GameButton active={view === 'salon'} onClick={() => setView('salon')} color="purple" icon={Scissors}>Salon</GameButton>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-8">
            {view === 'work' && (
              <div className="space-y-4">
                {userData.activeTasks.map(task => (
                  <div key={task.id} className="bg-white p-5 rounded-2xl border-2 border-slate-100 flex justify-between items-center hover:border-emerald-300">
                    <div><div className="font-bold text-slate-700 text-lg">{task.title}</div><div className="text-emerald-600 font-bold text-xs mt-1">+{task.reward_hay} Hay</div></div>
                    <GameButton onClick={() => feedHorse(task)} color="white" disabled={!!userData.digestingTask}>🍎</GameButton>
                  </div>
                ))}
              </div>
            )}
            {view === 'town' && (
              <div className="grid grid-cols-2 gap-4">
                  {townData.buildings.map(b => (
                    <div key={b.id} className={`p-6 rounded-3xl border-b-8 ${b.unlocked ? 'bg-white' : 'bg-slate-100'}`}>
                      <div className="flex justify-between items-start mb-4"><span className="text-4xl">{b.icon}</span>{b.unlocked && <CheckCircle className="text-emerald-500" />}</div>
                      <h3 className="font-black text-slate-700">{b.name}</h3>
                      {!b.unlocked ? <GameButton onClick={() => contributeToTown(b.id)} color="blue" className="w-full mt-4 text-sm">Contribute 50</GameButton> : <GameButton onClick={() => b.id === 'salon' ? setView('salon') : null} color="white" className="w-full mt-4 text-sm">Enter</GameButton>}
                    </div>
                  ))}
              </div>
            )}
            {view === 'shop' && (
              <div className="space-y-4">
                 <div className="flex gap-2 pb-2 overflow-x-auto">{['all', 'headware', 'neckware', 'shoes', 'accessories'].map(f => <button key={f} onClick={() => setShopFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase ${shopFilter === f ? 'bg-rose-500 text-white' : 'bg-white text-slate-400'}`}>{f}</button>)}</div>
                 <div className="grid grid-cols-3 gap-4">
                  {SHOP_ITEMS.filter(i => shopFilter === 'all' || i.type === shopFilter).map(item => {
                    const isOwned = userData.inventory?.includes(item.id);
                    return (
                      <button key={item.id} onClick={() => isOwned ? equipItem(item) : buyItem(item)} className={`p-4 rounded-[2rem] border-b-8 flex flex-col items-center text-center bg-white border-slate-200 ${userData.equipped[item.type] === item.id ? 'ring-4 ring-rose-200' : ''}`}>
                        <img src={item.thumb} className="w-16 h-16 object-contain mb-2" />
                        <div className="font-bold text-xs text-slate-700">{item.name}</div>
                        <div className={`mt-2 text-[10px] font-black px-2 py-1 rounded uppercase ${isOwned ? 'bg-slate-100 text-slate-400' : 'bg-pink-500 text-white'}`}>{isOwned ? 'Own' : item.price}</div>
                      </button>
                    )
                  })}
                 </div>
              </div>
            )}
            {view === 'salon' && (
              <div className="grid grid-cols-3 gap-4">
                {townData.buildings.find(b => b.id === 'salon')?.unlocked ? COAT_COLORS.map(coat => (
                   <button key={coat.id} onClick={() => userData.ownedCoats.includes(coat.id) ? equipCoat(coat.id) : buyCoat(coat)} className="p-4 rounded-[2rem] border-b-8 flex flex-col items-center bg-white border-slate-200">
                      <img src={coat.img} className="w-16 h-16 object-contain mb-2" />
                      <div className="font-bold text-xs">{coat.name}</div>
                      <div className={`mt-2 text-[10px] font-black px-2 py-1 rounded uppercase ${userData.ownedCoats.includes(coat.id) ? 'bg-slate-100 text-slate-400' : 'bg-purple-500 text-white'}`}>{userData.ownedCoats.includes(coat.id) ? 'Own' : coat.price}</div>
                   </button>
                )) : <div className="col-span-3 text-center p-10 text-slate-400 font-bold">Salon Locked. Build it in Town!</div>}
              </div>
            )}
          </div>
        </section>
      </main>
      
      {showWellness && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-10 rounded-[3rem] text-center border-8 border-white">
            <h2 className="text-3xl font-black text-slate-800 mb-2">Morning Grooming</h2>
            <div className="grid grid-cols-2 gap-4 mt-6">{['fire', 'happy', 'ok', 'tired'].map(m => <button key={m} onClick={() => handleWellness(m)} className="p-6 bg-slate-50 rounded-[2rem] border-b-8 border-slate-200 hover:bg-sky-50 text-2xl capitalize font-bold">{m}</button>)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

const LoginScreen = ({ onLogin }) => {
  const [tab, setTab] = useState('join'); // 'join' or 'create'
  
  const handleCreate = (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    const code = Math.floor(1000 + Math.random() * 9000).toString(); 
    onLogin({ 
      name: d.get('name'), 
      teamCode: code, 
      stableName: d.get('stableName'), 
      role: 'manager' 
    });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    onLogin({ 
      name: d.get('name'), 
      teamCode: d.get('code'), 
      role: 'jockey' 
    });
  };

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-8 border-white ring-4 ring-sky-100">
        <div className="bg-sky-400 p-8 text-center">
          <div className="text-8xl mb-2 drop-shadow-md">🐴</div>
          <h1 className="text-4xl font-black text-white tracking-tight">Stable Goals</h1>
        </div>

        {/* TABS */}
        <div className="flex border-b-2 border-slate-100">
          <button onClick={() => setTab('join')} className={`flex-1 py-4 font-black text-sm uppercase tracking-wide transition-colors ${tab === 'join' ? 'text-sky-500 border-b-4 border-sky-500' : 'text-slate-400 hover:text-slate-600'}`}>Join Team</button>
          <button onClick={() => setTab('create')} className={`flex-1 py-4 font-black text-sm uppercase tracking-wide transition-colors ${tab === 'create' ? 'text-amber-500 border-b-4 border-amber-500' : 'text-slate-400 hover:text-slate-600'}`}>Create Stable</button>
        </div>
        
        <div className="p-8">
          {tab === 'join' ? (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-2">Team Code</label>
                <input name="code" placeholder="e.g. 4829" className="w-full bg-slate-100 border-b-4 border-slate-200 rounded-2xl px-6 py-4 font-mono text-xl text-center focus:outline-none focus:border-sky-400 transition-colors" required />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-2">Your Name</label>
                <input name="name" placeholder="e.g. Sarah" className="w-full bg-slate-100 border-b-4 border-slate-200 rounded-2xl px-6 py-4 text-xl text-center focus:outline-none focus:border-sky-400 transition-colors" required />
              </div>
              <button className="w-full bg-sky-400 hover:bg-sky-500 text-white font-black text-xl py-4 rounded-2xl border-b-8 border-sky-600 active:border-b-0 active:translate-y-2 transition-all shadow-xl shadow-sky-200">ENTER STABLE</button>
            </form>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                 <label className="text-xs font-bold text-slate-400 uppercase ml-2">Stable Name</label>
                 <input name="stableName" placeholder="e.g. Design Team" className="w-full bg-slate-100 border-b-4 border-slate-200 rounded-2xl px-6 py-4 text-xl text-center focus:outline-none focus:border-amber-400 transition-colors" required />
              </div>
              <div>
                 <label className="text-xs font-bold text-slate-400 uppercase ml-2">Manager Name</label>
                 <input name="name" placeholder="e.g. Boss" className="w-full bg-slate-100 border-b-4 border-slate-200 rounded-2xl px-6 py-4 text-xl text-center focus:outline-none focus:border-amber-400 transition-colors" required />
              </div>
              <div className="bg-amber-50 p-4 rounded-2xl text-amber-800 text-xs font-bold border-2 border-amber-100 text-center">
                 Creating a stable generates a unique 4-digit code for your team to join.
              </div>
              <button className="w-full bg-amber-400 hover:bg-amber-500 text-white font-black text-xl py-4 rounded-2xl border-b-8 border-amber-600 active:border-b-0 active:translate-y-2 transition-all shadow-xl shadow-amber-200">CREATE & JOIN</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};