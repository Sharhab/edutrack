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

/* =================
   API STUDENT SHAPE
================= */

type ParentStudent = {
  _id?: string;
  id?: string;
  admissionNumber?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
};

/* =================
   HELPERS
================= */

/**
 * The parent API may return studentIds as:
 *
 * ["studentId1", "studentId2"]
 *
 * OR populated objects:
 *
 * [
 *   {
 *     _id: "...",
 *     admissionNumber: "0090",
 *     firstName: "shafa",
 *     lastName: "shafa",
 *     fullName: "shafa shafa"
 *   }
 * ]
 *
 * Normalize both forms so the UI remains compatible.
 */
function getParentStudents(parent: Parent): ParentStudent[] {
  const rawStudentIds = (parent as any)?.studentIds;

  if (!Array.isArray(rawStudentIds)) {
    return [];
  }

  return rawStudentIds
    .map((student: string | ParentStudent) => {
      if (typeof student === "string") {
        return {
          _id: student,
          id: student,
        };
      }

      return student || {};
    })
    .filter(
      (student: ParentStudent) =>
        !!student._id || !!student.id
    );
}

/**
 * Safely get the student ID whether the API returns
 * a string or a populated student object.
 */
function getStudentId(
  student: string | ParentStudent
): string {
  if (typeof student === "string") {
    return student;
  }

  return student?._id || student?.id || "";
}

/**
 * Some APIs return parent user information directly:
 *
 * firstName
 * lastName
 * email
 * phone
 *
 * while another response shape may return:
 *
 * userId: {
 *   firstName,
 *   lastName,
 *   email,
 *   ...
 * }
 *
 * Support both without changing the backend contract.
 */
