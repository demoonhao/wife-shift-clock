
export interface Shift {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface UserPreferences {
  washUp: number;      // minutes
  meal: number;        // minutes
  commute: number;     // minutes
  earlyArrival: number; // minutes (buffer before shift starts)
}

export interface DailyPlan {
  dayIndex: number; // 0 (Mon) to 6 (Sun)
  shiftId: string | null; // null means rest
}

export interface CalculatedTimes {
  alarmTime: string;
  departureTime: string;
  arrivalTime: string;
  workStartTime: string;
}

export enum ViewType {
  HOME = 'home',
  SCHEDULE = 'schedule',
  SETTINGS = 'settings'
}

export enum SettingsSubView {
  MAIN = 'main',
  SHIFTS = 'shifts',
  PREFS = 'prefs'
}
