
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  resetTeacherPassword,
} from "../../../../lib/teachers";

import {
  getClassOptions,
  getSubjectOptions,
} from "../../../../lib/options";

import type {
  Teacher,
  TeacherFormValues,
} from "../../../../types/teacher";

import type {
  ClassOption,
  SubjectOption,
} from "../../../../types/options";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Upload,
  KeyRound,
  Copy,
  RefreshCw,
  Users,
  AlertCircle,
  CheckCircle2,
  X,
  Mail,
} from "lucide-react";

const initialForm: TeacherFormValues = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  phone: "",
  employeeId: "",
  qualification: "",
  designation: "",
  dateOfBirth: "",
  employmentType: "full_time",
  employmentDate: "",
  subjectIds: [],
  classIds: [],
  gender: "male",
  address: "",
  isActive: true,
  status: "active",
  password: "",
  maritalStatus: "",
  stateOfOrigin: "",
  lga: "",
  nationality: "Nigerian",
  staffCategory: "",
  emergencyName: "",
  emergencyPhone: "",
  bloodGroup: "",
  genotype: "",
  nin: "",
  photo: "",
};

type PopulatedUser = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
};

function getUser(teacher: Teacher): PopulatedUser {
  return (teacher.userId || {}) as PopulatedUser;
}

