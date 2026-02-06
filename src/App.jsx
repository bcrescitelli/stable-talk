import React, { useState, useEffect } from 'react';
import { 
  Briefcase, ShoppingBag, Home, Trophy, 
  Clock, CheckCircle, Zap, LogOut, Scissors, 
  Users, Activity, TrendingUp, AlertCircle,
  BookOpen, Dumbbell, Flag, PlusCircle, Play,
  ChevronRight, Star
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
  { id: 'rocker_hair', name: 'Rocker Hair', type: 'headware', price: 35, thumb: '/assets/headware/rocker_hair_tn.png', overlay: '/assets/headware/rocker_hair.png' },
  { id: 'unicorn_horn', name: 'Unicorn Horn', type: 'headware', price: 50, thumb: '/assets/headware/unicorn_horn_tn.png', overlay: '/assets/headware/unicorn_horn.png' },

  // Neckware (Pucca moved here)
  { id: 'pucca', name: 'Pucca', type: 'neckware', price: 30, thumb: '/assets/neckware/pucca_tn.png', overlay: '/assets/neckware/pucca.png' },
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
  { id: 'white', name: 'Cloud White', price: 0, img: '/assets/horses/white.png' },
  { id: 'brown', name: 'Chestnut Brown', price: 100, img: '/assets/horses/brown.png' },
  { id: 'blue', name: 'Mystic Blue', price: 250, img: '/assets/horses/blue.png' },
];

const INITIAL_TASKS = [
  { id: 'init_1', title: "Join the Team", type: "Onboarding", reward_hay: 50, reward_stat: "stamina", isMain: false }
];

const INITIAL_TOWN = [
  { id: 'chat_barn', name: 'Chat Barn', cost: 300, current: 0, icon: '💬', description: 'Unlocks Team Chat', unlocked: false },
  { id: 'salon', name: 'The Mane Salon', cost: 500, current: 0, icon: '✂️', description: 'Unlocks Coat Colors', unlocked: false },
  { id: 'library', name: 'The Library', cost: 600, current: 0, icon: '📚', description: 'Unlocks Strategy Tips', unlocked: false },
  { id: 'gym', name: 'Iron Horse Gym', cost: 800, current: 0, icon: '🏋️', description: 'Unlocks Stat Boosts', unlocked: false },
  { id: 'racetrack', name: 'Derby Track', cost: 1000, current: 0, icon: '🏁', description: 'Unlocks Weekly Race', unlocked: false },
];

