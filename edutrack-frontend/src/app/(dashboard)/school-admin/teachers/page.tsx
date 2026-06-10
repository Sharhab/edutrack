"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";

import SectionCard from "../../../../components/ui/SectionCard";
import Modal from "../../../../components/ui/Modal";
import PageLoader from "../../../../components/ui/PageLoader";
import EmptyState from "../../../../components/ui/EmptyState";
import TeacherForm from "../../../../components/teachers/TeacherForm";

import {
  createTeacher,
  deleteTeacher,
  getTeachers,
  updateTeacher,
} from "../../../../lib/teachers";

import {
  getClassOptions,
  getSubjectOptions,
} from "../../../../lib/options";

import { Teacher, TeacherFormValues } from "../../../../types/teacher";
import { ClassOption, SubjectOption } from "../../../../types/options";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";

/* =========================
   FORM STATE
========================= */
const initialForm: TeacherFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  employeeId: "",
  subjectIds: [],
  classIds: [],
  gender: "male",
  address: "",
  isActive: true,
  password: "",
};

export default function TeachersPage() {
  const [items, setItems] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Teacher | null>(null);

  const [form, setForm] = useState<TeacherFormValues>(initialForm);

  /* =========================
     LOAD DATA
========================= */
  async function loadData() {
    try {
      setLoading(true);

      const [teachersData, classData, subjectData] =
        await Promise.all([
          getTeachers({ search: "" }),
          getClassOptions(),
          getSubjectOptions(),
        ]);

      setItems(teachersData || []);
      setClasses(classData || []);
      setSubjects(subjectData || []);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setPageError(
          err.response?.data?.message ||
            "Failed to load teachers"
        );
      } else {
        setPageError("Failed to load teachers");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* =========================
     FILTER
========================= */
  const filtered = useMemo(() => {
    if (!search.trim()) return items;

    const q = search.toLowerCase();

    return items.filter((t) => {
      const user = t.userId as any;

      const name =
        `${user?.firstName || ""} ${
          user?.lastName || ""
        }`.toLowerCase();

      return (
        name.includes(q) ||
        (t.employeeId || "").toLowerCase().includes(q) ||
        (user?.email || "").toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  /* =========================
     FORM HANDLERS
========================= */
  function updateForm(
    field: keyof TeacherFormValues,
    value: any
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
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

  function openEdit(item: Teacher) {
    setSelected(item);

    const user = item.userId as any;

    setForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      employeeId: item.employeeId || "",

      subjectIds: (item.subjectIds || []).map(
        (s: any) => s._id || s
      ),

      classIds: (item.classIds || []).map(
        (c: any) => c._id || c
      ),

      gender: "male",
      address: "",

      isActive: Boolean(user?.isActive),

      password: "",
    });

    setOpen(true);
  }

  /* =========================
     SAVE
========================= */
  async function handleSave() {
    try {
      setSubmitting(true);
      setActionError("");

      const payload = {
        ...form,
      };

      if (selected?._id) {
        await updateTeacher(selected._id, payload);
      } else {
        await createTeacher(payload);
      }

      setOpen(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message ||
          "Failed to save teacher"
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =========================
     DELETE
========================= */
  async function handleDelete(id: string) {
    try {
      await deleteTeacher(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  }

  /* =========================
     LOADING
========================= */
  if (loading) return <PageLoader />;

  if (pageError) {
    return (
      <EmptyState
        title="Error loading teachers"
        description={pageError}
      />
    );
  }

  /* =========================
     UI
========================= */
  return (
    <>
      <SectionCard
        title="Teachers"
        subtitle="Manage teachers, assignments and academic access"
      >
        {/* HEADER ACTIONS */}
        <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-3 text-slate-400" />
            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search teachers..."
              className="input pl-10"
            />
          </div>

          <div className="flex gap-3">
            <Link
              href="/school-admin/teachers/bulk"
              className="btn-secondary"
            >
              <Upload size={16} className="mr-2" />
              Bulk Entry
            </Link>

            <button
              onClick={openCreate}
              className="btn-primary"
            >
              <Plus size={16} className="mr-2" />
              Add Teacher
            </button>
          </div>
        </div>

        {/* TABLE */}
        {filtered.length === 0 ? (
          <EmptyState
            title="No Teachers Found"
            description="Start by adding teachers or importing bulk data"
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-slate-300">
                <tr>
                  <th className="p-3 text-left">
                    Name
                  </th>
                  <th className="p-3 text-left">
                    Email
                  </th>
                  <th className="p-3 text-left">
                    Employee ID
                  </th>
                  <th className="p-3 text-left">
                    Subjects
                  </th>
                  <th className="p-3 text-left">
                    Classes
                  </th>
                  <th className="p-3 text-left">
                    Status
                  </th>
                  <th className="p-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((t) => {
                  const user = t.userId as any;

                  return (
                    <tr
                      key={t._id}
                      className="border-t border-white/10 hover:bg-white/5"
                    >
                      <td className="p-3 font-medium">
                        {user?.firstName}{" "}
                        {user?.lastName}
                      </td>

                      <td className="p-3">
                        {user?.email}
                      </td>

                      <td className="p-3">
                        {t.employeeId}
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {(t.subjectIds || [])
                            .slice(0, 2)
                            .map((s: any) => (
                              <span
                                key={s._id}
                                className="px-2 py-1 text-xs rounded bg-cyan-500/10 text-cyan-300"
                              >
                                {s.name}
                              </span>
                            ))}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {(t.classIds || [])
                            .slice(0, 2)
                            .map((c: any) => (
                              <span
                                key={c._id}
                                className="px-2 py-1 text-xs rounded bg-purple-500/10 text-purple-300"
                              >
                                {c.name}
                              </span>
                            ))}
                        </div>
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            user?.isActive
                              ? "bg-green-500/10 text-green-300"
                              : "bg-red-500/10 text-red-300"
                          }`}
                        >
                          {user?.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              openEdit(t)
                            }
                            className="text-blue-400"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                t._id
                              )
                            }
                            className="text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* MODAL */}
      <Modal
        open={open}
        title={
          selected
            ? "Edit Teacher"
            : "Add Teacher"
        }
        description="Manage teacher profile and assignments"
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
      >
        <TeacherForm
          values={form}
          classes={classes}
          subjects={subjects}
          onChange={updateForm}
          onSubmit={handleSave}
          submitting={submitting}
          submitLabel="Save Teacher"
        />

        {actionError && (
          <p className="mt-3 text-sm text-red-400">
            {actionError}
          </p>
        )}
      </Modal>
    </>
  );
}