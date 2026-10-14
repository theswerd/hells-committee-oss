import test from 'node:test'
import assert from 'node:assert/strict'
import { favoriteSchedule, favoriteResults, validPicks } from '../src/favorites.ts'

const entries = count => Array.from({ length: count }, (_, i) => ({ id: `answer-${i}`, author: `player-${i}`, text: `Punishment ${i}` }))

test('randomized subgroups give every entry equal exposure in every position for 3–8 players', () => {
  for (let count = 3; count <= 8; count++) for (let seed = 0; seed < 500; seed++) {
    const answers = entries(count), schedule = favoriteSchedule(answers, 'round-' + seed)
    const size = Math.min(3, count - 1), rounds = Math.ceil((count - 1) / size)
    const seen = Object.fromEntries(answers.map(answer => [answer.id, Array(size).fill(0)]))
    for (const answer of answers) {
      const questions = schedule[answer.author]
      assert.equal(questions.length, rounds)
      const covered = new Set()
      for (const question of questions) {
        assert.equal(question.choices.length, size)
        assert.equal(new Set(question.choices).size, size)
        assert.ok(!question.choices.includes(answer.id), 'No self-votes')
        question.choices.forEach((id, index) => { seen[id][index]++; covered.add(id) })
      }
      assert.equal(covered.size, count - 1, 'Every rival is seen by every voter')
    }
    for (const positions of Object.values(seen)) assert.deepEqual(positions, Array(size).fill(rounds))
  }
})
test('a round is stable on reload and changes between rounds', () => {
  const answers = entries(8)
  assert.deepEqual(favoriteSchedule(answers, 'room-1'), favoriteSchedule(answers, 'room-1'))
  assert.notDeepEqual(favoriteSchedule(answers, 'room-1'), favoriteSchedule(answers, 'room-2'))
})
test('ties remain ties; only confirmed groups contribute appearances or score', () => {
  const answers = entries(3), schedule = favoriteSchedule(answers, 'tie')
  const picks = Object.fromEntries(answers.map((answer, i) => {
    const question = schedule[answer.author][0]
    return [answer.author, [{ question: question.id, choice: answers[(i + 1) % 3].id }]]
  }))
  const results = favoriteResults(answers, schedule, picks)
  assert.ok(results.every(result => result.winner && result.favorites === 1 && result.appearances === 2 && result.points === 750))
  const partial = favoriteResults(answers, schedule, { 'player-0': picks['player-0'] })
  assert.equal(partial.reduce((n, result) => n + result.appearances, 0), 2)
  assert.equal(partial.reduce((n, result) => n + result.favorites, 0), 1)
  assert.equal(partial.find(result => result.author === 'player-0').points, 0)
  assert.equal(partial.find(result => result.author === 'player-0').winner, false, 'An unjudged entry cannot tie a judged favorite at zero divided by zero')
})
test('forged, repeated, skipped and out-of-order picks cannot add votes', () => {
  const schedule = favoriteSchedule(entries(8), 'secure')['player-0']
  const first = { question: schedule[0].id, choice: schedule[0].choices[0] }
  assert.deepEqual(validPicks(schedule, [first, first]), [first])
  assert.deepEqual(validPicks(schedule, [{ question: schedule[1].id, choice: schedule[1].choices[0] }]), [])
  assert.deepEqual(validPicks(schedule, [{ question: schedule[0].id, choice: 'answer-0' }]), [])
})
test('missed submissions still get judge questions; zero or one entry does not deadlock', () => {
  for (const count of [0, 1, 2, 5]) {
    const answers = entries(count), schedule = favoriteSchedule(answers, 'late', [...answers.map(e => e.author), 'late-player'])
    assert.ok(schedule['late-player'])
    const covered = new Set(schedule['late-player'].flatMap(q => q.choices))
    assert.equal(covered.size, count)
    for (const question of schedule['late-player']) assert.equal(question.choices.length, new Set(question.choices).size)
  }
})
