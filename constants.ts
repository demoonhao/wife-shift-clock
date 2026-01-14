
import { Shift, UserPreferences, DailyPlan } from './types';

export const DEFAULT_SHIFTS: Shift[] = [
  { id: 'off', name: '休班', startTime: '00:00', endTime: '00:00' },
  { id: 'zao8', name: '早8', startTime: '08:30', endTime: '18:00' },
  { id: 'chang0', name: '常0', startTime: '09:00', endTime: '18:30' },
  { id: 'bai11', name: '白11', startTime: '09:00', endTime: '18:00' },
  { id: 'bai1', name: '白1', startTime: '09:30', endTime: '19:00' },
  { id: 'wan8', name: '晚8', startTime: '11:30', endTime: '21:00' },
  { id: 'wan9', name: '晚9', startTime: '12:15', endTime: '21:15' },
  { id: 'ye7', name: '夜7', startTime: '13:00', endTime: '22:30' },
];

export const DEFAULT_PREFS: UserPreferences = {
  snooze: 30,
  washUp: 10,
  breakfast: 15,
  lunch: 30,
  commute: 25,
  earlyArrival: 15,
  cutoffHour: 4,
};

export const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export const INITIAL_WEEKLY_PLAN: DailyPlan[] = WEEK_DAYS.map((_, i) => ({
  dayIndex: i,
  shiftId: i < 5 ? 'zao8' : 'off', 
}));
