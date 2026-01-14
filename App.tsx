
import React, { useState, useEffect } from 'react';
import { 
  Home as HomeIcon, 
  Calendar, 
  Settings as SettingsIcon,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  Coffee,
  Car,
  Bell,
  ArrowLeft
} from 'lucide-react';
import { Shift, UserPreferences, DailyPlan, ViewType, SettingsSubView } from './types';
import { DEFAULT_SHIFTS, DEFAULT_PREFS, INITIAL_WEEKLY_PLAN, WEEK_DAYS } from './constants';
import { calculateTimeline } from './utils';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ViewType>(ViewType.HOME);
  const [settingsView, setSettingsView] = useState<SettingsSubView>(SettingsSubView.MAIN);
  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem('shifts');
    return saved ? JSON.parse(saved) : DEFAULT_SHIFTS;
  });
  const [prefs, setPrefs] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('prefs');
    return saved ? JSON.parse(saved) : DEFAULT_PREFS;
  });
  const [weeklyPlan, setWeeklyPlan] = useState<DailyPlan[]>(() => {
    const saved = localStorage.getItem('weeklyPlan');
    return saved ? JSON.parse(saved) : INITIAL_WEEKLY_PLAN;
  });

  useEffect(() => {
    localStorage.setItem('shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem('prefs', JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    localStorage.setItem('weeklyPlan', JSON.stringify(weeklyPlan));
  }, [weeklyPlan]);

  const updateDailyShift = (dayIndex: number, shiftId: string | null) => {
    setWeeklyPlan(prev => prev.map(d => d.dayIndex === dayIndex ? { ...d, shiftId } : d));
  };

  const addShift = () => {
    const newShift: Shift = {
      id: Date.now().toString(),
      name: '新班次',
      startTime: '09:00',
      endTime: '18:00'
    };
    setShifts([...shifts, newShift]);
  };

  const deleteShift = (id: string) => {
    if (shifts.length <= 1) return;
    setShifts(shifts.filter(s => s.id !== id));
  };

  const updateShift = (id: string, field: keyof Shift, value: string) => {
    setShifts(shifts.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const updatePref = (field: keyof UserPreferences, value: number) => {
    setPrefs({ ...prefs, [field]: value });
  };

  // UI Components
  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center py-2 px-4 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]" 
         style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
      {[
        { id: ViewType.HOME, icon: HomeIcon, label: '主页' },
        { id: ViewType.SCHEDULE, icon: Calendar, label: '周计划' },
        { id: ViewType.SETTINGS, icon: SettingsIcon, label: '设置' },
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => {
              setActiveTab(tab.id);
              setSettingsView(SettingsSubView.MAIN);
          }}
          className={`flex flex-col items-center p-2 rounded-2xl transition-all ${activeTab === tab.id ? 'text-rose-500 bg-rose-50' : 'text-gray-400'}`}
        >
          <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
          <span className="text-[10px] mt-1 font-bold">{tab.label}</span>
        </button>
      ))}
    </div>
  );

  const Header = ({ title, showBack = false }: { title: string, showBack?: boolean }) => (
    <div className="sticky top-0 bg-white/90 backdrop-blur-xl px-6 flex items-center justify-between z-40 border-b border-gray-50"
         style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))', paddingBottom: '1rem' }}>
      {showBack ? (
        <button onClick={() => setSettingsView(SettingsSubView.MAIN)} className="text-gray-800 -ml-2 p-2 bg-gray-50 rounded-full">
          <ArrowLeft size={18} />
        </button>
      ) : <div className="w-8" />}
      <h1 className="text-lg font-heavy text-gray-900 flex-1 text-center tracking-tight">{title}</h1>
      <div className="w-8" />
    </div>
  );

  const HomeView = () => {
    const today = new Date();
    const tomorrowIndex = (today.getDay() === 0 ? 6 : today.getDay() - 1 + 1) % 7;
    const plan = weeklyPlan[tomorrowIndex];
    const shift = shifts.find(s => s.id === plan.shiftId) || shifts[0];
    const timeline = calculateTimeline(shift, prefs);

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Header title="倒班闹钟" />
        <div className="px-6">
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-rose-200 relative overflow-hidden">
             {/* 装饰性背景 */}
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <p className="text-rose-100 text-sm font-medium mb-1">明日班次 ({WEEK_DAYS[tomorrowIndex]})</p>
                <h2 className="text-4xl font-black tracking-tighter">{shift.name}</h2>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                <Clock size={28} />
              </div>
            </div>
            
            <div className="flex items-center justify-between relative z-10">
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 flex-1 mr-2">
                <p className="text-rose-100 text-[10px] uppercase font-bold tracking-widest mb-1">Start Time</p>
                <p className="text-2xl font-bold">{shift.startTime}</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 flex-1 ml-2">
                <p className="text-rose-100 text-[10px] uppercase font-bold tracking-widest mb-1">End Time</p>
                <p className="text-2xl font-bold">{shift.endTime}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 space-y-3">
          <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest px-1">Timeline Schedule</p>
          {[
            { label: '起床闹钟', time: timeline.alarmTime, icon: Bell, color: 'text-orange-500', bg: 'bg-white' },
            { label: '最晚出门', time: timeline.departureTime, icon: Car, color: 'text-blue-500', bg: 'bg-white' },
            { label: '必须到岗', time: timeline.arrivalTime, icon: Coffee, color: 'text-green-500', bg: 'bg-white' },
          ].map((item, idx) => (
            <div key={idx} className={`${item.bg} rounded-[1.5rem] p-5 flex items-center justify-between border border-gray-100 shadow-sm active:scale-95 transition-transform`}>
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-2xl bg-gray-50 ${item.color}`}>
                  <item.icon size={20} />
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-semibold">{item.label}</p>
                  <p className="text-xl font-black text-gray-900 tabular-nums leading-tight">{item.time}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-full p-2">
                <ChevronRight className="text-gray-300" size={16} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ScheduleView = () => {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
        <Header title="本周排班" />
        <div className="px-6">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {weeklyPlan.map((plan, idx) => {
                const currentShift = shifts.find(s => s.id === plan.shiftId);
                return (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="w-14">
                      <p className="font-black text-gray-900">{WEEK_DAYS[idx]}</p>
                      <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">Day {idx+1}</p>
                    </div>
                    
                    <div className="flex-1 px-4">
                      <select 
                        value={plan.shiftId || ''} 
                        onChange={(e) => updateDailyShift(idx, e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-rose-500 appearance-none text-center"
                      >
                        {shifts.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="text-right w-14">
                      <p className="text-sm font-black text-rose-500 tabular-nums">{currentShift?.startTime || '--:--'}</p>
                      <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">Start</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-4 bg-rose-50 rounded-2xl flex items-start space-x-3">
                <div className="bg-rose-500 rounded-full p-1 mt-0.5">
                    <Bell size={10} className="text-white" />
                </div>
                <p className="text-[11px] text-rose-600 font-medium leading-relaxed">
                    修改后的班次将即时生效。系统会根据新的班次为您计算明早的最佳起床时间。
                </p>
            </div>
        </div>
      </div>
    );
  };

  const SettingsView = () => {
    if (settingsView === SettingsSubView.SHIFTS) {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <Header title="班次库管理" showBack />
          <div className="px-6 space-y-4">
            {shifts.map(s => (
              <div key={s.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-6 bg-rose-500 rounded-full"></div>
                    <input 
                        type="text" 
                        value={s.name} 
                        onChange={(e) => updateShift(s.id, 'name', e.target.value)}
                        className="font-black text-gray-900 text-xl border-none focus:outline-none bg-transparent w-full"
                    />
                  </div>
                  <button onClick={() => deleteShift(s.id)} className="bg-gray-50 text-gray-300 hover:text-rose-500 p-3 rounded-2xl transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-2">开始时间</label>
                    <input 
                      type="time" 
                      value={s.startTime} 
                      onChange={(e) => updateShift(s.id, 'startTime', e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-2">结束时间</label>
                    <input 
                      type="time" 
                      value={s.endTime} 
                      onChange={(e) => updateShift(s.id, 'endTime', e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button 
              onClick={addShift}
              className="w-full py-5 bg-white border-2 border-dashed border-gray-200 rounded-[2rem] text-gray-400 flex items-center justify-center space-x-3 active:bg-gray-50 active:scale-95 transition-all"
            >
              <Plus size={22} />
              <span className="font-bold">新增班次模板</span>
            </button>
          </div>
        </div>
      );
    }

    if (settingsView === SettingsSubView.PREFS) {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <Header title="个性化提醒" showBack />
          <div className="px-6 pb-12">
            <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {[
                { id: 'washUp', label: '洗漱时间', icon: Bell, value: prefs.washUp, color: 'text-rose-500', bg: 'bg-rose-50' },
                { id: 'meal', label: '用餐时间', icon: Coffee, value: prefs.meal, color: 'text-orange-500', bg: 'bg-orange-50' },
                { id: 'commute', label: '通勤时长', icon: Car, value: prefs.commute, color: 'text-blue-500', bg: 'bg-blue-50' },
                { id: 'earlyArrival', label: '提前到岗', icon: Clock, value: prefs.earlyArrival, color: 'text-green-500', bg: 'bg-green-50' },
                ].map((item) => (
                <div key={item.id} className="p-8">
                    <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-2xl ${item.bg} ${item.color}`}>
                            <item.icon size={20} />
                        </div>
                        <span className="font-black text-gray-800 text-lg">{item.label}</span>
                    </div>
                    <span className="text-rose-600 font-black bg-rose-50 px-4 py-1.5 rounded-full text-sm tabular-nums">{item.value} min</span>
                    </div>
                    <input 
                    type="range" 
                    min="0" 
                    max="120" 
                    step="5"
                    value={item.value}
                    onChange={(e) => updatePref(item.id as keyof UserPreferences, parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-rose-500"
                    />
                </div>
                ))}
            </div>
            <div className="mt-6 text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Calculation Logic</p>
                <p className="text-xs text-gray-400 mt-2 px-8 leading-relaxed">
                    班次开始时间 - 提前缓冲 - 通勤 - 用餐 - 洗漱 = <span className="text-rose-500 font-bold underline">起床闹钟时间</span>
                </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
        <Header title="设置中心" />
        <div className="px-6 space-y-4">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
            <button 
              onClick={() => setSettingsView(SettingsSubView.SHIFTS)}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-5">
                <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-500">
                  <Calendar size={24} />
                </div>
                <div className="text-left">
                  <p className="font-black text-gray-900 text-lg leading-tight">班次库管理</p>
                  <p className="text-[11px] text-gray-400 font-medium mt-1 uppercase tracking-wider">Manage Templates</p>
                </div>
              </div>
              <ChevronRight className="text-gray-300" size={20} />
            </button>
            <button 
              onClick={() => setSettingsView(SettingsSubView.PREFS)}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-5">
                <div className="p-4 rounded-2xl bg-rose-50 text-rose-500">
                  <SettingsIcon size={24} />
                </div>
                <div className="text-left">
                  <p className="font-black text-gray-900 text-lg leading-tight">个性化计算</p>
                  <p className="text-[11px] text-gray-400 font-medium mt-1 uppercase tracking-wider">Calculator Rules</p>
                </div>
              </div>
              <ChevronRight className="text-gray-300" size={20} />
            </button>
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-100 p-8 text-center relative overflow-hidden">
             {/* 装饰水印 */}
            <div className="absolute -left-4 -bottom-4 text-gray-50 font-black text-6xl opacity-20 select-none">LOVE</div>
            <p className="text-gray-900 font-black text-sm relative z-10">爱妻倒班闹钟</p>
            <p className="text-gray-400 text-[10px] mt-1 font-bold tracking-widest relative z-10 uppercase">Special Edition v1.1.0</p>
            <div className="mt-4 inline-block px-4 py-1 bg-rose-50 text-rose-500 rounded-full text-[10px] font-bold">
                Made for You with ❤️
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderView = () => {
    switch(activeTab) {
      case ViewType.HOME: return <HomeView />;
      case ViewType.SCHEDULE: return <ScheduleView />;
      case ViewType.SETTINGS: return <SettingsView />;
      default: return <HomeView />;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#f9fafb] relative overflow-x-hidden pb-32">
      {renderView()}
      <BottomNav />
    </div>
  );
};

export default App;
