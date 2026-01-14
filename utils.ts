
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

export const calculateTimeline = (
  shift: Shift, 
  prefs: UserPreferences, 
  selectedMeal: 'breakfast' | 'lunch' | 'none'
): CalculatedTimes => {
  if (shift.id === 'off') {
    return {
        earliestAlarm: '--:--',
        latestWakeup: '--:--',
        departureTime: '--:--',
        arrivalAreaTime: '--:--',
        workStartTime: '--:--'
    };
  }
  
  const mealDuration = selectedMeal === 'breakfast' 
    ? prefs.breakfast 
    : (selectedMeal === 'lunch' ? prefs.lunch : 0);

  const startMins = timeToMinutes(shift.startTime);
  
  // 1. 早会时间 (Morning Meeting) = 上班时间 - 提前到岗
  const meetingMins = startMins - prefs.earlyArrival;
  
  // 2. 到位时间 (Arrival at location) = 早会时间 - 用餐时长
  const arriveAreaMins = meetingMins - mealDuration;
  
  // 3. 准时出门 = 到位时间 - 通勤时长
  const departureMins = arriveAreaMins - prefs.commute;
  
  // 4. 最晚起床 = 准时出门 - 洗漱穿衣
  const latestWakeupMins = departureMins - prefs.washUp;
  
  // 5. 最早闹钟 = 最晚起床 - 赖床时间
  const earliestAlarmMins = latestWakeupMins - prefs.snooze;

  return {
    earliestAlarm: minutesToTime(earliestAlarmMins),
    latestWakeup: minutesToTime(latestWakeupMins),
    departureTime: minutesToTime(departureMins),
    arrivalAreaTime: minutesToTime(meetingMins), // 逻辑上这里返回早会时间供主页显示
    workStartTime: shift.startTime,
  };
};

/**
 * 生成并下载 ICS 文件，用于同步到系统日历提醒
 */
export const downloadAlarmICS = (time: string, title: string) => {
  const now = new Date();
  const [h, m] = time.split(':').map(Number);
  
  const eventDate = new Date();
  eventDate.setHours(h, m, 0);
  if (eventDate < now) {
    eventDate.setDate(eventDate.getDate() + 1);
  }

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const start = formatDate(eventDate);
  const end = formatDate(new Date(eventDate.getTime() + 5 * 60000));

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WifeShiftAlarm//NONSGML v1.0//CN',
    'BEGIN:VEVENT',
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:起床闹钟: ${title}`,
    'DESCRIPTION:由爱妻倒班闹钟自动生成',
    'BEGIN:VALARM',
    'TRIGGER:-PT0M',
    'ACTION:DISPLAY',
    'DESCRIPTION:起床啦！',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `alarm_${time.replace(':', '')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
