<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let {
		fallbackHref = '/',
		label = 'Kembali',
		variant = 'ghost' as 'ghost' | 'outline',
		size = 'sm' as 'sm' | 'default',
	} = $props();

	let referrerOrigin: string | null = $state(null);

	if (typeof document !== 'undefined') {
		try { referrerOrigin = new URL(document.referrer).origin; } catch {}
	}

	function goBack() {
		const isInternal = referrerOrigin && referrerOrigin === $page.url.origin;
		if (isInternal && window.history.length > 1) {
			history.back();
		} else {
			goto(fallbackHref);
		}
	}
</script>

<Button {variant} {size} onclick={goBack}>
	<ArrowLeft size={14} class="mr-1" /> {label}
</Button>