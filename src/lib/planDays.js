export function isUpcomingDay(dayNumber, currentDayNumber) {
  return dayNumber > currentDayNumber
}

export function canOpenStudyDay(dayNumber, currentDayNumber) {
  return dayNumber >= 1 && dayNumber <= currentDayNumber
}

export function getStudyDayStatus({ dayNumber, currentDayNumber, complete }) {
  if (complete) return 'done'
  if (dayNumber > currentDayNumber) return 'upcoming'
  if (dayNumber === currentDayNumber) return 'today'
  return 'missed'
}
