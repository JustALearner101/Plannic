import { sveltekit } from '@sveltejs/kit/vite';
import UnoCSS from 'unocss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		UnoCSS(),
		sveltekit()
	],
	server: {
		port: 5173,
		strictPort: true
	}
});
