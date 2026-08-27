"use client";

import { useState } from "react";

interface ClassItem {
  id: string;
  name: string;
}

interface SubjectItem {
  id: string;
  name: string;
  classId: string;
}

interface BookFormProps {
  classes: ClassItem[];
  subjects: SubjectItem[];
  initialData?: {
    id?: string;
    title?: string;
    description?: string | null;
    classId?: string;
    subjectId?: string | null;
    status?: string;
    coverUrl?: string | null;
  };
  action: (formData: FormData) => Promise<void>;
  isEdit?: boolean;
}

export function BookForm({
  classes,
  subjects,
  initialData,
  action,
  isEdit = false,
}: BookFormProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialData?.classId || (classes[0]?.id ?? "")
  );

  const filteredSubjects = subjects.filter(
    (s) => s.classId === selectedClassId
  );

  return (
    <form action={action} encType="multipart/form-data" className={`form-grid ${isEdit ? "compact" : ""}`}>
      {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}

      <label>
        Title <span style={{ color: "#ef4444" }}>*</span>
        <input
          name="title"
          required
          defaultValue={initialData?.title || ""}
          placeholder="e.g. Advanced Calculus & Vectors"
        />
      </label>

      <label>
        Class <span style={{ color: "#ef4444" }}>*</span>
        <select
          name="classId"
          required
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
        >
          <option value="" disabled>
            Select a class
          </option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Subject <small>(filtered by selected class)</small>
        <select
          name="subjectId"
          defaultValue={initialData?.subjectId || ""}
        >
          <option value="">No subject (General class resource)</option>
          {filteredSubjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Status
        <select
          name="status"
          defaultValue={initialData?.status || "DRAFT"}
        >
          <option value="DRAFT">DRAFT</option>
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>
      </label>

      <label>
        Cover Image <small>(JPEG/PNG/WebP, max 10 MB)</small>
        <input name="cover" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
      </label>

      <label>
        PDF Document <small>(PDF, max 25 MB)</small>
        <input name="pdf" type="file" accept="application/pdf" />
      </label>

      <label className="full">
        Description
        <textarea
          name="description"
          rows={3}
          defaultValue={initialData?.description || ""}
          placeholder="Summary of topics, learning objectives, and curriculum scope..."
        />
      </label>

      <div className="full">
        <button className="button" type="submit">
          {isEdit ? "Update Book" : "Save Book"}
        </button>
      </div>
    </form>
  );
}
