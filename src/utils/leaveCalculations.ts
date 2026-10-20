import { Holiday, LeaveRequest } from '../types';

/**
 * Calculates the number of business days between start and end date (inclusive),
 * excluding weekends (Saturday/Sunday) and public holidays.
 */
export function calculateLeaveDays(startDate: string, endDate: string, holidays: Holiday[] = []): number {
  if (!startDate || !endDate) return 0;

  // Normalize string dates to avoid timezone shifting
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return 0;
  }

  // Mandatory holidays set (YYYY-MM-DD)
  const holidaySet = new Set(
    holidays
      .filter(h => !h.isOptional)
      .map(h => h.date)
  );

  let workdays = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0 = Sunday, 6 = Saturday
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidaySet.has(dateStr);

    if (!isWeekend && !isHoliday) {
      workdays++;
    }

    current.setDate(current.getDate() + 1);
  }

  return workdays;
}

/**
 * Checks if the requested date range overlaps with any active (pending or approved) request.
 */
export function checkLeaveOverlap(
  newStart: string,
  newEnd: string,
  existingRequests: LeaveRequest[],
  excludeRequestId?: string
): { hasOverlap: boolean; conflictingRequest?: LeaveRequest } {
  if (!newStart || !newEnd) return { hasOverlap: false };

  for (const req of existingRequests) {
    if (excludeRequestId && req.id === excludeRequestId) continue;
    if (req.status === 'rejected' || req.status === 'cancelled') continue;

    const reqStart = req.startDate;
    const reqEnd = req.endDate;

    // Ranges [newStart, newEnd] and [reqStart, reqEnd] overlap if:
    // !(newEnd < reqStart || newStart > reqEnd)
    if (!(newEnd < reqStart || newStart > reqEnd)) {
      return { hasOverlap: true, conflictingRequest: req };
    }
  }

  return { hasOverlap: false };
}
