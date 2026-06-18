<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { ShieldAlert } from '@lucide/svelte';
</script>

<div class="flex min-h-[60vh] items-center justify-center">
	<Card class="w-full max-w-md text-center">
		<CardHeader>
			<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
				<ShieldAlert size={32} class="text-destructive" />
			</div>
			<CardTitle class="text-2xl">Akses Ditolak</CardTitle>
			<CardDescription>
				Anda tidak memiliki akses ke halaman ini.
			</CardDescription>
		</CardHeader>
		<CardContent>
			<p class="text-sm text-muted-foreground">
				Halaman ini memerlukan hak akses yang tidak dimiliki oleh akun Anda. Silakan hubungi Owner jika membutuhkan akses.
			</p>
		</CardContent>
		<CardFooter class="justify-center">
			<a href="/dashboard">
				<Button>Kembali ke Dashboard</Button>
			</a>
		</CardFooter>
	</Card>
</div>
