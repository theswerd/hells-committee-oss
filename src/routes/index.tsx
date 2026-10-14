import { createFileRoute } from '@tanstack/react-router'
import { GamePortal } from '../components/GamePortal'
import { gameDescription, socialMeta } from '../social-meta'

export const Route = createFileRoute('/')({
  head: () => ({ meta: socialMeta({ title: 'Hell’s Committee', description: gameDescription, path: '/', image: 'og-game.png', imageAlt: 'Hell’s Committee in a cartoon infernal office with four demons.' }) }),
  component: GamePortal,
})
