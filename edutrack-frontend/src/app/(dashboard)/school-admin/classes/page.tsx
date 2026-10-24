
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import SectionCard from "../../../../components/ui/SectionCard";
import Modal from "../../../../components/ui/Modal";
import PageLoader from "../../../../components/ui/PageLoader";
import EmptyState from "../../../../components/ui/EmptyState";
import FormInput from "../../../../components/ui/FormInput";
import SelectField from "../../../../components/ui/SelectField";

import {
  createClass,
  deleteClass,
  getClasses,
  updateClass,
} from "../../../../lib/classes";

import type { ClassItem, ClassPayload } from "../../../../types/class";

type ClassFormValues = {
  name: string;
  level: string;
  arm: string;
  capacity: string;
  isActive: string;
};

const initialForm: ClassFormValues = {
  name: "",
  level: "",
  arm: "",
  capacity: "40",
  isActive: "true",
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }

  return fallback;
}

export default function ClassesPage() {
  const [items, setItems] = useState<ClassItem[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<ClassFormValues>(initialForm);
  const [selected, setSelected] = useState<ClassItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");

  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");

      const data = await getClasses();
      setItems(data || []);
    } catch (error: unknown) {
      setPageError(getErrorMessage(error, "Failed to load classes."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) =>
      `${item.name} ${item.level || ""} ${item.code || ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [items, search]);

  function updateForm(field: keyof ClassFormValues, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function resetForm() {
    setForm(initialForm);
    setSelected(null);
    setActionError("");
  }

  function closeForm() {
    if (submitting) return;

    setOpen(false);
    resetForm();
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(item: ClassItem) {
    setSelected(item);
    setActionError("");

    setForm({
      name: item.name || "",
      level: item.level || "",
      arm: item.code || "",
      capacity: String(item.capacity ?? 40),
      isActive: String(item.isActive ?? true),
    });

    setOpen(true);
  }

  function openDelete(item: ClassItem) {
    setSelected(item);
    setActionError("");
    setDeleteOpen(true);
  }

  function validateForm(): string {
    const name = form.name.trim();

    if (name.length < 2) {
      return "Class name must contain at least 2 characters.";
    }

    if (name.length > 100) {
      return "Class name cannot exceed 100 characters.";
    }

    if (form.level.trim().length > 50) {
      return "Level cannot exceed 50 characters.";
    }

    if (form.arm.trim().length > 30) {
      return "Class code cannot exceed 30 characters.";
    }

    const capacity = Number(form.capacity);

    if (
      form.capacity.trim() === "" ||
      !Number.isInteger(capacity) ||
      capacity < 0 ||
      capacity > 10000
    ) {
      return "Capacity must be a whole number between 0 and 10000.";
    }

    return "";
  }

  function toPayload(values: ClassFormValues): ClassPayload {
    return {
      name: values.name.trim(),
      level: values.level.trim(),
      code: values.arm.trim(),
      capacity: Number(values.capacity),
      isActive: values.isActive === "true",
    };
  }

  async function handleSave() {
    const validationError = validateForm();

    if (validationError) {
      setActionError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setActionError("");

      const payload = toPayload(form);

      if (selected?._id) {
        const updated = await updateClass(selected._id, payload);

        setItems((previous) =>
          previous.map((item) =>
            item._id === selected._id ? updated : item
          )
        );
      } else {
        const created = await createClass(payload);

        setItems((previous) => [
          created,
          ...previous.filter((item) => item._id !== created._id),
        ]);
      }

      setOpen(false);
      resetForm();
    } catch (error: unknown) {
      setActionError(getErrorMessage(error, "Failed to save class."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selected?._id || submitting) return;

    const deletingId = selected._id;

    try {
      setSubmitting(true);
      setActionError("");

      await deleteClass(deletingId);

      setItems((previous) =>
        previous.filter((item) => item._id !== deletingId)
      );

      setDeleteOpen(false);
      resetForm();
    } catch (error: unknown) {
      setActionError(
        getErrorMessage(
          error,
          "Failed to delete class. Check whether it has linked records."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <PageLoader />;
  }

  if (pageError) {
    return (
      <EmptyState
        title="Unable to load classes"
        description={pageError}
      />
    );
  }

  return (
    <>
      <SectionCard
        title="Classes"
        subtitle="Create and manage school classes"
        rightAction={
          <>
            <button
              type="button"
              onClick={openCreate}
              className="btn-primary inline-flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Add Class
            </button>

            <Link
              href="/school-admin/classes/bulk"
              className="btn-secondary inline-flex items-center"
            >
              Bulk Entry
            </Link>
          </>
        }
      >
        <div className="mb-5 max-w-md">
          <label
            htmlFor="class-search"
            className="mb-2 block text-sm text-slate-300"
          >
            Search Classes
          </label>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="class-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by class name, level, or code..."
              className="input pl-11"
            />
          </div>
        </div>

        {!filtered.length ? (
          <EmptyState
            title={search ? "No matching classes" : "No classes yet"}
            description={
              search
                ? "Try another search term or clear your search."
                : "Create your first class so students and teachers can be assigned."
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div
                key={item._id}
                className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-white">{item.name}</p>

                  <p className="text-sm text-slate-400">
                    {item.level || "No level"} •{" "}
                    {item.code || "No code"} •{" "}
                    {item.capacity ?? 40} capacity •{" "}
                    {item.isActive === false ? "Inactive" : "Active"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    aria-label={`Edit ${item.name}`}
                    className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => openDelete(item)}
                    aria-label={`Delete ${item.name}`}
                    className="rounded-xl p-2 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <Modal
        open={open}
        title={selected ? "Edit Class" : "Create Class"}
        description="Manage the class details for your school."
        onClose={closeForm}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <FormInput
            label="Class Name"
            name="className"
            value={form.name}
            placeholder="e.g. Primary 3"
            onChange={(value) => updateForm("name", value)}
          />

          <FormInput
            label="Level"
            name="classLevel"
            value={form.level}
            placeholder="e.g. Primary"
            onChange={(value) => updateForm("level", value)}
          />

          <FormInput
            label="Class Code"
            name="classCode"
            value={form.arm}
            placeholder="e.g. PRI3"
            onChange={(value) => updateForm("arm", value)}
          />

          <FormInput
            label="Capacity"
            name="classCapacity"
            type="number"
            value={form.capacity}
            onChange={(value) => updateForm("capacity", value)}
          />

          <SelectField
            label="Status"
            name="classStatus"
            value={form.isActive}
            options={[
              { label: "Active", value: "true" },
              { label: "Inactive", value: "false" },
            ]}
            onChange={(value) => updateForm("isActive", value)}
          />

          {actionError && (
            <p role="alert" className="text-sm text-red-400">
              {actionError}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="btn-secondary"
              disabled={submitting}
              onClick={closeForm}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : selected
                  ? "Save Changes"
                  : "Create Class"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        title="Delete Class"
        description="Confirm that you want to remove this class."
        onClose={() => {
          if (submitting) return;
          setDeleteOpen(false);
          setActionError("");
        }}
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-white">
              {selected?.name}
            </span>
            ?
          </p>

          <p className="text-sm text-slate-400">
            Classes with linked student or academic records should be protected
            by the backend. If deletion is blocked, the server error will
            appear here.
          </p>

          {actionError && (
            <p role="alert" className="text-sm text-red-400">
              {actionError}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="btn-secondary"
              disabled={submitting}
              onClick={() => {
                setDeleteOpen(false);
                setActionError("");
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
              disabled={submitting || !selected?._id}
              onClick={() => void handleDelete()}
            >
              {submitting ? "Deleting..." : "Delete Class"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
