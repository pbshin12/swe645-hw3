// Peter Shin (pshin2, G01073633)
// Vite build configuration: enables the React plugin for JSX compilation and dev server.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
