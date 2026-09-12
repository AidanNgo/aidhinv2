/* GitHub Pages serves static files only: a request for /about looks for a
   file at that path, finds none, and 404s - even though BrowserRouter would
   handle the route client-side. Pages serves 404.html for any unmatched
   path, so shipping a copy of index.html under that name hands control back
   to the router and deep links resolve normally. */
import { copyFileSync } from 'node:fs'

copyFileSync('dist/index.html', 'dist/404.html')
console.log('spa-fallback: wrote dist/404.html')
