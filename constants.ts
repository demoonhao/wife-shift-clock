
import { Shift, UserPreferences, DailyPlan } from './types';

export const DEFAULT_SHIFTS: Shift[] = [
  { id: '1', name: '早班', startTime: '08:00', endTime: '17:00' },
  { id: '2', name: '中班', startTime: '14:00', endTime: '22:00' },
  { id: '3', name: '晚班', startTime: '19:00', endTime: '04:00' },
  { id: '4', name: '休', startTime: '00:00', endTime: '00:00' },
];

export const DEFAULT_PREFS: UserPreferences = {
  washUp: 20,
  meal: 20,
  commute: 40,
  earlyArrival: 10,
};

export const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export const INITIAL_WEEKLY_PLAN: DailyPlan[] = WEEK_DAYS.map((_, i) => ({
  dayIndex: i,
  shiftId: i < 5 ? '1' : '4', // Default Mon-Fri Morning, Sat-Sun Rest
}));
