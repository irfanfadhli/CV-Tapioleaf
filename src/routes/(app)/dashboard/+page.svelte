<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { FileDown, Users, ShoppingCart, Factory, Package, TrendingUp } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import KPICard from '$lib/components/dashboard/KPICard.svelte';
	import SalesAreaChart from '$lib/components/dashboard/SalesAreaChart.svelte';
	import ProductionAreaChart from '$lib/components/dashboard/ProductionAreaChart.svelte';
	import MarginPieChart from '$lib/components/dashboard/MarginPieChart.svelte';
	import RecentTransactions from '$lib/components/dashboard/RecentTransactions.svelte';
	import StockAlertBanner from '$lib/components/dashboard/StockAlertBanner.svelte';
	import PeriodFilter from '$lib/components/dashboard/PeriodFilter.svelte';
	import SkeletonWidget from '$lib/components/dashboard/SkeletonWidget.svelte';

	let { data } = $props();

	let dashboardData = $state(data.data);
	let currentPeriod = $state(data.period);

	$effect(() => {
		dashboardData = data.data;
		currentPeriod = data.period;
	});
	let loading = $state(false);

	const compareLabels: Record<string, string> = { today: 'vs kemarin', week: 'vs pekan lalu', month: 'vs bulan lalu' };
	let compareLabel = $derived(compareLabels[currentPeriod] || '');

	function formatKg(kg: number): string {
		if (kg >= 1000) return `${(kg / 1000).toFixed(1)} ton`;
		return `${kg.toLocaleString('id-ID')} kg`;
	}

	async function changePeriod(period: string) {
		if (period === currentPeriod) return;
		loading = true;
		try {
			const url = new URL($page.url);
			url.searchParams.set('period', period);
			goto(url.toString(), { replaceState: true });
			const res = await fetch(`/api/dashboard?period=${period}`);
			if (res.ok) {
				dashboardData = await res.json();
				currentPeriod = period;
			}
		} catch {
			// keep existing data
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Dashboard — CV TapioLeaf</title>
</svelte:head>

<div class="space-y-6">
	<!-- Hero Welcome Header with Glass Accent -->
	<div class="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 shadow-xs">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="space-y-1">
				<div class="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
					<span>✨ Ringkasan Operasional & Bisnis</span>
				</div>
				<h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">CV TapioLeaf</h1>
				<p class="text-xs text-muted-foreground sm:text-sm">
					Selamat datang kembali, <strong class="text-foreground">{data.user?.name}</strong>. Pantau metrik usaha Anda secara real-time.
				</p>
			</div>
			<div class="flex items-center gap-2.5 flex-wrap">
				<a href={`/api/dashboard/report?period=${currentPeriod}`} target="_blank">
					<Button variant="outline" size="sm" class="gap-1.5 rounded-xl border-border/80 bg-background/80 shadow-2xs hover:bg-background">
						<FileDown size={14} /> Unduh PDF
					</Button>
				</a>
				<PeriodFilter active={currentPeriod} onChange={changePeriod} />
			</div>
		</div>
	</div>

	<StockAlertBanner products={dashboardData.stockAlerts} />

	<!-- KPI Cards Grid -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
		<KPICard
			title="Total User"
			value={dashboardData.totalUsers.toString()}
			subtitle="Pengguna terdaftar"
			icon={Users}
			accentColor="purple"
			loading={loading}
		/>
		<KPICard
			title="Penjualan"
			value={'Rp ' + dashboardData.sales.total.toLocaleString('id-ID')}
			subtitle={`${dashboardData.sales.count} transaksi berhasil`}
			change={dashboardData.sales.change}
			icon={ShoppingCart}
			accentColor="emerald"
			loading={loading}
			{compareLabel}
		/>
		<KPICard
			title="Produksi"
			value={formatKg(dashboardData.production.totalKg)}
			subtitle={`${dashboardData.production.count} batch selesai`}
			icon={Factory}
			accentColor="amber"
			loading={loading}
			{compareLabel}
		/>
		<KPICard
			title="Sisa Stok"
			value={dashboardData.stock.totalSKU + ' SKU'}
			subtitle={dashboardData.stock.criticalCount > 0
				? `${dashboardData.stock.criticalCount} produk kritis`
				: 'Semua stok normal'}
			alert={dashboardData.stock.criticalCount > 0}
			icon={Package}
			accentColor="blue"
			loading={loading}
			{compareLabel}
		/>
		<KPICard
			title="Laba Bersih"
			value={'Rp ' + dashboardData.revenue.total.toLocaleString('id-ID')}
			subtitle={dashboardData.revenue.margin !== null
				? `Margin laba ${dashboardData.revenue.margin}%`
				: 'Rincian laba & HPP'}
			change={dashboardData.revenue.change}
			icon={TrendingUp}
			accentColor="primary"
			loading={loading}
			{compareLabel}
		/>
	</div>

	<!-- Charts Row 1: Area Charts -->
	<div class="grid gap-4 md:grid-cols-2">
		{#if loading}
			<SkeletonWidget height="h-64" />
			<SkeletonWidget height="h-64" />
		{:else}
			<SalesAreaChart data={dashboardData.salesTrend} />
			<ProductionAreaChart data={dashboardData.productionTrend} />
		{/if}
	</div>

	<!-- Bottom Row: Recent Transactions & Margin Pie Chart -->
	<div class="grid gap-4 lg:grid-cols-2">
		{#if loading}
			<SkeletonWidget height="h-64" />
			<SkeletonWidget height="h-64" />
		{:else}
			<RecentTransactions transactions={dashboardData.recentTransactions} />
			<MarginPieChart data={dashboardData.marginPerProduct} />
		{/if}
	</div>
</div>
