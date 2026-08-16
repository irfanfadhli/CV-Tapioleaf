<script lang="ts">
	import '../layout.css';
	import logo from '$lib/assets/logo.svg';
	import { Toaster } from 'svelte-sonner';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={logo} /></svelte:head>
<Toaster position="bottom-right" richColors />
<div class="relative h-screen w-screen overflow-hidden flex items-center justify-center p-4 sm:p-6 bg-linear-to-br from-emerald-50/60 via-slate-50 to-emerald-100/40">
	<!-- Background subtle blur elements -->
	<div class="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl"></div>
	<div class="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"></div>

	{@render children()}
</div>
