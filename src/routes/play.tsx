import { createFileRoute } from '@tanstack/react-router'
import { GamePortal } from '../components/GamePortal'
import { gameDescription, socialMeta } from '../social-meta'

// Keep previously shared /play links working after the game moves to /.
export const Route = createFileRoute('/play')({
  head: () => ({ meta: socialMeta({ title: 'Hell’s Committee', description: gameDescription, path: '/play/', image: 'og-game.png', imageAlt: 'Hell’s Committee in a cartoon infernal office with four demons.' }) }),
  component: GamePortal,
})
