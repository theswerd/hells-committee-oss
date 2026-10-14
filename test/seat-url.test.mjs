import test from 'node:test'
import assert from 'node:assert/strict'
import { seatFromUrl, seatHash } from '../src/seat-url.ts'

const token = 'a'.repeat(64)

test('only a room and a valid URL ticket reopen a seat', () => {
  assert.deepEqual(seatFromUrl('host', 'HELL', seatHash(token)), { code: 'HELL', token, role: 'host' })
  assert.deepEqual(seatFromUrl('player', 'HELL', `#${seatHash(token)}`), { code: 'HELL', token, role: 'player' })
  assert.equal(seatFromUrl('host', undefined, seatHash(token)), null)
  assert.equal(seatFromUrl('host', 'HELL', ''), null)
  assert.equal(seatFromUrl('host', 'HELL', 'ticket=short'), null)
  assert.equal(seatFromUrl('host', 'HELL', `ticket=${token.slice(1)}Z`), null)
  assert.equal(seatFromUrl('host', 'hell', seatHash(token)), null)
})
