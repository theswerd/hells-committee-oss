import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import type { MeetingView } from './room-engine'
import type { Demon } from './game-model'
import type { VoiceId } from './voice'
import { seatFromUrl } from './seat-url'
import type { Seat } from './seat-url'

export function newTicket() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), value => value.toString(16).padStart(2, '0')).join('')
}
export class RoomApiError extends Error { status: number; constructor(message: string, status: number) { super(message); this.status = status } }
async function request<T>(path: string, token?: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch('/api/rooms' + path, { method: body ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store', signal,
    headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
  let value: T & { error?: string }
  try { value = await response.json() } catch { throw new RoomApiError('The room desk is not reachable. Open the game page and try again.', 503) }
  if (!response.ok) throw new RoomApiError(value.error ?? 'The paperwork did not reach the desk. Try again.', response.status)
  return value
}
const meetingKey = (seat: Seat | null) => ['live-meeting', seat?.code, seat?.token] as const

export function useMeeting(role: Seat['role'], requestedCode?: string, hash = '') {
  const client = useQueryClient()
  const seat = seatFromUrl(role, requestedCode, hash)
  const ticket = useRef<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [opening, setOpening] = useState(false), [openingError, setOpeningError] = useState('')
  useEffect(() => setLoaded(true), [])
  const query = useQuery<MeetingView>({ queryKey: meetingKey(seat), enabled: !!seat,
    queryFn: ({ signal }) => request('/' + seat!.code, seat!.token, undefined, signal),
    refetchInterval: 1000, refetchIntervalInBackground: true, staleTime: 300,
    retry: (attempt, error) => !(error instanceof RoomApiError && [401, 404].includes(error.status)) && attempt < 2,
    structuralSharing: (oldData, newData) => {
      const before = oldData as MeetingView | undefined, after = newData as MeetingView
      return before && before.revision > after.revision ? before : after
    },
  })
  const accept = (next: Seat, view: MeetingView) => {
    client.setQueryData(meetingKey(next), view); ticket.current = null; setOpeningError('')
  }
  const pendingTicket = () => {
    ticket.current ??= newTicket()
    return ticket.current
  }
  const create = async (tone: VoiceId) => {
    setOpening(true); setOpeningError('')
    try { const token = pendingTicket(), view = await request<MeetingView>('', undefined, { token, tone }); const next: Seat = { code: view.code, token, role }; accept(next, view); return next }
    catch (error) { setOpeningError(error instanceof Error ? error.message : 'The chair needs another try.'); return null }
    finally { setOpening(false) }
  }
  const join = async (code: string, demon: Demon, name: string) => {
    setOpening(true); setOpeningError('')
    try { const token = pendingTicket(), view = await request<MeetingView>('/' + code + '/join', undefined, { token, demon, name }); const next: Seat = { code, token, role }; accept(next, view); return next }
    catch (error) { setOpeningError(error instanceof Error ? error.message : 'The seat needs another try.'); return null }
    finally { setOpening(false) }
  }
  const mutation = useMutation({ mutationFn: (body: Record<string, unknown>) => request<MeetingView>('/' + seat!.code + '/action', seat!.token, body),
    onSuccess: view => client.setQueryData<MeetingView>(meetingKey(seat), previous => previous && previous.revision > view.revision ? previous : view),
    onError: () => client.invalidateQueries({ queryKey: meetingKey(seat) }),
  })
  const act = (body: Record<string, unknown>) => mutation.mutate({ round: query.data?.round, phase: query.data?.phase, ...body })
  const clear = () => { ticket.current = null; setOpeningError(''); mutation.reset() }
  return { seat, loaded, state: query.data, create, join, act, clear, opening, pending: mutation.isPending,
    error: openingError || mutation.error?.message || (!query.data ? query.error?.message : '') || '',
    reconnecting: !!query.data && query.isError,
  }
}
export function useLobby(code: string, enabled = true) {
  return useQuery<{ code: string; phase: string; tone: VoiceId; players: { demon: Demon; name: string }[] }>({ queryKey: ['live-lobby', code],
    enabled: enabled && /^[A-Z]{4}$/.test(code), queryFn: () => request('/' + code + '/lobby'), refetchInterval: 2000, retry: false,
  })
}
export type LiveConnection = ReturnType<typeof useMeeting>
