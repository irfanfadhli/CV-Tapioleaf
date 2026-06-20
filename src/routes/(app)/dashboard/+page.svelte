<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import KPICard from '$lib/components/dashboard/KPICard.svelte';
	import MarginChart from '$lib/components/dashboard/MarginChart.svelte';
	import CategoryChart from '$lib/components/dashboard/CategoryChart.svelte';
	import RecentTransactions from '$lib/components/dashboard/RecentTransactions.svelte';
	import StockAlertBanner from '$lib/components/dashboard/StockAlertBanner.svelte';
	import PeriodFilter from '$lib/components/dashboard/PeriodFilter.svelte';
	import SkeletonWidget from '$lib/components/dashboard/SkeletonWidget.svelte';

	let { data } = $props();

	let dashboardData = $state(data.data);
	let currentPeriod = $state(data.period);
	let loading = $state(false);

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

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Dashboard</h1>
			<p class="text-sm text-muted-foreground">Selamat datang, {data.user?.name}!</p>
		</div>
		<div class="flex items-center gap-2">
			<PeriodFilter active={currentPeriod} onChange={changePeriod} />
		</div>
	</div>

	<StockAlertBanner products={dashboardData.stockAlerts} />

	<!-- KPI Cards -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<KPICard
			title="Penjualan"
			value={'Rp ' + dashboardData.sales.total.toLocaleString('id-ID')}
			subtitle={dashboardData.sales.count + ' transaksi'}
			change={dashboardData.sales.change}
			icon="💰"
			loading={false}
		/>
		<KPICard
			title="Produksi"
			value={formatKg(dashboardData.production.totalKg)}
			subtitle={`${dashboardData.production.percentage}% dari ${formatKg(dashboardData.production.targetKg)}`}
			alert={dashboardData.production.percentage < 80}
			icon="📦"
			loading={false}
		/>
		<KPICard
			title="Stok"
			value={dashboardData.stock.totalSKU + ' SKU'}
			subtitle={dashboardData.stock.criticalCount > 0
				? dashboardData.stock.criticalCount + ' kritis'
				: 'Semua normal'}
			alert={dashboardData.stock.criticalCount > 0}
			icon="🏭"
			loading={false}
		/>
		<KPICard
			title="Pendapatan"
			value={'Rp ' + dashboardData.revenue.total.toLocaleString('id-ID')}
			subtitle={dashboardData.revenue.margin !== null
				? `Margin: ${dashboardData.revenue.margin}%`
				: ''}
			change={dashboardData.revenue.change}
			icon="📈"
			loading={false}
		/>
	</div>

	<!-- Margin Chart -->
	{#if loading}
		<SkeletonWidget height="h-64" />
	{:else}
		<MarginChart data={dashboardData.marginPerProduct} />
	{/if}

	<!-- Bottom Row -->
	<div class="grid gap-4 lg:grid-cols-2">
		{#if loading}
			<SkeletonWidget height="h-64" />
			<SkeletonWidget height="h-64" />
		{:else}
			<RecentTransactions transactions={dashboardData.recentTransactions} />
			<CategoryChart data={dashboardData.categoryDistribution} />
		{/if}
	</div>
</div>
