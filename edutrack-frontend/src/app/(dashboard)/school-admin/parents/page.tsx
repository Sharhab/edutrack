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

/* ================= API TYPES ================= */

type ApiParentStudent = {
  _id: string;
  id?: string;
  admissionNumber?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
};

type ApiParent = {
  _id: string;
  schoolId: string;

  userId?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    role?: string;
    isActive?: boolean;
  };

  studentIds?: ApiParentStudent[];

  occupation?: string;
  address?: string;
  relationshipToStudent?: string;

  createdAt?: string;
  updatedAt?: string;
};

/*
 * Frontend-normalized parent.
 *
 * This is what the page actually consumes.
 */
type ParentView = Parent & {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;

  studentIds: ApiParentStudent[];
};

/* ================= NORMALIZE API RESPONSE ================= */

function normalizeParent(parent: ApiParent): ParentView {
  return {
...(parent as unknown as Parent),
    /*
     * Parent identity comes from userId.
     */
    firstName:
      parent.userId?.firstName || "",

    lastName:
      parent.userId?.lastName || "",

    email:
      parent.userId?.email || "",

    phone:
      parent.userId?.phone || "",

    isActive:
      parent.userId?.isActive ?? true,

    /*
     * Keep the populated student objects.
     */
    studentIds:
      Array.isArray(parent.studentIds)
        ? parent.studentIds
        : [],
  } as ParentView;
}

/* ================= STUDENT ID HELPER ================= */

function getStudentId(
  student: ApiParentStudent | string
): string {
  if (typeof student === "string") {
    return student;
  }

  return student._id || student.id || "";
}

/* ================= COMPONENT ================= */

