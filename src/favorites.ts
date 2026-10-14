/** Shared by the room server and screen studies. Authors stay hidden in player payloads. */
export type Entry = { id: string; author: string; text: string }
export type FavoriteQuestion = { id: string; choices: string[] }
export type FavoritePick = { question: string; choice: string }

function random(seed: string) {
  let state = 2166136261
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619)
  return () => {
    state += 0x6d2b79f5
    let t = Math.imul(state ^ state >>> 15, 1 | state)
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}
export function shuffled<T>(values: readonly T[], seed: string): T[] {
  const output = [...values], next = random(seed)
  for (let i = output.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1))
    ;[output[i], output[j]] = [output[j], output[i]]
  }
  return output
}

/**
 * A randomized cyclic schedule, rather than independent random sampling.
 * For a complete 3–8 person round every entry gets exactly q appearances in
 * each card position, and every voter sees every other entry at least once.
 * A group never contains a duplicate or the voter's own entry.
 */
export function favoriteSchedule(entries: Entry[], seed: string, voters = entries.map(entry => entry.author)) {
  if (new Set(entries.map(e => e.id)).size !== entries.length || new Set(entries.map(e => e.author)).size !== entries.length) throw new Error('One unique entry per author is required.')
  const ring = shuffled(entries, seed + ':ring')
  const schedule: Record<string, FavoriteQuestion[]> = {}
  const n = ring.length
  if (!n) return Object.fromEntries(voters.map(voter => [voter, []]))
  const k = Math.min(3, n - 1)
  const offsets = shuffled(Array.from({ length: n - 1 }, (_, i) => i + 1), seed + ':offsets')
  const groups: number[][] = []
  if (k) for (let start = 0; start < offsets.length; start += k) {
    const group = offsets.slice(start, start + k)
    for (const offset of offsets) {
      if (group.length === k) break
      if (!group.includes(offset)) group.push(offset)
    }
    groups.push(shuffled(group, seed + ':position:' + start))
  }
  for (const voter of voters) {
    const index = ring.findIndex(entry => entry.author === voter)
    if (index >= 0) {
      const questions = groups.map((group, i) => ({ id: `${seed}:q${i}`, choices: group.map(offset => ring[(index + offset) % n].id) }))
      schedule[voter] = shuffled(questions, seed + ':questions:' + voter)
    } else {
      // If someone missed the writing deadline, they can still judge the filed
      // entries. The result uses actual appearances to handle incomplete rounds.
      const size = Math.min(3, n)
      const choices = shuffled(ring, seed + ':observer:' + voter)
      const questions: FavoriteQuestion[] = []
      for (let start = 0; start < choices.length; start += size) {
        const batch = choices.slice(start, start + size)
        for (const entry of choices) {
          if (batch.length === size) break
          if (!batch.includes(entry)) batch.push(entry)
        }
        questions.push({ id: `${seed}:q${questions.length}`, choices: batch.map(entry => entry.id) })
      }
      schedule[voter] = questions
    }
  }
  return schedule
}

export function validPicks(questions: FavoriteQuestion[], picks: FavoritePick[]) {
  const output: FavoritePick[] = []
  for (const pick of picks) {
    const question = questions[output.length]
    if (!question || question.id !== pick.question || !question.choices.includes(pick.choice)) break
    output.push(pick)
  }
  return output
}
export function favoriteResults(entries: Entry[], schedule: Record<string, FavoriteQuestion[]>, picks: Record<string, FavoritePick[]>) {
  const stats = entries.map(entry => ({ ...entry, favorites: 0, appearances: 0, points: 0, winner: false }))
  for (const [voter, questions] of Object.entries(schedule)) {
    for (const pick of validPicks(questions, picks[voter] ?? [])) {
      const question = questions.find(q => q.id === pick.question)!
      for (const id of question.choices) stats.find(entry => entry.id === id)!.appearances++
      stats.find(entry => entry.id === pick.choice)!.favorites++
    }
  }
  // Exact fraction comparison: tied approval rates are co-winners, regardless
  // of original submission order. No phantom impressions from unanswered cards.
  stats.sort((a, b) => b.favorites * (a.appearances || 1) - a.favorites * (b.appearances || 1) || a.id.localeCompare(b.id))
  const best = stats[0]
  for (const entry of stats) {
    entry.winner = entry.appearances > 0 && !!best?.favorites && entry.favorites * best.appearances === best.favorites * entry.appearances
    entry.points = entry.appearances ? Math.round(1000 * entry.favorites / entry.appearances) + (entry.winner ? 250 : 0) : 0
  }
  return stats
}
