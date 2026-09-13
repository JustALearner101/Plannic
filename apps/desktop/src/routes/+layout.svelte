<script lang="ts">
	import 'virtual:uno.css';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Plannic</title>
</svelte:head>

<div class="h-screen w-screen overflow-hidden flex flex-col">
	{@render children()}
</div>
