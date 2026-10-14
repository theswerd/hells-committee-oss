// The same Worker handler with a persistent SQLite adapter for local development.
import { createServer } from 'node:http'
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { handleApi } from '../worker/index.ts'

mkdirSync('.local', { recursive: true })
const sqlite = new DatabaseSync('.local/committee.sqlite')
sqlite.exec('CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)')
for (const name of readdirSync('drizzle').filter(name => name.endsWith('.sql')).sort()) {
  if (sqlite.prepare('SELECT name FROM local_migrations WHERE name = ?').get(name)) continue
  sqlite.exec('BEGIN')
  try { sqlite.exec(readFileSync('drizzle/' + name, 'utf8')); sqlite.prepare('INSERT INTO local_migrations VALUES (?)').run(name); sqlite.exec('COMMIT') }
  catch (error) { sqlite.exec('ROLLBACK'); throw error }
}
const database = { prepare(sql) { return {
  values: [], bind(...values) { this.values = values; return this },
  async first() { return sqlite.prepare(sql).get(...this.values) ?? null },
  async run() { return { meta: { changes: sqlite.prepare(sql).run(...this.values).changes } } },
} } }
const server = createServer(async (incoming, outgoing) => {
  const chunks = []
  for await (const chunk of incoming) chunks.push(chunk)
  const forwarded = incoming.headers['x-forwarded-host']
  const publicHost = ['127.0.0.1:4173', 'localhost:4173'].includes(forwarded) ? forwarded : incoming.headers.host
  const origin = 'http://' + publicHost
  const request = new Request(origin + incoming.url, { method: incoming.method, headers: incoming.headers, ...(chunks.length ? { body: Buffer.concat(chunks) } : {}) })
  const response = await handleApi(request, { DB: database })
  outgoing.writeHead(response.status, Object.fromEntries(response.headers))
  outgoing.end(Buffer.from(await response.arrayBuffer()))
})
server.listen(4175, '127.0.0.1', () => console.log('Committee room API: http://127.0.0.1:4175'))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => { sqlite.close(); process.exit(0) }))
