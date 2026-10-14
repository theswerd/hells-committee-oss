import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { VoiceProvider } from '../components/Voice'
import { clearLegacyGameStorage } from '../seat-url'
import { gameDescription } from '../social-meta'
import styles from '../styles.css?url'
import gameplay from '../gameplay.css?url'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }, { title: 'Hell’s Committee' }, { name: 'description', content: gameDescription }, { name: 'theme-color', content: '#28152f' }],
    links: [{ rel: 'stylesheet', href: styles }, { rel: 'stylesheet', href: gameplay }, { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
  }),
  component: Root,
  notFoundComponent: () => <main className="missing-file"><h1>File not found.</h1><p>The intern has been reassigned.</p><a href="/">Return to the committee</a></main>,
})
function Root() {
  const { queryClient } = Route.useRouteContext()
  useEffect(clearLegacyGameStorage, [])
  return <html lang="en"><head><HeadContent /></head><body><QueryClientProvider client={queryClient}><VoiceProvider><Outlet /></VoiceProvider></QueryClientProvider><Scripts /></body></html>
}
