import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Briefcase, 
  ShoppingBag, 
  Home, 
  Trophy, 
  Clock, 
  CheckCircle, 
  Zap,
  X,
  LogOut,
  User,
  Loader,
  Filter,
  Palette,
  Scissors
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  arrayUnion, 
  increment 
} from "firebase/firestore";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyB-j2PlwHFzwKWHRNyIFR1aNZqdVRHS_l4",
  authDomain: "stable-talk.firebaseapp.com",
  projectId: "stable-talk",
  storageBucket: "stable-talk.firebasestorage.app",
  messagingSenderId: "261641732141",
  appId: "1:261641732141:web:8d30751226507e179cb8a4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- ASSET DATA ---
// Structure: 
// thumb: The icon shown in the store (cropped, square)
// overlay: The transparent layer shown on the horse (full canvas size)

const SHOP_ITEMS = [
  // Headware
  { id: 'baseball_cap', name: 'Baseball Cap', type: 'headware', price: 15, thumb: '/assets/headware/baseball_cap_tn.png', overlay: '/assets/headware/baseball_cap.png' },
  { id: 'butterfly_clip', name: 'Butterfly Clip', type: 'headware', price: 10, thumb: '/assets/headware/butterfly_clip_tn.png', overlay: '/assets/headware/butterfly_clip.png' },
  { id: 'rocker_hair', name: 'Rocker Hair', type: 'headware', price: 35, thumb: '/assets/headware/rocker_hair_tn.png', overlay: '/assets/headware/rocker_hair.png' },
  { id: 'unicorn_horn', name: 'Unicorn Horn', type: 'headware', price: 50, thumb: '/assets/headware/unicorn_horn_tn.png', overlay: '/assets/headware/unicorn_horn.png' },

  // Neckware
  { id: 'fancy_necklace', name: 'Fancy Necklace', type: 'neckware', price: 25, thumb: '/assets/neckware/fancy_necklace_tn.png', overlay: '/assets/neckware/fancy_necklace.png' },
  { id: 'locket', name: 'Gold Locket', type: 'neckware', price: 15, thumb: '/assets/neckware/locket_tn.png', overlay: '/assets/neckware/locket.png' },
  { id: 'pucca', name: 'Pucca', type: 'headware', price: 30, thumb: '/assets/headware/pucca_tn.png', overlay: '/assets/headware/pucca.png' },

  // Shoes
  { id: 'cool_sneakers', name: 'Cool Sneakers', type: 'shoes', price: 20, thumb: '/assets/shoes/cool_sneakers_tn.png', overlay: '/assets/shoes/cool_sneakers.png' },
  { id: 'flip_flops', name: 'Flip Flops', type: 'shoes', price: 10, thumb: '/assets/shoes/flip_flops_tn.png', overlay: '/assets/shoes/flip_flops.png' },
  { id: 'ruby_slippers', name: 'Ruby Slippers', type: 'shoes', price: 40, thumb: '/assets/shoes/ruby_slippers_tn.png', overlay: '/assets/shoes/ruby_slippers.png' },
  { id: 'vans', name: 'Skater Vans', type: 'shoes', price: 25, thumb: '/assets/shoes/vans_tn.png', overlay: '/assets/shoes/vans.png' },

  // Accessories
  { id: 'mustache', name: 'Mustache', type: 'accessories', price: 12, thumb: '/assets/accessories/mustache_tn.png', overlay: '/assets/accessories/mustache.png' },
  { id: 'shaker', name: 'Protein Shaker', type: 'accessories', price: 15, thumb: '/assets/accessories/shaker_tn.png', overlay: '/assets/accessories/shaker.png' },
  { id: 'tote_bag', name: 'Tote Bag', type: 'accessories', price: 18, thumb: '/assets/accessories/tote_bag_tn.png', overlay: '/assets/accessories/tote_bag.png' },
];

const COAT_COLORS = [
  { id: 'white', name: 'Cloud White', price: 0, img: '/assets/horses/white.png' },
  { id: 'brown', name: 'Chestnut Brown', price: 100, img: '/assets/horses/brown.png' },
  { id: 'blue', name: 'Mystic Blue', price: 250, img: '/assets/horses/blue.png' },
];

const INITIAL_TASKS = [
  { id: 1, title: "Q3 Financial Report", type: "Deep Work", reward_hay: 200, reward_stat: "stamina" }, 
  { id: 2, title: "Client Email Sync", type: "Admin", reward_hay: 50, reward_stat: "speed" },
  { id: 3, title: "Update Documentation", type: "Maintenance", reward_hay: 80, reward_stat: "stamina" },
];