function getParentUser(parent: Parent) {
  const raw = parent as any;

  return {
    firstName:
      raw.firstName ||
      raw.userId?.firstName ||
      "",

    lastName:
      raw.lastName ||
      raw.userId?.lastName ||
      "",

    email:
      raw.email ||
      raw.userId?.email ||
      "",

    phone:
      raw.phone ||
      raw.userId?.phone ||
      "",

    isActive:
      raw.isActive ??
      raw.userId?.isActive ??
      true,
  };
}

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

  const [form, setForm] =
    useState<ParentFormValues>(initialForm);

  const [selectedParent, setSelectedParent] =
    useState<Parent | null>(null);

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
          err.response?.data?.message ||
            "Failed to load parents."
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
      console.error(
        "Failed to load students",
        err
      );
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
      const user = getParentUser(p);

      const studentNames = getParentStudents(p)
        .map(
          (student) =>
            student.fullName ||
            `${student.firstName || ""} ${
              student.lastName || ""
            }`
        )
        .join(" ");

      return (
        `${user.firstName} ${user.lastName}`
          .toLowerCase()
          .includes(q) ||
        user.email
          .toLowerCase()
          .includes(q) ||
        user.phone
          .toLowerCase()
          .includes(q) ||
        studentNames
          .toLowerCase()
          .includes(q)
      );
    });
  }, [parents, search]);

  /* ================= FORM UPDATE ================= */

  function updateForm(
    field: keyof ParentFormValues,
    value: any
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  /* ================= STUDENT TOGGLE ================= */

  function toggleStudent(studentId: string) {
    setForm((prev) => {
      const exists =
        prev.studentIds.includes(studentId);

      return {
        ...prev,
        studentIds: exists
          ? prev.studentIds.filter(
              (id) => id !== studentId
            )
          : [...prev.studentIds, studentId],
      };
    });
  }

  /* ================= RESET ================= */

  function resetForm() {
    setForm({
      ...initialForm,
      studentIds: [],
    });

    setSelectedParent(null);
    setActionError("");
  }

  /* ================= CREATE ================= */

  async function handleCreate() {
    try {
      setSubmitting(true);
      setActionError("");

      if (
        !form.firstName.trim() ||
        !form.lastName.trim() ||
        !form.email.trim() ||
        !form.password.trim()
      ) {
        setActionError(
          "Required fields missing"
        );
        return;
      }

      const created =
        await createParent(form);

      setParents((prev) => [
        created,
        ...prev,
      ]);

      setCreateOpen(false);
      resetForm();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message ||
            "Failed to create parent."
        );
      } else {
        setActionError(
          "Failed to create parent."
        );
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

      const updated =
        await updateParent(
          selectedParent._id,
          form
        );

      setParents((prev) =>
        prev.map((p) =>
          p._id === selectedParent._id
            ? updated
            : p
        )
      );

      setEditOpen(false);
      resetForm();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message ||
            "Failed to update parent."
        );
      } else {
        setActionError(
          "Failed to update parent."
        );
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
      setActionError("");

      await deleteParent(
        selectedParent._id
      );

      setParents((prev) =>
        prev.filter(
          (p) =>
            p._id !== selectedParent._id
        )
      );

      setDeleteOpen(false);
      resetForm();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message ||
            "Failed to delete parent."
        );
      } else {
        setActionError(
          "Failed to delete parent."
        );
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

  /* ================= UI ================= */

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
                <Plus
                  size={16}
                  className="mr-2"
                />
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
                placeholder="Search by name, email, phone, student..."
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

              {filteredParents.map((p) => {
                const user =
                  getParentUser(p);

                const parentStudents =
                  getParentStudents(p);

                return (
                  <div
                    key={p._id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between gap-4"
                  >

                    {/* PARENT INFORMATION */}
                    <div className="min-w-0 flex-1">

                      <div className="flex items-center gap-2">
                        <p className="font-bold">
                          {user.firstName}{" "}
                          {user.lastName}
                        </p>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            user.isActive
                              ? "bg-green-500/10 text-green-300 border border-green-500/20"
                              : "bg-red-500/10 text-red-300 border border-red-500/20"
                          }`}
                        >
                          {user.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>

                      {user.email && (
                        <p className="text-sm text-slate-400 mt-1">
                          {user.email}
                        </p>
                      )}

                      {user.phone && (
                        <p className="text-xs text-slate-500 mt-1">
                          {user.phone}
                        </p>
                      )}

                      {/* STUDENTS */}
                      <div className="mt-3">
                        <p className="text-xs text-slate-500 mb-1">
                          Students (
                          {parentStudents.length})
                        </p>

                        {parentStudents.length ===
                        0 ? (
                          <p className="text-xs text-slate-600">
                            No students linked
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {parentStudents.map(
                              (student, index) => {
                                const name =
                                  student.fullName ||
                                  `${student.firstName || ""} ${
                                    student.lastName || ""
                                  }`.trim();

                                return (
                                  <span
                                    key={
                                      student._id ||
                                      student.id ||
                                      index
                                    }
                                    className="text-xs px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300"
                                    title={
                                      student.admissionNumber
                                        ? `Admission: ${student.admissionNumber}`
                                        : undefined
                                    }
                                  >
                                    {name ||
                                      student.admissionNumber ||
                                      "Student"}
                                  </span>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedParent(p);

                          /*
                           * Convert populated student
                           * objects back into IDs for
                           * the edit form.
                           */
                          const rawStudents =
                            Array.isArray(
                              (p as any)
                                ?.studentIds
                            )
                              ? (p as any)
                                  .studentIds
                              : [];

                          const studentIds =
                            rawStudents
                              .map(
                                (
                                  student:
                                    | string
                                    | ParentStudent
                                ) =>
                                  getStudentId(
                                    student
                                  )
                              )
                              .filter(Boolean);

                          setForm({
                            firstName:
                              user.firstName ||
                              "",
                            lastName:
                              user.lastName ||
                              "",
                            email:
                              user.email ||
                              "",
                            phone:
                              user.phone ||
                              "",
                            password: "",

                            occupation:
                              (p as any)
                                .occupation ||
                              "",

                            address:
                              (p as any)
                                .address ||
                              "",

                            relationshipToStudent:
                              (p as any)
                                .relationshipToStudent ||
                              "",

                            studentIds,
                          });

                          setActionError("");
                          setEditOpen(true);
                        }}
                        className="btn-secondary"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => {
                          setSelectedParent(p);
                          setActionError("");
                          setDeleteOpen(true);
                        }}
                        className="btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}

            </div>
          )}
        </SectionCard>
      </div>

      {/* CREATE MODAL */}
      <Modal
        open={createOpen}
        title="Create Parent"
        onClose={() =>
          setCreateOpen(false)
        }
      >
        <div className="space-y-3">

          {actionError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {actionError}
            </div>
          )}

          <FormInput
            name="firstName"
            label="First Name"
            value={form.firstName}
            onChange={(v) =>
              updateForm(
                "firstName",
                v
              )
            }
          />

          <FormInput
            name="lastName"
            label="Last Name"
            value={form.lastName}
            onChange={(v) =>
              updateForm(
                "lastName",
                v
              )
            }
          />

          <FormInput
            name="email"
            label="Email"
            value={form.email}
            onChange={(v) =>
              updateForm(
                "email",
                v
              )
            }
          />

          <FormInput
            name="password"
            label="Password"
            value={form.password}
            onChange={(v) =>
              updateForm(
                "password",
                v
              )
            }
          />

          <FormInput
            name="phone"
            label="Phone"
            value={form.phone}
            onChange={(v) =>
              updateForm(
                "phone",
                v
              )
            }
          />

          {/* STUDENTS */}
          <div>
            <p className="text-sm text-slate-300 mb-2">
              Link Students
            </p>

            {loadingOptions ? (
              <div className="text-sm text-slate-500">
                Loading students...
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {students.map((s) => (
                  <div
                    key={s._id}
                    onClick={() =>
                      toggleStudent(s._id)
                    }
                    className={`p-2 rounded-lg cursor-pointer transition ${
                      form.studentIds.includes(
                        s._id
                      )
                        ? "bg-green-600"
                        : "bg-white/10 hover:bg-white/15"
                    }`}
                  >
                    {s.firstName}{" "}
                    {s.lastName}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleCreate}
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting
              ? "Creating..."
              : "Create Parent"}
          </button>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        open={editOpen}
        title="Edit Parent"
        onClose={() =>
          setEditOpen(false)
        }
      >
        <div className="space-y-3">

          {actionError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {actionError}
            </div>
          )}

          <FormInput
            name="firstName"
            label="First Name"
            value={form.firstName}
            onChange={(v) =>
              updateForm(
                "firstName",
                v
              )
            }
          />

          <FormInput
            name="lastName"
            label="Last Name"
            value={form.lastName}
            onChange={(v) =>
              updateForm(
                "lastName",
                v
              )
            }
          />

          <FormInput
            name="phone"
            label="Phone"
            value={form.phone}
            onChange={(v) =>
              updateForm(
                "phone",
                v
              )
            }
          />

          {/* EDIT STUDENTS */}
          <div>
            <p className="text-sm text-slate-300 mb-2">
              Linked Students
            </p>

            {loadingOptions ? (
              <div className="text-sm text-slate-500">
                Loading students...
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {students.map((s) => (
                  <div
                    key={s._id}
                    onClick={() =>
                      toggleStudent(s._id)
                    }
                    className={`p-2 rounded-lg cursor-pointer transition ${
                      form.studentIds.includes(
                        s._id
                      )
                        ? "bg-green-600"
                        : "bg-white/10 hover:bg-white/15"
                    }`}
                  >
                    {s.firstName}{" "}
                    {s.lastName}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleEdit}
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        open={deleteOpen}
        title="Delete Parent"
        onClose={() =>
          setDeleteOpen(false)
        }
      >
        <div className="space-y-3">

          {actionError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {actionError}
            </div>
          )}

          <p className="text-sm text-slate-400">
            Are you sure you want to delete{" "}
            <span className="text-white font-medium">
              {selectedParent
                ? `${getParentUser(
                    selectedParent
                  ).firstName} ${getParentUser(
                    selectedParent
                  ).lastName}`
                : "this parent"}
            </span>
            ?
          </p>

          <button
            onClick={handleDelete}
            disabled={submitting}
            className="btn-danger w-full"
          >
            {submitting
              ? "Deleting..."
              : "Delete"}
          </button>
        </div>
      </Modal>
    </>
  );
}
