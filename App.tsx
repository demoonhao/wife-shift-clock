
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
  // State
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

  // Persistence
  useEffect(() => {
    localStorage.setItem('shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem('prefs', JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    localStorage.setItem('weeklyPlan', JSON.stringify(weeklyPlan));
  }, [weeklyPlan]);

  // Actions
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 pb-6 px-4 z-50">
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
          className={`flex flex-col items-center p-2 rounded-xl transition-colors ${activeTab === tab.id ? 'text-rose-500' : 'text-gray-400'}`}
        >
          <tab.icon size={24} />
          <span className="text-xs mt-1 font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );

  const Header = ({ title, showBack = false }: { title: string, showBack?: boolean }) => (
    <div className="sticky top-0 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between z-40">
      {showBack && (
        <button onClick={() => setSettingsView(SettingsSubView.MAIN)} className="text-gray-500 -ml-2 p-2">
          <ArrowLeft size={20} />
        </button>
      )}
      <h1 className="text-xl font-bold text-gray-800 flex-1 text-center">{title}</h1>
      {showBack && <div className="w-8" />}
    </div>
  );

  // Views
  const HomeView = () => {
    // Tomorrow's calculation
    const today = new Date();
    const tomorrowIndex = (today.getDay() === 0 ? 6 : today.getDay() - 1 + 1) % 7;
    const plan = weeklyPlan[tomorrowIndex];
    const shift = shifts.find(s => s.id === plan.shiftId) || shifts[0];
    const timeline = calculateTimeline(shift, prefs);

    return (
      <div className="pb-24 px-6 space-y-6">
        <Header title="明日预告" />
        
        <div className="bg-rose-500 rounded-3xl p-6 text-white shadow-xl shadow-rose-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-rose-100 text-sm font-medium">明日班次 ({WEEK_DAYS[tomorrowIndex]})</p>
              <h2 className="text-3xl font-bold mt-1">{shift.name}</h2>
            </div>
            <div className="bg-white/20 p-2 rounded-xl">
              <Clock size={24} />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-rose-100 text-xs">上班时间</p>
              <p className="text-2xl font-semibold">{shift.startTime}</p>
            </div>
            <div className="text-right">
              <p className="text-rose-100 text-xs">下班时间</p>
              <p className="text-2xl font-semibold">{shift.endTime}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {[
            { label: '闹钟开启', time: timeline.alarmTime, icon: Bell, color: 'text-orange-500', bg: 'bg-orange-50' },
            { label: '必须出门', time: timeline.departureTime, icon: Car, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: '准时到岗', time: timeline.arrivalTime, icon: Coffee, color: 'text-green-500', bg: 'bg-green-50' },
          ].map((item, idx) => (
            <div key={idx} className={`${item.bg} rounded-2xl p-5 flex items-center justify-between`}>
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl bg-white ${item.color}`}>
                  <item.icon size={22} />
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium">{item.label}</p>
                  <p className="text-xl font-bold text-gray-800">{item.time}</p>
                </div>
              </div>
              <ChevronRight className="text-gray-300" size={18} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ScheduleView = () => {
    return (
      <div className="pb-24 px-4 space-y-4">
        <Header title="本周排班" />
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {weeklyPlan.map((plan, idx) => {
            const currentShift = shifts.find(s => s.id === plan.shiftId);
            return (
              <div key={idx} className={`p-4 flex items-center justify-between ${idx !== 6 ? 'border-bottom border-gray-50 border-b' : ''}`}>
                <div className="w-16">
                  <p className="font-bold text-gray-800">{WEEK_DAYS[idx]}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Schedule</p>
                </div>
                
                <div className="flex-1 px-4">
                  <select 
                    value={plan.shiftId || ''} 
                    onChange={(e) => updateDailyShift(idx, e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-xl py-2 px-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-rose-500 appearance-none"
                  >
                    {shifts.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.startTime})</option>
                    ))}
                  </select>
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400">{currentShift?.startTime || '--:--'}</p>
                  <p className="text-[10px] text-gray-300">Start</p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-gray-400 pt-2 px-6">点击班次名称可快速修改每日安排，系统将自动更新明日提醒时间。</p>
      </div>
    );
  };

  const SettingsView = () => {
    if (settingsView === SettingsSubView.SHIFTS) {
      return (
        <div className="pb-24 px-6 space-y-6">
          <Header title="班次库管理" showBack />
          <div className="space-y-4">
            {shifts.map(s => (
              <div key={s.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <input 
                    type="text" 
                    value={s.name} 
                    onChange={(e) => updateShift(s.id, 'name', e.target.value)}
                    className="font-bold text-gray-800 text-lg border-b border-transparent focus:border-rose-500 focus:outline-none bg-transparent w-1/2"
                  />
                  <button onClick={() => deleteShift(s.id)} className="text-gray-300 hover:text-rose-500 p-1">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">开始时间</label>
                    <input 
                      type="time" 
                      value={s.startTime} 
                      onChange={(e) => updateShift(s.id, 'startTime', e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-lg p-2 text-sm focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">结束时间</label>
                    <input 
                      type="time" 
                      value={s.endTime} 
                      onChange={(e) => updateShift(s.id, 'endTime', e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-lg p-2 text-sm focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button 
              onClick={addShift}
              className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors"
            >
              <Plus size={20} />
              <span className="font-medium">添加新班次</span>
            </button>
          </div>
        </div>
      );
    }

    if (settingsView === SettingsSubView.PREFS) {
      return (
        <div className="pb-24 px-6 space-y-6">
          <Header title="个性化设置" showBack />
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
            {[
              { id: 'washUp', label: '洗漱时间', icon: Bell, value: prefs.washUp },
              { id: 'meal', label: '用餐时间', icon: Coffee, value: prefs.meal },
              { id: 'commute', label: '通勤时长', icon: Car, value: prefs.commute },
              { id: 'earlyArrival', label: '提前到岗', icon: Clock, value: prefs.earlyArrival },
            ].map((item, idx) => (
              <div key={item.id} className={`p-6 ${idx !== 3 ? 'border-b border-gray-50' : ''}`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-3">
                    <item.icon className="text-rose-500" size={18} />
                    <span className="font-semibold text-gray-700">{item.label}</span>
                  </div>
                  <span className="text-rose-600 font-bold bg-rose-50 px-3 py-1 rounded-full text-sm">{item.value} 分钟</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="120" 
                  step="5"
                  value={item.value}
                  onChange={(e) => updatePref(item.id as keyof UserPreferences, parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center px-4">闹钟计算逻辑：上班时间 - 提前到岗 - 通勤 - 用餐 - 洗漱</p>
        </div>
      );
    }

    return (
      <div className="pb-24 px-6 space-y-6">
        <Header title="应用设置" />
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <button 
              onClick={() => setSettingsView(SettingsSubView.SHIFTS)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-500">
                  <Calendar size={22} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800">班次库</p>
                  <p className="text-xs text-gray-400">管理常用上下班时间模板</p>
                </div>
              </div>
              <ChevronRight className="text-gray-300" size={20} />
            </button>
            <div className="h-[1px] bg-gray-50 mx-5"></div>
            <button 
              onClick={() => setSettingsView(SettingsSubView.PREFS)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-orange-50 text-orange-500">
                  <SettingsIcon size={22} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800">个性化设置</p>
                  <p className="text-xs text-gray-400">调整通勤、洗漱等缓冲时间</p>
                </div>
              </div>
              <ChevronRight className="text-gray-300" size={20} />
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-5 text-center">
            <p className="text-gray-400 text-xs">爱妻倒班闹钟 v1.0.0</p>
            <p className="text-gray-300 text-[10px] mt-1">Make your life easier with love</p>
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
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-24 relative overflow-x-hidden">
      {renderView()}
      <BottomNav />
    </div>
  );
};

export default App;
