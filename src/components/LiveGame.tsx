import { ArrowRight, Check, Clock3, LockKeyhole, Plus, Send, ShieldCheck, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'
import QRCode from 'qrcode'
import { DEMON_CHOICES, PLAYERS, SINNERS } from '../game-model'
import type { Demon, SinnerId } from '../game-model'
import type { LiveConnection } from '../live'
import type { Seat } from '../seat-url'
import { useLobby } from '../live'
import type { MeetingView } from '../room-engine'
import { Logo, Paperclip, Ribbon, Skull, Sprite, Stamp } from './Art'
import { FavoriteQuestion, FavoriteReceipt, FavoriteTV } from './FavoriteVoting'
import { useVoice } from './Voice'

export function MeetingClock({ state }: { state: MeetingView }) {
  const [now, setNow] = useState(Date.now()), [offset, setOffset] = useState(0)
  useEffect(() => { setOffset(state.serverNow - Date.now()) }, [state.serverNow])
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(timer) }, [])
  const seconds = state.deadline ? Math.max(0, Math.ceil((state.deadline - now - offset) / 1000)) : 0
  return <div className="round-timer" aria-label={`${seconds} seconds remaining`}><Clock3 size={24} /><b>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</b></div>
}
function RoomCode({ code }: { code: string }) { return <div className="phone-room-code"><span>ROOM</span><b>{code}</b></div> }
export function LivePhoneFrame({ code, state, children }: { code: string; state?: MeetingView; children: React.ReactNode }) {
  return <section className={`phone-screen phone-scene-${state?.phase ?? 'lobby'} live-phone`} aria-label={`Player phone: ${state?.phase ?? 'join'}`}>
    <div className="phone-backdrop" /><header className="phone-header"><Logo size="tiny" /><RoomCode code={code || '????'} /></header>
    <div className="phone-main">{children}</div>
  </section>
}
function CharacterPicker({ selected, choose, claimed = [] }: { selected: Demon; choose: (id: Demon) => void; claimed?: Demon[] }) {
  return <div className="demon-picker" aria-label="Choose your demon">{DEMON_CHOICES.map(player => {
    const taken = claimed.includes(player.id)
    return <button type="button" key={player.id} disabled={taken} className={`${selected === player.id ? 'selected' : ''} ${taken ? 'demon-claimed' : ''}`} aria-pressed={selected === player.id} aria-label={`Play as ${player.name}${taken ? ' (taken)' : ''}`} title={taken ? 'Already clocked in' : player.job} onClick={() => choose(player.id)}><Sprite id={player.id} name={player.name} /><span className="demon-option-name">{player.name}</span>{taken ? <LockKeyhole size={13} /> : selected === player.id && <Check size={14} strokeWidth={4} />}</button>
  })}</div>
}
export function PhoneClockIn({ connection, requestedCode, onJoined }: { connection: LiveConnection; requestedCode?: string; onJoined?: (seat: Seat) => void }) {
  const voice = useVoice(), state = connection.state
  const me = state?.players.find(player => player.id === state.me)
  const [code, setCode] = useState(requestedCode ?? state?.code ?? '')
  const [demon, setDemon] = useState<Demon>(me?.demon ?? 'greg'), [name, setName] = useState(me?.name ?? 'Greg')
  const lobby = useLobby(code, !state)
  const claimed = state ? state.players.filter(player => player.id !== state.me).map(player => player.demon) : lobby.data?.players.map(player => player.demon) ?? []
  const choose = (id: Demon) => { setName(old => old === PLAYERS.find(player => player.id === demon)!.name ? PLAYERS.find(player => player.id === id)!.name : old); setDemon(id) }
  useEffect(() => { if (requestedCode) setCode(requestedCode) }, [requestedCode])
  useEffect(() => {
    if (!me && claimed.includes(demon)) { const next = DEMON_CHOICES.find(player => !claimed.includes(player.id)); if (next) choose(next.id) }
  }, [lobby.data])
  const error = connection.error || (code.length === 4 && lobby.error ? lobby.error.message : '')
  return <LivePhoneFrame code={state?.code ?? code} state={state}><div className="phone-lobby live-clock-in">
    <h1>{voice.phoneWelcome[0]}<br /><span>{voice.phoneWelcome[1]}</span></h1>
    <div className="employee-portrait"><Sprite id={demon} pose={me ? 'stamping' : 'idle'} /><div className="portrait-halo" /></div><Ribbon>Pick your problem.</Ribbon>
    <CharacterPicker selected={demon} choose={choose} claimed={claimed} />
    <form className="employee-form" onSubmit={event => { event.preventDefault(); if (me) connection.act({ action: 'profile', demon, name }); else void connection.join(code, demon, name).then(seat => { if (seat) onJoined?.(seat) }) }}>
      <label>YOUR INFERNAL ALIAS<input aria-label="Your infernal alias" maxLength={20} value={name} required onChange={event => setName(event.target.value)} autoComplete="nickname" /></label>
      <label className="room-field">ROOM CODE<input aria-label="Room code" maxLength={4} minLength={4} required disabled={!!me} value={code} onChange={event => setCode(event.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} autoCapitalize="characters" spellCheck={false} />{(!!state || !!lobby.data) && <ShieldCheck size={20} />}</label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className={`infernal-button ${me ? 'button-lime' : ''}`} type="submit" disabled={connection.opening || connection.pending || name.trim().length === 0 || code.length !== 4 || claimed.includes(demon)}>{connection.opening ? 'CLAIMING YOUR SEAT…' : me ? <>CLOCKED IN <Check size={23} /></> : <>CLOCK IN <Send size={21} /></>}</button>
    </form><p className="phone-fineprint">{me ? 'THE CHAIR IS GETTING THINGS STARTED.' : PLAYERS.find(player => player.id === demon)!.job.toUpperCase()}</p>
  </div></LivePhoneFrame>
}
function SinnerSprite({ sinner, pose = 'idle', name }: { sinner: SinnerId; pose?: string; name: string }) {
  return <Sprite id={sinner} pose={pose} format={sinner === 'david' ? 'png' : 'svg'} className={sinner === 'david' ? 'david-sprite' : ''} name={name} />
}
function LiveMiniFile({ sinner, round }: { sinner: SinnerId; round: number }) {
  const subject = SINNERS[sinner]
  return <article className="phone-case paper-stack"><div className="polaroid"><Paperclip /><div className="mugshot"><SinnerSprite sinner={sinner} name={subject.name} /></div></div><div><span className="type-label">SOUL № {String(665 + round).padStart(5, '0')}</span><h2>{subject.name}{subject.age === undefined ? '' : `, ${subject.age}`}</h2><p>{subject.sins}</p></div></article>
}
function LiveCaseFile({ state }: { state: MeetingView }) {
  const subject = SINNERS[state.sinner]
  return <article className="case-file case-file-small paper-stack"><div className="file-tab">DEPARTMENT OF DAMNATION</div><div className="polaroid"><Paperclip /><div className="mugshot"><SinnerSprite sinner={state.sinner} name={subject.name} /></div><span>ABSOLUTELY NO REMORSE</span></div><div className="file-copy"><span className="type-label">SUBJECT № {String(665 + state.round).padStart(5, '0')} · NEW ARRIVAL</span><h2>{subject.name}{subject.age !== undefined && <span>, {subject.age}</span>}</h2><p className="subject-job">{subject.title}</p><p className="sin-description">{subject.sins}</p><Stamp>{subject.label}</Stamp></div></article>
}
function LiveWriting({ connection }: { connection: LiveConnection }) {
  const state = connection.state!, me = state.players.find(player => player.id === state.me)!, voice = useVoice()
  const [draft, setDraft] = useState('')
  useEffect(() => { setDraft(state.myEntry) }, [state.code, state.round, me.id])
  return <div className="phone-pitch"><div className="phone-demon-writing"><Sprite id={me.demon} pose={me.filed ? 'stamping' : 'writing'} /></div><Ribbon>{me.filed ? 'PAPERWORK FILED.' : 'YOUR SENTENCE?'}</Ribbon><LiveMiniFile sinner={state.sinner} round={state.round} />
    {me.filed ? <article className="filed-receipt paper-stack"><Stamp>FILED IN HELL</Stamp><p>{state.myEntry}</p><div className="receipt-rule" /><b>{voice.filed}</b><span>{state.filedCount} / {state.players.length} FILED · VOTING IS UP NEXT</span><button className="text-button" disabled={connection.pending} onClick={() => connection.act({ action: 'amend' })}>Amend my sentence</button></article> : <form className="punishment-form" onSubmit={event => { event.preventDefault(); connection.act({ action: 'submit', text: draft }) }}><label htmlFor="live-sentence">{voice.writingLabel}</label><div className="sentence-box"><textarea id="live-sentence" aria-label="Your punishment" minLength={3} maxLength={140} required value={draft} placeholder={voice.placeholder} onChange={event => setDraft(event.target.value)} /><span className={draft.length >= 130 ? 'near-limit' : ''}>{draft.length}/140</span></div><button className="infernal-button" type="submit" disabled={connection.pending || draft.trim().length < 3}>{connection.pending ? 'FILING…' : 'SUBMIT SENTENCE'}<Send size={21} /></button></form>}
    {connection.error && <p className="form-error" role="alert">{connection.error}</p>}<p className="phone-fineprint">{voice.pitchTip}</p>
  </div>
}
function LiveFavorites({ connection }: { connection: LiveConnection }) {
  const state = connection.state!, me = state.players.find(player => player.id === state.me)!
  const [selected, setSelected] = useState<string | null>(null)
  useEffect(() => setSelected(null), [state.question?.id, state.round])
  if (!state.question) return <FavoriteReceipt demon={me.demon} favorites={state.myFavorites} />
  return <FavoriteQuestion question={state.question} index={state.questionIndex} total={state.questionCount} selected={selected} onSelect={setSelected} pending={connection.pending} error={connection.error} onConfirm={() => connection.act({ action: 'favorite', question: state.question!.id, choice: selected })} />
}
function LivePlayerVerdict({ state }: { state: MeetingView }) {
  const me = state.players.find(player => player.id === state.me)!, result = state.results.find(result => result.author === me.id), winner = state.results.find(result => result.winner)
  return <div className="phone-verdict"><h1>{result?.winner ? <>YOUR HANDIWORK<br /><span>IS HELLISH.</span></> : <>A TERRIBLE<br /><span>DECISION. NICE.</span></>}</h1><div className="phone-winner"><Sprite id={me.demon} pose="celebrate" /><div className="point-burst">+{result?.points ?? 0}<small>MISCHIEF</small></div><span className="winner-spark spark-a">✦</span><span className="winner-spark spark-b">✧</span></div><article className={`phone-verdict-receipt paper-stack ${winner && winner.text.length > 90 ? 'long-sentence' : ''}`}><span className="type-label">DEPARTMENT OF DAMNATION / RECEIPT</span><Stamp>CASE CLOSED</Stamp><h2>{result?.winner ? 'PUNISHMENT APPROVED.' : 'SENTENCE APPROVED.'}</h2><p>{winner?.text ?? 'No sentence made it through the paperwork.'}</p><div className="receipt-rule" /><dl><div><dt>Your favorites</dt><dd>{result?.favorites ?? 0} / {result?.appearances ?? 0} SHOWINGS</dd></div><div><dt>Round mischief</dt><dd>+{result?.points ?? 0}</dd></div><div className="receipt-total"><dt>YOUR MISCHIEF</dt><dd>{me.score.toLocaleString()}</dd></div></dl></article><p className="phone-fineprint">Keep the receipt. There are no refunds.</p><div className="next-soul-note">{state.round < state.totalRounds ? 'NEXT SINNER CLOCKS IN SHORTLY…' : 'FINAL APPRAISALS COMING UP…'}</div></div>
}
function PlayerFinal({ state }: { state: MeetingView }) {
  const me = state.players.find(player => player.id === state.me)!, best = Math.max(...state.players.map(player => player.score))
  return <div className="player-final"><h1>{me.score === best && best > 0 ? <>EMPLOYEE<br /><span>OF THE EON.</span></> : <>HORRIBLE WORK.<br /><span>GREAT MEETING.</span></>}</h1><Sprite id={me.demon} pose="celebrate" /><article className="paper-stack"><Stamp>PERFORMANCE REVIEW</Stamp><span className="type-label">{me.name.toUpperCase()} / FINAL MISCHIEF</span><strong>{me.score.toLocaleString()}</strong><p>No conscience. Excellent benefits.</p></article><p className="phone-fineprint">The chair can start a rematch.</p></div>
}
export function LivePlayer({ connection }: { connection: LiveConnection }) {
  const state = connection.state!
  if (state.phase === 'lobby') return <PhoneClockIn connection={connection} />
  return <LivePhoneFrame code={state.code} state={state}>
    {state.phase === 'pitch' && <LiveWriting connection={connection} />}
    {state.phase === 'vote' && <LiveFavorites connection={connection} />}
    {state.phase === 'verdict' && <LivePlayerVerdict state={state} />}
    {state.phase === 'finished' && <PlayerFinal state={state} />}
  </LivePhoneFrame>
}

function LiveCommittee({ connection }: { connection: LiveConnection }) {
  const state = connection.state!, scene = state.phase === 'finished' ? 'verdict' : state.phase
  return <div className={`committee committee-${scene} live-committee`}>
    {state.players.map((player, index) => {
      const winner = (scene === 'verdict' && state.results.some(result => result.author === player.id && result.winner))
      const pose = scene === 'pitch' ? player.filed ? 'stamping' : 'writing' : scene === 'vote' ? player.voted ? 'stamping' : 'voting' : scene === 'verdict' ? 'celebrate' : 'idle'
      return <div className={`committee-member member-${index} ${winner ? 'member-winner' : ''}`} key={player.id}><Sprite id={player.demon} pose={pose} name={player.name} />{winner && <div className="winner-crown">✦ MVP OF MISERY ✦</div>}{scene === 'pitch' && player.filed && <span className="filed-tag"><Check size={13} /> FILED</span>}{scene === 'vote' && <span className={`filed-tag ${!player.voted ? 'still-deciding' : ''}`}>{player.voted ? <><Check size={13} /> DECIDED</> : `${player.completed}/${player.totalQuestions} PICKS`}</span>}<div className="nameplate"><i style={{ background: PLAYERS.find(demon => demon.id === player.demon)!.color }} /><span>{player.name}</span>{scene === 'lobby' ? <small className="is-ready">READY</small> : scene === 'verdict' && <small>{player.score.toLocaleString()} PTS</small>}</div>{scene === 'lobby' && <button className="remove-seat" title={`Remove ${player.name}`} aria-label={`Remove ${player.name}`} disabled={connection.pending} onClick={() => connection.act({ action: 'remove', player: player.id })}><X size={13} /></button>}</div>
    })}
    {!state.players.length && Array.from({ length: 8 }, (_, index) => <div key={index} className="committee-member empty-seat"><span>?</span><div className="nameplate">OPEN SEAT {index + 1}</div></div>)}
  </div>
}
function FinalMusic({ video }: { video: RefObject<HTMLVideoElement | null> }) {
  const [needsPlay, setNeedsPlay] = useState(false)
  const [available, setAvailable] = useState(true)
  useEffect(() => { void video.current?.play().catch(() => setNeedsPlay(true)) }, [])
  return <div className="final-music"><span className="type-label">OFFICIAL END CREDITS</span><video ref={video} src="/media/winner-video.mp4" poster="/media/winner-poster.jpg" title="Winner video" controls autoPlay playsInline preload="metadata" hidden={!available} onPlay={() => setNeedsPlay(false)} onError={() => { setAvailable(false); setNeedsPlay(false) }} />{!available && <div className="final-media-placeholder">NO WINNER VIDEO INSTALLED</div>}<p><b>WINNER VIDEO</b><span>{available ? needsPlay ? 'PRESS PLAY TO START THE END CREDITS' : 'THE ROAD TO ETERNITY HAS A SOUNDTRACK' : 'ADD YOUR OWN IN PUBLIC/MEDIA'}</span></p></div>
}
export function LiveHost({ connection }: { connection: LiveConnection }) {
  const state = connection.state!, voice = useVoice(), subject = SINNERS[state.sinner]
  const [qr, setQr] = useState('')
  const music = useRef<HTMLAudioElement>(null)
  const finalVideo = useRef<HTMLVideoElement>(null)
  const [musicPreferred, setMusicPreferred] = useState(true)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [musicAvailable, setMusicAvailable] = useState(true)
  const playMusic = () => {
    if (!music.current) return
    music.current.volume = 0.25
    void music.current.play().then(() => setMusicPlaying(true)).catch(() => setMusicPlaying(false))
  }
  const toggleMusic = () => {
    if (musicPlaying) { music.current?.pause(); setMusicPlaying(false); setMusicPreferred(false) }
    else { setMusicPreferred(true); playMusic() }
  }
  useEffect(() => {
    if (state.phase === 'finished') { music.current?.pause(); setMusicPlaying(false) }
  }, [state.phase])
  const joinUrl = typeof window === 'undefined' ? '' : `${window.location.origin}/join?room=${state.code}`
  useEffect(() => { let current = true; if (joinUrl) void QRCode.toDataURL(joinUrl, { margin: 1, width: 192, color: { dark: '#28152f', light: '#fff2d2' } }).then(value => { if (current) setQr(value) }); return () => { current = false } }, [joinUrl])
  const winners = state.results.filter(result => result.winner)
  const winnerPage = Math.min(winners.length - 1, Math.floor((state.serverNow - (state.verdictStartedAt ?? state.serverNow)) / 5_000))
  const winner = winners[Math.max(0, winnerPage)]
  const championScore = Math.max(0, ...state.players.map(player => player.score)), leaderboard = [...state.players].sort((a,b) => b.score - a.score)
  const seats = state.players.length || 8, scene = state.phase === 'finished' ? 'verdict' : state.phase
  const groups = Math.max(1, ...state.players.map(player => player.totalQuestions))
  return <section className={`tv-screen scene-${scene} ${seats > 4 ? 'party-large' : ''} live-tv ${state.phase === 'finished' ? 'meeting-finished' : ''}`} style={{ '--seats': seats, '--member-size': `${Math.min(205, 1400 / seats)}px`, '--small-member-size': `${Math.min(182, 1280 / seats + 8)}px` } as CSSProperties} aria-label={`Host TV: ${state.phase}`} data-player-count={state.players.length}>
    <audio ref={music} src="/media/background-music.m4a" loop preload="auto" onError={() => setMusicAvailable(false)} />
    <div className="office-backdrop" /><div className="office-vignette" /><header className="tv-header">{state.phase === 'lobby' ? <div className="office-seal"><Skull /></div> : <Logo />}{state.phase !== 'finished' && <span className="round-topline">{state.phase === 'lobby' ? `${state.players.length} / 8 DEMONS CLOCKED IN` : `ROUND ${state.round} OF ${state.totalRounds} / QUESTIONABLE JUDGMENT`}</span>}{state.deadline ? <MeetingClock state={state} /> : <RoomCode code={state.code} />}</header>
    {state.phase === 'lobby' && <div className="lobby-center"><Logo size="large" /><p className="lobby-motto">{voice.headline.join(' ')}</p><div className="join-ticket live-join-ticket paper-stack"><div><span className="type-label">TAKE A SEAT IN THE BAD PLACE</span><p>Join on your phone.</p><small>Scan the code. Claim a demon. Bring your worst.</small></div><div className="room-code"><span>ROOM CODE</span><strong>{state.code}</strong></div>{qr && <img className="room-qr" src={qr} alt="Scan to join this room" />}</div><div className="lobby-sticky"><span>EMPLOYEE<br />OF THE EON</span><Skull /><b>VACANT</b></div></div>}
    {state.phase === 'pitch' && <div className="pitch-scene"><h1 className="scene-headline">{voice.pitchHeadline[0]} <span>{voice.pitchHeadline[1]}</span></h1><LiveCaseFile state={state} /><div className="pitch-sticky">{voice.sticky[0]}<br />{voice.sticky[1]}<span>— management</span><span className="sticky-trident">♆</span></div><div className="pitch-progress"><span><b>{state.filedCount} / {state.players.length}</b> PUNISHMENTS FILED</span><div className="progress-track"><i style={{ width: `${state.filedCount / state.players.length * 100}%` }} /></div></div></div>}
    {state.phase === 'vote' && <FavoriteTV headline={voice.voteHeadline} subject={subject.name} groups={groups} completed={state.ballotCount} total={state.players.length} />}
    {state.phase === 'verdict' && <div className="verdict-scene"><h1 className="scene-headline">{voice.verdictHeadline[0]} <span>{voice.verdictHeadline[1]}</span></h1><div className="sentenced-photo polaroid"><div className="mugshot"><SinnerSprite sinner={state.sinner} pose="shocked" name={`${subject.name}, shocked`} /></div><span>{subject.name.toUpperCase()} / SOUL № {665 + state.round}</span></div><article className={`winning-sentence paper-stack ${!winner || winner.text.length > 90 ? 'long-sentence' : ''}`}><span className="type-label">{winners.length > 1 ? `JOINT DISASTERS / ${winnerPage + 1} OF ${winners.length}` : 'OFFICIAL SENTENCE / NO APPEALS / NO REFUNDS'}</span><div className="winning-body"><p>{winner?.text ?? 'The paperwork never arrived. Management is unimpressed.'}</p></div><div className="winning-byline"><b>{winner ? `BY ${state.players.find(player => player.id === winner.author)!.name.toUpperCase()}` : 'NO SENTENCE FILED'}</b><span>{winner ? `${winner.favorites} / ${winner.appearances} FAVORITES` : '0 FAVORITES'}</span></div><Stamp>{winners.length > 1 ? 'CO-WINNERS' : 'SENTENCED'}</Stamp></article><div className="celebration-burst burst-left">✦</div><div className="celebration-burst burst-right">✧</div><div className="verdict-sticky">ANOTHER DAY.<br />ANOTHER<br />ETERNITY.</div></div>}
    {state.phase === 'finished' && <div className="final-review"><span className="type-label">THREE CASES. COUNTLESS HR VIOLATIONS.</span><h1>EMPLOYEE{leaderboard.filter(player => player.score === championScore).length > 1 ? 'S' : ''} <span>OF THE EON.</span></h1><div className="final-stage"><article className="paper-stack final-leaderboard"><Stamp>PERFORMANCE REVIEW</Stamp>{leaderboard.map(player => <div className={player.score === championScore && championScore > 0 ? 'top-ranked' : ''} key={player.id}><span>{1 + leaderboard.filter(other => other.score > player.score).length}</span><Sprite id={player.demon} pose={player.score === championScore ? 'celebrate' : 'idle'} /><strong>{player.name}</strong><b>{player.score.toLocaleString()}<small>MISCHIEF</small></b></div>)}</article><FinalMusic video={finalVideo} /></div></div>}
    {state.phase !== 'finished' && <LiveCommittee connection={connection} />}
    <div className="desk-front" />
    <footer className="tv-footer">
      <div className="footer-left">
        {state.phase !== 'finished' && musicAvailable && <button className="footer-music" type="button" aria-label={musicPlaying ? 'Mute background music' : 'Play background music'} onClick={toggleMusic}><span aria-hidden="true" className="footer-music-note">♫</span>{musicPlaying ? 'MUTE MUSIC' : 'PLAY MUSIC'}</button>}
        <span className="footer-slogan">{voice.footer[state.phase === 'lobby' ? 'lobby' : state.phase === 'verdict' || state.phase === 'finished' ? 'verdict' : 'round']}</span>
      </div>
      <div className="live-host-actions">{state.deadline && <button className="add-time" disabled={connection.pending} onClick={() => connection.act({ action: 'extend' })}><Plus size={13} /> 60 SECONDS</button>}{state.phase === 'lobby' ? <button className="start-meeting" disabled={state.players.length < 3 || connection.pending} onClick={() => { if (musicPreferred) playMusic(); connection.act({ action: 'advance' }) }}>{state.players.length < 3 ? `NEED ${3 - state.players.length} MORE DEMON${state.players.length === 2 ? '' : 'S'}` : 'BEGIN DAMNATION'}<ArrowRight size={18} /></button> : state.phase === 'finished' ? <button className="next-case" disabled={connection.pending} onClick={() => { finalVideo.current?.pause(); if (musicPreferred) playMusic(); connection.act({ action: 'rematch' }) }}>ANOTHER TERRIBLE MEETING <ArrowRight size={18} /></button> : <span className="tv-room-code">ROOM <b>{state.code}</b></span>}</div>
    </footer>
    {connection.error && <p className="live-tv-error" role="alert">{connection.error}</p>}
  </section>
}
