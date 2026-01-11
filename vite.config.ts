import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { jsonSavePlugin } from './vite-plugin-json-save';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), jsonSavePlugin()],
})
