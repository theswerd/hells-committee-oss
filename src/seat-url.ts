export type Seat = { code: string; token: string; role: 'host' | 'player' }

export function seatFromUrl(role: Seat['role'], code?: string, hash = ''): Seat | null {
  const token = new URLSearchParams(hash.replace(/^#/, '')).get('ticket')
  return code && /^[A-Z]{4}$/.test(code) && token && /^[a-f0-9]{64}$/.test(token)
    ? { code, token, role }
    : null
}

export function seatHash(token: string) { return `ticket=${token}` }

export function clearLegacyGameStorage() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('hells-live-') || key.startsWith('hells-draft:')) localStorage.removeItem(key)
    }
  } catch { /* Browser storage may be disabled. */ }
}
