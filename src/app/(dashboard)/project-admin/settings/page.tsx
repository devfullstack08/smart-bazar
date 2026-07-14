'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Upload, Image as ImageIcon, Video, Type, CalendarDays } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { adminPopupApi, PopupPayload } from '@/lib/api/adminPopupApi';
import { publicUploadUrl } from '@/lib/publicUploadUrl';
import type { PopupContentItem, ProjectPopup } from '@/types';

type FormState = {
    name: string;
    title: string;
    description: string;
    startAt: string;
    endAt: string;
    isActive: boolean;
    contents: PopupContentItem[];
};

const emptyFormState: FormState = {
    name: '',
    title: '',
    description: '',
    startAt: '',
    endAt: '',
    isActive: true,
    contents: [{ type: 'text', text: '', order: 0 }],
};

function toDateInputValue(value?: string) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
}

function fromDateInputValue(value: string) {
    if (!value) return '';
    return new Date(value).toISOString();
}

function sortContents(contents: PopupContentItem[]) {
    return [...contents].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function toPayload(form: FormState): PopupPayload {
    return {
        name: form.name.trim(),
        title: form.title.trim() || undefined,
        description: form.description.trim() || undefined,
        isActive: form.isActive,
        showOn: 'dashboard',
        startAt: fromDateInputValue(form.startAt),
        endAt: fromDateInputValue(form.endAt),
        contents: sortContents(form.contents).map((item, idx) => ({
            id: item.id,
            type: item.type,
            order: idx,
            text: item.type === 'text' ? (item.text || '').trim() : undefined,
            file: item.type === 'image' || item.type === 'video' ? (item.file || item.url) : undefined,
            mimeType: item.type === 'image' || item.type === 'video' ? item.mimeType : undefined,
            url: item.type === 'image' || item.type === 'video' ? (item.url || item.file) : undefined,
            poster: item.type === 'video' ? item.poster : undefined,
        })),
    };
}

function toFormState(popup: ProjectPopup): FormState {
    const normalized = adminPopupApi.normalizePopup(popup);
    return {
        name: normalized.name || '',
        title: normalized.title || '',
        description: normalized.description || '',
        startAt: toDateInputValue(normalized.startAt),
        endAt: toDateInputValue(normalized.endAt),
        isActive: Boolean(normalized.isActive),
        contents: Array.isArray(normalized.contents) && normalized.contents.length > 0
            ? sortContents(normalized.contents)
            : [{ type: 'text', text: '', order: 0 }],
    };
}

export default function ProjectAdminSettingsPage() {
    const [popups, setPopups] = useState<ProjectPopup[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPopup, setEditingPopup] = useState<ProjectPopup | null>(null);
    const [form, setForm] = useState<FormState>(emptyFormState);

    const refreshPopups = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminPopupApi.list();
            const sorted = [...data].sort((a, b) => {
                if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            });
            setPopups(sorted);
        } catch (error: any) {
            toast.error(error?.message || 'Failed to load popups');
            setPopups([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshPopups();
    }, [refreshPopups]);

    const resetForm = () => {
        setEditingPopup(null);
        setForm(emptyFormState);
    };

    const openCreate = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEdit = (popup: ProjectPopup) => {
        setEditingPopup(popup);
        setForm(toFormState(popup));
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const canSubmit = useMemo(() => {
        if (!form.name.trim()) return false;
        if (!form.startAt || !form.endAt) return false;
        const start = new Date(form.startAt).getTime();
        const end = new Date(form.endAt).getTime();
        if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) return false;
        if (form.contents.length === 0) return false;
        return form.contents.every((item) => {
            if (item.type === 'text') return Boolean(item.text?.trim());
            return Boolean(item.file || item.url);
        });
    }, [form]);

    const addContentItem = (type: PopupContentItem['type']) => {
        setForm((prev) => ({
            ...prev,
            contents: [
                ...prev.contents,
                {
                    type,
                    order: prev.contents.length,
                    text: type === 'text' ? '' : undefined,
                    file: type === 'image' || type === 'video' ? '' : undefined,
                    url: type === 'image' || type === 'video' ? '' : undefined,
                    poster: type === 'video' ? '' : undefined,
                },
            ],
        }));
    };

    const removeContentItem = (index: number) => {
        setForm((prev) => {
            const nextContents = prev.contents.filter((_, idx) => idx !== index)
                .map((item, idx) => ({ ...item, order: idx }));
            return {
                ...prev,
                contents: nextContents.length > 0 ? nextContents : [{ type: 'text', text: '', order: 0 }],
            };
        });
    };

    const moveContentItem = (index: number, direction: -1 | 1) => {
        setForm((prev) => {
            const target = index + direction;
            if (target < 0 || target >= prev.contents.length) return prev;
            const next = [...prev.contents];
            [next[index], next[target]] = [next[target], next[index]];
            return { ...prev, contents: next.map((item, idx) => ({ ...item, order: idx })) };
        });
    };

    const updateContent = (index: number, patch: Partial<PopupContentItem>) => {
        setForm((prev) => ({
            ...prev,
            contents: prev.contents.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
        }));
    };

    const handleUpload = async (index: number, file: File, field: 'url' | 'poster' = 'url') => {
        try {
            setUploadingIndex(index);
            const itemType = form.contents[index]?.type;
            const uploaded = await adminPopupApi.uploadMedia(
                file,
                field === 'poster'
                    ? 'image'
                    : itemType === 'video'
                        ? 'video'
                        : itemType === 'image'
                            ? 'image'
                            : undefined
            );
            if (field === 'poster') {
                updateContent(index, { poster: uploaded?.poster || uploaded?.url } as Partial<PopupContentItem>);
            } else {
                updateContent(index, {
                    file: uploaded?.file,
                    url: uploaded?.url,
                    mimeType: uploaded?.mimeType,
                } as Partial<PopupContentItem>);
            }
            toast.success('File uploaded');
        } catch (error: any) {
            toast.error(error?.message || 'Upload failed');
        } finally {
            setUploadingIndex(null);
        }
    };

    const handleSave = async () => {
        if (!canSubmit) {
            toast.error('Please complete all required fields');
            return;
        }

        const payload = toPayload(form);
        setSubmitting(true);
        try {
            if (editingPopup?._id) {
                await adminPopupApi.update(editingPopup._id, payload);
                toast.success('Popup updated');
            } else {
                await adminPopupApi.create(payload);
                toast.success('Popup created');
            }
            closeModal();
            await refreshPopups();
        } catch (error: any) {
            toast.error(error?.message || 'Failed to save popup');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (popup: ProjectPopup) => {
        const ok = window.confirm(`Delete "${popup.name}" popup?`);
        if (!ok) return;
        try {
            await adminPopupApi.remove(popup._id);
            toast.success('Popup deleted');
            await refreshPopups();
        } catch (error: any) {
            toast.error(error?.message || 'Failed to delete popup');
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">Project Admin Settings</h1>
                    <p className="mt-1 text-sm sm:text-base text-[var(--muted-foreground)]">
                        Manage dashboard popup campaigns by project and time window.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--pw-primary)] px-4 py-2.5 text-sm font-semibold text-[#0A2540] hover:bg-[var(--pw-primary)]/90 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Add Popup
                </button>
            </div>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <div className="border-b border-[var(--border)] px-4 sm:px-6 py-4">
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">Popup Campaigns</h2>
                </div>

                {loading ? (
                    <LoadingSpinner size="md" />
                ) : popups.length === 0 ? (
                    <div className="p-6 sm:p-10 text-center">
                        <p className="text-[var(--muted-foreground)]">No popup campaigns yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border)]">
                        {popups.map((popup) => (
                            <article key={popup._id} className="p-4 sm:p-6 space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">{popup.name}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${popup.isActive ? 'bg-emerald-500/15 text-emerald-500' : 'bg-gray-500/15 text-gray-500'}`}>
                                                {popup.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        {popup.title ? (
                                            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{popup.title}</p>
                                        ) : null}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openEdit(popup)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-elevated)]"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(popup)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/40 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm">
                                    <div className="rounded-xl bg-[var(--surface-elevated)] px-3 py-2">
                                        <p className="text-[var(--muted-foreground)]">Start</p>
                                        <p className="font-medium text-[var(--foreground)]">{new Date(popup.startAt).toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-xl bg-[var(--surface-elevated)] px-3 py-2">
                                        <p className="text-[var(--muted-foreground)]">End</p>
                                        <p className="font-medium text-[var(--foreground)]">{new Date(popup.endAt).toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-xl bg-[var(--surface-elevated)] px-3 py-2">
                                        <p className="text-[var(--muted-foreground)]">Content Items</p>
                                        <p className="font-medium text-[var(--foreground)]">{popup.contents?.length || 0}</p>
                                    </div>
                                </div>

                                {popup.contents?.length ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                        {sortContents(popup.contents).slice(0, 4).map((item, idx) => (
                                            <div key={`${item.id || item.url || idx}-${idx}`} className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-2 h-24 flex items-center justify-center text-xs text-[var(--muted-foreground)] overflow-hidden">
                                                {item.type === 'text' ? (
                                                    <p className="line-clamp-4 break-words">{item.text || 'Text'}</p>
                                                ) : item.type === 'image' ? (
                                                    <img src={publicUploadUrl(item.url || item.file) || item.url || item.file} alt="Popup preview" className="h-full w-full object-cover rounded" />
                                                ) : (
                                                    <video src={publicUploadUrl(item.url || item.file) || item.url || item.file} className="h-full w-full object-cover rounded" muted />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingPopup ? 'Edit Popup' : 'Create Popup'}
                size="xl"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="space-y-1">
                            <span className="text-sm font-medium text-[var(--foreground)]">Internal Name *</span>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--pw-primary)]/60"
                                placeholder="Smart Bazar campaign April"
                            />
                        </label>

                        <label className="space-y-1">
                            <span className="text-sm font-medium text-[var(--foreground)]">Popup Title</span>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--pw-primary)]/60"
                                placeholder="Special announcement"
                            />
                        </label>
                    </div>

                    <label className="space-y-1 block">
                        <span className="text-sm font-medium text-[var(--foreground)]">Description</span>
                        <textarea
                            rows={3}
                            value={form.description}
                            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--pw-primary)]/60"
                            placeholder="Optional subtitle shown in popup"
                        />
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)]">
                                <CalendarDays className="h-4 w-4" />
                                Start DateTime *
                            </span>
                            <input
                                type="datetime-local"
                                value={form.startAt}
                                onChange={(e) => setForm((prev) => ({ ...prev, startAt: e.target.value }))}
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--pw-primary)]/60"
                            />
                        </label>

                        <label className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)]">
                                <CalendarDays className="h-4 w-4" />
                                End DateTime *
                            </span>
                            <input
                                type="datetime-local"
                                value={form.endAt}
                                onChange={(e) => setForm((prev) => ({ ...prev, endAt: e.target.value }))}
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--pw-primary)]/60"
                            />
                        </label>
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                            className="h-4 w-4 rounded border-[var(--border)] text-[var(--pw-primary)] focus:ring-[var(--pw-primary)]"
                        />
                        Active
                    </label>

                    <section className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-base font-semibold text-[var(--foreground)]">Popup Content *</h3>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => addContentItem('text')} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface-elevated)]">
                                    <Type className="h-4 w-4" /> Text
                                </button>
                                <button type="button" onClick={() => addContentItem('image')} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface-elevated)]">
                                    <ImageIcon className="h-4 w-4" /> Image
                                </button>
                                <button type="button" onClick={() => addContentItem('video')} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface-elevated)]">
                                    <Video className="h-4 w-4" /> Video
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {form.contents.map((item, idx) => (
                                <div key={`${item.id || item.url || item.text || item.type}-${idx}`} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-sm font-medium text-[var(--foreground)]">
                                            Item #{idx + 1} ({item.type})
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => moveContentItem(idx, -1)} disabled={idx === 0} className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs disabled:opacity-50">
                                                Up
                                            </button>
                                            <button type="button" onClick={() => moveContentItem(idx, 1)} disabled={idx === form.contents.length - 1} className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs disabled:opacity-50">
                                                Down
                                            </button>
                                            <button type="button" onClick={() => removeContentItem(idx)} className="rounded-lg border border-red-400/40 px-2 py-1 text-xs text-red-500">
                                                Remove
                                            </button>
                                        </div>
                                    </div>

                                    {item.type === 'text' && (
                                        <textarea
                                            rows={4}
                                            value={item.text || ''}
                                            onChange={(e) => updateContent(idx, { text: e.target.value })}
                                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--pw-primary)]/60"
                                            placeholder="Write popup message"
                                        />
                                    )}

                                    {item.type === 'image' && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm cursor-pointer hover:bg-[var(--surface-elevated)]">
                                                    <Upload className="h-4 w-4" />
                                                    {uploadingIndex === idx ? 'Uploading...' : 'Upload Image'}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleUpload(idx, file, 'url');
                                                            e.currentTarget.value = '';
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                            {item.url || item.file ? (
                                                <img src={publicUploadUrl(item.url || item.file) || item.url || item.file} alt="Popup content" className="w-full max-h-44 object-contain rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)]" />
                                            ) : null}
                                        </div>
                                    )}

                                    {item.type === 'video' && (
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap gap-2">
                                                <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm cursor-pointer hover:bg-[var(--surface-elevated)]">
                                                    <Upload className="h-4 w-4" />
                                                    {uploadingIndex === idx ? 'Uploading...' : 'Upload Video'}
                                                    <input
                                                        type="file"
                                                        accept="video/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleUpload(idx, file, 'url');
                                                            e.currentTarget.value = '';
                                                        }}
                                                    />
                                                </label>
                                                <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm cursor-pointer hover:bg-[var(--surface-elevated)]">
                                                    <Upload className="h-4 w-4" />
                                                    {uploadingIndex === idx ? 'Uploading...' : 'Upload Poster'}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleUpload(idx, file, 'poster');
                                                            e.currentTarget.value = '';
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                            {item.url || item.file ? (
                                                <video src={publicUploadUrl(item.url || item.file) || item.url || item.file} controls className="w-full max-h-44 rounded-lg border border-[var(--border)] bg-black" />
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-elevated)]"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!canSubmit || submitting}
                            className="px-4 py-2 rounded-xl bg-[var(--pw-primary)] text-[#0A2540] font-semibold hover:bg-[var(--pw-primary)]/90 disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : editingPopup ? 'Update Popup' : 'Create Popup'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
