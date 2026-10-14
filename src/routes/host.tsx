import { createFileRoute, useLocation, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useRef } from 'react'
import { useMeeting } from '../live'
import { Logo, ScaledCanvas } from '../components/Art'
import { LiveHost } from '../components/LiveGame'
import { VoiceProvider } from '../components/Voice'
import { DEFAULT_VOICE } from '../voice'
import { socialMeta } from '../social-meta'
import { seatHash } from '../seat-url'

export const Route = createFileRoute('/host')({
  head: () => ({ meta: socialMeta({ title: 'Host Hell’s Committee', description: 'Put the game on the TV and invite your friends to join on their phones.', path: '/host/', image: 'og-game.png', imageAlt: 'Hell’s Committee in a cartoon infernal office with four demons.' }) }),
  validateSearch: (search: Record<string, unknown>): { room?: string } => ({
    room: /^[A-Z]{4}$/.test(String(search.room)) ? String(search.room) : undefined,
  }),
  component: Host,
})

function Host() {
  const { room } = Route.useSearch()
  const hash = useLocation({ select: location => location.hash })
  const navigate = useNavigate({ from: '/host' })
  const connection = useMeeting('host', room, hash)
  const createStarted = useRef(false)

  const createRoom = useCallback(() => {
    if (createStarted.current) return
    createStarted.current = true
    void connection.create(DEFAULT_VOICE).then(seat => {
      if (seat) void navigate({ search: { room: seat.code }, hash: seatHash(seat.token), replace: true })
    })
  }, [connection.create, navigate])

  useEffect(() => {
    if (room) createStarted.current = false
    else if (connection.loaded) createRoom()
  }, [room, connection.loaded, createRoom])

  if (!connection.loaded || (!room && !connection.error) || (connection.seat && !connection.state && !connection.error)) {
    return <main className="room-loading"><Logo /><h1>Preparing your room…</h1></main>
  }

  if (!connection.state) {
    return <main className="room-loading"><Logo /><h1>The chair is missing.</h1><p role="alert">{connection.error || 'This host link is missing its access ticket.'}</p><button className="infernal-button" onClick={() => {
      connection.clear()
      if (room) void navigate({ search: {}, hash: '', replace: true })
      else { createStarted.current = false; createRoom() }
    }}>{room ? 'START A NEW ROOM' : 'TRY AGAIN'}</button></main>
  }

  return <VoiceProvider tone={connection.state.tone}><main className="live-stage live-stage-tv"><ScaledCanvas width={1280} height={720}><LiveHost connection={connection} /></ScaledCanvas></main></VoiceProvider>
}
