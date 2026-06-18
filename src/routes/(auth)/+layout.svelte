<script lang="ts">
	import '../layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from 'svelte-sonner';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Toaster position="bottom-right" richColors />
<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4"
>
	{@render children()}
</div>
