import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiResponse } from '../../../lib/helpers/apiHelper';
import { courseApi } from '../api/courseApi';
import type { CourseContent, CourseDetail } from '../types';
import { coursesStore } from './coursesStore.svelte';

vi.mock('../api/courseApi', () => ({
    courseApi: {
        create: vi.fn(),
        changeCover: vi.fn(),
        update: vi.fn(),
        list: vi.fn(),
        detail: vi.fn(),
        remove: vi.fn(),
        removeAll: vi.fn(),
        join: vi.fn(),
        leave: vi.fn(),
        rate: vi.fn(),
        addContent: vi.fn(),
        updateContent: vi.fn(),
        contentDetail: vi.fn(),
        removeContent: vi.fn(),
        setContentStatus: vi.fn()
    }
}));

const api = vi.mocked(courseApi);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ok = (data?: unknown): ApiResponse<any> => ({ status: 'success', message: 'OK', data });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fail = (data?: unknown): ApiResponse<any> => ({ status: 'fail', message: 'Gagal', data });

const course = { id: 1, user_id: 1, title: 'A', students: [], contents: [] } as unknown as CourseDetail;
const content = { id: 5, course_id: 1, title: 'V' } as unknown as CourseContent;
const file = new File(['x'], 'c.png', { type: 'image/png' });
const payload = { title: 'A', description: 'B' };
const contentPayload = { title: 'V', youtube: 'https://youtu.be/x' };

beforeEach(() => {
    vi.resetAllMocks();
    for (const fn of Object.values(api)) fn.mockResolvedValue(ok());
    api.list.mockResolvedValue(ok({ courses: [] }));
    api.detail.mockResolvedValue(ok({ course }));
    api.contentDetail.mockResolvedValue(ok({ course_content: content }));

    coursesStore.courses = [];
    coursesStore.course = null;
    coursesStore.content = null;
    coursesStore.loading = false;
    coursesStore.detailLoading = false;
    coursesStore.contentLoading = false;
    coursesStore.error = null;
    coursesStore.detailError = null;
    coursesStore.contentError = null;
    coursesStore.busy = {};
    coursesStore.toast = null;
});

describe('loadCourses', () => {
    it('mengisi daftar kursus', async () => {
        api.list.mockResolvedValue(ok({ courses: [course] }));

        await coursesStore.loadCourses();

        expect(coursesStore.courses).toEqual([course]);
        expect(coursesStore.loading).toBe(false);
    });

    it('daftar kosong jika data tidak ada', async () => {
        api.list.mockResolvedValue(ok());

        await coursesStore.loadCourses();

        expect(coursesStore.courses).toEqual([]);
    });

    it('menyimpan error saat gagal', async () => {
        api.list.mockResolvedValue(fail());

        await coursesStore.loadCourses();

        expect(coursesStore.error).toBe('Gagal');
    });

    it('loading true selama permintaan', async () => {
        let seen = false;
        api.list.mockImplementation(async () => {
            seen = coursesStore.loading;
            return ok({ courses: [] });
        });

        await coursesStore.loadCourses();

        expect(seen).toBe(true);
    });
});

describe('loadDetail', () => {
    it('mengisi detail kursus', async () => {
        await coursesStore.loadDetail(1);

        expect(coursesStore.course).toEqual(course);
        expect(coursesStore.detailLoading).toBe(false);
    });

    it('mengosongkan detail lama jika id berbeda', async () => {
        coursesStore.course = { ...course, id: 99 };
        api.detail.mockResolvedValue(fail());

        await coursesStore.loadDetail(1);

        expect(coursesStore.course).toBeNull();
        expect(coursesStore.detailError).toBe('Gagal');
    });

    it('mempertahankan detail jika id sama', async () => {
        coursesStore.course = course;
        api.detail.mockResolvedValue(fail());

        await coursesStore.loadDetail(1, true);

        expect(coursesStore.course).toEqual(course);
    });

    it('mode silent tidak menyalakan detailLoading', async () => {
        let seen = true;
        api.detail.mockImplementation(async () => {
            seen = coursesStore.detailLoading;
            return ok({ course });
        });

        await coursesStore.loadDetail(1, true);

        expect(seen).toBe(false);
    });

    it('mode biasa menyalakan detailLoading', async () => {
        let seen = false;
        api.detail.mockImplementation(async () => {
            seen = coursesStore.detailLoading;
            return ok({ course });
        });

        await coursesStore.loadDetail(1);

        expect(seen).toBe(true);
    });

    it('respons sukses tanpa data dianggap error', async () => {
        api.detail.mockResolvedValue(ok());

        await coursesStore.loadDetail(1);

        expect(coursesStore.detailError).toBe('OK');
    });
});