const INITIAL_TOWN = [
  { id: 'chat_barn', name: 'Chat Barn', cost: 300, current: 0, icon: '💬', description: 'Unlocks Team Chat', unlocked: false },
  { id: 'salon', name: 'The Mane Salon', cost: 500, current: 0, icon: '✂️', description: 'Unlocks Coat Colors', unlocked: false },
  { id: 'studio', name: 'Photo Studio', cost: 800, current: 0, icon: '📸', description: 'Unlocks Profiles', unlocked: false },
];

const DEFAULT_USER_STATE = {
  currency: { sugar: 50, hay: 100 },
  stats: { speed: 10, stamina: 10, mood: null },
  inventory: [], // IDs of owned items
  ownedCoats: ['white'], // IDs of owned coats
  horseColor: 'white', // Current coat ID
  equipped: { headware: null, neckware: null, shoes: null, accessories: null },
  activeTasks: INITIAL_TASKS,
  digestingTask: null
};

// --- COMPONENTS ---

const GameButton = ({ children, onClick, color = 'blue', className = '', disabled = false, active = false, icon: Icon }) => {
  const colors = {
    blue: 'bg-sky-400 hover:bg-sky-500 border-sky-600 text-white',
    rose: 'bg-rose-400 hover:bg-rose-500 border-rose-600 text-white',
    emerald: 'bg-emerald-400 hover:bg-emerald-500 border-emerald-600 text-white',
    amber: 'bg-amber-400 hover:bg-amber-500 border-amber-600 text-white',
    purple: 'bg-purple-400 hover:bg-purple-500 border-purple-600 text-white',
    slate: 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600',
    white: 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
  };

  const activeStyle = active ? 'translate-y-1 border-b-0 brightness-95' : '';

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`
        relative px-4 py-3 rounded-2xl font-black transition-all transform 
        border-b-4 active:border-b-0 active:translate-y-1
        flex items-center justify-center gap-2
        ${colors[color]} 
        ${disabled ? 'opacity-50 cursor-not-allowed border-b-0 translate-y-1 grayscale' : ''} 
        ${activeStyle}
        ${className}
      `}
    >
      {Icon && <Icon size={20} strokeWidth={3} />}
      {children}
    </button>
  );
};

// --- MAIN APPLICATION ---

