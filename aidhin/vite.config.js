import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import photoManifest from './scripts/vite-photo-manifest.mjs'

// https://vite.dev/config/
export default defineConfig({
  /* photoManifest keeps src/photos/manifest.json in step with the photo
     folders, at server start and whenever a photo is added or removed -
     so new photos appear without restarting the dev server. */
  plugins: [react(), photoManifest()],
})
