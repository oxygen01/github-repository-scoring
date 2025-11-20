// Helper method to validate ISO8601 date format (YYYY-MM-DD)
export const isValidDate = (dateString: string): boolean => {
  // Check if the date string matches ISO8601 format (YYYY-MM-DD)
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}$/
  if (!iso8601Regex.test(dateString)) {
    return false
  }

  // Validate that it's actually a valid date
  const date = new Date(dateString + 'T00:00:00.000Z') // Ensure UTC interpretation
  return (
    date instanceof Date &&
    !isNaN(date.getTime()) &&
    date.toISOString().startsWith(dateString)
  )
}
