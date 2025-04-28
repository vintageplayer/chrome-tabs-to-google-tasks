import { addDays, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns";

export function getNextDayAtMidnight(): Date {
    const today = new Date();
    const tomorrow = addDays(today, 1);
  
    // Normalize time to start of the day (00:00:00)
    const startOfDay = setMilliseconds(
      setSeconds(
        setMinutes(
          setHours(tomorrow, 0),
        0),
      0),
    0);
  
    return startOfDay;
  }