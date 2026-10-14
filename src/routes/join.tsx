import { createFileRoute, useLocation, useNavigate } from '@tanstack/react-router'
import { useMeeting } from '../live'
import { ScaledCanvas, Logo } from '../components/Art'
import { LivePlayer, PhoneClockIn } from '../components/LiveGame'
import { VoiceProvider } from '../components/Voice'
import { DEFAULT_VOICE } from '../voice'
import { socialMeta } from '../social-meta'
import { seatHash } from '../seat-url'

export const Route = createFileRoute('/join')({ head: () => ({ meta: socialMeta({ title: 'Join Hell’s Committee', description: 'Claim a demon. Bring your worst.', image: 'og-join.png', imageAlt: 'Hell’s Committee join card with two demons and a join on your phone ticket.' }) }), validateSearch: (search: Record<string, unknown>): { room?: string } => ({ room: /^[A-Z]{4}$/.test(String(search.room)) ? String(search.room) : undefined }), component: Join })
function Join() {
  const search = Route.useSearch(), hash = useLocation({ select: location => location.hash }), navigate = useNavigate({from:'/join'}), connection = useMeeting('player', search.room, hash)
  const tone = connection.state?.tone ?? DEFAULT_VOICE
  if (!connection.loaded) return <div className="opening-office">Finding your little evil office…</div>
  return <VoiceProvider tone={tone}><main className="live-stage live-stage-phone">{connection.seat && !connection.state ? <div className="room-loading"><Logo /><h1>{connection.error ? 'Your seat is missing.' : 'Opening your office…'}</h1>{connection.error && <><p role="alert">{connection.error}</p><button className="infernal-button" onClick={() => { connection.clear(); void navigate({ search: {}, hash: '', replace: true }) }}>FIND ANOTHER ROOM</button></>}</div> : <ScaledCanvas width={390} height={812}>{connection.state ? <LivePlayer connection={connection} /> : <PhoneClockIn connection={connection} requestedCode={search.room} onJoined={seat => void navigate({ search: { room: seat.code }, hash: seatHash(seat.token), replace: true })} />}</ScaledCanvas>}</main></VoiceProvider>
}
