<script lang="ts">
	import '../layout.css';
	import logo from '$lib/assets/logo.svg';
	import { Toaster } from 'svelte-sonner';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={logo} /></svelte:head>
<Toaster position="bottom-right" richColors />
<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4"
>
	{@render children()}
</div>