describe('loadContent', () => {
    it('mengisi konten', async () => {
        await coursesStore.loadContent(5);

        expect(coursesStore.content).toEqual(content);
        expect(coursesStore.contentLoading).toBe(false);
    });

    it('mengosongkan konten lama jika id berbeda dan menyimpan error', async () => {
        coursesStore.content = { ...content, id: 99 };
        api.contentDetail.mockResolvedValue(fail());

        await coursesStore.loadContent(5);

        expect(coursesStore.content).toBeNull();
        expect(coursesStore.contentError).toBe('Gagal');
    });

    it('mempertahankan konten jika id sama', async () => {
        coursesStore.content = content;
        api.contentDetail.mockResolvedValue(fail());

        await coursesStore.loadContent(5, true);

        expect(coursesStore.content).toEqual(content);
    });

    it('mode silent tidak menyalakan contentLoading, mode biasa menyalakan', async () => {
        const seen: boolean[] = [];
        api.contentDetail.mockImplementation(async () => {
            seen.push(coursesStore.contentLoading);
            return ok({ course_content: content });
        });

        await coursesStore.loadContent(5, true);
        await coursesStore.loadContent(5);

        expect(seen).toEqual([false, true]);
    });

    it('respons sukses tanpa data dianggap error', async () => {
        api.contentDetail.mockResolvedValue(ok());

        await coursesStore.loadContent(5);

        expect(coursesStore.contentError).toBe('OK');
    });
});

/* ---------- Mutasi yang pola hasilnya seragam ---------- */

const mutations = [
    {
        name: 'addCourse',
        key: 'add',
        run: () => coursesStore.addCourse(payload),
        call: () => api.create,
        reloads: () => [api.list],
        toastError: false
    },
    {
        name: 'updateCourse',
        key: 'change',
        run: () => coursesStore.updateCourse(1, payload),
        call: () => api.update,
        reloads: () => [api.detail],
        toastError: false
    },
    {
        name: 'changeCover',
        key: 'cover',
        run: () => coursesStore.changeCover(1, file),
        call: () => api.changeCover,
        reloads: () => [api.detail],
        toastError: false
    },
    {
        name: 'deleteAllCourses',
        key: 'removeAll',
        run: () => coursesStore.deleteAllCourses(),
        call: () => api.removeAll,
        reloads: () => [api.list],
        toastError: true
    },
    {
        name: 'joinCourse',
        key: 'student',
        run: () => coursesStore.joinCourse(1),
        call: () => api.join,
        reloads: () => [api.detail],
        toastError: true
    },
    {
        name: 'leaveCourse',
        key: 'student',
        run: () => coursesStore.leaveCourse(1),
        call: () => api.leave,
        reloads: () => [api.detail],
        toastError: true
    },
    {
        name: 'rateCourse',
        key: 'rating',
        run: () => coursesStore.rateCourse(1, { ratings: 5, comment: 'bagus' }),
        call: () => api.rate,
        reloads: () => [api.detail],
        toastError: false
    },
    {
        name: 'addContent',
        key: 'content',
        run: () => coursesStore.addContent(1, contentPayload),
        call: () => api.addContent,
        reloads: () => [api.detail],
        toastError: false
    },
    {
        name: 'deleteContent',
        key: 'content',
        run: () => coursesStore.deleteContent(1, 5),
        call: () => api.removeContent,
        reloads: () => [api.detail],
        toastError: true
    },
    {
        name: 'setContentStatus',
        key: 'content',
        run: () => coursesStore.setContentStatus(1, 5, 1),
        call: () => api.setContentStatus,
        reloads: () => [api.detail, api.contentDetail],
        toastError: true
    }
] as const;

