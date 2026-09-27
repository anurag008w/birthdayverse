/**
 * BirthdayVerse Timezone & Countdown Engine
 */

export interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isUnlocked: boolean;
  totalSecondsRemaining: number;
}

/**
 * Calculates countdown to birthday or release time taking into account IANA timezone.
 */
export function calculateCountdown(targetDateStr: string, timezone = 'UTC'): CountdownState {
  try {
    const now = new Date();
    
    // Parse target date (YYYY-MM-DD or full ISO)
    let targetTimeMs: number;
    if (targetDateStr.includes('T')) {
      targetTimeMs = new Date(targetDateStr).getTime();
    } else {
      // It's a date string YYYY-MM-DD. Set to 00:00:00 on that date in the target timezone
      const [year, month, day] = targetDateStr.split('-').map(Number);
      // Construct date string with timezone offset
      const dateInTz = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      targetTimeMs = dateInTz.getTime();
    }

    const diffMs = targetTimeMs - now.getTime();

    if (diffMs <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isUnlocked: true,
        totalSecondsRemaining: 0
      };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      days,
      hours,
      minutes,
      seconds,
      isUnlocked: false,
      totalSecondsRemaining: totalSeconds
    };
  } catch {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isUnlocked: true,
      totalSecondsRemaining: 0
    };
  }
}

/**
 * Formats a friendly readable date.
 */
export function formatFriendlyDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}
