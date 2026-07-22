# 06 — Grade report CSV export

**Status:** Proposed · **Depends on:** [01](./01-types-and-api-client.md), [02](./02-dashboards-and-inbox.md) · **Backend refs:** `GET /api/reports/grades?class_id=&format=csv` (english-learning-api/docs/illms-upgrade/05; RBAC row 16)

**Blast radius:** `lib/api.ts` (+`downloadGradeReport` raw helper), teacher surfaces that already list classes (teacher dashboard class cards from [brief 02](./02-dashboards-and-inbox.md), and the inbox header when filtered by class). Optional `components/ui.tsx` button reuse.

---

## Goal
Let teachers (own classes) and admins (any class) download a per-class grade report as CSV. The endpoint returns `text/csv`, not JSON — needs a dedicated client path.

## Why (gap)
No export exists. **`apiFetch` cannot be reused** — it calls `res.json()` and would throw on CSV. A browser `<a download href>` also can't attach the `Authorization: Bearer` header. So the file must be fetched with the token, read as a `Blob`, and saved via an object URL.

## Changes (file by file)

### `lib/api.ts` — raw download helper
Reuse the in-memory `accessToken` + `API_BASE_URL` already in this module (do not duplicate token logic):
```ts
// CSV/binary download — apiFetch can't be used (it does res.json()).
export async function downloadGradeReport(classId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/reports/grades?class_id=${classId}&format=csv`, {
    headers: {
      Accept: "text/csv",
      ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
    },
  });
  if (!res.ok) throw await toApiError(res);     // reuse existing error normalizer (403 "Not your class", 404)
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `grades_class_${classId}.csv`;     // backend sets Content-Disposition too
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
```
> `toApiError` and `getAccessToken` are already exported/defined in `api.ts`. Note this helper does **not** do the transparent 401→refresh dance `apiFetch` does; for MVP that's acceptable (the user is on an authed screen). If you want parity, refactor `apiFetch` to support a `raw`/`responseType: "blob"` option and route both through it — optional.

### UI placement (no new route)
Teacher class-detail (T15) is still a placeholder, so attach the action where teachers already see their classes:
- **Teacher dashboard** ([brief 02](./02-dashboards-and-inbox.md)): an "Export CSV" button on each `t.classes` card.
- **Submissions inbox** ([brief 02](./02-dashboards-and-inbox.md)): when filtered to a class (`?class_id=`), an "Export CSV" button in the header.

```tsx
const [busy, setBusy] = useState(false);
async function onExport(classId: number) {
  setBusy(true);
  try { await downloadGradeReport(classId); }
  catch (e) { /* surface ApiError.message via your toast/inline error */ }
  finally { setBusy(false); }
}
// <Button variant="outline" size="sm" loading={busy} onClick={() => onExport(c.id)}>Export CSV</Button>
```

## Acceptance criteria
- [ ] Teacher clicks "Export CSV" on an own class → a `grades_class_<id>.csv` file downloads with header row + one row per submission (seeded data).
- [ ] Teacher exporting another teacher's class surfaces a 403 (`Not your class`) via `ApiError`, no silent failure.
- [ ] Admin can export any class.
- [ ] `yarn typecheck`/`yarn lint` pass; no `apiFetch` JSON-parse error on the CSV response.

## Deferred / out of scope
- PDF export (backend returns 501 unless `REPORTS_PDF_ENABLED`; don't offer a PDF button until that's wired).
- A dedicated reports/analytics page — the export is an inline action for now.
