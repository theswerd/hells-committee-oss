import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const committeeRooms = sqliteTable('committee_rooms', {
  code: text('code').primaryKey(),
  hostKey: text('host_key').notNull().unique(),
  version: integer('version').notNull().default(0),
  expiresAt: integer('expires_at').notNull(),
  payload: text('payload').notNull(),
})