function getTeacherName(teacher: Teacher) {
  const user = getUser(teacher);

  return [
    user.firstName || teacher.firstName,
    teacher.middleName,
    user.lastName || teacher.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function getTeacherEmail(teacher: Teacher) {
  const user = getUser(teacher);
  return user.email || teacher.email || "";
}

function isTeacherActive(teacher: Teacher) {
  const user = getUser(teacher);

  if (teacher.status === "inactive") return false;

  return Boolean(user.isActive ?? teacher.isActive ?? true);
}

function generateSecurePassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "@#$!";

  const all = upper + lower + numbers + symbols;
  const random = new Uint32Array(16);

  if (!globalThis.crypto?.getRandomValues) {
    throw new Error(
      "Secure password generation is unavailable in this browser."
    );
  }

  crypto.getRandomValues(random);

  const characters = Array.from(
    random,
    (value) => all[value % all.length]
  );

  // Ensure the password contains each character category.
  characters[0] = upper[random[0] % upper.length];
  characters[1] = lower[random[1] % lower.length];
  characters[2] = numbers[random[2] % numbers.length];
  characters[3] = symbols[random[3] % symbols.length];

  // Securely shuffle the generated characters.
  const shuffleValues = new Uint32Array(characters.length);
  crypto.getRandomValues(shuffleValues);

  for (let i = characters.length - 1; i > 0; i--) {
    const j = shuffleValues[i] % (i + 1);
    [characters[i], characters[j]] = [
      characters[j],
      characters[i],
    ];
  }

  return characters.join("");
}

export default function TeachersPage() {
  const [items, setItems] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Teacher | null>(null);
  const [form, setForm] = useState<TeacherFormValues>(initialForm);

  const [resetTarget, setResetTarget] = useState<Teacher | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");

      const [teachersData, classData, subjectData] = await Promise.all([
        getTeachers({ search: "" }),
        getClassOptions(),
        getSubjectOptions(),
      ]);

      setItems(teachersData || []);
      setClasses(classData || []);
      setSubjects(subjectData || []);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;

      setPageError(message || "Unable to load teachers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return items;

    return items.filter((teacher) => {
      const user = getUser(teacher);

      const name = getTeacherName(teacher).toLowerCase();
      const email = getTeacherEmail(teacher).toLowerCase();

      return (
        name.includes(query) ||
        email.includes(query) ||
        (teacher.employeeId || "").toLowerCase().includes(query) ||
        (user.phone || teacher.phone || "").toLowerCase().includes(query)
      );
    });
  }, [items, search]);

  const activeCount = useMemo(
    () => items.filter(isTeacherActive).length,
    [items]
  );

  const inactiveCount = items.length - activeCount;

  function updateForm(
    field: keyof TeacherFormValues,
    value: unknown
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm({ ...initialForm });
    setSelected(null);
    setActionError("");
  }

  function openCreate() {
    resetForm();
    setNotice("");
    setOpen(true);
  }

  function openEdit(teacher: Teacher) {
    const user = getUser(teacher);

    setSelected(teacher);
    setActionError("");
    setNotice("");

    setForm({
      ...initialForm,
      firstName: user.firstName || teacher.firstName || "",
      middleName: teacher.middleName || "",
      lastName: user.lastName || teacher.lastName || "",
      email: user.email || teacher.email || "",
      phone: user.phone || teacher.phone || "",
      employeeId: teacher.employeeId || "",
      qualification: teacher.qualification || "",
      designation: teacher.designation || "",
      subjectIds: (teacher.subjectIds || []).map(
        (item: any) => item._id || item
      ),
      classIds: (teacher.classIds || []).map(
        (item: any) => item._id || item
      ),
      gender: teacher.gender || "male",
      address: teacher.address || "",
      dateOfBirth: teacher.dateOfBirth
        ? String(teacher.dateOfBirth).substring(0, 10)
        : "",
      employmentDate: teacher.employmentDate
        ? String(teacher.employmentDate).substring(0, 10)
        : "",
      employmentType: teacher.employmentType || "full_time",
      isActive: isTeacherActive(teacher),
      status: isTeacherActive(teacher) ? "active" : "inactive",
      password: "",
    });

    setOpen(true);
  }

  async function handleSave() {
    try {
      setSubmitting(true);
      setActionError("");

      const payload: TeacherFormValues = {
        ...form,
        status: form.isActive ? "active" : "inactive",
      };

      if (selected?._id) {
        await updateTeacher(selected._id, payload);
        setNotice("Teacher updated successfully.");
      } else {
        await createTeacher(payload);
        setNotice("Teacher created successfully.");
      }

      setOpen(false);
      resetForm();

      await loadData();
    } catch (error: any) {
      setActionError(
        error?.response?.data?.message || "Unable to save teacher."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(teacher: Teacher) {
    const name = getTeacherName(teacher) || "this teacher";

    if (
      !window.confirm(
        `Delete ${name}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setNotice("");
      setPageError("");
      await deleteTeacher(teacher._id);
      setNotice(`${name} was deleted successfully.`);
      await loadData();
    } catch (error: any) {
      setNotice(
        error?.response?.data?.message || "Unable to delete teacher."
      );
    }
  }

  function openResetModal(teacher: Teacher) {
    setResetTarget(teacher);
    setResetError("");
    setResetSuccess(false);
    setCopyMessage("");

    if (!isTeacherActive(teacher)) {
      setTemporaryPassword("");
      setResetError(
        "This teacher is inactive. Activate the teacher's account before resetting the password."
      );
      return;
    }

    try {
      // Generate immediately so Reset Password is available on opening.
      setTemporaryPassword(generateSecurePassword());
    } catch (error: any) {
      setTemporaryPassword("");
      setResetError(
        error?.message || "Unable to generate a secure password."
      );
    }
  }

  function regeneratePassword() {
    try {
      setTemporaryPassword(generateSecurePassword());
      setResetError("");
      setResetSuccess(false);
      setCopyMessage("");
    } catch (error: any) {
      setResetError(
        error?.message || "Unable to generate a secure password."
      );
    }
  }

  async function handleResetPassword() {
    if (!resetTarget?._id) {
      setResetError("Select a teacher first.");
      return;
    }

    if (!isTeacherActive(resetTarget)) {
      setResetError(
        "Activate this teacher's account before resetting the password."
      );
      return;
    }

    if (temporaryPassword.length < 12) {
      setResetError("Enter a password containing at least 12 characters.");
      return;
    }

    try {
      setResetSubmitting(true);
      setResetError("");
      setCopyMessage("");

      await resetTeacherPassword(
        resetTarget._id,
        temporaryPassword
      );

      setResetSuccess(true);
    } catch (error: any) {
      setResetError(
        error?.response?.data?.message ||
          "Password reset failed. The existing password has not been confirmed as changed."
      );
    } finally {
      setResetSubmitting(false);
    }
  }

  async function copyTemporaryPassword() {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopyMessage("Password copied. Share it privately with the teacher.");
    } catch {
      setCopyMessage(
        "Automatic copying failed. Select the password field and copy it manually."
      );
    }
  }

  function closeResetModal() {
    if (resetSubmitting) return;

    setResetTarget(null);
    setTemporaryPassword("");
    setResetError("");
    setResetSuccess(false);
    setCopyMessage("");
  }

  if (loading) return <PageLoader />;

  if (pageError) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="Unable to load teachers"
          description={pageError}
        />

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => void loadData()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Teachers"
        subtitle="Manage teacher profiles, assignments and account access."
      >
        {/* Overview */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">Total teachers</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {items.length}
                </p>
              </div>
              <Users className="text-cyan-400" size={22} />
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-sm text-slate-400">Active accounts</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-400">
              {activeCount}
            </p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-sm text-slate-400">Inactive accounts</p>
            <p className="mt-1 text-2xl font-semibold text-amber-400">
              {inactiveCount}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email or employee ID..."
              aria-label="Search teachers"
              className="input w-full pl-10"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/school-admin/teachers/bulk"
              className="btn-secondary inline-flex items-center justify-center"
            >
              <Upload size={16} className="mr-2" />
              Bulk Entry
            </Link>

            <button
              type="button"
              onClick={openCreate}
              className="btn-primary inline-flex items-center justify-center"
            >
              <Plus size={17} className="mr-2" />
              Add Teacher
            </button>
          </div>
        </div>

        {notice && (
          <div
            role="status"
            className="mb-4 flex items-start gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-sm text-cyan-200"
          >
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span className="flex-1">{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState
            title={search ? "No matching teachers" : "No teachers yet"}
            description={
              search
                ? "Try a different name, email or employee ID."
                : "Add your first teacher or import teacher records using Bulk Entry."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Teacher</th>
                  <th className="px-4 py-3">Employee ID</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Gender</th>
                  <th className="px-4 py-3">Qualification</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Subjects</th>
                  <th className="px-4 py-3">Classes</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {filtered.map((teacher) => {
                  const user = getUser(teacher);
                  const active = isTeacherActive(teacher);

                  return (
                    <tr
                      key={teacher._id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">
                          {getTeacherName(teacher) || "Unnamed teacher"}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                          <Mail size={12} />
                          {getTeacherEmail(teacher) || "No email"}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-slate-300">
                        {teacher.employeeId || "—"}
                      </td>

                      <td className="px-4 py-3 text-slate-300">
                        {user.phone || teacher.phone || "—"}
                      </td>

                      <td className="px-4 py-3 capitalize text-slate-300">
                        {teacher.gender || "—"}
                      </td>

                      <td className="px-4 py-3 text-slate-300">
                        {teacher.qualification || "—"}
                      </td>

                      <td className="px-4 py-3 text-slate-300">
                        {teacher.designation || "—"}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex max-w-40 flex-wrap gap-1">
                          {(teacher.subjectIds || []).length === 0 ? (
                            <span className="text-slate-500">—</span>
                          ) : (
                            <>
                              {(teacher.subjectIds || [])
                                .slice(0, 2)
                                .map((subject: any, index: number) => (
                                  <span
                                    key={subject._id || subject || index}
                                    className="rounded-md bg-cyan-500/10 px-2 py-1 text-xs text-cyan-300"
                                  >
                                    {subject.name || subject.code || "Subject"}
                                  </span>
                                ))}

                              {teacher.subjectIds.length > 2 && (
                                <span className="text-xs text-slate-400">
                                  +{teacher.subjectIds.length - 2}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex max-w-40 flex-wrap gap-1">
                          {(teacher.classIds || []).length === 0 ? (
                            <span className="text-slate-500">—</span>
                          ) : (
                            <>
                              {(teacher.classIds || [])
                                .slice(0, 2)
                                .map((classItem: any, index: number) => (
                                  <span
                                    key={classItem._id || classItem || index}
                                    className="rounded-md bg-purple-500/10 px-2 py-1 text-xs text-purple-300"
                                  >
                                    {classItem.name || classItem.level || "Class"}
                                  </span>
                                ))}

                              {teacher.classIds.length > 2 && (
                                <span className="text-xs text-slate-400">
                                  +{teacher.classIds.length - 2}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                            active
                              ? "bg-emerald-500/10 text-emerald-300"
                              : "bg-amber-500/10 text-amber-300"
                          }`}
                        >
                          {active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            title={
                              active
                                ? "Reset teacher password"
                                : "Activate teacher before resetting password"
                            }
                            aria-label={`Reset password for ${getTeacherName(teacher)}`}
                            onClick={() => openResetModal(teacher)}
                            className={`rounded-lg p-2 transition ${
                              active
                                ? "text-amber-300 hover:bg-amber-500/10"
                                : "text-slate-500 hover:bg-white/5"
                            }`}
                          >
                            <KeyRound size={17} />
                          </button>

                          <button
                            type="button"
                            title="Edit teacher"
                            aria-label={`Edit ${getTeacherName(teacher)}`}
                            onClick={() => openEdit(teacher)}
                            className="rounded-lg p-2 text-cyan-300 transition hover:bg-cyan-500/10"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            title="Delete teacher"
                            aria-label={`Delete ${getTeacherName(teacher)}`}
                            onClick={() => void handleDelete(teacher)}
                            className="rounded-lg p-2 text-red-300 transition hover:bg-red-500/10"
                          >
                            <Trash2 size={17} />
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

        <p className="mt-3 text-xs text-slate-500">
          Showing {filtered.length} of {items.length} teachers
        </p>
      </SectionCard>

      {/* Add / Edit Teacher */}
      <Modal
        open={open}
        title={selected ? "Edit Teacher" : "Add Teacher"}
        description={
          selected
            ? "Update this teacher's profile and assignments."
            : "Create a teacher account and configure their profile."
        }
        onClose={() => {
          if (submitting) return;
          setOpen(false);
          resetForm();
        }}
      >
        <div className="space-y-4">
          <TeacherForm
            values={form}
            classes={classes}
            subjects={subjects}
            onChange={updateForm}
            onSubmit={handleSave}
            submitting={submitting}
            submitLabel={selected ? "Save Changes" : "Create Teacher"}
          />

          {actionError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              {actionError}
            </div>
          )}
        </div>
      </Modal>

      {/* Reset Password */}
      <Modal
        open={Boolean(resetTarget)}
        title="Reset Teacher Password"
        description="Set a new password for the selected teacher account."
        onClose={closeResetModal}
      >
        {resetTarget && (
          <div className="space-y-5">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                  <KeyRound size={20} />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-white">
                    {getTeacherName(resetTarget) || "Teacher"}
                  </p>
                  <p className="mt-1 break-all text-sm text-slate-400">
                    {getTeacherEmail(resetTarget) || "No email address"}
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs ${
                      isTeacherActive(resetTarget)
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {isTeacherActive(resetTarget)
                      ? "Active account"
                      : "Inactive account"}
                  </span>
                </div>
              </div>
            </div>

            {!resetSuccess && isTeacherActive(resetTarget) && (
              <div className="space-y-2">
                <label
                  htmlFor="temporary-password"
                  className="block text-sm font-medium text-slate-200"
                >
                  New temporary password
                </label>

                <div className="flex gap-2">
                  <input
                    id="temporary-password"
                    type="text"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={temporaryPassword}
                    onChange={(event) => {
                      setTemporaryPassword(event.target.value);
                      setResetError("");
                      setCopyMessage("");
                    }}
                    disabled={resetSubmitting}
                    className="input min-w-0 flex-1 font-mono text-sm"
                    placeholder="Enter a password"
                  />

                  <button
                    type="button"
                    onClick={regeneratePassword}
                    disabled={resetSubmitting}
                    title="Generate a new password"
                    aria-label="Generate a new password"
                    className="inline-flex shrink-0 items-center justify-center rounded-lg border border-white/10 px-3 text-cyan-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>

                <p className="text-xs text-slate-400">
                  A secure 16-character password is generated automatically.
                  You can regenerate or edit it. Minimum length: 12 characters.
                </p>

                {temporaryPassword.length > 0 &&
                  temporaryPassword.length < 12 && (
                    <p className="text-xs text-amber-300">
                      Add at least {12 - temporaryPassword.length} more
                      character(s) to enable the reset.
                    </p>
                  )}
              </div>
            )}

            {resetError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300"
              >
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2
                    size={20}
                    className="mt-0.5 shrink-0 text-emerald-400"
                  />
                  <div>
                    <p className="font-semibold text-emerald-300">
                      Password reset successfully
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      The new password has been saved. Share it privately
                      with the teacher.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    readOnly
                    aria-label="New temporary password"
                    value={temporaryPassword}
                    className="input min-w-0 flex-1 font-mono text-sm"
                    onFocus={(event) => event.currentTarget.select()}
                  />

                  <button
                    type="button"
                    onClick={() => void copyTemporaryPassword()}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-cyan-300 transition hover:bg-white/5"
                  >
                    <Copy size={16} />
                    Copy
                  </button>
                </div>

                {copyMessage && (
                  <p role="status" className="text-xs text-slate-300">
                    {copyMessage}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeResetModal}
                disabled={resetSubmitting}
                className="btn-secondary inline-flex items-center justify-center"
              >
                {resetSuccess ? "Done" : "Cancel"}
              </button>

              {!resetSuccess && isTeacherActive(resetTarget) && (
                <button
                  type="button"
                  onClick={() => void handleResetPassword()}
                  disabled={
                    resetSubmitting ||
                    temporaryPassword.length < 12
                  }
                  className="btn-primary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resetSubmitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <KeyRound size={16} />
                      Reset Password
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