const DEFAULT_USER_STATE = {
  currency: { sugar: 50, hay: 100 },
  stats: { speed: 10, stamina: 10, mood: null },
  inventory: [], ownedCoats: ['white'], horseColor: 'white',
  equipped: { headware: null, neckware: null, shoes: null, accessories: null },
  activeTasks: INITIAL_TASKS, digestingTask: null,
  role: 'jockey' 
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
  const [teamMembers, setTeamMembers] = useState([]); 
  const [showWellness, setShowWellness] = useState(false);
  const [shopFilter, setShopFilter] = useState('all');
  
  // Manager State
  const [selectedMember, setSelectedMember] = useState(null);
  const [raceMode, setRaceMode] = useState(false);
  const [raceResults, setRaceResults] = useState(null);

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

    const userRef = doc(db, "users", userDocId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, { ...DEFAULT_USER_STATE, name, teamCode: safeCode, role });
    }

    const townRef = doc(db, "towns", townDocId);
    const townSnap = await getDoc(townRef);
    if (!townSnap.exists()) {
      await setDoc(townRef, { buildings: INITIAL_TOWN, stableName: stableName });
    }

    onSnapshot(userRef, (doc) => setUserData(doc.data()));
    onSnapshot(townRef, (doc) => setTownData(doc.data()));

    const q = query(collection(db, "users"), where("teamCode", "==", safeCode));
    onSnapshot(q, (snapshot) => {
      const members = snapshot.docs.map(d => ({...d.data(), id: d.id}));
      setTeamMembers(members);
    });

    const sessionData = { name, teamCode: safeCode, docId: userDocId, townDocId };
    setSession(sessionData);
    localStorage.setItem('stable_goals_creds', JSON.stringify({ name, teamCode: safeCode }));
    
    if ((!userSnap.exists() || !userSnap.data().stats?.mood) && role !== 'manager') {
      setShowWellness(true);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('stable_goals_creds');
    setSession(null); setUserData(null); setTownData(null); setTeamMembers([]);
  };

  // --- ACTIONS ---
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
      await updateDoc(userRef, { "currency.sugar": increment(-item.price), inventory: arrayUnion(item.id) });
    }
  };

  const buyCoat = async (coat) => {
    if (userData.currency.sugar >= coat.price) {
      const userRef = doc(db, "users", session.docId);
      await updateDoc(userRef, { "currency.sugar": increment(-coat.price), ownedCoats: arrayUnion(coat.id), horseColor: coat.id });
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

  const assignGoal = async (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    const mainTitle = d.get('mainGoal');
    const sub1 = d.get('sub1');
    const sub2 = d.get('sub2');
    const sub3 = d.get('sub3');

    const newTasks = [
      { id: Date.now() + '_main', title: mainTitle, type: 'Main Focus', reward_hay: 200, reward_stat: 'stamina', isMain: true }
    ];
    if (sub1) newTasks.push({ id: Date.now() + '_s1', title: sub1, type: 'Subtask', reward_hay: 50, reward_stat: 'speed', isMain: false });
    if (sub2) newTasks.push({ id: Date.now() + '_s2', title: sub2, type: 'Subtask', reward_hay: 50, reward_stat: 'speed', isMain: false });
    if (sub3) newTasks.push({ id: Date.now() + '_s3', title: sub3, type: 'Subtask', reward_hay: 50, reward_stat: 'speed', isMain: false });

    const memberRef = doc(db, "users", selectedMember.id);
    // In real app, use arrayUnion, but here we just append to avoid overwrite logic complexity
    const currentTasks = selectedMember.activeTasks || [];
    await updateDoc(memberRef, { activeTasks: [...currentTasks, ...newTasks] });
    setSelectedMember(null);
  };

  const runRace = () => {
    // Simple simulation based on stats
    const results = teamMembers
      .filter(m => m.role !== 'manager')
      .map(m => ({
        ...m,
        score: (m.stats.speed * 2) + m.stats.stamina + Math.random() * 10
      }))
      .sort((a, b) => b.score - a.score);
    setRaceResults(results);
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
    
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-8">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
           <div>
             <h1 className="text-3xl font-black text-slate-800">{townData.stableName || "My Stable"}</h1>
             <div className="text-slate-400 font-bold flex items-center gap-2">
                <span className="bg-slate-100 px-3 py-1 rounded-lg text-slate-500 font-mono text-sm">Code: {userData.teamCode}</span>
             </div>
           </div>
           <div className="flex gap-3">
             <button onClick={() => { setRaceMode(true); runRace(); }} className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-amber-200">
                <Flag size={20} /> Run Race
             </button>
             <button onClick={handleLogout} className="flex items-center gap-2 text-rose-500 font-bold hover:bg-rose-50 px-4 py-2 rounded-xl transition-colors"><LogOut size={20} /></button>
           </div>
        </header>

        {raceMode ? (
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden min-h-[60vh]">
             <div className="flex justify-between items-center mb-8 relative z-10">
                <h2 className="text-4xl font-black italic tracking-tighter text-amber-400">Weekly Gallop Results</h2>
                <button onClick={() => { setRaceMode(false); setRaceResults(null); }} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl font-bold backdrop-blur">Close Race</button>
             </div>
             
             <div className="space-y-6 relative z-10">
                {raceResults?.map((r, i) => (
                  <div key={r.id} className="flex items-center gap-4 animate-in slide-in-from-left duration-700" style={{ animationDelay: `${i * 100}ms` }}>
                     <div className="text-3xl font-black w-12 text-slate-500">#{i+1}</div>
                     <div className="flex-1 bg-slate-800/50 rounded-2xl p-2 flex items-center gap-4 pr-6 border border-slate-700">
                        <div className="w-12 h-12 bg-white rounded-xl overflow-hidden relative">
                           <img src={`/assets/horses/${r.horseColor || 'white'}.png`} className="absolute w-full h-full object-contain" />
                        </div>
                        <div className="flex-1">
                           <div className="font-bold text-lg">{r.name}</div>
                           <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-1">
                              <div className="h-full bg-gradient-to-r from-amber-400 to-rose-500" style={{ width: `${Math.min(r.score, 100)}%` }}></div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-xs text-slate-400 font-bold uppercase">Score</div>
                           <div className="font-mono text-xl text-amber-400">{Math.floor(r.score)}</div>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
             <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/asphalt-dark.png')]"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="text-slate-400 font-bold uppercase text-xs tracking-wider mb-2">Team Mood</div>
                  <div className="flex justify-between text-2xl">
                    <span title="On Fire">🔥 {moodCounts.fire}</span>
                    <span title="Happy">😄 {moodCounts.happy}</span>
                    <span title="Okay">😐 {moodCounts.ok}</span>
                    <span title="Tired">😴 {moodCounts.tired}</span>
                  </div>
              </div>
              <div className="md:col-span-3 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                  <h3 className="text-slate-400 font-bold uppercase text-xs tracking-wider mb-4">Quick Actions</h3>
                  <div className="flex gap-4">
                     <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold text-sm border border-emerald-100">
                        Assign Goals: Click a member below
                     </div>
                     <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl font-bold text-sm border border-purple-100">
                        Manage Town: {townData.buildings.filter(b => b.unlocked).length} / {townData.buildings.length} Unlocked
                     </div>
                  </div>
              </div>
            </div>

            <h2 className="text-xl font-black text-slate-700 mb-4">Active Roster ({teamMembers.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member) => (
                <div key={member.id} 
                     onClick={() => member.role !== 'manager' && setSelectedMember(member)}
                     className={`bg-white p-4 rounded-3xl border-2 transition-all cursor-pointer group relative overflow-hidden ${selectedMember?.id === member.id ? 'border-sky-400 ring-4 ring-sky-100' : 'border-slate-100 hover:border-sky-200'}`}
                >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center relative overflow-hidden">
                          <img src={`/assets/horses/${member.horseColor || 'white'}.png`} className="absolute w-full h-full object-contain" />
                          {/* Basic overlay preview for manager */}
                          {getEquippedOverlay(member, 'headware') && <img src={getEquippedOverlay(member, 'headware')} className="absolute w-full h-full object-contain z-20" />}
                      </div>
                      <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div className="font-bold text-lg text-slate-700">{member.name}</div>
                            {member.role === 'manager' && <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold uppercase">MGR</span>}
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                             <div className="bg-amber-50 rounded-lg px-2 py-1">
                                <div className="text-[10px] font-bold text-amber-400 uppercase">Speed</div>
                                <div className="font-black text-amber-700">{member.stats?.speed || 0}</div>
                             </div>
                             <div className="bg-rose-50 rounded-lg px-2 py-1">
                                <div className="text-[10px] font-bold text-rose-400 uppercase">Stamina</div>
                                <div className="font-black text-rose-700">{member.stats?.stamina || 0}</div>
                             </div>
                          </div>
                      </div>
                    </div>
                    {member.role !== 'manager' && (
                      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-400 group-hover:text-sky-500">
                         <span>Active Tasks: {member.activeTasks?.length || 0}</span>
                         <span className="flex items-center gap-1">Assign Goal <PlusCircle size={14} /></span>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ASSIGN GOAL MODAL */}
        {selectedMember && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                   <div>
                      <h3 className="text-2xl font-black text-slate-800">Assign Goals</h3>
                      <p className="text-slate-400 font-bold">for {selectedMember.name}</p>
                   </div>
                   <button onClick={() => setSelectedMember(null)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><X size={20} /></button>
                </div>
                
                <form onSubmit={assignGoal} className="space-y-4">
                   <div>
                      <label className="text-xs font-bold text-emerald-600 uppercase ml-2 mb-1 block">Main Focus (+200 Hay)</label>
                      <input name="mainGoal" placeholder="e.g. Finish Q3 Report" className="w-full bg-emerald-50 border-2 border-emerald-100 rounded-xl px-4 py-3 font-bold text-emerald-900 placeholder-emerald-300 focus:outline-none focus:border-emerald-400" required />
                   </div>
                   
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-2 block">Subtasks (+50 Hay)</label>
                      <input name="sub1" placeholder="Subtask 1" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-sky-300" />
                      <input name="sub2" placeholder="Subtask 2" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-sky-300" />
                      <input name="sub3" placeholder="Subtask 3" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-sky-300" />
                   </div>

                   <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-200 mt-4 transition-all">
                      Confirm Assignment
                   </button>
                </form>
             </div>
          </div>
        )}
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
              <img src={`/assets/horses/${userData.horseColor || 'white'}.png`} alt="Horse" className="absolute w-full h-full object-contain z-10" />
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
                {userData.activeTasks.length > 0 ? userData.activeTasks.map(task => (
                  <div key={task.id} className={`bg-white p-5 rounded-2xl border-2 flex justify-between items-center hover:shadow-md transition-shadow ${task.isMain ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100'}`}>
                    <div>
                        <div className="flex items-center gap-2">
                           {task.isMain && <Star size={16} className="text-amber-400 fill-amber-400" />}
                           <div className="font-bold text-slate-700 text-lg">{task.title}</div>
                        </div>
                        <div className={`${task.isMain ? 'text-emerald-600' : 'text-slate-400'} font-bold text-xs mt-1 flex items-center gap-1`}>
                           <span className="uppercase">{task.type}</span> • +{task.reward_hay} Hay
                        </div>
                    </div>
                    <GameButton onClick={() => feedHorse(task)} color={task.isMain ? "emerald" : "white"} disabled={!!userData.digestingTask}>🍎</GameButton>
                  </div>
                )) : (
                  <div className="text-center py-20 bg-white rounded-[2.5rem] border-4 border-dashed border-slate-200">
                     <div className="text-6xl mb-4 grayscale opacity-30">🥕</div>
                     <div className="text-slate-400 font-bold">No Active Tasks</div>
                     <div className="text-slate-300 text-sm">Ask your manager to assign goals!</div>
                  </div>
                )}
              </div>
            )}
            {view === 'town' && (
              <div className="space-y-6">
                  {townData.buildings.map(b => (
                    <div key={b.id} className={`p-6 rounded-3xl border-b-8 relative overflow-hidden ${b.unlocked ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200'}`}>
                      <div className="flex justify-between items-start mb-4 relative z-10">
                         <div className="flex items-center gap-4">
                            <span className="text-4xl">{b.icon}</span>
                            <div>
                               <h3 className="font-black text-slate-700 text-lg">{b.name}</h3>
                               <p className="text-slate-400 text-xs font-bold uppercase">{b.description}</p>
                            </div>
                         </div>
                         {b.unlocked ? <CheckCircle className="text-emerald-500" /> : <div className="text-xs font-black text-slate-400 bg-slate-200 px-2 py-1 rounded">{b.current}/{b.cost}</div>}
                      </div>
                      {!b.unlocked ? (
                        <div className="relative z-10">
                           <div className="h-3 bg-slate-200 rounded-full overflow-hidden mb-4">
                              <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${(b.current / b.cost) * 100}%` }}></div>
                           </div>
                           <GameButton onClick={() => contributeToTown(b.id)} color="blue" className="w-full mt-2 text-sm">Contribute 50 Hay</GameButton>
                        </div>
                      ) : <GameButton onClick={() => b.id === 'salon' ? setView('salon') : null} color="white" className="w-full mt-4 text-sm relative z-10">Enter Building</GameButton>}
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
  const [tab, setTab] = useState('join'); 
  
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