<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { FileDown } from '@lucide/svelte';
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

<div class="space-y-4">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div>
			<h1 class="text-xl font-bold md:text-2xl">CV TapioLeaf</h1>
			<p class="text-sm text-muted-foreground">Selamat datang, {data.user?.name}!</p>
		</div>
		<div class="flex items-center gap-2">
			<a href={`/api/dashboard/report?period=${currentPeriod}`} target="_blank"><Button variant="outline" size="sm"><FileDown size={14} class="mr-1" /> PDF</Button></a>
			<PeriodFilter active={currentPeriod} onChange={changePeriod} />
		</div>
	</div>

	<StockAlertBanner products={dashboardData.stockAlerts} />

	<!-- KPI Cards -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
		<KPICard
			title="Total User"
			value={dashboardData.totalUsers.toString()}
			subtitle="Pengguna terdaftar"
			icon="👤"
			loading={false}
		/>
		<KPICard
			title="Penjualan"
			value={'Rp ' + dashboardData.sales.total.toLocaleString('id-ID')}
			subtitle={dashboardData.sales.count + ' transaksi'}
			change={dashboardData.sales.change}
			icon="💰"
			loading={false}
			{compareLabel}
		/>
		<KPICard
			title="Produksi"
			value={formatKg(dashboardData.production.totalKg)}
			subtitle={`${dashboardData.production.count} batch`}
			icon="🏭"
			loading={false}
			{compareLabel}
		/>
		<KPICard
			title="Stok"
			value={dashboardData.stock.totalSKU + ' SKU'}
			subtitle={dashboardData.stock.criticalCount > 0
				? dashboardData.stock.criticalCount + ' kritis'
				: 'Semua normal'}
			alert={dashboardData.stock.criticalCount > 0}
			icon="📦"
			loading={false}
			{compareLabel}
		/>
		<KPICard
			title="Laba"
			value={'Rp ' + dashboardData.revenue.total.toLocaleString('id-ID')}
			subtitle={dashboardData.revenue.margin !== null
				? `Margin ${dashboardData.revenue.margin}%`
				: 'Isi harga modal'}
			change={dashboardData.revenue.change}
			icon="📈"
			loading={false}
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
			<ProductionAreaChart data={dashboardData.productionTrend} targetKg={dashboardData.production.targetKg} />
		{/if}
	</div>


	<!-- Bottom Row -->
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
