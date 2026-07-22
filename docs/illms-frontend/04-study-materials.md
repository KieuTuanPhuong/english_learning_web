# 04 — Study materials library

**Status:** Proposed · **Depends on:** [01](./01-types-and-api-client.md) · **Backend refs:** `/api/study-materials/` (english-learning-api/docs/illms-upgrade/03; RBAC rows 6 admin-manage / 7 read-all)

**Blast radius:** `lib/hooks.ts` (+5 hooks), `app/(app)/study-materials/page.tsx` (NEW), `app/(app)/study-materials/[id]/page.tsx` (NEW), `components/layout.tsx` (nav entry for all roles).

---

## Goal
Add the official study-materials library: every authenticated role can browse/read documents; admins can create/edit/delete them. `file_url` is a pasted mock URL (no upload backend), consistent with the existing avatar/audio-URL convention.

## Why (gap)
No materials UI exists (Explore map §6). The backend now exposes `/api/study-materials/` — list/retrieve for all active users, write for admins. `StudyMaterial` = `{ id, title, file_url, description?, uploaded_by_id, class_id?, created_at }`.

## Changes (file by file)

### `lib/hooks.ts`
```ts
export function useStudyMaterials() {
  return useQuery({ queryKey: qk.studyMaterials, queryFn: api.listStudyMaterials });
}
export function useStudyMaterial(id: number) {
  return useQuery({ queryKey: qk.studyMaterial(id), queryFn: () => api.getStudyMaterial(id), enabled: Number.isFinite(id) });
}
export function useCreateStudyMaterial() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createStudyMaterial,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.studyMaterials }) });
}
export function useUpdateStudyMaterial(id: number) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: Partial<StudyMaterialRequest>) => api.updateStudyMaterial(id, b),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.studyMaterials }); qc.invalidateQueries({ queryKey: qk.studyMaterial(id) }); } });
}
export function useDeleteStudyMaterial() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => api.deleteStudyMaterial(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.studyMaterials }) });
}
```

### `app/(app)/study-materials/page.tsx` (NEW — list, all roles)
`"use client"`. Library list with the standard Skeleton/ErrorState/EmptyState pattern.
```tsx
const { role } = useAuth();
const { data, isLoading, isError } = useStudyMaterials();
// grid of <Card>: title, description, "Open" link → file_url (target=_blank rel=noopener), created_at
// if role === "admin": show "New material" button → <Modal> with the create form
```
Admin create/edit/delete uses `<Modal>` + react-hook-form (`title`, `file_url`, `description?`, optional `class_id`). Non-admins never see write affordances (and the backend 403s them regardless). This is the only materials-management surface in this set — there is no separate admin console here.

### `app/(app)/study-materials/[id]/page.tsx` (NEW — detail)
`"use client"`; `await params` (Next 16). Show title, description, an "Open document" button to `file_url`, uploader/created_at. Admin: Edit (Modal) + Delete (confirm) using the update/delete hooks; on delete success `router.push("/study-materials")`.

### `components/layout.tsx` (nav)
Add a "Materials" entry pointing at `/study-materials` to **both** the student `MobileShell` nav and the teacher `DesktopShell` nav (read access is for all roles). Use a `lucide-react` icon (e.g. `BookOpen`). Keep the existing nav-item shape/active-state logic.

## Acceptance criteria
- [ ] Student and teacher can list + open materials (seeded rows exist after `seed_demo`); detail page loads via `await params`.
- [ ] Admin sees "New material" / Edit / Delete; create with a mock `file_url` returns 201 and appears without reload; class-scoped (`class_id`) create works.
- [ ] Non-admin sees no write controls; a direct write attempt surfaces the 403 `{detail}` via `ApiError`.
- [ ] Nav shows "Materials" for student + teacher; `yarn typecheck`/`yarn lint` pass.

## Deferred / out of scope
- Real file upload (URL paste only — backend convention).
- Per-user "saved/bookmarked" materials (backend RBAC row 7 "save" = read for MVP; no SavedMaterial endpoint).
- Admin's broader console (users/health/ai-models) — not in this set.
