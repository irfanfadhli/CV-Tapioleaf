<script lang="ts">
	let { height = 'h-48' }: { height?: string } = $props();
</script>

<div class="animate-pulse rounded-xl border bg-white p-5 shadow-sm {height}">
	<div class="space-y-3">
		<div class="h-4 w-24 rounded bg-gray-200"></div>
		<div class="h-6 w-full rounded bg-gray-200"></div>
		<div class="h-6 w-3/4 rounded bg-gray-200"></div>
		<div class="h-6 w-1/2 rounded bg-gray-200"></div>
	</div>
</div>
