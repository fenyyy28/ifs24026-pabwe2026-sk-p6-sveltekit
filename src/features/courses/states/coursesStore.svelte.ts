import type { ApiResponse } from '../../../lib/helpers/apiHelper';
import { flattenErrors } from '../../../lib/helpers/toolsHelper';
import { courseApi } from '../api/courseApi';
import type {
    ContentPayload,
    Course,
    CourseContent,
    CourseDetail,
    CoursePayload,
    MutationKey,
    MutationResult,
    RatingPayload,
    Toast
} from '../types';

interface MutateOptions {
    after: () => Promise<unknown>;
    /** Tampilkan toast saat gagal (untuk aksi tanpa modal). */
    toastError?: boolean;
}

class CoursesStore {
    /* ---- Data ---- */
    courses = $state<Course[]>([]);
    course = $state<CourseDetail | null>(null);
    content = $state<CourseContent | null>(null);

    /* ---- Status muat ---- */
    loading = $state(false);
    detailLoading = $state(false);
    contentLoading = $state(false);
    error = $state<string | null>(null);
    detailError = $state<string | null>(null);
    contentError = $state<string | null>(null);

    /* ---- Bendera mutasi ---- */
    busy = $state<Partial<Record<MutationKey, boolean>>>({});

    toast = $state<Toast | null>(null);
    #toastTimer: ReturnType<typeof setTimeout> | undefined;

    /* ================= Muat data ================= */

    async loadCourses(): Promise<void> {
        this.loading = true;
        this.error = null;

        const res = await courseApi.list();
        if (res.status === 'success') this.courses = res.data?.courses ?? [];
        else this.error = res.message;

        this.loading = false;
    }

    async loadDetail(id: number, silent = false): Promise<void> {
        if (this.course?.id !== id) this.course = null;
        if (!silent) this.detailLoading = true;
        this.detailError = null;

        const res = await courseApi.detail(id);
        if (res.status === 'success' && res.data?.course) this.course = res.data.course;
        else this.detailError = res.message;

        this.detailLoading = false;
    }

    async loadContent(id: number, silent = false): Promise<void> {
        if (this.content?.id !== id) this.content = null;
        if (!silent) this.contentLoading = true;
        this.contentError = null;

        const res = await courseApi.contentDetail(id);
        if (res.status === 'success' && res.data?.course_content) {
            this.content = res.data.course_content;
        } else {
            this.contentError = res.message;
        }

        this.contentLoading = false;
    }

    /* ================= Mutasi kursus ================= */

    addCourse(payload: CoursePayload): Promise<MutationResult> {
        return this.#mutate('add', () => courseApi.create(payload), {
            after: () => this.loadCourses()
        });
    }

    updateCourse(id: number, payload: CoursePayload): Promise<MutationResult> {
        return this.#mutate('change', () => courseApi.update(id, payload), {
            after: () => this.loadDetail(id, true)
        });
    }

    changeCover(id: number, file: File): Promise<MutationResult> {
        return this.#mutate('cover', () => courseApi.changeCover(id, file), {
            after: () => this.loadDetail(id, true)
        });
    }

    deleteCourse(id: number): Promise<MutationResult> {
        return this.#mutate('remove', () => courseApi.remove(id), {
            toastError: true,
            after: async () => {
                this.courses = this.courses.filter((c) => c.id !== id);
                if (this.course?.id === id) this.course = null;
            }
        });
    }

    deleteAllCourses(): Promise<MutationResult> {
        return this.#mutate('removeAll', () => courseApi.removeAll(), {
            toastError: true,
            after: () => this.loadCourses()
        });
    }

    /* ================= Peserta & rating ================= */

    joinCourse(id: number): Promise<MutationResult> {
        return this.#mutate('student', () => courseApi.join(id), {
            toastError: true,
            after: () => this.loadDetail(id, true)
        });
    }

    leaveCourse(id: number): Promise<MutationResult> {
        return this.#mutate('student', () => courseApi.leave(id), {
            toastError: true,
            after: () => this.loadDetail(id, true)
        });
    }

    rateCourse(id: number, payload: RatingPayload): Promise<MutationResult> {
        return this.#mutate('rating', () => courseApi.rate(id, payload), {
            after: () => this.loadDetail(id, true)
        });
    }

    /* ================= Konten ================= */

    addContent(courseId: number, payload: ContentPayload): Promise<MutationResult> {
        return this.#mutate('content', () => courseApi.addContent(courseId, payload), {
            after: () => this.loadDetail(courseId, true)
        });
    }

    updateContent(
        courseId: number,
        contentId: number,
        payload: ContentPayload
    ): Promise<MutationResult> {
        return this.#mutate('content', () => courseApi.updateContent(contentId, payload), {
            after: () =>
                Promise.all([
                    this.loadDetail(courseId, true),
                    this.content?.id === contentId ? this.loadContent(contentId, true) : undefined
                ])
        });
    }

    deleteContent(courseId: number, contentId: number): Promise<MutationResult> {
        return this.#mutate('content', () => courseApi.removeContent(contentId), {
            toastError: true,
            after: () => this.loadDetail(courseId, true)
        });
    }

    setContentStatus(courseId: number, contentId: number, status: 0 | 1): Promise<MutationResult> {
        return this.#mutate('content', () => courseApi.setContentStatus(contentId, status), {
            toastError: true,
            after: () =>
                Promise.all([this.loadContent(contentId, true), this.loadDetail(courseId, true)])
        });
    }

    /* ================= Toast ================= */

    notify(type: Toast['type'], text: string): void {
        this.toast = { type, text };
        clearTimeout(this.#toastTimer);
        this.#toastTimer = setTimeout(() => (this.toast = null), 3500);
    }

    /* ================= Internal ================= */

    async #mutate(
        key: MutationKey,
        request: () => Promise<ApiResponse>,
        options: MutateOptions
    ): Promise<MutationResult> {
        this.busy[key] = true;

        const res = await request();
        const ok = res.status === 'success';
        if (ok) await options.after();

        this.busy[key] = false;

        if (ok) this.notify('success', res.message);
        else if (options.toastError) this.notify('error', res.message);

        return { ok, message: res.message, fields: ok ? [] : flattenErrors(res.data) };
    }
}

export const coursesStore = new CoursesStore();