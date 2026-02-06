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
  Loader
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
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

// --- FIREBASE CONFIGURATION (From your screenshot) ---
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

// --- CONSTANTS & DEFAULTS ---

const SHOP_ITEMS = [
  { id: 'hat_cowboy', name: 'Rancher Hat', type: 'headware', price: 5, icon: '🤠' },
  { id: 'hat_top', name: 'Fancy Topper', type: 'headware', price: 10, icon: '🎩' },
  { id: 'hat_crown', name: 'Royal Crown', type: 'headware', price: 50, icon: '👑' },
  { id: 'neck_bandana', name: 'Red Bandana', type: 'neckware', price: 5, icon: '🧣' },
  { id: 'acc_glasses', name: 'Cool Shades', type: 'accessories', price: 8, icon: '🕶️' },
  { id: 'shoe_gold', name: 'Golden Shoes', type: 'shoes', price: 15, icon: '✨' },
];

const INITIAL_TASKS = [
  { id: 1, title: "Q3 Financial Report", type: "Deep Work", reward_hay: 200, reward_stat: "stamina" }, 
  { id: 2, title: "Client Email Sync", type: "Admin", reward_hay: 50, reward_stat: "speed" },
  { id: 3, title: "Update Documentation", type: "Maintenance", reward_hay: 80, reward_stat: "stamina" },
];

const INITIAL_TOWN = [
  { id: 'chat_barn', name: 'Chat Barn', cost: 500, current: 0, icon: '💬', description: 'Unlocks Team Chat', unlocked: false },
  { id: 'studio', name: 'Photo Studio', cost: 800, current: 0, icon: '📸', description: 'Unlocks Profiles', unlocked: false },
];

