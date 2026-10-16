<script lang="ts">
    import { page } from '$app/state';
    import DetailPage from '../../../features/courses/pages/DetailPage.svelte';

    const courseId = $derived(Number(page.params.courseId));
</script>

{#if Number.isInteger(courseId) && courseId > 0}
    <DetailPage {courseId} />
{:else}
    <p class="text-slate-500">Kursus tidak valid.</p>
{/if}