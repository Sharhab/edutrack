"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
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
import { ClassItem, ClassFormValues } from "../../../../types/class";
import Link from "next/link";
const initialForm: ClassFormValues = {
  name: "",
  level: "",
  arm: "",
  capacity: "",
  isActive: "true",
};

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

  async function load() {
    try {
      setLoading(true);
      setPageError("");
      const data = await getClasses();
      setItems(data || []);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPageError(err.response?.data?.message || "Failed to load classes.");
      } else {
        setPageError("Failed to load classes.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();

    return items.filter((item) =>
      `${item.name} ${item.level || ""} ${item.arm || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [items, search]);

  function updateForm(field: keyof ClassFormValues, value: string) {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm(initialForm);
    setSelected(null);
    setActionError("");
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
      arm: item.arm || "",
      capacity: item.capacity ? String(item.capacity) : "",
      isActive: String(item.isActive ?? true),
    });
    setOpen(true);
  }

  function openDelete(item: ClassItem) {
    setSelected(item);
    setActionError("");
    setDeleteOpen(true);
  }

  function validateForm() {
    if (!form.name.trim()) return "Class name is required.";
    return "";
  }

  function toPayload(form: ClassFormValues) {
  return {
    name: form.name.trim(),
    level: form.level.trim() || undefined,
    arm: form.arm.trim() || undefined,
    capacity: form.capacity ? Number(form.capacity) : undefined,
    isActive: form.isActive === "true",
  };
}

 async function handleSave() {
  const error = validateForm();
  if (error) {
    setActionError(error);
    return;
  }

  try {
    setSubmitting(true);
    setActionError("");

    const payload = toPayload(form);

    if (selected?._id) {
      const updated = await updateClass(selected._id, payload);
      setItems((prev) =>
        prev.map((item) => (item._id === selected._id ? updated : item))
      );
    } else {
      const created = await createClass(payload);
      setItems((prev) => [created, ...prev]);
    }

    setOpen(false);
    resetForm();
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      setActionError(err.response?.data?.message || "Failed to save class.");
    } else {
      setActionError("Failed to save class.");
    }
  } finally {
    setSubmitting(false);
  }
}

  async function handleDelete() {
    if (!selected?._id) return;

    try {
      setSubmitting(true);
      setActionError("");

      await deleteClass(selected._id);

      setItems((prev) => prev.filter((item) => item._id !== selected._id));
      setDeleteOpen(false);
      resetForm();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(err.response?.data?.message || "Failed to delete class.");
      } else {
        setActionError("Failed to delete class.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageLoader />;

  if (pageError) {
    return <EmptyState title="Unable to load classes" description={pageError} />;
  }

  return (
    <>
      <SectionCard
        title="Classes"
        subtitle="Create and manage school classes"
        rightAction={
            
          <><button
            type="button"
            onClick={openCreate}
            className="btn-primary inline-flex items-center"
          >

            <Plus size={16} className="mr-2" />
            Add Class
          </button><Link
            href="/school-admin/classes/bulk"
            className="btn-secondary inline-flex items-center"
          >
              Bulk Entry
            </Link></>
        }
      >
      
        <div className="mb-5 max-w-md">
          <label className="mb-2 block text-sm text-slate-300">
            Search Classes
          </label>
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by class name..."
              className="input pl-11"
            />
          </div>
        </div>

        {!filtered.length ? (
          <EmptyState
            title="No classes yet"
            description="Create your first class so students and teachers can be assigned."
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
                    {item.level || "No level"} • {item.arm || "No arm"} •{" "}
                    {item.capacity || 0} capacity
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => openDelete(item)}
                    className="rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20"
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
        title={selected ? "Edit Class" : "Add Class"}
        description="Create or update a school class"
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
      >
        {actionError ? (
          <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {actionError}
          </div>
        ) : null}

        <div className="space-y-4">
          <FormInput
            label="Class Name"
            name="name"
            value={form.name}
            placeholder="Primary 1, JSS 1, SS 2..."
            onChange={(value) => updateForm("name", value)}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="Level"
              name="level"
              value={form.level}
              placeholder="Primary, Junior, Senior"
              onChange={(value) => updateForm("level", value)}
            />

            <FormInput
              label="Arm"
              name="arm"
              value={form.arm}
              placeholder="A, B, Science, Commercial"
              onChange={(value) => updateForm("arm", value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="Capacity"
              name="capacity"
              type="number"
              value={form.capacity}
              placeholder="40"
              onChange={(value) => updateForm("capacity", value)}
            />

            <SelectField
              label="Status"
              name="isActive"
              value={form.isActive}
              onChange={(value) => updateForm("isActive", value)}
              options={[
                { label: "Active", value: "true" },
                { label: "Inactive", value: "false" },
              ]}
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? "Saving..." : selected ? "Save Changes" : "Create Class"}
          </button>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        title="Delete Class"
        description="This action cannot be undone"
        onClose={() => {
          setDeleteOpen(false);
          resetForm();
        }}
      >
        {actionError ? (
          <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {actionError}
          </div>
        ) : null}

        <div className="space-y-5">
          <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-white">{selected?.name}</span>?
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
            >
              {submitting ? "Deleting..." : "Delete Class"}
            </button>

            <button
              type="button"
              onClick={() => {
                setDeleteOpen(false);
                resetForm();
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}