
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ArrowLeft,
  Minus,
  Check,
  Zap,
  Coffee as RelaxIcon,
  Smile
} from 'lucide-react';
import { Shift, UserPreferences, DailyPlan, ViewType, SettingsSubView } from './types';
import { DEFAULT_SHIFTS, DEFAULT_PREFS, INITIAL_WEEKLY_PLAN, WEEK_DAYS } from './constants';
import { calculateTimeline } from './utils';

const App: React.FC = () => {
  // --- 核心状态 ---
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

  // --- 交互状态 ---
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [timePicker, setTimePicker] = useState<{
    isOpen: boolean,
    shiftId: string,
    field: 'startTime' | 'endTime',
    tempHour: string,
    tempMin: string
  } | null>(null);

  // --- 数据持久化 ---
  useEffect(() => { localStorage.setItem('shifts', JSON.stringify(shifts)); }, [shifts]);
  useEffect(() => { localStorage.setItem('prefs', JSON.stringify(prefs)); }, [prefs]);
  useEffect(() => { localStorage.setItem('weeklyPlan', JSON.stringify(weeklyPlan)); }, [weeklyPlan]);

  // --- 业务逻辑 ---
  const updateDailyShift = (dayIndex: number, shiftId: string | null) => {
    setWeeklyPlan(prev => prev.map(d => d.dayIndex === dayIndex ? { ...d, shiftId } : d));
    setEditingDay(null);
  };

  const addShift = () => {
    const newId = Date.now().toString();
    setShifts([...shifts, { id: newId, name: '新班次', startTime: '09:00', endTime: '18:00' }]);
  };

  const deleteShift = (id: string) => {
    if (id === 'off') return; 
    if (shifts.length <= 1) return;
    setShifts(shifts.filter(s => s.id !== id));
  };

  const updateShift = (id: string, field: keyof Shift, value: string) => {
    setShifts(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const updatePref = (field: keyof UserPreferences, value: number) => {
    setPrefs(prev => ({ ...prev, [field]: Math.max(0, value) }));
  };

  const openTimePicker = (shift: Shift, field: 'startTime' | 'endTime') => {
    const [h, m] = shift[field].split(':');
    setTimePicker({
      isOpen: true,
      shiftId: shift.id,
      field,
      tempHour: h,
      tempMin: m
    });
  };

  const confirmTime = () => {
    if (!timePicker) return;
    const timeStr = `${timePicker.tempHour}:${timePicker.tempMin}`;
    updateShift(timePicker.shiftId, timePicker.field, timeStr);
    setTimePicker(null);
  };

  // --- 通用 UI 片段 ---
  const CommonHeader = ({ title, showBack = false }: { title: string, showBack?: boolean }) => (
    <div className="shrink-0 flex items-center justify-between px-6 bg-white/50 backdrop-blur-md"
         style={{ paddingTop: 'calc(0.4rem + env(safe-area-inset-top))', paddingBottom: '0.4rem' }}>
      {showBack ? (
        <button onClick={() => setSettingsView(SettingsSubView.MAIN)} className="text-gray-800 -ml-2 p-2 active-scale">
          <ArrowLeft size={20} />
        </button>
      ) : <div className="w-10" />}
      <h1 className="text-[10px] font-black text-gray-900 flex-1 text-center tracking-widest uppercase">{title}</h1>
      <div className="w-10" />
    </div>
  );

  // --- 页面渲染函数 ---

  const renderHome = () => {
    const today = new Date();
    const tomorrowIndex = (today.getDay() === 0 ? 6 : today.getDay() - 1 + 1) % 7;
    const plan = weeklyPlan[tomorrowIndex];
    const shift = shifts.find(s => s.id === plan.shiftId) || shifts[0];
    const isOff = shift.id === 'off' || shift.name === '休' || shift.name === '休班';
    const timeline = calculateTimeline(shift, prefs);

    if (isOff) {
      return (
        <div className="h-full flex flex-col animate-in fade-in zoom-in duration-500 bg-indigo-50/20">
          <CommonHeader title="爱妻倒班闹钟" />
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-10">
            <div className="relative group">
              <div className="absolute -inset-6 bg-indigo-300 blur-3xl rounded-full opacity-20 animate-pulse"></div>
              <div className="relative bg-white p-10 rounded-[3.5rem] shadow-2xl text-indigo-500 active-scale transition-transform">
                <RelaxIcon size={72} strokeWidth={1.2} />
              </div>
              <div className="absolute -top-4 -right-4 bg-yellow-400 p-4 rounded-3xl shadow-xl rotate-12 animate-bounce">
                <Smile size={32} className="text-white" />
              </div>
            </div>
            
            <div className="space-y-5">
              <h2 className="text-5xl font-black text-indigo-900 leading-[1.1] tracking-tighter">
                明天老子<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
                  不上班！
                </span>
              </h2>
              <p className="text-indigo-400 font-bold tracking-[0.4em] text-[10px] uppercase opacity-60">
                Freedom Day · {WEEK_DAYS[tomorrowIndex]}
              </p>
            </div>

            <div className="bg-white px-8 py-5 rounded-full shadow-lg flex items-center space-x-3 border border-indigo-50 active-scale">
              <Zap size={18} className="text-yellow-500 fill-yellow-500" />
              <p className="text-indigo-900 text-sm font-black">闹钟已罢工，好梦到中午</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col animate-in fade-in duration-300">
        <CommonHeader title="爱妻倒班闹钟" />
        <div className="flex-1 px-5 pb-4 space-y-3.5 flex flex-col overflow-hidden">
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-[2rem] p-6 text-white shadow-xl relative shrink-0">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-rose-100 text-[9px] font-black uppercase tracking-widest mb-1">Tomorrow · {WEEK_DAYS[tomorrowIndex]}</p>
                <h2 className="text-3xl font-black tracking-tighter">{shift.name}</h2>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md text-white">
                <Clock size={24} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm border border-white/10">
                <p className="text-rose-100 text-[8px] font-black uppercase mb-0.5">STARTING</p>
                <p className="text-xl font-black">{shift.startTime}</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm border border-white/10">
                <p className="text-rose-100 text-[8px] font-black uppercase mb-0.5">ENDING</p>
                <p className="text-xl font-black">{shift.endTime}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto no-scrollbar">
            <p className="text-gray-400 text-[8px] font-black uppercase tracking-widest px-2">Daily Timeline</p>
            {[
              { label: '起床闹钟', time: timeline.alarmTime, icon: Bell, color: 'text-orange-500' },
              { label: '最晚出门', time: timeline.departureTime, icon: Car, color: 'text-blue-500' },
              { label: '预计到岗', time: timeline.arrivalTime, icon: Coffee, color: 'text-green-500' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-[1.5rem] p-4 flex items-center justify-between border border-gray-100 shadow-sm active-scale transition-all">
                <div className="flex items-center space-x-4">
                  <div className={`p-2.5 rounded-xl bg-gray-50 ${item.color}`}>
                    <item.icon size={20} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-[9px] font-bold mb-0.5 uppercase tracking-wide">{item.label}</p>
                    <p className="text-lg font-black text-gray-900 tabular-nums">{item.time}</p>
                  </div>
                </div>
                <div className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSchedule = () => (
    <div className="h-full flex flex-col animate-in fade-in duration-300">
      <CommonHeader title="本周排班表" />
      <div className="flex-1 overflow-y-auto px-5 pb-20 no-scrollbar space-y-2">
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {weeklyPlan.map((plan, idx) => {
              const currentShift = shifts.find(s => s.id === plan.shiftId);
              const isEditing = editingDay === idx;
              const isOff = currentShift?.id === 'off' || currentShift?.name === '休班';
              return (
                <div key={idx} className="flex flex-col">
                  <div onClick={() => setEditingDay(isEditing ? null : idx)} className={`p-4 flex items-center justify-between active:bg-gray-50 transition-colors ${isEditing ? 'bg-rose-50/30' : ''}`}>
                    <div className="w-10"><p className="font-black text-gray-900 text-xs">{WEEK_DAYS[idx]}</p></div>
                    <div className="flex-1 flex justify-center">
                      <div className={`px-5 py-1.5 rounded-full text-[9px] font-black transition-all ${isEditing ? 'bg-rose-500 text-white' : isOff ? 'bg-indigo-50 text-indigo-400' : 'bg-gray-100 text-gray-500'}`}>
                         {currentShift?.name || '休'}
                      </div>
                    </div>
                    <div className="text-right w-16">
                      {!isOff && (
                        <p className="text-xs font-black text-rose-500 tabular-nums">
                          {currentShift?.startTime}
                        </p>
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <div className="px-3 py-3 bg-gray-50/50 flex flex-wrap gap-2 border-t border-gray-50">
                      {shifts.map(s => (
                        <button key={s.id} onClick={() => updateDailyShift(idx, s.id)}
                          className={`px-4 py-2 rounded-xl text-[9px] font-black active-scale shadow-sm transition-all ${plan.shiftId === s.id ? (s.id === 'off' ? 'bg-indigo-500 text-white' : 'bg-rose-500 text-white') : 'bg-white text-gray-400'}`}>
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
      </div>
    </div>
  );

  const renderSettings = () => {
    if (settingsView === SettingsSubView.MAIN) {
      return (
        <div className="h-full flex flex-col animate-in fade-in duration-300">
          <CommonHeader title="应用偏好" />
          <div className="flex-1 px-5 space-y-4 overflow-y-auto no-scrollbar">
            <div className="bg-white rounded-[1.8rem] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
              <button onClick={() => setSettingsView(SettingsSubView.SHIFTS)} className="w-full flex items-center justify-between p-6 active:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-5">
                  <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-500 shadow-sm"><Clock size={22} /></div>
                  <p className="font-black text-gray-900 text-sm">班次模板管理</p>
                </div>
                <ChevronRight className="text-gray-300" size={18} />
              </button>
              <button onClick={() => setSettingsView(SettingsSubView.PREFS)} className="w-full flex items-center justify-between p-6 active:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-5">
                  <div className="p-3.5 rounded-2xl bg-orange-50 text-orange-500 shadow-sm"><SettingsIcon size={22} /></div>
                  <p className="font-black text-gray-900 text-sm">闹钟逻辑设定</p>
                </div>
                <ChevronRight className="text-gray-300" size={18} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (settingsView === SettingsSubView.SHIFTS) {
      return (
        <div className="h-full flex flex-col animate-in fade-in duration-300">
          <CommonHeader title="模板管理" showBack />
          <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-3.5 no-scrollbar">
            {shifts.map(s => (
              <div key={s.id} className={`bg-white p-5 rounded-[1.8rem] border border-gray-100 shadow-sm space-y-4 ${s.id === 'off' ? 'bg-indigo-50/20' : ''}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`w-2 h-5 rounded-full ${s.id === 'off' ? 'bg-indigo-400' : 'bg-rose-500'}`}></div>
                    <input 
                        type="text" 
                        defaultValue={s.name} 
                        readOnly={s.id === 'off'}
                        onBlur={(e) => updateShift(s.id, 'name', e.target.value)}
                        className={`font-black text-sm border-none bg-transparent w-full p-0 focus:ring-0 ${s.id === 'off' ? 'text-indigo-900' : 'text-gray-900'}`}
                    />
                  </div>
                  {s.id !== 'off' && (
                    <button onClick={() => deleteShift(s.id)} className="text-gray-200 hover:text-rose-500 p-2 active-scale transition-colors">
                      <Trash2 size={18} />
                    </button>
                  )}
                  {s.id === 'off' && <div className="text-[7px] font-black bg-white px-2.5 py-1 rounded-lg text-indigo-400 shadow-sm uppercase tracking-widest border border-indigo-50">Locked</div>}
                </div>
                
                {s.id !== 'off' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div onClick={() => openTimePicker(s, 'startTime')} className="bg-white rounded-2xl p-3 px-4 border border-gray-50 active:bg-gray-100 transition-colors cursor-pointer shadow-sm">
                      <p className="text-[7px] text-gray-400 font-black uppercase mb-1">START</p>
                      <p className="text-base font-black text-gray-700">{s.startTime}</p>
                    </div>
                    <div onClick={() => openTimePicker(s, 'endTime')} className="bg-white rounded-2xl p-3 px-4 border border-gray-50 active:bg-gray-100 transition-colors cursor-pointer shadow-sm">
                      <p className="text-[7px] text-gray-400 font-black uppercase mb-1">END</p>
                      <p className="text-base font-black text-gray-700">{s.endTime}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button onClick={addShift} className="w-full py-5 border-2 border-dashed border-gray-200 rounded-[1.5rem] text-gray-300 flex items-center justify-center space-x-2 active-scale bg-white/50">
              <Plus size={20} /><span className="font-black text-xs">新增自定义模板</span>
            </button>
          </div>
        </div>
      );
    }

    if (settingsView === SettingsSubView.PREFS) {
      return (
        <div className="h-full flex flex-col animate-in fade-in duration-300">
          <CommonHeader title="智能算法设定" showBack />
          <div className="flex-1 overflow-y-auto px-5 pb-20 no-scrollbar space-y-4">
            {[
              { id: 'washUp', label: '洗漱穿衣', icon: Bell, value: prefs.washUp, color: 'text-rose-500', bg: 'bg-rose-50' },
              { id: 'meal', label: '用餐时间', icon: Coffee, value: prefs.meal, color: 'text-orange-500', bg: 'bg-orange-50' },
              { id: 'commute', label: '通勤时长', icon: Car, value: prefs.commute, color: 'text-blue-500', bg: 'bg-blue-50' },
              { id: 'earlyArrival', label: '缓冲余量', icon: Clock, value: prefs.earlyArrival, color: 'text-green-500', bg: 'bg-green-50' },
            ].map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-[1.8rem] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2.5 rounded-2xl ${item.bg} ${item.color}`}><item.icon size={18} /></div>
                    <span className="font-black text-gray-800 text-xs tracking-wide">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-rose-500 tabular-nums">{item.value}</span>
                    <span className="ml-1 text-[8px] font-black text-gray-400 uppercase tracking-widest">Min</span>
                  </div>
                </div>
                <div className="flex items-center justify-between space-x-4">
                  <button onClick={() => updatePref(item.id as keyof UserPreferences, item.value - 5)} className="w-14 py-3 bg-gray-50 rounded-xl flex items-center justify-center active:bg-gray-200 transition-all"><Minus size={18} /></button>
                  <div className="flex-1 h-2 bg-gray-50 rounded-full relative overflow-hidden shadow-inner">
                      <div className="absolute left-0 top-0 h-full bg-rose-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (item.value / 120) * 100)}%` }}></div>
                  </div>
                  <button onClick={() => updatePref(item.id as keyof UserPreferences, item.value + 5)} className="w-14 py-3 bg-gray-50 rounded-xl flex items-center justify-center active:bg-gray-200 transition-all"><Plus size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // --- iOS 风格连续滚动机制 ---
  const WheelPicker = ({ 
    items, 
    value, 
    onChange 
  }: { 
    items: string[], 
    value: string, 
    onChange: (val: string) => void 
  }) => {
    const listRef = useRef<HTMLDivElement>(null);
    const itemHeight = 48; 

    useEffect(() => {
      const idx = items.indexOf(value);
      if (listRef.current && idx !== -1) {
        listRef.current.style.scrollBehavior = 'auto';
        listRef.current.scrollTop = idx * itemHeight;
        listRef.current.style.scrollBehavior = 'smooth';
      }
    }, [items, value]);

    const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      const idx = Math.round(scrollTop / itemHeight);
      const targetValue = items[idx];
      
      if (targetValue && targetValue !== value) {
        onChange(targetValue);
      }
    }, [items, value, onChange]);

    return (
      <div className="relative flex-1 h-[240px] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white to-transparent z-20 pointer-events-none opacity-90"></div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent z-20 pointer-events-none opacity-90"></div>
        <div className="absolute top-1/2 left-0 right-0 h-[48px] -translate-y-1/2 bg-rose-50/50 rounded-2xl pointer-events-none z-0 border-y border-rose-100"></div>
        <div 
          ref={listRef}
          onScroll={onScroll}
          className="h-full overflow-y-auto no-scrollbar snap-y snap-mandatory relative z-10 overscroll-contain"
        >
          <div style={{ height: (240 - itemHeight) / 2 }}></div>
          {items.map((item) => (
            <div 
              key={item}
              className={`h-[48px] flex items-center justify-center text-xl font-black transition-all snap-center cursor-pointer ${value === item ? 'text-rose-600 scale-110' : 'text-gray-300 opacity-40 scale-90'}`}
              onClick={(e) => {
                const target = e.currentTarget;
                const parent = target.parentElement;
                if (parent) parent.scrollTop = target.offsetTop - (240 - itemHeight) / 2;
                onChange(item);
              }}
            >
              {item}
            </div>
          ))}
          <div style={{ height: (240 - itemHeight) / 2 }}></div>
        </div>
      </div>
    );
  };

  const TimePickerOverlay = () => {
    if (!timePicker) return null;
    
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const mins = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

    return (
      <div className="fixed inset-0 z-[100] flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setTimePicker(null)}></div>
        <div className="relative bg-white rounded-t-[3rem] p-8 pb-14 space-y-8 animate-in slide-in-from-bottom duration-500 shadow-2xl">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
               <h3 className="font-black text-gray-900 text-lg tracking-tight uppercase">设置时间</h3>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Continuous Wheel Scroll</p>
            </div>
            <button onClick={confirmTime} className="bg-rose-500 text-white p-4 px-8 rounded-2xl flex items-center space-x-3 active-scale shadow-xl shadow-rose-100 transition-all hover:bg-rose-600">
              <span className="font-black text-sm">确认</span>
              <Check size={22} />
            </button>
          </div>
          
          <div className="flex items-center space-x-4 px-2">
            <WheelPicker 
              items={hours} 
              value={timePicker.tempHour} 
              onChange={(h) => setTimePicker({ ...timePicker, tempHour: h })} 
            />
            <div className="text-3xl font-black text-gray-200 select-none pb-2">:</div>
            <WheelPicker 
              items={mins} 
              value={timePicker.tempMin} 
              onChange={(m) => setTimePicker({ ...timePicker, tempMin: m })} 
            />
          </div>
          
          <div className="flex justify-center">
            <div className="px-6 py-2 bg-gray-50 rounded-full border border-gray-100">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">物理惯性滚动 · 分钟锁定5分步进</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen bg-[#f9fafb] flex flex-col max-w-md mx-auto overflow-hidden">
      <div className="flex-1 overflow-hidden relative">
        {activeTab === ViewType.HOME && renderHome()}
        {activeTab === ViewType.SCHEDULE && renderSchedule()}
        {activeTab === ViewType.SETTINGS && renderSettings()}
      </div>
      
      <div className="shrink-0 bg-white/90 backdrop-blur-2xl border-t border-gray-100 flex justify-around items-center py-3 px-8 shadow-sm" 
           style={{ paddingBottom: 'calc(0.6rem + env(safe-area-inset-bottom))' }}>
        {[
          { id: ViewType.HOME, icon: HomeIcon, label: '首页' },
          { id: ViewType.SCHEDULE, icon: Calendar, label: '排班' },
          { id: ViewType.SETTINGS, icon: SettingsIcon, label: '设置' },
        ].map(tab => {
          const isHomeAndOff = activeTab === ViewType.HOME && tab.id === ViewType.HOME && weeklyPlan[(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1 + 1) % 7].shiftId === 'off';
          return (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSettingsView(SettingsSubView.MAIN); }}
              className={`flex flex-col items-center p-2.5 rounded-2xl transition-all active-scale ${activeTab === tab.id ? (isHomeAndOff ? 'text-indigo-600' : 'text-rose-600') : 'text-gray-300'}`}>
              <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
              <span className="text-[10px] mt-1.5 font-black">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <TimePickerOverlay />
    </div>
  );
};

export default App;
