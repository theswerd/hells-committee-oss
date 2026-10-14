const site = 'https://hell.swerdlow.dev'

export const gameDescription = 'Great minds. Terrible judgment. A party game about demons inventing absurd punishments.'

export function socialMeta({ title, description, path, image, imageAlt }: {
  title: string
  description: string
  path?: string
  image: 'og-game.png' | 'og-join.png'
  imageAlt: string
}) {
  const imageUrl = `${site}/social/${image}`
  return [
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Hell’s Committee' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    ...(path ? [{ property: 'og:url', content: `${site}${path}` }] : []),
    { property: 'og:image', content: imageUrl },
    { property: 'og:image:secure_url', content: imageUrl },
    { property: 'og:image:type', content: 'image/png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: imageAlt },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: imageUrl },
    { name: 'twitter:image:alt', content: imageAlt },
  ]
}
