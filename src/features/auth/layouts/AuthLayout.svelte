<script lang="ts">
	import type { Snippet } from 'svelte';
	import { BookOpen, Star, Video } from 'lucide-svelte';
	import Logo from '../../../lib/components/Logo.svelte';

	let {
		title,
		subtitle,
		children
	}: { title: string; subtitle: string; children: Snippet } = $props();
</script>

<div class="grid min-h-screen lg:grid-cols-2">
	<aside class="hidden flex-col justify-between bg-indigo-50 p-12 text-slate-700 lg:flex">
		<Logo size={32} />

		<div class="space-y-6">
			<h2 class="text-3xl font-bold text-slate-900">Belajar lewat kursus, kapan saja.</h2>
			<p class="text-slate-600">
				Delcom Courses adalah platform kursus daring. Ikuti kursus yang dibuat pengajar, atau
				buat kursus Anda sendiri dan bagikan ilmunya.
			</p>

			<ul class="space-y-3">
				<li class="flex items-center gap-3">
					<Video size={20} class="text-indigo-600" />
					<span>Materi berupa video yang tersusun per topik</span>
				</li>
				<li class="flex items-center gap-3">
					<BookOpen size={20} class="text-indigo-600" />
					<span>Pantau progres belajar di setiap kursus</span>
				</li>
				<li class="flex items-center gap-3">
					<Star size={20} class="text-indigo-600" />
					<span>Beri rating dan ulasan setelah belajar</span>
				</li>
			</ul>
		</div>

		<p class="text-sm text-slate-500">&copy; Delcom Courses</p>
	</aside>

	<main class="flex items-center justify-center p-6">
		<div class="w-full max-w-sm">
			<div class="mb-8 lg:hidden"><Logo /></div>
			<h1 class="text-2xl font-bold text-slate-900">{title}</h1>
			<p class="mt-1 mb-6 text-sm text-slate-500">{subtitle}</p>
			{@render children()}
		</div>
	</main>
</div>