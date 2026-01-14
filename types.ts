
export interface Shift {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface UserPreferences {
  snooze: number;       // 赖床时间 (minutes)
  washUp: number;      // 洗漱穿衣 (minutes)
  breakfast: number;    // 早餐时间 (minutes)
  lunch: number;        // 午餐时间 (minutes)
  commute: number;     // 通勤时长 (minutes)
  earlyArrival: number; // 提前到岗 (minutes)
  cutoffHour: number;   // 临界小时 (0-23)
}

export interface DailyPlan {
  dayIndex: number; // 0 (Mon) to 6 (Sun)
  shiftId: string | null; // null means rest
}

export interface CalculatedTimes {
  earliestAlarm: string; // 最早闹钟
  latestWakeup: string;  // 最晚起床
  departureTime: string; // 出门时间
  arrivalAreaTime: string; // 到位用餐时间
  workStartTime: string;
}

export enum ViewType {
  SCHEDULE = 'schedule',
  HOME = 'home',
  SETTINGS = 'settings'
}

export enum SettingsSubView {
  MAIN = 'main',
  SHIFTS = 'shifts',
  ALARM = 'alarm',
  PERSONAL = 'personal'
}
