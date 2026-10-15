import { DEMON_CHOICES, PLAYERS, SINNERS } from './game-model.ts'
import type { Demon, SinnerId, Scene } from './game-model.ts'
import { favoriteSchedule, favoriteResults, shuffled } from './favorites.ts'
import type { Entry, FavoriteQuestion, FavoritePick } from './favorites.ts'
import { voiceId } from './voice.ts'
import type { VoiceId } from './voice.ts'

export type Phase = Scene | 'finished'
export type Result = ReturnType<typeof favoriteResults>[number]
export type Member = { id: string; demon: Demon; name: string; score: number; ready: boolean; tokenHash: string }
export type Meeting = {
  code: string; hostHash: string; seed: string; createdAt: number; expiresAt: number
  phase: Phase; round: number; totalRounds: number; tone: VoiceId; sinners: SinnerId[]
  deadline: number | null; players: Member[]; entries: Entry[]
  questions: Record<string, FavoriteQuestion[]>; picks: Record<string, FavoritePick[]>
  results: Result[]; history: Result[][]
  verdictStartedAt?: number
  demo?: { bots: string[] }
}
export class GameError extends Error {
  status: number
  constructor(message: string, status = 400) { super(message); this.status = status }
}
function requireGame(condition: unknown, message: string, status = 400): asserts condition {
  if (!condition) throw new GameError(message, status)
}
export function newMeeting(code: string, hostHash: string, tone: unknown, now: number): Meeting {
  const seed = crypto.randomUUID()
  return { code, hostHash, seed, createdAt: now, expiresAt: now + 24 * 60 * 60 * 1000,
    phase: 'lobby', round: 1, totalRounds: 3, tone: voiceId(tone) ?? 'committee',
    sinners: shuffled(Object.keys(SINNERS) as SinnerId[], seed), deadline: null,
    players: [], entries: [], questions: {}, picks: {}, results: [], history: [] }
}
export function identity(meeting: Meeting, tokenHash: string) {
  if (meeting.hostHash === tokenHash) return { role: 'host' as const, player: undefined }
  const player = meeting.players.find(player => player.tokenHash === tokenHash)
  requireGame(player, 'This seat needs its original phone. Join again from the lobby.', 401)
  return { role: 'player' as const, player }
}
function playerName(value: unknown) {
  requireGame(typeof value === 'string', 'Every demon needs an alias.')
  const name = value.replace(/\p{C}/gu, '').trim()
  requireGame(name.length > 0 && name.length <= 20, 'Keep your alias between 1 and 20 characters.')
  return name
}
function demonId(value: unknown, current?: Demon): Demon {
  requireGame(DEMON_CHOICES.some(player => player.id === value) || (current !== undefined && value === current), 'Choose a demon from the picker.')
  return value as Demon
}
export function joinMeeting(meeting: Meeting, tokenHash: string, body: Record<string, unknown>) {
  const existing = meeting.players.find(player => player.tokenHash === tokenHash)
  if (existing) return existing // A retry after a lost join response retains the same seat.
  requireGame(meeting.phase === 'lobby', 'This meeting has started. Ask the host to open another one.', 409)
  requireGame(meeting.players.length < 8, 'All eight seats are taken.', 409)
  const demon = demonId(body.demon), name = playerName(body.name)
  requireGame(!meeting.players.some(player => player.demon === demon), 'That demon just clocked in. Pick another face.', 409)
  const player: Member = { id: crypto.randomUUID(), demon, name, score: 0, ready: true, tokenHash }
  meeting.players.push(player)
  return player
}
function finishRound(meeting: Meeting, now: number) {
  meeting.results = favoriteResults(meeting.entries, meeting.questions, meeting.picks)
  for (const result of meeting.results) meeting.players.find(player => player.id === result.author)!.score += result.points
  meeting.history.push(meeting.results)
  meeting.phase = 'verdict'; meeting.deadline = null; meeting.verdictStartedAt = now
}
function openVoting(meeting: Meeting, now: number) {
  if (meeting.entries.length < 2) { finishRound(meeting, now); return }
  meeting.questions = favoriteSchedule(meeting.entries, meeting.seed + ':round-' + meeting.round, meeting.players.map(player => player.id))
  meeting.picks = Object.fromEntries(meeting.players.map(player => [player.id, []]))
  meeting.phase = 'vote'; meeting.deadline = now + 90_000
}
function startPitch(meeting: Meeting, now: number) {
  meeting.phase = 'pitch'; meeting.deadline = now + 90_000
}
function nextRound(meeting: Meeting, now: number) {
  if (meeting.round === meeting.totalRounds) { meeting.phase = 'finished'; meeting.verdictStartedAt = undefined; return }
  meeting.round++; meeting.entries = []; meeting.questions = {}; meeting.picks = {}; meeting.results = []
  meeting.verdictStartedAt = undefined
  startPitch(meeting, now)
}
const demoSentences: Record<SinnerId, string[]> = {
  john: [
    'Every brunch requires forty complaint forms, and the manager is always at lunch.',
    'He waits tables for skeletons who tip one tiny bone at a time.',
  ],
  maya: [
    'She must schedule eternity in the group chat, but every reply is “we should hang soon.”',
    'Every vague plan becomes a mandatory calendar invite hosted by a punctual ghost.',
  ],
  brad: [
    'He must attend an all-hands meeting where every slide says “circle back” forever.',
    'His podcast has one listener: a skeleton who interrupts to ask about benefits.',
  ],
  tessa: [
    'Her wellness retreat is an endless 5 a.m. meeting led by a very sleepy sloth.',
    'Every referral code sends her to a cold plunge full of lukewarm oatmeal.',
  ],
  derek: [
    'He must get a permit for every blade of grass, signed by the grass itself.',
    'The sidewalk chalk becomes permanent and spells out all his complaints.',
  ],
  pam: [
    'Every lunch she steals is replaced by a fish that microwaves itself.',
    'Her fridge has one shelf, and every yogurt has someone else’s name on it.',
  ],
  olivia: [
    'Her apology videos have no camera, only a live audience asking follow-up questions.',
    'Every sponsor read is interrupted by a demon reading the actual terms and conditions.',
  ],
  elliot: [
    'He waits in a line whose front keeps moving back whenever he says “my friends are here.”',
    'His priority pass opens a second queue for everyone he ever cut in front of.',
  ],
  david: [
    'He spends eternity in a meeting whose agenda is planning the next meeting.',
    'Every “quick sync” becomes a three-hour debrief chaired by a sleepy gargoyle.',
  ],
  felix: [
    'Every movie ends one scene before the twist, and everyone tells him what happens.',
    'His spoiler texts arrive after he has forgotten the plot but before the opening credits.',
  ],
  rita: [
    'Her seat reclines only when the person behind her does, into a chain of infinite apology.',
    'She gets the middle seat between two armrests that both belong to someone else.',
  ],
  kieran: [
    'Every speaker he owns plays only the ads, at full volume, on a crowded train.',
    'His videos buffer forever while everyone asks him to turn it up.',
  ],
  simone: [
    'Every thank-you email spawns an all-staff reply asking her to confirm receipt.',
    'Her inbox has one thread, and every demon replies all with “following.”',
  ],
  omar: [
    'His dinner arrives one napkin at a time, each delivered by someone expecting a real tip.',
    'Every discount code adds a mandatory gratuity to the driver he tried to shortchange.',
  ],
  chloe: [
    'Her eternal subscription can only be canceled by calling herself during hold music.',
    'Every exit button opens a survey that asks why she is abandoning the survey.',
  ],
  hugo: [
    'Every parking spot has a cone, and every cone is being saved for a smaller cone.',
    'His car is always perfectly parked two streets away from where he needs it.',
  ],
  bianca: [
    'She gives a speech at every wedding, but the microphone only plays the couple’s vows.',
    'Every cake slice is the flavor she requested, and nobody will let her take one home.',
  ],
  priya: [
    'The thermostat follows her around, changing to whatever temperature she just complained about.',
    'Her sweater closet is warm and her office is cold, but the remote is always in the other room.',
  ],
  marco: [
    'The self-checkout asks him to explain every avocado to an increasingly skeptical banana.',
    'Every coupon works, but only after he puts all the frozen food back where it belongs.',
  ],
  sloane: [
    'She must dine at all six tables she booked, one course at a time, before dessert closes.',
    'Every reservation confirms itself for the exact moment she finally sits down somewhere else.',
  ],
  nina: [
    'Her recipe is at the top of the page, but she has to read the comments before cooking.',
    'Every ingredient links to a twelve-chapter origin story written by the ingredient.',
  ],
  calvin: [
    'Every one-star review gets a thoughtful owner reply that asks him to describe the weather.',
    'His complaint form has five stars preselected and no comment box.',
  ],
  wren: [
    'Every voice note she sends is transcribed as “inaudible chewing” except the first second.',
    'Her friends reply with nine-minute recordings that begin “quick question.”',
  ],
  luca: [
    'Every machine he claims turns into a towel rack until he finishes his actual set.',
    'His gym mirror shows only the strangers he filmed without asking.',
  ],
  greta: [
    'Her room key expires one minute before checkout, and the hallway is lined with tiny shampoos.',
    'Every glitter fleck in the sheets needs its own checkout form.',
  ],
  malik: [
    'The playlist accepts his songs, then skips them after ten seconds with a polite ding.',
    'His aux cord reaches every speaker but only plays everyone else’s requests.',
  ],
  june: [
    'Every book she borrows opens to a page with her own ending spoiled in the margin.',
    'Her library card works only after she flattens every dog-ear she ever made.',
  ],
  eddie: [
    'The Wi-Fi password changes every time he says it aloud, and the router refuses hints.',
    'His devices connect only after he answers all the messages asking for access.',
  ],
  vera: [
    'Every abandoned cart follows her home, squeaking one wheel louder than the last.',
    'Her ice cream melts until she returns each misplaced item to the right aisle.',
  ],
  arlo: [
    'His microphone stays on for lunch but mutes itself whenever he has the answer.',
    'His screen share displays only a giant “can you see it?” button that no one can click.',
  ],
}
export function tickMeeting(meeting: Meeting, now: number) {
  // Rooms saved on the retired reveal screen enter the writing round on their next poll.
  if (meeting.phase === 'case') startPitch(meeting, now)
  if (meeting.demo) {
    if (meeting.phase === 'lobby' && meeting.players.length >= 3) startPitch(meeting, now)
    else if (meeting.phase === 'pitch') {
      meeting.demo.bots.forEach((id, index) => {
        if (meeting.players.some(player => player.id === id) && !meeting.entries.some(entry => entry.author === id)) {
          meeting.entries.push({ id: crypto.randomUUID(), author: id, text: demoSentences[meeting.sinners[meeting.round - 1]][index % 2] })
        }
      })
    } else if (meeting.phase === 'vote') {
      meeting.demo.bots.forEach((id, index) => {
        if (!meeting.players.some(player => player.id === id)) return
        const questions = meeting.questions[id] ?? [], picks = meeting.picks[id] ?? []
        for (const question of questions.slice(picks.length)) {
          if (question.choices.length) picks.push({ question: question.id, choice: question.choices[(index + meeting.round) % question.choices.length] })
        }
        meeting.picks[id] = picks
      })
    }
  }
  if (meeting.phase === 'pitch' && (meeting.entries.length === meeting.players.length || now >= meeting.deadline!)) openVoting(meeting, now)
  if (meeting.phase === 'vote' && (meeting.players.every(player => (meeting.picks[player.id]?.length ?? 0) === (meeting.questions[player.id]?.length ?? 0)) || now >= meeting.deadline!)) finishRound(meeting, now)
  if (meeting.phase === 'verdict') {
    meeting.verdictStartedAt ??= now // Existing rooms may already be showing a verdict.
    const winners = meeting.results.filter(result => result.winner).length
    if (now - meeting.verdictStartedAt >= Math.max(15_000, winners * 5_000)) nextRound(meeting, now)
  }
}
export function actOnMeeting(meeting: Meeting, tokenHash: string, body: Record<string, unknown>, now: number) {
  const who = identity(meeting, tokenHash)
  if (body.action === 'advance' || body.action === 'extend' || body.action === 'remove' || body.action === 'rematch' || body.action === 'enable-demo') {
    requireGame(who.role === 'host', 'Only the chair can move the meeting.', 403)
    requireGame(body.phase === meeting.phase && body.round === meeting.round, 'The meeting has moved ahead. The latest screen is on its way.', 409)
    if (body.action === 'enable-demo') {
      requireGame(meeting.phase === 'lobby' && meeting.players.length === 2, 'Set up two demons before opening the demo.', 409)
      requireGame(Array.isArray(body.bots) && body.bots.length === 2 && new Set(body.bots).size === 2 && body.bots.every(id => meeting.players.some(player => player.id === id)), 'Choose both demo demons.')
      meeting.demo = { bots: body.bots as string[] }
    } else if (body.action === 'remove') {
      requireGame(meeting.phase === 'lobby', 'Seats are locked during a round.', 409)
      meeting.players = meeting.players.filter(player => player.id !== body.player)
    } else if (body.action === 'extend') {
      requireGame(meeting.phase === 'pitch' || meeting.phase === 'vote', 'There is no running clock to extend.', 409)
      meeting.deadline = Math.max(meeting.deadline!, now) + 60_000
    } else if (body.action === 'rematch') {
      requireGame(meeting.phase === 'finished', 'Finish the meeting before a rematch.', 409)
      meeting.phase = 'lobby'; meeting.round = 1; meeting.history = []; meeting.results = []
      meeting.entries = []; meeting.questions = {}; meeting.picks = {}; meeting.deadline = null; meeting.verdictStartedAt = undefined
      meeting.seed = crypto.randomUUID(); meeting.sinners = shuffled(Object.keys(SINNERS) as SinnerId[], meeting.seed)
      meeting.players.forEach(player => { player.score = 0; player.ready = true })
    } else if (meeting.phase === 'lobby') {
      requireGame(meeting.players.length >= 3, 'Clock in at least three demons first.', 409)
      requireGame(meeting.players.every(player => player.ready), 'Wait for every demon to clock in.', 409)
      startPitch(meeting, now)
    } else if (meeting.phase === 'pitch') {
      requireGame(meeting.entries.length >= 2, 'At least two sentences need to be filed.', 409)
      openVoting(meeting, now)
    } else if (meeting.phase === 'vote') {
      finishRound(meeting, now)
    } else if (meeting.phase === 'verdict') {
      nextRound(meeting, now)
    } else throw new GameError('Choose a rematch to begin another meeting.', 409)
  } else {
    requireGame(who.player, 'Join from a phone to take a player action.', 403)
    const player = who.player
    if (body.action === 'profile') {
      requireGame(meeting.phase === 'lobby', 'Your seat is locked until the next lobby.', 409)
      const demon = demonId(body.demon, player.demon)
      requireGame(!meeting.players.some(other => other.id !== player.id && other.demon === demon), 'That demon just clocked in. Pick another face.', 409)
      player.demon = demon; player.name = playerName(body.name); player.ready = true
    } else if (body.action === 'submit' || body.action === 'amend') {
      requireGame(meeting.phase === 'pitch' && body.round === meeting.round, 'The writing docket has closed.', 409)
      if (body.action === 'amend') meeting.entries = meeting.entries.filter(entry => entry.author !== player.id)
      else {
        requireGame(typeof body.text === 'string', 'Write a sentence first.')
        const text = body.text.trim()
        requireGame(text.length >= 3 && text.length <= 140, 'Keep your sentence between 3 and 140 characters.')
        const entry = meeting.entries.find(entry => entry.author === player.id)
        if (entry) entry.text = text
        else meeting.entries.push({ id: crypto.randomUUID(), author: player.id, text })
      }
    } else if (body.action === 'favorite') {
      requireGame(body.round === meeting.round, 'That ballot belonged to an earlier sinner.', 409)
      const questions = meeting.questions[player.id] ?? [], picks = meeting.picks[player.id] ?? []
      const saved = picks.find(pick => pick.question === body.question)
      if (saved && saved.choice === body.choice) return // Retrying a confirmed pick adds no second vote.
      requireGame(meeting.phase === 'vote', 'The favorites round has closed.', 409)
      const question = questions[picks.length]
      requireGame(question && question.id === body.question, 'Finish the current group before the next one.', 409)
      requireGame(typeof body.choice === 'string' && question.choices.includes(body.choice), 'Choose one answer from this group.')
      requireGame(meeting.entries.find(entry => entry.id === body.choice)?.author !== player.id, 'You cannot vote for your own sentence.')
      picks.push({ question: question.id, choice: body.choice }); meeting.picks[player.id] = picks
    } else throw new GameError('That paperwork is not on the docket.')
  }
  tickMeeting(meeting, now)
}
export function meetingView(meeting: Meeting, tokenHash: string, version: number, now: number) {
  const who = identity(meeting, tokenHash), me = who.player?.id
  const mine = me ? meeting.picks[me] ?? [] : []
  const questions = me ? meeting.questions[me] ?? [] : []
  const current = meeting.phase === 'vote' ? questions[mine.length] : undefined
  const revealed = meeting.phase === 'verdict' || meeting.phase === 'finished'
  return {
    code: meeting.code, revision: version, phase: meeting.phase, round: meeting.round,
    totalRounds: meeting.totalRounds, tone: meeting.tone, sinner: meeting.sinners[meeting.round - 1],
    deadline: meeting.deadline, verdictStartedAt: meeting.verdictStartedAt, serverNow: now, role: who.role, me,
    players: meeting.players.map(player => ({ id: player.id, demon: player.demon, name: player.name, score: player.score, ready: player.ready,
      filed: meeting.entries.some(entry => entry.author === player.id),
      voted: meeting.phase === 'vote' || revealed ? (meeting.picks[player.id]?.length ?? 0) === (meeting.questions[player.id]?.length ?? 0) : false,
      completed: meeting.picks[player.id]?.length ?? 0, totalQuestions: meeting.questions[player.id]?.length ?? 0 })),
    filedCount: meeting.entries.length, ballotCount: meeting.players.filter(player => (meeting.picks[player.id]?.length ?? 0) === (meeting.questions[player.id]?.length ?? 0)).length,
    questionIndex: mine.length, questionCount: questions.length,
    question: current ? { id: current.id, choices: current.choices.map(id => ({ id, text: meeting.entries.find(entry => entry.id === id)!.text })) } : null,
    myEntry: me ? meeting.entries.find(entry => entry.author === me)?.text ?? '' : '',
    myFavorites: mine.map(pick => ({ question: pick.question, text: meeting.entries.find(entry => entry.id === pick.choice)?.text ?? '' })),
    results: revealed ? meeting.results : [], history: meeting.phase === 'finished' ? meeting.history : [],
  }
}
export type MeetingView = ReturnType<typeof meetingView>
