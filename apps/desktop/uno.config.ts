import { defineConfig, presetIcons, presetTypography, presetUno } from 'unocss';

export default defineConfig({
	presets: [
		presetUno(),
		presetIcons({ scale: 1.2 }),
		presetTypography()
	]
});