describe.each(mutations)('$name', (m) => {
    it('berhasil: memanggil API, memuat ulang data, dan menampilkan toast sukses', async () => {
        const result = await m.run();

        expect(result).toEqual({ ok: true, message: 'OK', fields: [] });
        expect(m.call()).toHaveBeenCalledOnce();
        for (const reload of m.reloads()) expect(reload).toHaveBeenCalled();
        expect(coursesStore.busy[m.key]).toBe(false);
        expect(coursesStore.toast).toEqual({ type: 'success', text: 'OK' });
    });

    it('gagal: tidak memuat ulang dan mengembalikan error field', async () => {
        m.call().mockResolvedValue(fail({ title: ['wajib'] }));

        const result = await m.run();

        expect(result).toEqual({ ok: false, message: 'Gagal', fields: ['wajib'] });
        for (const reload of m.reloads()) expect(reload).not.toHaveBeenCalled();
        expect(coursesStore.busy[m.key]).toBe(false);
        expect(coursesStore.toast).toEqual(m.toastError ? { type: 'error', text: 'Gagal' } : null);
    });
});

it('bendera busy menyala selama permintaan', async () => {
    let seen: boolean | undefined;
    api.create.mockImplementation(async () => {
        seen = coursesStore.busy.add;
        return ok();
    });

    await coursesStore.addCourse(payload);

    expect(seen).toBe(true);
});

describe('updateContent', () => {
    it('memuat ulang detail kursus saja jika konten lain yang terbuka', async () => {
        coursesStore.content = { ...content, id: 99 };

        await coursesStore.updateContent(1, 5, contentPayload);

        expect(api.updateContent).toHaveBeenCalledWith(5, contentPayload);
        expect(api.detail).toHaveBeenCalled();
        expect(api.contentDetail).not.toHaveBeenCalled();
    });

    it('memuat ulang konten jika konten itu sedang terbuka', async () => {
        coursesStore.content = content;

        await coursesStore.updateContent(1, 5, contentPayload);

        expect(api.contentDetail).toHaveBeenCalledWith(5);
    });

    it('gagal', async () => {
        api.updateContent.mockResolvedValue(fail());

        const result = await coursesStore.updateContent(1, 5, contentPayload);

        expect(result.ok).toBe(false);
        expect(api.detail).not.toHaveBeenCalled();
    });
});

describe('deleteCourse', () => {
    it('menghapus kursus dari daftar dan mengosongkan detail yang sama', async () => {
        coursesStore.courses = [course, { ...course, id: 2 }];
        coursesStore.course = course;

        const result = await coursesStore.deleteCourse(1);

        expect(result.ok).toBe(true);
        expect(api.remove).toHaveBeenCalledWith(1);
        expect(coursesStore.courses.map((c) => c.id)).toEqual([2]);
        expect(coursesStore.course).toBeNull();
    });

    it('tidak mengosongkan detail kursus lain', async () => {
        coursesStore.courses = [course];
        coursesStore.course = { ...course, id: 2 };

        await coursesStore.deleteCourse(1);

        expect(coursesStore.course?.id).toBe(2);
    });

    it('gagal: daftar tetap dan toast error muncul', async () => {
        coursesStore.courses = [course];
        api.remove.mockResolvedValue(fail());

        const result = await coursesStore.deleteCourse(1);

        expect(result.ok).toBe(false);
        expect(coursesStore.courses).toEqual([course]);
        expect(coursesStore.toast).toEqual({ type: 'error', text: 'Gagal' });
    });
});

describe('notify', () => {
    it('menghilangkan toast setelah 3,5 detik', () => {
        vi.useFakeTimers();

        coursesStore.notify('success', 'halo');
        expect(coursesStore.toast).toEqual({ type: 'success', text: 'halo' });

        vi.advanceTimersByTime(3500);
        expect(coursesStore.toast).toBeNull();
    });

    it('notifikasi baru mengulang hitungan waktu', () => {
        vi.useFakeTimers();

        coursesStore.notify('success', 'pertama');
        vi.advanceTimersByTime(2000);
        coursesStore.notify('error', 'kedua');
        vi.advanceTimersByTime(2000);

        expect(coursesStore.toast).toEqual({ type: 'error', text: 'kedua' });

        vi.advanceTimersByTime(1500);
        expect(coursesStore.toast).toBeNull();
    });
});