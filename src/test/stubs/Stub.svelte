<script lang="ts">
	let { courseId, contentId }: { courseId?: number; contentId?: number } = $props();
</script>

<p data-testid="stub">halaman:{courseId ?? '-'}:{contentId ?? '-'}</p>
