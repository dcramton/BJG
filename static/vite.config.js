import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        rollupOptions: {
            input: './static/admin.js',
            output: {
                entryFileNames: 'bundle.js',
                dir: 'dist',
            },
        },
    },
});