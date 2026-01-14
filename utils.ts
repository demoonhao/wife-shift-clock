
import { Shift, UserPreferences, CalculatedTimes } from './types';

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (totalMinutes: number): string => {
  let mins = totalMinutes;
  while (mins < 0) mins += 1440;
  mins %= 1440;
  const hours = Math.floor(mins / 60);
  const m = mins % 60;
  return `${hours.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const calculateTimeline = (shift: Shift, prefs: UserPreferences): CalculatedTimes => {
  if (shift.name === '休') {
    return {
        alarmTime: '--:--',
        departureTime: '--:--',
        arrivalTime: '--:--',
        workStartTime: '--:--'
    };
  }
  
  const startMins = timeToMinutes(shift.startTime);
  const arrivalMins = startMins - prefs.earlyArrival;
  const departureMins = arrivalMins - prefs.commute;
  const alarmMins = departureMins - prefs.meal - prefs.washUp;

  return {
    alarmTime: minutesToTime(alarmMins),
    departureTime: minutesToTime(departureMins),
    arrivalTime: minutesToTime(arrivalMins),
    workStartTime: shift.startTime,
  };
};
