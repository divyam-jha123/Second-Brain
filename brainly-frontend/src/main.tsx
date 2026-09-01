import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import './index.css'
import App from './App.tsx'
import { CLERK_PUBLISHABLE_KEY } from './config.ts'
import { ThemeProvider } from './theme/ThemeProvider.tsx'
import { warmUpApi } from './lib/warmup.ts'

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing CLERK_PUBLISHABLE_KEY in environment variables')
}

// Wake the sleeping backend before the visitor gets anywhere near the
// dashboard. Fire-and-forget, so it costs the first paint nothing.
warmUpApi()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    </ThemeProvider>
  </StrictMode>,
)
