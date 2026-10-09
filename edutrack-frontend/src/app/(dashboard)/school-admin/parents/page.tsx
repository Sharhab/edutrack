
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

import type { ParentFormValues } from "../../../../types/parent-portal";
import type { Student } from "../../../../types/student";

import { Plus, Search } from "lucide-react";

/* ================= TYPES ================= */

type ParentUser = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
};

type ParentStudent = {
  _id: string;
  id?: string;
  admissionNumber?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
};

type ParentRecord = {
  _id: string;
  schoolId?: string;
  userId?: ParentUser | string | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  studentIds?: (ParentStudent | string)[];
  occupation?: string;
  address?: string;
  relationshipToStudent?: string;
  createdAt?: string;
  updatedAt?: string;
};

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

/* ================= HELPERS ================= */

function getParentUser(parent: ParentRecord): ParentUser {
  if (parent.userId && typeof parent.userId === "object") {
    return parent.userId;
  }

  return {
    firstName: parent.firstName,
    lastName: parent.lastName,
    email: parent.email,
    isActive: parent.isActive,
  };
}

function getParentStudents(parent: ParentRecord): ParentStudent[] {
  if (!Array.isArray(parent.studentIds)) {
    return [];
  }

  return parent.studentIds.filter(
    (student): student is ParentStudent =>
      typeof student === "object" &&
      student !== null &&
      Boolean(student._id)
  );
}

function getStudentIds(parent: ParentRecord): string[] {
  if (!Array.isArray(parent.studentIds)) {
    return [];
  }

  return parent.studentIds
    .map((student) =>
      typeof student === "string" ? student : student?._id
    )
    .filter((id): id is string => Boolean(id));
}

function displayValue(value?: string | null): string {
  return value?.trim() || "N/A";
}

function getFullName(
  firstName?: string,
  lastName?: string
): string {
  return `${firstName || ""} ${lastName || ""}`.trim();
}

