<script lang="ts">
    import { page } from '$app/state';
    import ContentPage from '../../../../../features/courses/pages/ContentPage.svelte';

    const courseId = $derived(Number(page.params.courseId));
    const contentId = $derived(Number(page.params.contentId));
    const valid = $derived(
        Number.isInteger(courseId) && courseId > 0 && Number.isInteger(contentId) && contentId > 0
    );
</script>

{#if valid}
    <ContentPage {courseId} {contentId} />
{:else}
    <p class="text-slate-500">Konten tidak valid.</p>
{/if}