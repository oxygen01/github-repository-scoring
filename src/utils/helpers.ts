export const cleanInt = (value: unknown): number | undefined => {
  if (Number.isInteger(value)) {
    return value as number
  }
  if (value && typeof value === 'string') {
    const parsed = parseInt(value, 10)
    if (!isNaN(parsed) && Number.isInteger(parsed)) {
      return parsed
    }
  }
  return undefined
}