function formatDate(value?: string): string {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ================= PAGE ================= */

export default function ParentsPage() {
  const [parents, setParents] = useState<ParentRecord[]>([]);
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
  const [selectedParent, setSelectedParent] =
    useState<ParentRecord | null>(null);

  /* ================= LOAD PARENTS ================= */

  async function loadParents() {
    try {
      setLoading(true);
      setPageError("");

      const result = await getParents({
        search: search.trim(),
      });

      // Supports either a normalized array or the API response envelope.
      const records = Array.isArray(result)
        ? result
        : Array.isArray((result as any)?.data)
          ? (result as any).data
          : [];

      setParents(records as ParentRecord[]);
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

      const result = await getStudents();

      setStudents(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("Failed to load students:", err);
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
    const query = search.trim().toLowerCase();

    if (!query) return parents;

    return parents.filter((parent) => {
      const user = getParentUser(parent);
      const children = getParentStudents(parent);

      const parentName = getFullName(
        user.firstName,
        user.lastName
      ).toLowerCase();

      const childDetails = children
        .map((student) =>
          [
            student.fullName,
            student.firstName,
            student.lastName,
            student.admissionNumber,
            student._id,
          ]
            .filter(Boolean)
            .join(" ")
        )
        .join(" ")
        .toLowerCase();

      return (
        parentName.includes(query) ||
        (user.email || "").toLowerCase().includes(query) ||
        (parent.phone || "").toLowerCase().includes(query) ||
        (parent.occupation || "").toLowerCase().includes(query) ||
        (parent.address || "").toLowerCase().includes(query) ||
        (parent.relationshipToStudent || "")
          .toLowerCase()
          .includes(query) ||
        childDetails.includes(query)
      );
    });
  }, [parents, search]);

  /* ================= FORM UPDATE ================= */

  function updateForm(
    field: keyof ParentFormValues,
    value: any
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function toggleStudent(studentId: string) {
    setForm((previous) => {
      const exists = previous.studentIds.includes(studentId);

      return {
        ...previous,
        studentIds: exists
          ? previous.studentIds.filter((id) => id !== studentId)
          : [...previous.studentIds, studentId],
      };
    });
  }

  function resetForm() {
    setForm({ ...initialForm, studentIds: [] });
    setSelectedParent(null);
    setActionError("");
  }

  /* ================= OPEN EDIT ================= */

  function openEdit(parent: ParentRecord) {
    const user = getParentUser(parent);

    setSelectedParent(parent);

    setForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: parent.phone || "",
      password: "",
      occupation: parent.occupation || "",
      address: parent.address || "",
      relationshipToStudent:
        parent.relationshipToStudent || "",
      studentIds: getStudentIds(parent),
    });

    setActionError("");
    setEditOpen(true);
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
        !form.password
      ) {
        setActionError(
          "First name, last name, email, and password are required."
        );
        return;
      }

      await createParent(form);

      setCreateOpen(false);
      resetForm();
      await loadParents();
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

      await updateParent(selectedParent._id, form);

      setEditOpen(false);
      resetForm();
      await loadParents();
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
      setActionError("");

      await deleteParent(selectedParent._id);

      setParents((previous) =>
        previous.filter(
          (parent) => parent._id !== selectedParent._id
        )
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

  /* ================= RENDER ================= */

  return (
    <>
      <div className="space-y-6">
        <SectionCard
          title="Parents"
          subtitle="Manage parent accounts, contact details, and linked children"
          rightAction={
            <div className="flex flex-wrap gap-2">
              <Link href="/school-admin/parents/bulk">
                <button type="button" className="btn-secondary">
                  Bulk Upload
                </button>
              </Link>

              <button
                type="button"
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

          <div className="relative mb-5 max-w-md">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-11 text-slate-400"
            />

            <div className="[&_input]:pl-11">
              <FormInput
                name="search"
                label="Search Parents"
                value={search}
                placeholder="Search parent, email, child, admission number..."
                onChange={setSearch}
              />
            </div>
          </div>

          {/* SUMMARY */}

          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Total Parents</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {parents.length}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Active Accounts</p>
              <p className="mt-1 text-2xl font-bold text-green-400">
                {
                  parents.filter(
                    (parent) => getParentUser(parent).isActive === true
                  ).length
                }
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Linked Children</p>
              <p className="mt-1 text-2xl font-bold text-cyan-400">
                {
                  new Set(
                    parents.flatMap((parent) =>
                      getStudentIds(parent)
                    )
                  ).size
                }
              </p>
            </div>
          </div>

          {/* PARENT LIST */}

          {filteredParents.length === 0 ? (
            <EmptyState
              title="No parents found"
              description={
                search
                  ? "Try another search term."
                  : "Create a parent account to get started."
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredParents.map((parent) => {
                const user = getParentUser(parent);
                const children = getParentStudents(parent);

                const parentName =
                  getFullName(user.firstName, user.lastName) ||
                  "Unnamed Parent";

                return (
                  <div
                    key={parent._id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-5">
                        {/* PARENT IDENTITY */}

                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-bold text-white">
                              {parentName}
                            </h3>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                user.isActive === true
                                  ? "bg-green-500/15 text-green-300"
                                  : user.isActive === false
                                    ? "bg-red-500/15 text-red-300"
                                    : "bg-slate-500/15 text-slate-300"
                              }`}
                            >
                              {user.isActive === true
                                ? "Active"
                                : user.isActive === false
                                  ? "Inactive"
                                  : "Status unavailable"}
                            </span>

                            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs text-cyan-300">
                              {children.length}{" "}
                              {children.length === 1
                                ? "child"
                                : "children"}
                            </span>
                          </div>

                          <p className="mt-1 break-all text-sm text-slate-300">
                            {displayValue(user.email)}
                          </p>
                        </div>

                        {/* PARENT DETAILS */}

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          <div>
                            <p className="text-xs text-slate-400">
                              Occupation
                            </p>
                            <p className="mt-1 text-sm text-white">
                              {displayValue(parent.occupation)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">
                              Address
                            </p>
                            <p className="mt-1 break-words text-sm text-white">
                              {displayValue(parent.address)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">
                              Relationship to Student
                            </p>
                            <p className="mt-1 text-sm text-white">
                              {displayValue(
                                parent.relationshipToStudent
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">
                              Account Role
                            </p>
                            <p className="mt-1 text-sm text-white">
                              {displayValue(user.role)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">
                              Parent Record Created
                            </p>
                            <p className="mt-1 text-sm text-white">
                              {formatDate(parent.createdAt)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">
                              Last Updated
                            </p>
                            <p className="mt-1 text-sm text-white">
                              {formatDate(parent.updatedAt)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">
                              Parent Record ID
                            </p>
                            <p className="mt-1 break-all text-xs text-slate-300">
                              {parent._id}
                            </p>
                          </div>
                        </div>

                        {/* LINKED CHILDREN */}

                        <div className="border-t border-white/10 pt-4">
                          <h4 className="mb-3 font-semibold text-white">
                            Linked Children
                          </h4>

                          {children.length === 0 ? (
                            <p className="text-sm text-slate-400">
                              No populated child records are available.
                            </p>
                          ) : (
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                              {children.map((student) => {
                                const studentName =
                                  student.fullName ||
                                  getFullName(
                                    student.firstName,
                                    student.lastName
                                  ) ||
                                  "Unnamed Student";

                                return (
                                  <div
                                    key={student._id}
                                    className="rounded-xl border border-white/10 bg-black/10 p-4"
                                  >
                                    <p className="font-medium text-white">
                                      {studentName}
                                    </p>

                                    <p className="mt-2 text-xs text-slate-400">
                                      Admission Number
                                    </p>

                                    <p className="mt-1 text-sm text-cyan-300">
                                      {displayValue(
                                        student.admissionNumber
                                      )}
                                    </p>

                                    <p className="mt-2 break-all text-xs text-slate-500">
                                      Student ID: {student._id}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ACTIONS */}

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(parent)}
                          className="btn-secondary"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedParent(parent);
                            setActionError("");
                            setDeleteOpen(true);
                          }}
                          className="btn-danger"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ================= CREATE MODAL ================= */}

      <Modal
        open={createOpen}
        title="Create Parent"
        onClose={() => setCreateOpen(false)}
      >
        <div className="max-h-[75vh] space-y-3 overflow-y-auto pr-1">
          {actionError && (
            <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
              {actionError}
            </p>
          )}

          <FormInput
            name="firstName"
            label="First Name"
            value={form.firstName}
            onChange={(value) => updateForm("firstName", value)}
          />

          <FormInput
            name="lastName"
            label="Last Name"
            value={form.lastName}
            onChange={(value) => updateForm("lastName", value)}
          />

          <FormInput
            name="email"
            label="Email"
            value={form.email}
            onChange={(value) => updateForm("email", value)}
          />

          <FormInput
            name="password"
            label="Password"
            value={form.password}
            onChange={(value) => updateForm("password", value)}
          />

          <FormInput
            name="phone"
            label="Phone"
            value={form.phone}
            onChange={(value) => updateForm("phone", value)}
          />

          <FormInput
            name="occupation"
            label="Occupation"
            value={form.occupation}
            onChange={(value) => updateForm("occupation", value)}
          />

          <FormInput
            name="address"
            label="Address"
            value={form.address}
            onChange={(value) => updateForm("address", value)}
          />

          <FormInput
            name="relationshipToStudent"
            label="Relationship to Student"
            value={form.relationshipToStudent}
            onChange={(value) =>
              updateForm("relationshipToStudent", value)
            }
          />

          <div>
            <p className="mb-2 text-sm font-medium text-white">
              Link Students
            </p>

            {loadingOptions ? (
              <p className="text-sm text-slate-400">
                Loading students...
              </p>
            ) : students.length === 0 ? (
              <p className="text-sm text-slate-400">
                No students available.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {students.map((student) => {
                  const selected = form.studentIds.includes(student._id);

                  return (
                    <button
                      type="button"
                      key={student._id}
                      onClick={() => toggleStudent(student._id)}
                      className={`rounded-lg border p-3 text-left text-sm ${
                        selected
                          ? "border-green-400 bg-green-600/20 text-green-200"
                          : "border-white/10 bg-white/5 text-slate-200"
                      }`}
                    >
                      {selected ? "✓ " : ""}
                      {student.firstName} {student.lastName}
                      {student.admissionNumber
                        ? ` (${student.admissionNumber})`
                        : ""}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? "Creating..." : "Create Parent"}
          </button>
        </div>
      </Modal>

      {/* ================= EDIT MODAL ================= */}

      <Modal
        open={editOpen}
        title="Edit Parent"
        onClose={() => setEditOpen(false)}
      >
        <div className="max-h-[75vh] space-y-3 overflow-y-auto pr-1">
          {actionError && (
            <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
              {actionError}
            </p>
          )}

          <FormInput
            name="firstName"
            label="First Name"
            value={form.firstName}
            onChange={(value) => updateForm("firstName", value)}
          />

          <FormInput
            name="lastName"
            label="Last Name"
            value={form.lastName}
            onChange={(value) => updateForm("lastName", value)}
          />

          <FormInput
            name="email"
            label="Email"
            value={form.email}
            onChange={(value) => updateForm("email", value)}
          />

          <FormInput
            name="phone"
            label="Phone"
            value={form.phone}
            onChange={(value) => updateForm("phone", value)}
          />

          <FormInput
            name="occupation"
            label="Occupation"
            value={form.occupation}
            onChange={(value) => updateForm("occupation", value)}
          />

          <FormInput
            name="address"
            label="Address"
            value={form.address}
            onChange={(value) => updateForm("address", value)}
          />

          <FormInput
            name="relationshipToStudent"
            label="Relationship to Student"
            value={form.relationshipToStudent}
            onChange={(value) =>
              updateForm("relationshipToStudent", value)
            }
          />

          <div>
            <p className="mb-2 text-sm font-medium text-white">
              Linked Students
            </p>

            {loadingOptions ? (
              <p className="text-sm text-slate-400">
                Loading students...
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {students.map((student) => {
                  const selected = form.studentIds.includes(student._id);

                  return (
                    <button
                      type="button"
                      key={student._id}
                      onClick={() => toggleStudent(student._id)}
                      className={`rounded-lg border p-3 text-left text-sm ${
                        selected
                          ? "border-green-400 bg-green-600/20 text-green-200"
                          : "border-white/10 bg-white/5 text-slate-200"
                      }`}
                    >
                      {selected ? "✓ " : ""}
                      {student.firstName} {student.lastName}
                      {student.admissionNumber
                        ? ` (${student.admissionNumber})`
                        : ""}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleEdit}
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </Modal>

      {/* ================= DELETE MODAL ================= */}

      <Modal
        open={deleteOpen}
        title="Delete Parent"
        onClose={() => setDeleteOpen(false)}
      >
        <div className="space-y-4">
          {actionError && (
            <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
              {actionError}
            </p>
          )}

          <p className="text-sm text-slate-300">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-white">
              {selectedParent
                ? getFullName(
                    getParentUser(selectedParent).firstName,
                    getParentUser(selectedParent).lastName
                  ) || "this parent"
                : "this parent"}
            </span>
            ?
          </p>

          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            className="btn-danger w-full"
          >
            {submitting ? "Deleting..." : "Delete Parent"}
          </button>
        </div>
      </Modal>
    </>
  );
}
