<script lang="ts">
	let { data } = $props();
</script>

<h1 class="mb-2 text-2xl font-bold">Dashboard</h1>
<p class="text-muted-foreground">Selamat datang, {data.user?.name}!</p>