export default function ParentsPage() {
  const [parents, setParents] =
    useState<ParentView[]>([]);

  const [students, setStudents] =
    useState<Student[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingOptions, setLoadingOptions] =
    useState(true);

  const [pageError, setPageError] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [createOpen, setCreateOpen] =
    useState(false);

  const [editOpen, setEditOpen] =
    useState(false);

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [form, setForm] =
    useState<ParentFormValues>(
      initialForm
    );

  const [selectedParent, setSelectedParent] =
    useState<ParentView | null>(null);

  /* ================= LOAD PARENTS ================= */

  async function loadParents() {
    try {
      setLoading(true);
      setPageError("");

      const result = await getParents({
        search: search.trim(),
      });

      /*
       * IMPORTANT:
       *
       * getParents() is returning:
       *
       * {
       *   userId: {
       *     firstName,
       *     lastName,
       *     email,
       *     isActive
       *   },
       *   studentIds: [...]
       * }
       *
       * Normalize that response before
       * giving it to the UI.
       */
      const normalized = (
        (result || []) as unknown as ApiParent[]
      ).map(normalizeParent);

      setParents(normalized);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPageError(
          err.response?.data?.message ||
            "Failed to load parents."
        );
      } else {
        setPageError(
          "Failed to load parents."
        );
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

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    loadParents();
    loadStudents();
  }, []);

  /* ================= FILTER ================= */

  const filteredParents = useMemo(() => {
    const q = search
      .trim()
      .toLowerCase();

    if (!q) {
      return parents;
    }

    return parents.filter((parent) => {
      const parentName =
        `${parent.firstName} ${parent.lastName}`
          .toLowerCase();

      const email =
        parent.email.toLowerCase();

      const phone =
        parent.phone.toLowerCase();

     const studentText = parent.studentIds
  .map((student) => {
    if (typeof student === "string") {
      return student;
    }

    return [
      student.firstName,
      student.lastName,
      student.fullName,
      student.admissionNumber,
    ]
      .filter(Boolean)
      .join(" ");
  })
  .join(" ")
  .toLowerCase();

      return (
        parentName.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        studentText.includes(q)
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

  function toggleStudent(
    studentId: string
  ) {
    setForm((prev) => {
      const exists =
        prev.studentIds.includes(
          studentId
        );

      return {
        ...prev,

        studentIds: exists
          ? prev.studentIds.filter(
              (id) =>
                id !== studentId
            )
          : [
              ...prev.studentIds,
              studentId,
            ],
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

      /*
       * The create endpoint may return the same
       * populated structure. Normalize it before
       * inserting into the list.
       */
      const normalized =
        normalizeParent(
          created as unknown as ApiParent
        );

      setParents((prev) => [
        normalized,
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
    if (!selectedParent?._id) {
      return;
    }

    try {
      setSubmitting(true);
      setActionError("");

      const updated =
        await updateParent(
          selectedParent._id,
          form
        );

      /*
       * Normalize updated response too.
       */
      const normalized =
        normalizeParent(
          updated as unknown as ApiParent
        );

      setParents((prev) =>
        prev.map((parent) =>
          parent._id ===
          selectedParent._id
            ? normalized
            : parent
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
    if (!selectedParent?._id) {
      return;
    }

    try {
      setSubmitting(true);
      setActionError("");

      await deleteParent(
        selectedParent._id
      );

      setParents((prev) =>
        prev.filter(
          (parent) =>
            parent._id !==
            selectedParent._id
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

  if (loading) {
    return <PageLoader />;
  }

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

              <Link
                href="/school-admin/parents/bulk"
              >
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
                placeholder="Search by name, email, phone or student..."
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

              {filteredParents.map(
                (parent) => {

                  const linkedStudents =
                    Array.isArray(
                      parent.studentIds
                    )
                      ? parent.studentIds
                      : [];

                  return (
                    <div
                      key={parent._id}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between gap-4"
                    >

                      {/* PARENT DATA */}

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center gap-2">

                          <p className="font-bold">
                            {parent.firstName}{" "}
                            {parent.lastName}
                          </p>

                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border ${
                              parent.isActive
                                ? "bg-green-500/10 text-green-300 border-green-500/20"
                                : "bg-red-500/10 text-red-300 border-red-500/20"
                            }`}
                          >
                            {parent.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>

                        </div>

                        <p className="text-sm text-slate-400 mt-1">
                          {parent.email ||
                            "No email"}
                        </p>

                        {parent.phone && (
                          <p className="text-xs text-slate-500 mt-1">
                            {parent.phone}
                          </p>
                        )}

                        {/* STUDENTS */}

                        <div className="mt-3">

                          <p className="text-xs text-slate-500 mb-2">
                            Linked Students (
                            {
                              linkedStudents.length
                            }
                            )
                          </p>

                          {linkedStudents.length ===
                          0 ? (
                            <p className="text-xs text-slate-600">
                              No students linked
                            </p>
                          ) : (

                            <div className="flex flex-wrap gap-2">

                              {linkedStudents.map(
                                (
                                  student,
                                  index
                                ) => {

                                  const name =
                                    student.fullName ||
                                    `${student.firstName || ""} ${
                                      student.lastName || ""
                                    }`.trim() ||
                                    "Student";

                                  const id =
                                    getStudentId(
                                      student
                                    );

                                  return (
                                    <div
                                      key={
                                        id ||
                                        index
                                      }
                                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20"
                                    >

                                      <div className="text-xs text-cyan-300">
                                        {name}
                                      </div>

                                      {student.admissionNumber && (
                                        <div className="text-[10px] text-slate-500">
                                          Adm:{" "}
                                          {
                                            student.admissionNumber
                                          }
                                        </div>
                                      )}

                                    </div>
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

                            setSelectedParent(
                              parent
                            );

                            /*
                             * IMPORTANT:
                             *
                             * API returns populated
                             * student objects.
                             *
                             * Edit form needs only
                             * their IDs.
                             */
                            const studentIds =
                              linkedStudents
                                .map(
                                  (
                                    student
                                  ) =>
                                    getStudentId(
                                      student
                                    )
                                )
                                .filter(
                                  Boolean
                                );

                            setForm({
                              firstName:
                                parent.firstName ||
                                "",

                              lastName:
                                parent.lastName ||
                                "",

                              email:
                                parent.email ||
                                "",

                              phone:
                                parent.phone ||
                                "",

                              password: "",

                              occupation:
                                parent.occupation ||
                                "",

                              address:
                                parent.address ||
                                "",

                              relationshipToStudent:
                                parent.relationshipToStudent ||
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
                            setSelectedParent(
                              parent
                            );

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
                }
              )}

            </div>
          )}

        </SectionCard>

      </div>

      {/* ================= CREATE MODAL ================= */}

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

                {students.map((student) => (

                  <div
                    key={student._id}
                    onClick={() =>
                      toggleStudent(
                        student._id
                      )
                    }
                    className={`p-2 rounded-lg cursor-pointer transition ${
                      form.studentIds.includes(
                        student._id
                      )
                        ? "bg-green-600"
                        : "bg-white/10 hover:bg-white/15"
                    }`}
                  >
                    {student.firstName}{" "}
                    {student.lastName}
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

      {/* ================= EDIT MODAL ================= */}

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

                {students.map((student) => (

                  <div
                    key={student._id}
                    onClick={() =>
                      toggleStudent(
                        student._id
                      )
                    }
                    className={`p-2 rounded-lg cursor-pointer transition ${
                      form.studentIds.includes(
                        student._id
                      )
                        ? "bg-green-600"
                        : "bg-white/10 hover:bg-white/15"
                    }`}
                  >
                    {student.firstName}{" "}
                    {student.lastName}
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

      {/* ================= DELETE MODAL ================= */}

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
  {selectedParent
    ? `${selectedParent.firstName} ${selectedParent.lastName}`
    : "this parent"}
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
