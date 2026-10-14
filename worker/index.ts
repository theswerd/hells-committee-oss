import { GameError, newMeeting, joinMeeting, actOnMeeting, tickMeeting, meetingView, identity } from '../src/room-engine.ts'
import type { Meeting } from '../src/room-engine.ts'

type D1Statement = { bind(...values: unknown[]): D1Statement; first<T>(): Promise<T | null>; run(): Promise<{ meta?: { changes?: number } }> }
export type Database = { prepare(sql: string): D1Statement; withSession?(constraint: string): Database }
type Env = { DB: Database; ASSETS: { fetch(request: Request): Promise<Response> } }
type Stored = { code: string; host_key: string; version: number; expires_at: number; payload: string }
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers })

export async function tokenHash(value: unknown) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) throw new GameError('This phone needs a valid seat ticket.', 401)
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('')
}
async function bodyOf(request: Request) {
  const text = await request.text()
  if (text.length > 4096) throw new GameError('That file is too large for this desk.', 413)
  let body: unknown
  try { body = JSON.parse(text) } catch { throw new GameError('The paperwork needs valid JSON.') }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new GameError('Send one piece of paperwork at a time.')
  return body as Record<string, unknown>
}
function roomCode() {
  const alphabet = 'ABCDEFGHJKMNPQRSTVWXYZ', bytes = crypto.getRandomValues(new Uint8Array(4))
  return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('')
}
async function read(db: Database, code: string) {
  const stored = await db.prepare('SELECT code, host_key, version, expires_at, payload FROM committee_rooms WHERE code = ?').bind(code).first<Stored>()
  if (!stored || stored.expires_at <= Date.now()) throw new GameError('That room has closed. Ask the host for the current code.', 404)
  return stored
}
async function change(db: Database, code: string, operate: (meeting: Meeting) => void) {
  // Compare-and-swap protects simultaneous joins, submissions and favorites.
  // No process memory or browser broadcasts are used for live room authority.
  for (let attempt = 0; attempt < 12; attempt++) {
    const stored = await read(db, code), meeting = JSON.parse(stored.payload) as Meeting
    operate(meeting)
    const payload = JSON.stringify(meeting)
    if (payload === stored.payload) return { meeting, version: stored.version }
    const result = await db.prepare('UPDATE committee_rooms SET payload = ?, version = version + 1 WHERE code = ? AND version = ?').bind(payload, code, stored.version).run()
    if (result.meta?.changes === 1) return { meeting, version: stored.version + 1 }
  }
  throw new GameError('The committee is filing at once. Try that again.', 409)
}
export async function handleApi(request: Request, env: Env) {
  try {
    if (!env.DB) throw new GameError('The room service is warming up. Try again shortly.', 503)
    const url = new URL(request.url), parts = url.pathname.split('/').filter(Boolean), now = Date.now()
    if (request.method !== 'GET') {
      const origin = request.headers.get('Origin')
      if (origin && origin !== url.origin) throw new GameError('File your paperwork from the game page.', 403)
    }
    const db = env.DB.withSession?.('first-primary') ?? env.DB
    if (url.pathname === '/api/rooms' && request.method === 'POST') {
      const body = await bodyOf(request), hostHash = await tokenHash(body.token)
      const previous = await db.prepare('SELECT code, host_key, version, expires_at, payload FROM committee_rooms WHERE host_key = ? AND expires_at > ?').bind(hostHash, now).first<Stored>()
      if (previous) return json(meetingView(JSON.parse(previous.payload), hostHash, previous.version, now))
      await db.prepare('DELETE FROM committee_rooms WHERE expires_at < ?').bind(now).run()
      for (let attempt = 0; attempt < 8; attempt++) {
        const meeting = newMeeting(roomCode(), hostHash, body.tone, now)
        const result = await db.prepare('INSERT OR IGNORE INTO committee_rooms (code, host_key, version, expires_at, payload) VALUES (?, ?, 0, ?, ?)').bind(meeting.code, hostHash, meeting.expiresAt, JSON.stringify(meeting)).run()
        if (result.meta?.changes === 1) return json(meetingView(meeting, hostHash, 0, now), 201)
        const concurrent = await db.prepare('SELECT code, host_key, version, expires_at, payload FROM committee_rooms WHERE host_key = ? AND expires_at > ?').bind(hostHash, now).first<Stored>()
        if (concurrent) return json(meetingView(JSON.parse(concurrent.payload), hostHash, concurrent.version, now))
      }
      throw new GameError('The room directory is busy. Try again.', 503)
    }
    const code = parts[2]?.toUpperCase()
    if (parts[0] !== 'api' || parts[1] !== 'rooms' || !code || !/^[A-Z]{4}$/.test(code)) throw new GameError('That room code is not in the directory.', 404)
    if (parts.length === 4 && parts[3] === 'lobby' && request.method === 'GET') {
      const stored = await read(db, code), meeting = JSON.parse(stored.payload) as Meeting
      return json({ code, phase: meeting.phase, tone: meeting.tone, players: meeting.players.map(player => ({ demon: player.demon, name: player.name })) })
    }
    if (parts.length === 4 && parts[3] === 'join' && request.method === 'POST') {
      const body = await bodyOf(request), hash = await tokenHash(body.token)
      const result = await change(db, code, meeting => { tickMeeting(meeting, now); joinMeeting(meeting, hash, body) })
      return json(meetingView(result.meeting, hash, result.version, now))
    }
    const hash = await tokenHash(request.headers.get('Authorization')?.replace(/^Bearer /, ''))
    if (parts.length === 3 && request.method === 'GET') {
      const result = await change(db, code, meeting => { identity(meeting, hash); tickMeeting(meeting, now) })
      return json(meetingView(result.meeting, hash, result.version, now))
    }
    if (parts.length === 4 && parts[3] === 'action' && request.method === 'POST') {
      const body = await bodyOf(request)
      const result = await change(db, code, meeting => { identity(meeting, hash); tickMeeting(meeting, now); actOnMeeting(meeting, hash, body, now) })
      return json(meetingView(result.meeting, hash, result.version, now))
    }
    throw new GameError('That form is not on this desk.', 404)
  } catch (error) {
    if (error instanceof GameError) return json({ error: error.message }, error.status)
    console.error('Committee room request failed', error instanceof Error ? error.message : 'Unknown server error')
    return json({ error: 'The records desk hit a snag. Your last confirmed action is safe; try again.' }, 500)
  }
}
export default {
  fetch(request: Request, env: Env) {
    if (new URL(request.url).pathname.startsWith('/api/')) return handleApi(request, env)
    return env.ASSETS.fetch(request)
  },
}
