import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import './index.css'
import App from './App.tsx'
import { CLERK_PUBLISHABLE_KEY } from './config.ts'

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing CLERK_PUBLISHABLE_KEY in environment variables')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </StrictMode>,
)