const DEFAULT_USER_STATE = {
  currency: { sugar: 25, hay: 100 },
  stats: { speed: 10, stamina: 10, mood: null },
  inventory: ['hat_cowboy'],
  equipped: { headware: 'hat_cowboy', neckware: null, shoes: null },
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
  const [session, setSession] = useState(null); // { name, teamCode, docId }
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('work'); 
  
  // Game Data State (Synced from Firebase)
  const [userData, setUserData] = useState(null);
  const [townData, setTownData] = useState(null); // This is now shared!
  
  // UI State
  const [showWellness, setShowWellness] = useState(false);
  const [toast, setToast] = useState(null);
  const [raceProgress, setRaceProgress] = useState(0);
  const [isRacing, setIsRacing] = useState(false);

  // --- 1. AUTHENTICATION & INITIALIZATION ---

  useEffect(() => {
    const initApp = async () => {
      // Sign in silently to Firebase to allow DB access
      await signInAnonymously(auth);
      
      // Check for saved session
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
    // Sanitize ID
    const safeCode = teamCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const userDocId = `${safeCode}_${safeName}`;
    const townDocId = `${safeCode}_town`;

    setLoading(true);

    // 1. Setup User Document
    const userRef = doc(db, "users", userDocId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, { ...DEFAULT_USER_STATE, name, teamCode: safeCode });
    }

    // 2. Setup Town Document (Shared)
    const townRef = doc(db, "towns", townDocId);
    const townSnap = await getDoc(townRef);
    
    if (!townSnap.exists()) {
      await setDoc(townRef, { buildings: INITIAL_TOWN });
    }

    // 3. Setup Listeners (Real-time Sync)
    // Listen to USER
    onSnapshot(userRef, (doc) => {
      setUserData(doc.data());
    });

    // Listen to TOWN (Shared!)
    onSnapshot(townRef, (doc) => {
      setTownData(doc.data()?.buildings || []);
    });

    // 4. Save Session
    const sessionData = { name, teamCode: safeCode, docId: userDocId, townDocId };
    setSession(sessionData);
    localStorage.setItem('stable_goals_creds', JSON.stringify({ name, teamCode: safeCode }));
    
    // Trigger Wellness check if first load of session
    if (!userSnap.exists() || !userSnap.data().stats.mood) {
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

  // --- 2. GAME ACTIONS (Updated to write to Firebase) ---

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const feedHorse = async (task) => {
    if (userData.digestingTask) return;

    // We only set the start time in DB. Logic handles the rest locally for UI, but could be cloud function.
    // For this prototype, we update DB state to "digesting"
    const taskData = { ...task, startTime: Date.now(), duration: 3000 };
    
    const userRef = doc(db, "users", session.docId);
    
    // Remove task from active, add to digesting
    const newActiveTasks = userData.activeTasks.filter(t => t.id !== task.id);
    
    await updateDoc(userRef, {
      activeTasks: newActiveTasks,
      digestingTask: taskData
    });
  };

  // Check digestion status (Client side simulation)
  useEffect(() => {
    if (!userData?.digestingTask) return;

    const interval = setInterval(async () => {
      const { digestingTask } = userData;
      const elapsed = Date.now() - digestingTask.startTime;
      
      if (elapsed >= digestingTask.duration) {
        // Task Complete! Update DB
        const userRef = doc(db, "users", session.docId);
        
        // Prepare updates
        // Note: In a real app, use Firestore 'increment' to be safe against race conditions
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

  const equipItem = async (item) => {
    const userRef = doc(db, "users", session.docId);
    await updateDoc(userRef, {
      [`equipped.${item.type}`]: item.id
    });
  };

  const contributeToTown = async (buildingId) => {
    const building = townData.find(b => b.id === buildingId);
    if (!building) return;

    if (userData.currency.hay >= 50) {
      const userRef = doc(db, "users", session.docId);
      const townRef = doc(db, "towns", session.townDocId);
      
      // 1. Deduct from User
      await updateDoc(userRef, {
        "currency.hay": increment(-50)
      });

      // 2. Add to Shared Town
      const newCurrent = Math.min(building.current + 50, building.cost);
      const isNowUnlocked = newCurrent >= building.cost;
      
      // We need to map the array to update the specific building
      // In Firestore, updating an object in an array is tricky. 
      // We'll just read the whole array, modify, and write back for this prototype.
      const newBuildings = townData.map(b => 
        b.id === buildingId ? { ...b, current: newCurrent, unlocked: isNowUnlocked } : b
      );

      await updateDoc(townRef, { buildings: newBuildings });

      if (isNowUnlocked) {
        showToast(`🎉 UNLOCKED: ${building.name}!`);
      } else {
        showToast("Contributed 50 Hay 🌾");
      }
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

  // Race Logic (Local Simulation)
  useEffect(() => {
    let interval;
    if (isRacing) {
      interval = setInterval(() => {
        setRaceProgress(prev => {
          if (prev >= 100) {
            setIsRacing(false);
            showToast("You placed 1st! 🥇");
            return 100;
          }
          return prev + (0.5 + (userData.stats.speed * 0.05)); 
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isRacing]);


  // --- 3. VIEWS ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-50">
        <div className="text-center animate-pulse">
          <div className="text-6xl mb-4">🐎</div>
          <div className="text-sky-400 font-bold">Loading Stable...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-8 border-white ring-4 ring-sky-100">
          <div className="bg-sky-400 p-10 text-center relative overflow-hidden">
            <div className="text-8xl mb-4 relative z-10 drop-shadow-lg">🐴</div>
            <h1 className="text-4xl font-black text-white tracking-tight relative z-10 drop-shadow-md">Stable Goals</h1>
            <p className="text-sky-100 font-bold relative z-10 text-lg">Productivity with a Kick</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-400 uppercase tracking-wider ml-2">Team Code</label>
              <input name="code" type="text" placeholder="e.g. RACE-2024" className="w-full bg-slate-100 border-b-4 border-slate-200 rounded-2xl px-6 py-4 font-mono text-xl text-slate-700 focus:border-sky-400 focus:outline-none transition-colors" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-400 uppercase tracking-wider ml-2">Your Name</label>
              <input name="name" type="text" placeholder="e.g. Sarah" className="w-full bg-slate-100 border-b-4 border-slate-200 rounded-2xl px-6 py-4 text-xl text-slate-700 focus:border-sky-400 focus:outline-none transition-colors" required />
            </div>
            <button className="w-full bg-sky-400 hover:bg-sky-500 text-white font-black text-xl py-4 rounded-2xl border-b-8 border-sky-600 active:border-b-0 active:translate-y-2 transition-all shadow-xl shadow-sky-200">
              ENTER STABLE
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Ensure data is loaded before rendering main app
  if (!userData || !townData) return null;

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-sans text-slate-800 flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <header className="bg-white border-b-2 border-slate-200 px-6 py-3 flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-sky-500 text-white p-2 rounded-xl">
            <Zap size={24} fill="currentColor" />
          </div>
          <h1 className="text-xl font-black text-slate-700 tracking-tight hidden md:block">Stable Goals</h1>
        </div>

        <div className="flex items-center gap-6">
           {/* Currency HUD */}
           <div className="flex gap-3">
              <div className="bg-amber-50 border-2 border-amber-100 px-4 py-1.5 rounded-xl flex items-center gap-2">
                <span className="text-2xl">🌾</span>
                <div>
                  <div className="text-[10px] font-black text-amber-400 uppercase leading-none">Hay</div>
                  <div className="font-black text-amber-800 leading-none">{userData.currency.hay}</div>
                </div>
              </div>
              <div className="bg-pink-50 border-2 border-pink-100 px-4 py-1.5 rounded-xl flex items-center gap-2">
                <span className="text-2xl">🍬</span>
                <div>
                  <div className="text-[10px] font-black text-pink-400 uppercase leading-none">Sugar</div>
                  <div className="font-black text-pink-800 leading-none">{userData.currency.sugar}</div>
                </div>
              </div>
           </div>

           {/* User Profile */}
           <div className="flex items-center gap-3 pl-6 border-l-2 border-slate-100">
             <div className="text-right hidden md:block">
               <div className="font-bold text-slate-700 text-sm">{userData.name}</div>
               <div className="text-xs text-slate-400 font-bold">{userData.teamCode}</div>
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border-2 border-slate-200">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`} alt="User" />
             </div>
             <button onClick={handleLogout} className="text-slate-400 hover:text-rose-500 transition-colors">
               <LogOut size={20} />
             </button>
           </div>
        </div>
      </header>

      {/* DESKTOP LAYOUT GRID */}
      <main className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* LEFT PANE: THE PADDOCK (Companion View) */}
        <section className="lg:col-span-5 relative bg-gradient-to-b from-sky-100 to-sky-50 flex flex-col border-r-2 border-slate-200 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.02)]">
          {/* Environment */}
          <div className="flex-1 relative flex items-center justify-center p-8">
            
            {/* Background Decor */}
            <div className="absolute inset-0 overflow-hidden">
               <div className="absolute top-20 left-10 text-8xl opacity-20 text-white animate-pulse">☁️</div>
               <div className="absolute top-40 right-20 text-6xl opacity-20 text-white animate-pulse delay-700">☁️</div>
               {/* Rolling Hills */}
               <div className="absolute bottom-0 w-full h-1/3 bg-[#A7D1AB] rounded-t-[50%] scale-150 origin-bottom"></div>
            </div>

            {/* THE HORSE */}
            <div className="relative z-10 transform hover:scale-105 transition-transform duration-300 cursor-pointer group">
              {/* Status Bubbles */}
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-600 shadow-sm border border-slate-200">
                   SPD: {userData.stats.speed}
                 </div>
                 <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-600 shadow-sm border border-slate-200">
                   STM: {userData.stats.stamina}
                 </div>
              </div>

              {/* Character Composite */}
              <div className="text-[14rem] leading-none drop-shadow-2xl filter relative">
                🐎
                {userData.equipped.headware === 'hat_cowboy' && <div className="absolute -top-[5.5rem] left-[1.5rem] text-[8rem]">🤠</div>}
                {userData.equipped.headware === 'hat_top' && <div className="absolute -top-[6rem] left-[0.5rem] text-[8rem]">🎩</div>}
                {userData.equipped.headware === 'hat_crown' && <div className="absolute -top-[6rem] left-[1rem] text-[8rem]">👑</div>}
                {userData.equipped.neckware === 'neck_bandana' && <div className="absolute top-[8rem] left-[3rem] text-[8rem]">🧣</div>}
                {userData.equipped.accessories === 'acc_glasses' && <div className="absolute top-[2.5rem] left-[3.5rem] text-[7rem]">🕶️</div>}
                
                {/* Mood Indicator */}
                {userData.stats.mood && (
                  <div className="absolute -right-8 top-0 bg-white p-3 rounded-full shadow-lg border-4 border-slate-50 text-4xl animate-bounce">
                    {userData.stats.mood === 'fire' ? '🔥' : userData.stats.mood === 'happy' ? '😄' : userData.stats.mood === 'ok' ? '😐' : '😴'}
                  </div>
                )}
              </div>

              {/* Digestion Bubble */}
              {userData.digestingTask && (
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-2xl shadow-xl border-b-4 border-emerald-200 flex items-center gap-3 whitespace-nowrap animate-in slide-in-from-bottom-4">
                  <div className="bg-emerald-100 p-2 rounded-full text-emerald-600 animate-spin">
                    <Clock size={20} />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Digesting</div>
                    <div className="font-bold text-slate-700 text-sm leading-none">{userData.digestingTask.title}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT PANE: THE ACTION DECK */}
        <section className="lg:col-span-7 bg-[#F0F4F8] flex flex-col h-full overflow-hidden">
          
          {/* Deck Tabs */}
          <div className="px-8 pt-8 pb-4 flex gap-4 overflow-x-auto no-scrollbar">
             <GameButton 
               active={view === 'work'} 
               onClick={() => setView('work')} 
               color="emerald" 
               className="flex-1 min-w-[120px]"
               icon={Briefcase}
             >
               Work
             </GameButton>
             <GameButton 
               active={view === 'town'} 
               onClick={() => setView('town')} 
               color="blue" 
               className="flex-1 min-w-[120px]"
               icon={Home}
             >
               Town
             </GameButton>
             <GameButton 
               active={view === 'shop'} 
               onClick={() => setView('shop')} 
               color="rose" 
               className="flex-1 min-w-[120px]"
               icon={ShoppingBag}
             >
               Shop
             </GameButton>
             <GameButton 
               active={view === 'race'} 
               onClick={() => setView('race')} 
               color="amber" 
               className="flex-1 min-w-[120px]"
               icon={Trophy}
             >
               Race
             </GameButton>
          </div>

          {/* Deck Content Area */}
          <div className="flex-1 overflow-y-auto px-8 pb-8">
            
            {/* --- WORK VIEW --- */}
            {view === 'work' && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300 fade-in">
                <div className="bg-white p-6 rounded-3xl border-b-4 border-slate-200 mb-6">
                  <h2 className="text-2xl font-black text-slate-700 mb-1">Task Feed</h2>
                  <p className="text-slate-400 font-medium">Feed your horse completed tasks to earn stats.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {userData.activeTasks.length > 0 ? userData.activeTasks.map(task => (
                    <div key={task.id} className="bg-white p-5 rounded-2xl border-2 border-slate-100 flex justify-between items-center group hover:border-emerald-300 transition-all hover:shadow-lg shadow-sm">
                      <div>
                        <div className="font-bold text-slate-700 text-lg">{task.title}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">+{task.reward_hay} Hay</span>
                          <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">{task.type}</span>
                        </div>
                      </div>
                      <GameButton onClick={() => feedHorse(task)} color="white" className="!p-3 !rounded-xl border-slate-200 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-600 transition-colors" disabled={!!userData.digestingTask}>
                        <span className="text-2xl">🍎</span>
                      </GameButton>
                    </div>
                  )) : (
                    <div className="text-center py-20 bg-white rounded-[2rem] border-dashed border-4 border-slate-200">
                      <div className="text-6xl mb-4 grayscale opacity-50">🐴</div>
                      <p className="text-slate-400 font-bold text-lg">All tasks complete!</p>
                      <p className="text-slate-400">Your horse is full for today.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- TOWN VIEW --- */}
            {view === 'town' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 fade-in">
                <div className="bg-blue-500 text-white p-8 rounded-3xl border-b-8 border-blue-700 relative overflow-hidden">
                   <div className="relative z-10">
                     <h2 className="text-3xl font-black mb-2">Town Construction</h2>
                     <p className="text-blue-100 font-medium max-w-md">Pool your Hay with the team to build facilities.</p>
                     <div className="mt-6 inline-flex bg-black/20 backdrop-blur px-4 py-2 rounded-xl font-bold border border-white/10">
                        Total Treasury: {townData.reduce((acc, b) => acc + b.current, 0)} 🌾
                     </div>
                   </div>
                   <div className="absolute right-0 bottom-0 text-9xl opacity-20 transform translate-x-8 translate-y-8">🏗️</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {townData.map(b => (
                    <div key={b.id} className={`p-6 rounded-3xl border-b-8 transition-all relative overflow-hidden ${b.unlocked ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200'}`}>
                      <div className="flex justify-between items-start mb-6">
                         <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-sm ${b.unlocked ? 'bg-yellow-100' : 'bg-white grayscale opacity-50'}`}>
                           {b.icon}
                         </div>
                         {b.unlocked && <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full font-black uppercase tracking-wider">Unlocked</span>}
                      </div>
                      
                      <h3 className="font-black text-slate-700 text-xl">{b.name}</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1 mb-4 h-10">{b.description}</p>

                      {!b.unlocked ? (
                        <div className="space-y-3">
                          <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-wider">
                            <span>{Math.floor((b.current / b.cost) * 100)}% Funded</span>
                            <span>{b.current}/{b.cost}</span>
                          </div>
                          <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${(b.current / b.cost) * 100}%` }} />
                          </div>
                          <GameButton onClick={() => contributeToTown(b.id)} color="blue" className="w-full mt-4 text-sm">
                            Contribute 50 Hay 🌾
                          </GameButton>
                        </div>
                      ) : (
                        <GameButton color="white" className="w-full text-sm bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                          Enter Building
                        </GameButton>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- SHOP VIEW --- */}
            {view === 'shop' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 fade-in">
                 <div className="bg-rose-500 text-white p-6 rounded-3xl border-b-8 border-rose-700 flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-black">The Haberdashery</h2>
                      <p className="text-rose-100 font-medium">Spend your Sugar Cubes on style.</p>
                    </div>
                    <div className="text-5xl">🎪</div>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {SHOP_ITEMS.map(item => {
                    const isOwned = userData.inventory.includes(item.id);
                    const isEquipped = userData.equipped[item.type] === item.id;
                    return (
                      <button 
                        key={item.id}
                        onClick={() => isOwned ? equipItem(item) : buyItem(item)}
                        className={`
                          relative p-6 rounded-[2rem] border-b-8 flex flex-col items-center text-center transition-all active:scale-95 active:border-b-0 active:translate-y-2
                          ${isEquipped 
                            ? 'bg-rose-50 border-rose-300 ring-4 ring-rose-200 ring-offset-2' 
                            : 'bg-white border-slate-200 hover:border-rose-300 hover:shadow-xl'}
                        `}
                      >
                        {isEquipped && <div className="absolute top-4 right-4 text-rose-500"><CheckCircle size={20} fill="currentColor" className="text-white" /></div>}
                        <div className="text-6xl mb-4 transform transition-transform hover:scale-110">{item.icon}</div>
                        <div className="font-black text-slate-700">{item.name}</div>
                        <div className={`mt-3 text-xs font-black px-4 py-2 rounded-xl uppercase tracking-wider w-full ${isOwned ? 'bg-slate-100 text-slate-400' : 'bg-pink-500 text-white shadow-lg shadow-pink-200'}`}>
                          {isOwned ? (isEquipped ? 'Wearing' : 'Own') : `${item.price} Sugar`}
                        </div>
                      </button>
                    )
                  })}
                 </div>
              </div>
            )}

            {/* --- RACE VIEW --- */}
            {view === 'race' && (
              <div className="h-full flex flex-col animate-in slide-in-from-right-4 duration-300 fade-in">
                 <div className="bg-amber-400 text-amber-900 p-8 rounded-3xl border-b-8 border-amber-600 mb-6 text-center">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter">Thursday Gallop</h2>
                    <p className="font-bold opacity-75 mt-2">Race scheduled in 2 Days</p>
                 </div>

                 <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden flex-1 border-8 border-slate-800 shadow-2xl">
                   {/* Track UI */}
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asphalt-dark.png')] opacity-50"></div>
                   
                   <div className="relative z-10 h-full flex flex-col justify-center space-y-8">
                      {/* Lane 1 (Player) */}
                      <div className="relative">
                         <div className="flex items-center gap-4 mb-2">
                            <div className="w-8 h-8 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center font-bold text-xs">YOU</div>
                            <div className="h-1 bg-slate-700 flex-1 rounded-full"></div>
                         </div>
                         <div className="border-b-4 border-dashed border-slate-700 pb-2 relative h-16 flex items-end">
                            <div className="text-5xl absolute transition-all duration-100 transform -translate-x-1/2 bottom-0" style={{ left: `${raceProgress}%` }}>🐎</div>
                         </div>
                      </div>

                      {/* Lane 2 (Rival) */}
                      <div className="relative opacity-50">
                         <div className="flex items-center gap-4 mb-2">
                            <div className="w-8 h-8 rounded-full bg-slate-600 border-2 border-white flex items-center justify-center font-bold text-xs">CPU</div>
                            <div className="h-1 bg-slate-700 flex-1 rounded-full"></div>
                         </div>
                         <div className="border-b-4 border-dashed border-slate-700 pb-2 relative h-16 flex items-end">
                            <div className="text-5xl absolute left-10 bottom-0">🦓</div>
                         </div>
                      </div>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-white p-4 rounded-2xl border-b-4 border-slate-200 text-center">
                       <div className="text-xs font-black text-slate-400 uppercase">Speed Lvl</div>
                       <div className="text-3xl font-black text-slate-700">{userData.stats.speed}</div>
                    </div>
                    <GameButton 
                      onClick={() => { setRaceProgress(0); setIsRacing(true); }} 
                      disabled={isRacing || raceProgress >= 100}
                      color="amber" 
                      className="text-lg"
                    >
                      {isRacing ? 'Racing...' : raceProgress >= 100 ? 'Finished!' : 'Start Simulation'}
                    </GameButton>
                 </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* WELLNESS CHECKIN OVERLAY */}
      {showWellness && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white max-w-lg w-full p-10 rounded-[3rem] shadow-2xl text-center border-8 border-white ring-4 ring-slate-900/10">
            <h2 className="text-3xl font-black text-slate-800 mb-2">Morning Grooming</h2>
            <p className="text-slate-500 mb-10 font-bold text-lg">How is {session.name} feeling today?</p>
            
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleWellness('fire')} className="group flex flex-col items-center gap-2 p-6 bg-orange-50 rounded-[2rem] border-b-8 border-orange-200 hover:bg-orange-100 hover:border-orange-300 transition-all active:border-b-0 active:translate-y-2">
                <span className="text-5xl transform group-hover:scale-110 transition-transform">🔥</span>
                <span className="font-black text-orange-700 uppercase tracking-wide">On Fire</span>
              </button>
              <button onClick={() => handleWellness('happy')} className="group flex flex-col items-center gap-2 p-6 bg-emerald-50 rounded-[2rem] border-b-8 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all active:border-b-0 active:translate-y-2">
                <span className="text-5xl transform group-hover:scale-110 transition-transform">😄</span>
                <span className="font-black text-emerald-700 uppercase tracking-wide">Good</span>
              </button>
              <button onClick={() => handleWellness('ok')} className="group flex flex-col items-center gap-2 p-6 bg-blue-50 rounded-[2rem] border-b-8 border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all active:border-b-0 active:translate-y-2">
                <span className="text-5xl transform group-hover:scale-110 transition-transform">😐</span>
                <span className="font-black text-blue-700 uppercase tracking-wide">Okay</span>
              </button>
              <button onClick={() => handleWellness('tired')} className="group flex flex-col items-center gap-2 p-6 bg-slate-50 rounded-[2rem] border-b-8 border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all active:border-b-0 active:translate-y-2">
                <span className="text-5xl transform group-hover:scale-110 transition-transform">😴</span>
                <span className="font-black text-slate-600 uppercase tracking-wide">Tired</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl z-[60] font-black text-lg animate-in slide-in-from-bottom-5 fade-in duration-300 flex items-center gap-3 border-b-8 ${toast.type === 'error' ? 'bg-rose-500 border-rose-700 text-white' : 'bg-slate-800 border-slate-950 text-white'}`}>
          {toast.type === 'success' && <CheckCircle size={24} className="text-emerald-400" />}
          {toast.message}
        </div>
      )}

    </div>
  );
}
