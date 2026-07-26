import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Safe Journal - Private Mindful Sanctuary',
    short_name: 'Safe Journal',
    description: 'Encrypted private journal, mood tracker, 3D manifestation vision flask, and everyday gratitude sanctuary.',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#090d16',
    theme_color: '#0d9488',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'New Journal Entry 📝',
        short_name: 'New Entry',
        description: 'Write a new mindful journal entry',
        url: '/journal/new',
        icons: [{ src: '/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Gratitude Sanctuary 🌺',
        short_name: 'Gratitude',
        description: 'Open 3D Cork Memory Jar',
        url: '/gratitude',
        icons: [{ src: '/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Manifestation Flask 🔮',
        short_name: 'Manifest',
        description: '3D Crystal Vision Flask',
        url: '/manifestation',
        icons: [{ src: '/icon-192x192.png', sizes: '192x192' }],
      },
    ],
  };
}