export default function StableGoals() {
  const [session, setSession] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('work'); 
  
  // Game Data State
  const [userData, setUserData] = useState(null);
  const [townData, setTownData] = useState(null);
  
  // UI State
  const [showWellness, setShowWellness] = useState(false);
  const [toast, setToast] = useState(null);
  const [shopFilter, setShopFilter] = useState('all');

  // --- 1. AUTHENTICATION & INITIALIZATION ---

  useEffect(() => {
    const initApp = async () => {
      await signInAnonymously(auth);
      const saved = localStorage.getItem('stable_goals_creds');
      if (saved) {
        const { name, teamCode } = JSON.parse(saved);
        await connectToGame(name, teamCode);
      }
      setLoading(false);
    };
    initApp();
  }, []);

  const connectToGame = async (name, teamCode) => {
    const safeCode = teamCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const userDocId = `${safeCode}_${safeName}`;
    const townDocId = `${safeCode}_town`;

    setLoading(true);

    const userRef = doc(db, "users", userDocId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, { ...DEFAULT_USER_STATE, name, teamCode: safeCode });
    } else {
      // Data Migration
      const currentData = userSnap.data();
      if (!currentData.horseColor) {
        await updateDoc(userRef, { horseColor: 'white', ownedCoats: ['white'] });
      }
    }

    const townRef = doc(db, "towns", townDocId);
    const townSnap = await getDoc(townRef);
    
    if (!townSnap.exists()) {
      await setDoc(townRef, { buildings: INITIAL_TOWN });
    }

    onSnapshot(userRef, (doc) => setUserData(doc.data()));
    onSnapshot(townRef, (doc) => setTownData(doc.data()?.buildings || []));

    const sessionData = { name, teamCode: safeCode, docId: userDocId, townDocId };
    setSession(sessionData);
    localStorage.setItem('stable_goals_creds', JSON.stringify({ name, teamCode: safeCode }));
    
    if (!userSnap.exists() || !userSnap.data().stats?.mood) {
      setShowWellness(true);
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await connectToGame(formData.get('name'), formData.get('code'));
  };

  const handleLogout = () => {
    localStorage.removeItem('stable_goals_creds');
    setSession(null);
    setUserData(null);
    setTownData(null);
  };

  // --- 2. GAME ACTIONS ---

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const feedHorse = async (task) => {
    if (userData.digestingTask) return;
    const taskData = { ...task, startTime: Date.now(), duration: 3000 };
    const userRef = doc(db, "users", session.docId);
    const newActiveTasks = userData.activeTasks.filter(t => t.id !== task.id);
    await updateDoc(userRef, { activeTasks: newActiveTasks, digestingTask: taskData });
  };

  useEffect(() => {
    if (!userData?.digestingTask) return;
    const interval = setInterval(async () => {
      const { digestingTask } = userData;
      const elapsed = Date.now() - digestingTask.startTime;
      if (elapsed >= digestingTask.duration) {
        const userRef = doc(db, "users", session.docId);
        await updateDoc(userRef, {
          "currency.hay": increment(digestingTask.reward_hay),
          [`stats.${digestingTask.reward_stat}`]: increment(1),
          digestingTask: null
        });
        showToast(`Finished! +${digestingTask.reward_hay} Hay 🌾`);
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [userData?.digestingTask, session]);

  const buyItem = async (item) => {
    if (userData.currency.sugar >= item.price) {
      const userRef = doc(db, "users", session.docId);
      await updateDoc(userRef, {
        "currency.sugar": increment(-item.price),
        inventory: arrayUnion(item.id)
      });
      showToast(`Bought ${item.name}!`);
    } else {
      showToast("Need more Sugar Cubes!", "error");
    }
  };

  const buyCoat = async (coat) => {
    if (userData.currency.sugar >= coat.price) {
      const userRef = doc(db, "users", session.docId);
      await updateDoc(userRef, {
        "currency.sugar": increment(-coat.price),
        ownedCoats: arrayUnion(coat.id),
        horseColor: coat.id
      });
      showToast(`Bought ${coat.name} Coat!`);
    } else {
      showToast("Need more Sugar Cubes!", "error");
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
    const building = townData.find(b => b.id === buildingId);
    if (!building) return;
    if (userData.currency.hay >= 50) {
      const userRef = doc(db, "users", session.docId);
      const townRef = doc(db, "towns", session.townDocId);
      await updateDoc(userRef, { "currency.hay": increment(-50) });
      const newCurrent = Math.min(building.current + 50, building.cost);
      const isNowUnlocked = newCurrent >= building.cost;
      const newBuildings = townData.map(b => 
        b.id === buildingId ? { ...b, current: newCurrent, unlocked: isNowUnlocked } : b
      );
      await updateDoc(townRef, { buildings: newBuildings });
      if (isNowUnlocked) showToast(`🎉 UNLOCKED: ${building.name}!`);
      else showToast("Contributed 50 Hay 🌾");
    } else {
      showToast("Need more Hay!", "error");
    }
  };

  const handleWellness = async (mood) => {
    const userRef = doc(db, "users", session.docId);
    await updateDoc(userRef, {
      "stats.mood": mood,
      "currency.sugar": increment(10)
    });
    setShowWellness(false);
    showToast("Checked in! +10 🍬");
  };

  // --- 3. HELPER RENDERS ---

  const getEquippedOverlay = (type) => {
    const itemId = userData.equipped[type];
    if (!itemId) return null;
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    return item ? item.overlay : null;
  };

  // --- 4. MAIN RENDER ---

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-sky-50 text-sky-400 font-bold text-xl animate-pulse">Loading Stable...</div>;
  if (!session) return <LoginScreen onLogin={handleLogin} />;
  if (!userData || !townData) return null;

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-sans text-slate-800 flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <header className="bg-white border-b-2 border-slate-200 px-6 py-3 flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-sky-500 text-white p-2 rounded-xl"><Zap size={24} fill="currentColor" /></div>
          <h1 className="text-xl font-black text-slate-700 tracking-tight hidden md:block">Stable Goals</h1>
        </div>
        <div className="flex items-center gap-6">
           <CurrencyDisplay icon="🌾" label="Hay" value={userData.currency.hay} color="amber" />
           <CurrencyDisplay icon="🍬" label="Sugar" value={userData.currency.sugar} color="pink" />
           <div className="flex items-center gap-3 pl-6 border-l-2 border-slate-100">
             <div className="text-right hidden md:block">
               <div className="font-bold text-slate-700 text-sm">{userData.name}</div>
               <div className="text-xs text-slate-400 font-bold">{userData.teamCode}</div>
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`} alt="User" />
             </div>
             <button onClick={handleLogout} className="text-slate-400 hover:text-rose-500 transition-colors"><LogOut size={20} /></button>
           </div>
        </div>
      </header>

      {/* DESKTOP LAYOUT */}
      <main className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* LEFT PANE: PADDOCK */}
        <section className="lg:col-span-5 relative bg-gradient-to-b from-sky-100 to-sky-50 flex flex-col border-r-2 border-slate-200 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.02)]">
          <div className="flex-1 relative flex items-center justify-center p-8">
            <div className="absolute inset-0 overflow-hidden">
               <div className="absolute top-20 left-10 text-8xl opacity-20 text-white animate-pulse">☁️</div>
               <div className="absolute bottom-0 w-full h-1/3 bg-[#A7D1AB] rounded-t-[50%] scale-150 origin-bottom"></div>
            </div>

            {/* THE HORSE COMPOSITE */}
            <div className="relative z-10 transform hover:scale-105 transition-transform duration-300 cursor-pointer group w-[300px] h-[300px] flex items-center justify-center">
              
              {/* Base Horse */}
              <img src={`/assets/horses/${userData.horseColor || 'white'}.png`} alt="Horse" className="absolute w-full h-full object-contain z-10 drop-shadow-2xl" />

              {/* Layers (Overlays) */}
              {getEquippedOverlay('shoes') && <img src={getEquippedOverlay('shoes')} alt="Shoes" className="absolute w-full h-full object-contain z-20" />}
              {getEquippedOverlay('neckware') && <img src={getEquippedOverlay('neckware')} alt="Neck" className="absolute w-full h-full object-contain z-30" />}
              {getEquippedOverlay('headware') && <img src={getEquippedOverlay('headware')} alt="Head" className="absolute w-full h-full object-contain z-40" />}
              {getEquippedOverlay('accessories') && <img src={getEquippedOverlay('accessories')} alt="Acc" className="absolute w-full h-full object-contain z-50" />}

              {/* Mood */}
              {userData.stats.mood && (
                <div className="absolute -right-4 top-0 bg-white p-3 rounded-full shadow-lg border-4 border-slate-50 text-4xl animate-bounce z-50">
                  {userData.stats.mood === 'fire' ? '🔥' : userData.stats.mood === 'happy' ? '😄' : userData.stats.mood === 'ok' ? '😐' : '😴'}
                </div>
              )}

              {/* Digestion Bubble */}
              {userData.digestingTask && (
                <div className="absolute -bottom-10 bg-white px-6 py-3 rounded-2xl shadow-xl border-b-4 border-emerald-200 flex items-center gap-3 animate-in slide-in-from-bottom-4 z-50">
                  <div className="bg-emerald-100 p-2 rounded-full text-emerald-600 animate-spin"><Clock size={20} /></div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Digesting</div>
                    <div className="font-bold text-slate-700 text-sm leading-none">{userData.digestingTask.title}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT PANE: ACTION DECK */}
        <section className="lg:col-span-7 bg-[#F0F4F8] flex flex-col h-full overflow-hidden">
          
          {/* TABS */}
          <div className="px-8 pt-8 pb-4 flex gap-4 overflow-x-auto no-scrollbar">
             <GameButton active={view === 'work'} onClick={() => setView('work')} color="emerald" className="flex-1 min-w-[100px]" icon={Briefcase}>Work</GameButton>
             <GameButton active={view === 'town'} onClick={() => setView('town')} color="blue" className="flex-1 min-w-[100px]" icon={Home}>Town</GameButton>
             <GameButton active={view === 'shop'} onClick={() => setView('shop')} color="rose" className="flex-1 min-w-[100px]" icon={ShoppingBag}>Shop</GameButton>
             <GameButton active={view === 'salon'} onClick={() => setView('salon')} color="purple" className="flex-1 min-w-[100px]" icon={Scissors}>Salon</GameButton>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-8">
            
            {/* WORK VIEW */}
            {view === 'work' && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300 fade-in">
                {userData.activeTasks.length > 0 ? userData.activeTasks.map(task => (
                  <div key={task.id} className="bg-white p-5 rounded-2xl border-2 border-slate-100 flex justify-between items-center group hover:border-emerald-300 transition-all hover:shadow-lg">
                    <div>
                      <div className="font-bold text-slate-700 text-lg">{task.title}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-xs font-bold uppercase">+{task.reward_hay} Hay</span>
                        <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-lg text-xs font-bold uppercase">{task.type}</span>
                      </div>
                    </div>
                    <GameButton onClick={() => feedHorse(task)} color="white" className="!p-3 !rounded-xl border-slate-200 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white" disabled={!!userData.digestingTask}>
                      <span className="text-2xl">🍎</span>
                    </GameButton>
                  </div>
                )) : (
                  <div className="text-center py-20 bg-white rounded-[2rem] border-dashed border-4 border-slate-200">
                    <div className="text-6xl mb-4 grayscale opacity-50">🐴</div>
                    <p className="text-slate-400 font-bold">All tasks complete!</p>
                  </div>
                )}
              </div>
            )}

            {/* TOWN VIEW */}
            {view === 'town' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {townData.map(b => (
                    <div key={b.id} className={`p-6 rounded-3xl border-b-8 transition-all ${b.unlocked ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200'}`}>
                      <div className="flex justify-between items-start mb-6">
                         <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-sm ${b.unlocked ? 'bg-yellow-100' : 'bg-white grayscale opacity-50'}`}>{b.icon}</div>
                         {b.unlocked && <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full font-black uppercase">Unlocked</span>}
                      </div>
                      <h3 className="font-black text-slate-700 text-xl">{b.name}</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1 mb-4 h-10">{b.description}</p>
                      {!b.unlocked ? (
                        <div className="space-y-3">
                          <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${(b.current / b.cost) * 100}%` }} />
                          </div>
                          <GameButton onClick={() => contributeToTown(b.id)} color="blue" className="w-full mt-4 text-sm">Contribute 50 Hay 🌾</GameButton>
                        </div>
                      ) : (
                        <GameButton onClick={() => b.id === 'salon' ? setView('salon') : null} color="white" className="w-full text-sm bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                           {b.id === 'salon' ? 'Enter Salon' : 'Enter Building'}
                        </GameButton>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SHOP VIEW */}
            {view === 'shop' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                 {/* Filter Tabs */}
                 <div className="flex gap-2 pb-2 overflow-x-auto">
                    {['all', 'headware', 'neckware', 'shoes', 'accessories'].map(filter => (
                      <button 
                        key={filter}
                        onClick={() => setShopFilter(filter)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${shopFilter === filter ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
                      >
                        {filter}
                      </button>
                    ))}
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {SHOP_ITEMS.filter(i => shopFilter === 'all' || i.type === shopFilter).map(item => {
                    const isOwned = userData.inventory?.includes(item.id);
                    const isEquipped = userData.equipped[item.type] === item.id;
                    return (
                      <button 
                        key={item.id}
                        onClick={() => isOwned ? equipItem(item) : buyItem(item)}
                        className={`
                          relative p-6 rounded-[2rem] border-b-8 flex flex-col items-center text-center transition-all active:scale-95 active:border-b-0 active:translate-y-2
                          ${isEquipped 
                            ? 'bg-rose-50 border-rose-300 ring-4 ring-rose-200' 
                            : 'bg-white border-slate-200 hover:border-rose-300 hover:shadow-xl'}
                        `}
                      >
                        <div className="w-24 h-24 mb-4 flex items-center justify-center">
                          {/* Use Thumbnail for Shop */}
                          <img src={item.thumb} alt={item.name} className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="font-black text-slate-700">{item.name}</div>
                        <div className={`mt-3 text-xs font-black px-4 py-2 rounded-xl uppercase tracking-wider w-full ${isOwned ? 'bg-slate-100 text-slate-400' : 'bg-pink-500 text-white shadow-lg shadow-pink-200'}`}>
                          {isOwned ? (isEquipped ? 'Wearing' : 'Own') : `${item.price} 🍬`}
                        </div>
                      </button>
                    )
                  })}
                 </div>
              </div>
            )}

            {/* SALON VIEW */}
            {view === 'salon' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                {townData.find(b => b.id === 'salon')?.unlocked ? (
                  <>
                     <div className="bg-purple-500 text-white p-6 rounded-3xl border-b-8 border-purple-700 mb-4">
                        <h2 className="text-2xl font-black">The Mane Salon</h2>
                        <p className="text-purple-100">Change your coat color for a fresh look.</p>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {COAT_COLORS.map(coat => {
                           const isOwned = userData.ownedCoats?.includes(coat.id);
                           const isEquipped = userData.horseColor === coat.id;
                           return (
                              <button 
                                key={coat.id}
                                onClick={() => isOwned ? equipCoat(coat.id) : buyCoat(coat)}
                                className={`
                                  relative p-6 rounded-[2rem] border-b-8 flex flex-col items-center text-center transition-all active:scale-95 active:border-b-0 active:translate-y-2
                                  ${isEquipped 
                                    ? 'bg-purple-50 border-purple-300 ring-4 ring-purple-200' 
                                    : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-xl'}
                                `}
                              >
                                <div className="w-24 h-24 mb-4 flex items-center justify-center">
                                   <img src={coat.img} alt={coat.name} className="max-w-full max-h-full object-contain" />
                                </div>
                                <div className="font-black text-slate-700">{coat.name}</div>
                                <div className={`mt-3 text-xs font-black px-4 py-2 rounded-xl uppercase tracking-wider w-full ${isOwned ? 'bg-slate-100 text-slate-400' : 'bg-purple-500 text-white'}`}>
                                  {isOwned ? (isEquipped ? 'Equipped' : 'Select') : `${coat.price} 🍬`}
                                </div>
                              </button>
                           )
                        })}
                     </div>
                  </>
                ) : (
                  <div className="text-center py-20 bg-slate-100 rounded-[3rem] border-4 border-dashed border-slate-200">
                     <div className="text-6xl mb-4 grayscale opacity-50">🔒</div>
                     <h2 className="text-2xl font-black text-slate-400">Salon Locked</h2>
                     <p className="text-slate-400">Contribute Hay in the Town tab to build the Salon!</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </section>
      </main>

      {/* WELLNESS OVERLAY */}
      {showWellness && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-10 rounded-[3rem] shadow-2xl text-center border-8 border-white">
            <h2 className="text-3xl font-black text-slate-800 mb-2">Morning Grooming</h2>
            <p className="text-slate-500 mb-10 font-bold text-lg">How is {session.name} feeling today?</p>
            <div className="grid grid-cols-2 gap-4">
              {['fire', 'happy', 'ok', 'tired'].map(mood => (
                <button key={mood} onClick={() => handleWellness(mood)} className="p-6 bg-slate-50 rounded-[2rem] border-b-8 border-slate-200 hover:bg-sky-50 hover:border-sky-300 transition-all active:border-b-0 active:translate-y-2">
                   <span className="text-4xl capitalize">{mood}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl z-[60] font-black text-lg animate-in slide-in-from-bottom-5 fade-in duration-300 flex items-center gap-3 border-b-8 ${toast.type === 'error' ? 'bg-rose-500 border-rose-700 text-white' : 'bg-slate-800 border-slate-950 text-white'}`}>
          {toast.type === 'success' && <CheckCircle size={24} className="text-emerald-400" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

// --- SUBCOMPONENTS ---

const CurrencyDisplay = ({ icon, label, value, color }) => (
  <div className={`bg-${color}-50 border-2 border-${color}-100 px-4 py-1.5 rounded-xl flex items-center gap-2`}>
    <span className="text-2xl">{icon}</span>
    <div>
      <div className={`text-[10px] font-black text-${color}-400 uppercase leading-none`}>{label}</div>
      <div className={`font-black text-${color}-800 leading-none`}>{value}</div>
    </div>
  </div>
);

const LoginScreen = ({ onLogin }) => (
  <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4 font-sans">
    <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-8 border-white ring-4 ring-sky-100">
      <div className="bg-sky-400 p-10 text-center">
        <div className="text-8xl mb-4 drop-shadow-lg">🐴</div>
        <h1 className="text-4xl font-black text-white tracking-tight">Stable Goals</h1>
      </div>
      <form onSubmit={onLogin} className="p-10 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-black text-slate-400 uppercase tracking-wider ml-2">Team Code</label>
          <input name="code" type="text" placeholder="e.g. RACE-2024" className="w-full bg-slate-100 border-b-4 border-slate-200 rounded-2xl px-6 py-4 font-mono text-xl text-slate-700 focus:border-sky-400 focus:outline-none" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-black text-slate-400 uppercase tracking-wider ml-2">Your Name</label>
          <input name="name" type="text" placeholder="e.g. Sarah" className="w-full bg-slate-100 border-b-4 border-slate-200 rounded-2xl px-6 py-4 text-xl text-slate-700 focus:border-sky-400 focus:outline-none" required />
        </div>
        <button className="w-full bg-sky-400 hover:bg-sky-500 text-white font-black text-xl py-4 rounded-2xl border-b-8 border-sky-600 active:border-b-0 active:translate-y-2 transition-all shadow-xl shadow-sky-200">ENTER STABLE</button>
      </form>
    </div>
  </div>
);