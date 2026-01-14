
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Smile,
  Moon,
  Layers,
  Timer,
  Utensils,
  Share2,
  Users,
  Sparkles
} from 'lucide-react';
import { Shift, UserPreferences, DailyPlan, ViewType, SettingsSubView } from './types';
import { DEFAULT_SHIFTS, DEFAULT_PREFS, INITIAL_WEEKLY_PLAN, WEEK_DAYS } from './constants';
import { calculateTimeline, timeToMinutes, downloadAlarmICS } from './utils';

const App: React.FC = () => {
  // --- 状态管理 ---
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

  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'none'>('none');
  const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [timePicker, setTimePicker] = useState<{
    isOpen: boolean, type: 'shift' | 'cutoff', shiftId?: string, field?: 'startTime' | 'endTime', tempHour: string, tempMin?: string
  } | null>(null);

  // --- 持久化 ---
  useEffect(() => { localStorage.setItem('shifts', JSON.stringify(shifts)); }, [shifts]);
  useEffect(() => { localStorage.setItem('prefs', JSON.stringify(prefs)); }, [prefs]);
  useEffect(() => { localStorage.setItem('weeklyPlan', JSON.stringify(weeklyPlan)); }, [weeklyPlan]);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2000);
  };

  const currentShiftInfo = useMemo(() => {
    const today = new Date();
    const currentHour = today.getHours();
    const isEarlyMorning = currentHour < prefs.cutoffHour;
    const dayOffset = isEarlyMorning ? 0 : 1;
    const targetDayIndex = ((today.getDay() + 6) + dayOffset) % 7;
    const plan = weeklyPlan[targetDayIndex];
    return {
      shift: shifts.find(s => s.id === plan.shiftId) || shifts[0],
      dayIndex: targetDayIndex,
      labelPrefix: isEarlyMorning ? '今日' : '明日'
    };
  }, [weeklyPlan, shifts, prefs.cutoffHour]);

  useEffect(() => {
    if (currentShiftInfo.shift.id === 'off') {
        setSelectedMeal('none');
        return;
    }
    const mins = timeToMinutes(currentShiftInfo.shift.startTime);
    if (mins >= 600) {
      setSelectedMeal('lunch');
    } else {
      setSelectedMeal('none');
    }
  }, [currentShiftInfo.shift.startTime, currentShiftInfo.shift.id]);

  const handleSyncAlarm = (time: string) => {
    if (time === '--:--') return;
    try {
      navigator.clipboard.writeText(time);
      showToast(`已拷贝 ${time}`);
    } catch (err) {
      showToast('拷贝失败');
    }
    setTimeout(() => { downloadAlarmICS(time, currentShiftInfo.shift.name); }, 300);
  };

  const updateDailyShift = (dayIndex: number, shiftId: string | null) => {
    setWeeklyPlan(prev => prev.map(d => d.dayIndex === dayIndex ? { ...d, shiftId } : d));
    setEditingDay(null);
  };

  const updateShift = (id: string, field: keyof Shift, value: string) => {
    setShifts(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const updatePref = (field: keyof UserPreferences, value: number) => {
    setPrefs(prev => ({ ...prev, [field]: Math.max(0, value) }));
  };

  const confirmTime = () => {
    if (!timePicker) return;
    if (timePicker.type === 'shift' && timePicker.shiftId && timePicker.field) {
      const timeStr = `${timePicker.tempHour}:${timePicker.tempMin}`;
      updateShift(timePicker.shiftId, timePicker.field, timeStr);
    } else if (timePicker.type === 'cutoff') {
      updatePref('cutoffHour', parseInt(timePicker.tempHour));
    }
    setTimePicker(null);
  };

  const renderHome = () => {
    const { shift, dayIndex, labelPrefix } = currentShiftInfo;
    const isOff = shift.id === 'off' || shift.name === '休班';
    const timeline = calculateTimeline(shift, prefs, selectedMeal);
    const startTimeMins = timeToMinutes(shift.startTime);
    const isLunchAvailable = startTimeMins >= 600;

    return (
      <div className="h-full flex flex-col px-6 pt-[calc(1.2rem + env(safe-area-inset-top))] animate-in fade-in duration-700">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">{WEEK_DAYS[dayIndex]} · {labelPrefix}</p>
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter">
              {isOff ? '好梦休息' : <span className="text-rose-600">{shift.name}</span>}
            </h2>
          </div>
          <div className={`${isOff ? 'bg-indigo-50 text-indigo-400' : 'bg-rose-50 text-rose-500'} p-3 rounded-2xl`}>
            {isOff ? <Moon size={24} /> : <Sparkles size={24} fill="currentColor" />}
          </div>
        </div>

        {isOff ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 pb-32">
            <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-500 animate-pulse">
              <Coffee size={32} />
            </div>
            <div className="text-center">
              <p className="text-gray-900 font-black text-base">今天不需要闹钟</p>
              <p className="text-gray-400 font-bold text-xs tracking-tight">充实的一天从深度睡眠开始</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-3 pb-24 overflow-y-auto no-scrollbar py-1">
            <div className="bg-gray-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Clock size={80} />
              </div>
              <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-3">Today's Shift</p>
              <div className="flex justify-between items-center relative z-10">
                <div className="text-center flex-1 border-r border-white/10">
                  <p className="text-2xl font-black tabular-nums">{shift.startTime}</p>
                  <p className="text-white/30 font-black text-[8px] uppercase mt-0.5 tracking-tighter">Office In</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-2xl font-black tabular-nums">{shift.endTime}</p>
                  <p className="text-white/30 font-black text-[8px] uppercase mt-0.5 tracking-tighter">Office Out</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-100/50 p-1 rounded-[1.5rem] flex items-center h-12 shrink-0">
                <button 
                  onClick={() => setSelectedMeal(isLunchAvailable ? 'lunch' : 'breakfast')} 
                  className={`flex-1 h-full rounded-[1.2rem] text-[11px] font-black transition-all flex items-center justify-center space-x-2 ${selectedMeal !== 'none' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-400'}`}
                >
                  <Utensils size={14} strokeWidth={2.5} />
                  <span>{isLunchAvailable ? '吃午饭' : '吃早饭'}</span>
                </button>
                <button 
                  onClick={() => setSelectedMeal('none')} 
                  className={`flex-1 h-full rounded-[1.2rem] text-[11px] font-black transition-all flex items-center justify-center space-x-2 ${selectedMeal === 'none' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                >
                  <Smile size={14} strokeWidth={2.5} />
                  <span>不吃饭</span>
                </button>
            </div>

            <div className="space-y-2.5">
              {[
                { label: '最早闹钟', time: timeline.earliestAlarm, icon: Bell, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', priority: true },
                { label: '最晚起床', time: timeline.latestWakeup, icon: Moon, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
                { label: '准时出门', time: timeline.departureTime, icon: Car, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
                { label: '早会时间', time: timeline.arrivalAreaTime, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
              ].map((item, idx) => (
                <div key={idx} className={`bg-white rounded-[1.8rem] p-4 flex items-center justify-between border shadow-sm ${item.border}`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-[1.2rem] ${item.bg} ${item.color} flex items-center justify-center shadow-inner`}>
                      <item.icon size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className={`text-gray-400 text-[9px] font-black uppercase tracking-widest leading-none mb-1.5`}>{item.label}</p>
                      <p className={`text-2xl font-black text-gray-900 tabular-nums leading-none tracking-tight`}>{item.time}</p>
                    </div>
                  </div>
                  {item.priority && (
                    <button 
                      onClick={() => handleSyncAlarm(item.time)}
                      className="w-12 h-12 bg-rose-500 text-white rounded-[1.1rem] flex items-center justify-center shadow-lg shadow-rose-200 active:scale-90 transition-transform"
                    >
                      <Share2 size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSchedule = () => (
    <div className="h-full flex flex-col px-6 pt-[calc(1.2rem + env(safe-area-inset-top))] animate-in fade-in duration-500">
      <div className="mb-4">
        <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-1">Weekly Plan</p>
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">本周排班</h1>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col justify-between pb-28">
        <div className="space-y-2">
          {weeklyPlan.map((plan, idx) => {
            const currentShift = shifts.find(s => s.id === plan.shiftId);
            const isEditing = editingDay === idx;
            const isOff = currentShift?.id === 'off';
            
            // 色块搭配逻辑
            const colorSet = isOff 
              ? { bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-400', iconBg: 'bg-gray-100' }
              : idx % 3 === 0 
                ? { bg: 'bg-rose-50/30', border: 'border-rose-100/50', text: 'text-rose-600', iconBg: 'bg-rose-100/50' }
                : idx % 3 === 1 
                  ? { bg: 'bg-sky-50/30', border: 'border-sky-100/50', text: 'text-sky-600', iconBg: 'bg-sky-100/50' }
                  : { bg: 'bg-indigo-50/30', border: 'border-indigo-100/50', text: 'text-indigo-600', iconBg: 'bg-indigo-100/50' };

            return (
              <div key={idx} className={`rounded-[1.5rem] transition-all overflow-hidden border ${isEditing ? 'border-blue-500 shadow-xl scale-[1.02] bg-white z-10' : `${colorSet.bg} ${colorSet.border} shadow-sm`}`}>
                <div onClick={() => setEditingDay(isEditing ? null : idx)} className={`px-5 py-3.5 flex items-center justify-between active:bg-white/50`}>
                  <div className="flex items-center space-x-4">
                    <span className="w-8 font-black text-gray-900 text-[13px]">{WEEK_DAYS[idx]}</span>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-tight ${isOff ? 'bg-gray-200 text-gray-500' : `${colorSet.iconBg} ${colorSet.text}`}`}>
                      {currentShift?.name || '休'}
                    </div>
                  </div>
                  {!isOff && <span className="text-base font-black text-gray-900 tabular-nums">{currentShift?.startTime}</span>}
                </div>
                {isEditing && (
                  <div className="px-5 pb-5 pt-0 flex flex-wrap gap-2 animate-in slide-in-from-top-2 bg-white">
                    {shifts.map(s => (<button key={s.id} onClick={() => updateDailyShift(idx, s.id)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black transition-all ${plan.shiftId === s.id ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{s.name}</button>))}
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
    const BackButton = () => (
      <button onClick={() => setSettingsView(SettingsSubView.MAIN)} className="mb-4 flex items-center space-x-2 text-gray-400 font-black text-xs">
        <ArrowLeft size={16} strokeWidth={3} /><span>返回设置</span>
      </button>
    );

    if (settingsView === SettingsSubView.MAIN) {
      return (
        <div className="h-full flex flex-col px-6 pt-[calc(1.2rem + env(safe-area-inset-top))] animate-in fade-in duration-500">
          <div className="mb-8">
            <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-1">Preferences</p>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">应用设置</h1>
          </div>
          <div className="space-y-3.5">
            {[
              { view: SettingsSubView.SHIFTS, icon: Layers, label: '班次模板', bg: 'bg-rose-50', color: 'text-rose-500', border: 'border-rose-100' },
              { view: SettingsSubView.ALARM, icon: Timer, label: '起床用时', bg: 'bg-orange-50', color: 'text-orange-500', border: 'border-orange-100' },
              { view: SettingsSubView.PERSONAL, icon: Smile, label: '日期临界', bg: 'bg-indigo-50', color: 'text-indigo-500', border: 'border-indigo-100' },
            ].map(item => (
              <button key={item.view} onClick={() => setSettingsView(item.view)} className={`w-full bg-white rounded-[1.8rem] p-5 flex items-center justify-between shadow-sm border ${item.border} active:scale-[0.98] transition-all`}>
                <div className="flex items-center space-x-5">
                  <div className={`w-12 h-12 rounded-[1.1rem] ${item.bg} ${item.color} flex items-center justify-center shadow-inner`}><item.icon size={22} /></div>
                  <span className="font-black text-gray-900 text-base">{item.label}</span>
                </div>
                <ChevronRight size={20} className="text-gray-200" />
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (settingsView === SettingsSubView.ALARM) {
      return (
        <div className="flex flex-col h-full overflow-hidden px-6 pt-[calc(1.2rem + env(safe-area-inset-top))]">
          <BackButton />
          <h2 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">起床用时设置</h2>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3.5 pb-32">
            {[
              { id: 'snooze', label: '赖床时间', icon: Moon, value: prefs.snooze, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
              { id: 'washUp', label: '洗漱穿衣', icon: Bell, value: prefs.washUp, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
              { id: 'commute', label: '通勤时长', icon: Car, value: prefs.commute, color: 'text-sky-500', bg: 'bg-sky-50', border: 'border-sky-100' },
              { id: 'breakfast', label: '早餐时间', icon: Utensils, value: prefs.breakfast, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
              { id: 'lunch', label: '午餐时间', icon: Utensils, value: prefs.lunch, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
              { id: 'earlyArrival', label: '提前到岗', icon: Check, value: prefs.earlyArrival, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            ].map((item) => (
              <div key={item.id} className={`bg-white p-5 rounded-[1.8rem] shadow-sm border ${item.border}`}>
                <div className="flex justify-between items-center mb-0">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-[1rem] ${item.bg} ${item.color} flex items-center justify-center`}><item.icon size={18} /></div>
                    <span className="font-black text-gray-900 text-sm tracking-tight">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button onClick={() => updatePref(item.id as any, item.value - 5)} className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center active:bg-gray-200 transition-colors"><Minus size={14} /></button>
                    <div className="w-8 text-center"><span className="text-lg font-black text-gray-900 tabular-nums">{item.value}</span></div>
                    <button onClick={() => updatePref(item.id as any, item.value + 5)} className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center active:bg-gray-200 transition-colors"><Plus size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (settingsView === SettingsSubView.SHIFTS) {
      return (
        <div className="flex flex-col h-full overflow-hidden px-6 pt-[calc(1.2rem + env(safe-area-inset-top))]">
          <BackButton />
          <h2 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">班次库</h2>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3.5 pb-32">
            {shifts.map(s => (
              <div key={s.id} className={`bg-white p-5 rounded-[1.8rem] border ${s.id === 'off' ? 'border-gray-100 bg-gray-50/30' : 'border-rose-100'} shadow-sm space-y-3.5`}>
                <div className="flex justify-between items-center">
                  <input type="text" defaultValue={s.name} readOnly={s.id === 'off'} onBlur={(e) => updateShift(s.id, 'name', e.target.value)} className={`font-black text-base border-none bg-transparent p-0 focus:ring-0 text-gray-900`} />
                  {s.id !== 'off' && <button onClick={() => setShifts(prev => prev.filter(sh => sh.id !== s.id))} className="text-gray-200 hover:text-rose-500 transition-colors p-2"><Trash2 size={18} /></button>}
                </div>
                {s.id !== 'off' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div onClick={() => { const [h, m] = s.startTime.split(':'); setTimePicker({ isOpen: true, type: 'shift', shiftId: s.id, field: 'startTime', tempHour: h, tempMin: m }); }} className="bg-white rounded-[1.1rem] p-3.5 active:bg-rose-50 transition-colors cursor-pointer border border-rose-50 shadow-inner">
                      <p className="text-[8px] text-gray-400 font-black uppercase mb-1 tracking-widest">上班</p><p className="text-lg font-black text-gray-900 tabular-nums">{s.startTime}</p>
                    </div>
                    <div onClick={() => { const [h, m] = s.endTime.split(':'); setTimePicker({ isOpen: true, type: 'shift', shiftId: s.id, field: 'endTime', tempHour: h, tempMin: m }); }} className="bg-white rounded-[1.1rem] p-3.5 active:bg-rose-50 transition-colors cursor-pointer border border-rose-50 shadow-inner text-right">
                      <p className="text-[8px] text-gray-400 font-black uppercase mb-1 tracking-widest">下班</p><p className="text-lg font-black text-gray-900 tabular-nums">{s.endTime}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button onClick={() => setShifts([...shifts, { id: Date.now().toString(), name: '新班次', startTime: '09:00', endTime: '18:00' }])} className="w-full py-5 border-2 border-dashed border-gray-200 rounded-[1.8rem] text-gray-400 font-black text-sm flex items-center justify-center space-x-2 active:bg-gray-50 active:border-gray-300 transition-all"><Plus size={20} /><span>新增上班班次</span></button>
          </div>
        </div>
      );
    }

    if (settingsView === SettingsSubView.PERSONAL) {
      return (
        <div className="flex flex-col h-full overflow-hidden px-6 pt-[calc(1.2rem + env(safe-area-inset-top))]">
          <BackButton />
          <h2 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">日期临界设置</h2>
          <div className="bg-white p-7 rounded-[2rem] shadow-xl border border-indigo-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-[1.2rem] flex items-center justify-center text-indigo-500 shadow-inner"><Moon size={24} /></div>
                <p className="font-black text-gray-900 text-lg">日期临界点</p>
              </div>
              <button onClick={() => setTimePicker({ isOpen: true, type: 'cutoff', tempHour: prefs.cutoffHour.toString().padStart(2, '0') })} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-black text-lg shadow-lg shadow-indigo-100 active:scale-95 transition-transform">{prefs.cutoffHour.toString().padStart(2, '0')}:00</button>
            </div>
            <div className="bg-indigo-50/50 p-4 rounded-2xl text-[10px] text-indigo-500 font-bold leading-relaxed border border-indigo-100/50 italic">提示：系统将在此时刻自动切换至次日排班，以便你提前预览明日提醒。</div>
          </div>
        </div>
      );
    }
    return null;
  };

  const WheelPicker = ({ items, value, onChange }: { items: string[], value: string, onChange: (val: string) => void }) => {
    const listRef = useRef<HTMLDivElement>(null);
    const itemHeight = 56; 
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
      if (targetValue && targetValue !== value) { onChange(targetValue); }
    }, [items, value, onChange]);
    return (
      <div className="relative flex-1 h-[280px] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white to-transparent z-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent z-20 pointer-events-none"></div>
        <div className="absolute top-1/2 left-0 right-0 h-[56px] -translate-y-1/2 bg-rose-50/50 rounded-2xl pointer-events-none z-0 border-y border-rose-100/50"></div>
        <div ref={listRef} onScroll={onScroll} className="h-full overflow-y-auto no-scrollbar snap-y snap-mandatory relative z-10 overscroll-contain">
          <div style={{ height: (280 - itemHeight) / 2 }}></div>
          {items.map((item) => (
            <div key={item} className={`h-[56px] flex items-center justify-center text-2xl font-black transition-all snap-center cursor-pointer ${value === item ? 'text-rose-600 scale-110' : 'text-gray-200 opacity-30'}`} onClick={(e) => { const target = e.currentTarget; const parent = target.parentElement; if (parent) parent.scrollTop = target.offsetTop - (280 - itemHeight) / 2; onChange(item); }}>{item}</div>
          ))}
          <div style={{ height: (280 - itemHeight) / 2 }}></div>
        </div>
      </div>
    );
  };

  const TimePickerOverlay = () => {
    if (!timePicker) return null;
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const mins = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));
    const isShift = timePicker.type === 'shift';
    return (
      <div className="fixed inset-0 z-[100] flex flex-col justify-end">
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setTimePicker(null)}></div>
        <div className="relative bg-white rounded-t-[3rem] p-10 pb-14 space-y-8 animate-in slide-in-from-bottom duration-700 shadow-2xl">
          <div className="flex justify-between items-center px-4"><h3 className="font-black text-gray-900 text-2xl tracking-tighter">选择时间</h3><button onClick={confirmTime} className="bg-rose-600 text-white p-5 px-10 rounded-[1.5rem] font-black text-base active:scale-95 shadow-xl shadow-rose-200">确认</button></div>
          <div className="flex items-center space-x-6">
            <WheelPicker items={hours} value={timePicker.tempHour} onChange={(h) => setTimePicker({ ...timePicker, tempHour: h })} />
            {isShift && (<><div className="text-4xl font-black text-gray-100">:</div><WheelPicker items={mins} value={timePicker.tempMin || '00'} onChange={(m) => setTimePicker({ ...timePicker, tempMin: m })} /></>)}
            {!isShift && <div className="flex-1 text-center font-black text-gray-100 text-4xl tracking-widest">: 00</div>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[100dvh] w-screen bg-[#FDFDFE] flex flex-col max-w-md mx-auto overflow-hidden relative">
      {toast.visible && (<div className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-gray-900/95 backdrop-blur-xl text-white px-8 py-4 rounded-[2rem] text-sm font-black shadow-2xl animate-in fade-in slide-in-from-top-6 duration-500 flex items-center space-x-3 border border-white/10"><Check size={18} className="text-green-400" strokeWidth={4} /><span>{toast.message}</span></div>)}
      <div className="flex-1 overflow-hidden relative">
        <div className="h-full">
          {activeTab === ViewType.SCHEDULE && renderSchedule()}
          {activeTab === ViewType.HOME && renderHome()}
          {activeTab === ViewType.SETTINGS && renderSettings()}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-gray-100/50 flex justify-around items-center py-5 px-10 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
        {[ { id: ViewType.SCHEDULE, icon: Calendar, label: '排班' }, { id: ViewType.HOME, icon: HomeIcon, label: '主页' }, { id: ViewType.SETTINGS, icon: SettingsIcon, label: '设置' }, ].map(tab => {
          const isActive = activeTab === tab.id;
          const colorClass = isActive ? (tab.id === ViewType.HOME ? 'text-rose-600' : (tab.id === ViewType.SCHEDULE ? 'text-blue-600' : 'text-indigo-600')) : 'text-gray-300';
          return (<button key={tab.id} onClick={() => { setActiveTab(tab.id); setSettingsView(SettingsSubView.MAIN); }} className={`flex flex-col items-center space-y-1.5 transition-all active:scale-90 relative ${colorClass}`}><tab.icon size={26} strokeWidth={isActive ? 3 : 2} /><span className={`text-[10px] font-black tracking-tighter ${isActive ? 'opacity-100' : 'opacity-40'}`}>{tab.label}</span>{isActive && <div className={`absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-current`} />}</button>);
        })}
      </div>
      <TimePickerOverlay />
    </div>
  );
};

export default App;
