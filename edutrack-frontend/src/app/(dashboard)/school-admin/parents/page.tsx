"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";

import SectionCard from "../../../../components/ui/SectionCard";
import Modal from "../../../../components/ui/Modal";
import PageLoader from "../../../../components/ui/PageLoader";
import EmptyState from "../../../../components/ui/EmptyState";
import FormInput from "../../../../components/ui/FormInput";

import {
  createParent,
  deleteParent,
  getParents,
  updateParent,
} from "../../../../lib/parent-portal";

import { getStudents } from "../../../../lib/students";

import { Parent, ParentFormValues } from "../../../../types/parent-portal";
import { Student } from "../../../../types/student";

import { Plus, Search } from "lucide-react";

/* ================= INITIAL FORM ================= */
const initialForm: ParentFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  occupation: "",
  address: "",
  relationshipToStudent: "",
  studentIds: [],
};

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");

  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<ParentFormValues>(initialForm);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);

  /* ================= LOAD PARENTS ================= */
  async function loadParents() {
    try {
      setLoading(true);
      setPageError("");

      const result = await getParents({
        search: search.trim(),
      });

      setParents(result || []);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPageError(
          err.response?.data?.message || "Failed to load parents."
        );
      } else {
        setPageError("Failed to load parents.");
      }
    } finally {
      setLoading(false);
    }
  }

  /* ================= LOAD STUDENTS ================= */
  async function loadStudents() {
    try {
      setLoadingOptions(true);
      const res = await getStudents();
      setStudents(res || []);
    } catch (err) {
      console.error("Failed to load students", err);
    } finally {
      setLoadingOptions(false);
    }
  }

  useEffect(() => {
    loadParents();
    loadStudents();
  }, []);

  /* ================= FILTER ================= */
  const filteredParents = useMemo(() => {
    if (!search.trim()) return parents;

    const q = search.toLowerCase();

    return parents.filter((p) => {
      return (
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q) ||
        (p.phone || "").toLowerCase().includes(q)
      );
    });
  }, [parents, search]);

  /* ================= FORM UPDATE ================= */
  function updateForm(field: keyof ParentFormValues, value: any) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function toggleStudent(studentId: string) {
    setForm((prev) => {
      const exists = prev.studentIds.includes(studentId);

      return {
        ...prev,
        studentIds: exists
          ? prev.studentIds.filter((id) => id !== studentId)
          : [...prev.studentIds, studentId],
      };
    });
  }

  function resetForm() {
    setForm(initialForm);
    setSelectedParent(null);
    setActionError("");
  }

  /* ================= CREATE ================= */
  async function handleCreate() {
    try {
      setSubmitting(true);
      setActionError("");

      if (
        !form.firstName ||
        !form.lastName ||
        !form.email ||
        !form.password
      ) {
        setActionError("Required fields missing");
        return;
      }

      const created = await createParent(form);

      setParents((prev) => [created, ...prev]);
      setCreateOpen(false);
      resetForm();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message || "Failed to create parent."
        );
      } else {
        setActionError("Failed to create parent.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  /* ================= EDIT ================= */
  async function handleEdit() {
    if (!selectedParent?._id) return;

    try {
      setSubmitting(true);
      setActionError("");

      const updated = await updateParent(selectedParent._id, form);

      setParents((prev) =>
        prev.map((p) =>
          p._id === selectedParent._id ? updated : p
        )
      );

      setEditOpen(false);
      resetForm();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message || "Failed to update parent."
        );
      } else {
        setActionError("Failed to update parent.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  /* ================= DELETE ================= */
  async function handleDelete() {
    if (!selectedParent?._id) return;

    try {
      setSubmitting(true);

      await deleteParent(selectedParent._id);

      setParents((prev) =>
        prev.filter((p) => p._id !== selectedParent._id)
      );

      setDeleteOpen(false);
      resetForm();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message || "Failed to delete parent."
        );
      } else {
        setActionError("Failed to delete parent.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  /* ================= LOADING ================= */
  if (loading) return <PageLoader />;

  if (pageError) {
    return (
      <EmptyState
        title="Unable to load parents"
        description={pageError}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">

        {/* HEADER */}
        <SectionCard
          title="Parents"
          subtitle="Manage parent accounts and link students"
          rightAction={
            <div className="flex gap-2">
              <Link href="/school-admin/parents/bulk">
                <button className="btn-secondary">
                  Bulk Upload
                </button>
              </Link>

              <button
                onClick={() => {
                  resetForm();
                  setCreateOpen(true);
                }}
                className="btn-primary"
              >
                <Plus size={16} className="mr-2" />
                Add Parent
              </button>
            </div>
          }
        >
          {/* SEARCH */}
          <div className="relative max-w-md mb-5">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-11 text-slate-400"
            />
            <div className="[&_input]:pl-11">
              <FormInput
                name="search"
                label="Search Parents"
                value={search}
                placeholder="Search by name, email, phone..."
                onChange={setSearch}
              />
            </div>
          </div>

          {/* LIST */}
          {filteredParents.length === 0 ? (
            <EmptyState
              title="No parents found"
              description="Create a parent account to get started"
            />
          ) : (
            <div className="space-y-3">
              {filteredParents.map((p) => (
                <div
                  key={p._id}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between"
                >
                  <div>
                    <p className="font-bold">
                      {p.firstName} {p.lastName}
                    </p>
                    <p className="text-sm text-slate-400">
                      {p.email}
                    </p>
                    <p className="text-xs text-slate-500">
                      Students: {p.studentIds?.length || 0}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedParent(p);
                        setForm({
                          firstName: p.firstName || "",
                          lastName: p.lastName || "",
                          email: p.email || "",
                          phone: p.phone || "",
                          password: "",

                          occupation: p.occupation || "",
                          address: p.address || "",
                          relationshipToStudent:
                            p.relationshipToStudent || "",

                          studentIds: p.studentIds || [],
                        });
                        setEditOpen(true);
                      }}
                      className="btn-secondary"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => {
                        setSelectedParent(p);
                        setDeleteOpen(true);
                      }}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* CREATE MODAL */}
      <Modal
        open={createOpen}
        title="Create Parent"
        onClose={() => setCreateOpen(false)}
      >
        <div className="space-y-3">
          <FormInput
            name="firstName"
            label="First Name"
            value={form.firstName}
            onChange={(v) => updateForm("firstName", v)}
          />
          <FormInput
            name="lastName"
            label="Last Name"
            value={form.lastName}
            onChange={(v) => updateForm("lastName", v)}
          />
          <FormInput
            name="email"
            label="Email"
            value={form.email}
            onChange={(v) => updateForm("email", v)}
          />
          <FormInput
            name="password"
            label="Password"
            value={form.password}
            onChange={(v) => updateForm("password", v)}
          />
          <FormInput
            name="phone"
            label="Phone"
            value={form.phone}
            onChange={(v) => updateForm("phone", v)}
          />

          <div className="grid grid-cols-2 gap-2">
            {students.map((s) => (
              <div
                key={s._id}
                onClick={() => toggleStudent(s._id)}
                className={`p-2 rounded-lg cursor-pointer ${
                  form.studentIds.includes(s._id)
                    ? "bg-green-600"
                    : "bg-white/10"
                }`}
              >
                {s.firstName} {s.lastName}
              </div>
            ))}
          </div>

          <button
            onClick={handleCreate}
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? "Creating..." : "Create Parent"}
          </button>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        open={editOpen}
        title="Edit Parent"
        onClose={() => setEditOpen(false)}
      >
        <div className="space-y-3">
          <FormInput
            name="firstName"
            label="First Name"
            value={form.firstName}
            onChange={(v) => updateForm("firstName", v)}
          />
          <FormInput
            name="lastName"
            label="Last Name"
            value={form.lastName}
            onChange={(v) => updateForm("lastName", v)}
          />
          <FormInput
            name="phone"
            label="Phone"
            value={form.phone}
            onChange={(v) => updateForm("phone", v)}
          />

          <button
            onClick={handleEdit}
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        open={deleteOpen}
        title="Delete Parent"
        onClose={() => setDeleteOpen(false)}
      >
        <button
          onClick={handleDelete}
          className="btn-danger w-full"
        >
          Delete
        </button>
      </Modal>
    </>
  );
}