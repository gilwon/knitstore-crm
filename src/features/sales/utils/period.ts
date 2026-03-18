export function calcGrowthRate(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export function getPreviousPeriodRange(from: string | undefined, to: string | undefined) {
  if (!from) return { prevFrom: undefined, prevTo: undefined }

  const fromDate = new Date(from)
  const toDate = to ? new Date(to) : new Date()
  const durationMs = toDate.getTime() - fromDate.getTime()

  const prevTo = new Date(fromDate.getTime() - 1)
  const prevFrom = new Date(prevTo.getTime() - durationMs)

  return {
    prevFrom: prevFrom.toISOString(),
    prevTo: prevTo.toISOString(),
  }
}
