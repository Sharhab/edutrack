
"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";

import SectionCard from "../../../../components/ui/SectionCard";
import Modal from "../../../../components/ui/Modal";
import PageLoader from "../../../../components/ui/PageLoader";
import EmptyState from "../../../../components/ui/EmptyState";
import FormInput from "../../../../components/ui/FormInput";
import StudentForm from "../../../../components/students/StudentForm";
import StudentsTable from "../../../../components/students/StudentTable";

import {
  createStudent,
  deleteStudent,
  getStudents,
  updateStudent,
  generateStudentLoginAccounts,
  resetStudentPassword,
  type StudentLoginCredential,
} from "../../../../lib/students";

import {
  getClassOptions,
  getParentOptions,
} from "../../../../lib/options";

import type { Student, StudentFormValues } from "../../../../types/student";
import type { ClassOption, ParentOption } from "../../../../types/options";

import {
  Plus,
  Search,
  Upload,
  KeyRound,
  Printer,
  Copy,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const initialForm: StudentFormValues = {
  firstName: "",
  middleName: "",
  lastName: "",
  admissionNumber: "",
  gender: "male",
  dateOfBirth: "",
  classId: "",
  parentId: "",
  email: "",
  phone: "",
  address: "",
  entryType: "new",
  previousSchool: "",
  stateOfOrigin: "",
  lga: "",
  emergencyName: "",
  emergencyPhone: "",
  bloodGroup: "",
  genotype: "",
  nin: "",
  birthCertificateNo: "",
  isActive: "true",
};

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

function getStudentName(student: Student) {
  return [
    student.firstName,
    (student as any).middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function isStudentActive(student: Student) {
  return student.status !== "inactive" && student.status !== "suspended";
}

/**
 * Uses the browser's cryptographically secure random generator.
 * The generated password meets the backend's 12-character minimum.
 */
function generateTemporaryPassword(length = 16) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);

  return Array.from(randomValues)
    .map((value) => chars[value % chars.length])
    .join("");
}

export default function SchoolAdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [parents, setParents] = useState<ParentOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<StudentFormValues>(initialForm);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Student login-account generation
  const [generatingLogins, setGeneratingLogins] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [loginCredentials, setLoginCredentials] = useState<
    StudentLoginCredential[]
  >([]);
  const [hasMoreLogins, setHasMoreLogins] = useState(false);

  // Student password reset
  const [resetTarget, setResetTarget] = useState<Student | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  async function loadStudents() {
    try {
      setLoading(true);
      setPageError("");

      const result = await getStudents({ search: search.trim() });
      setStudents(result || []);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setPageError(
          error.response?.data?.message || "Failed to load students."
        );
      } else {
        setPageError("Failed to load students.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadOptions() {
    try {
      setLoadingOptions(true);

      const [classResults, parentResults] = await Promise.all([
        getClassOptions(),
        getParentOptions(),
      ]);

      setClasses(classResults || []);
      setParents(parentResults || []);
    } catch (error) {
      console.error("Failed to load student form options", error);
    } finally {
      setLoadingOptions(false);
    }
  }

  useEffect(() => {
    void loadStudents();
    void loadOptions();
    // Load the initial student list and form options on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return students;

    return students.filter((student) => {
      const name = getStudentName(student).toLowerCase();

      return (
        name.includes(query) ||
        (student.email || "").toLowerCase().includes(query) ||
        (student.admissionNumber || "").toLowerCase().includes(query) ||
        String(student.className || student.classId || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [students, search]);

  function updateForm(field: keyof StudentFormValues, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setSelectedStudent(null);
    setActionError("");
  }

  function openCreateModal() {
    resetForm();
    setCreateOpen(true);
  }

  function openEditModal(student: Student) {
    setSelectedStudent(student);
    setActionError("");

    setForm({
      ...initialForm,
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      admissionNumber: student.admissionNumber || "",
      gender: student.gender || "male",
      dateOfBirth: student.dateOfBirth
        ? new Date(student.dateOfBirth).toISOString().slice(0, 10)
        : "",
      classId:
        typeof student.classId === "string"
          ? student.classId
          : (student.classId as any)?._id || "",
      parentId:
        typeof student.parentId === "string"
          ? student.parentId
          : (student.parentId as any)?._id || "",
      email: student.email || "",
      phone: student.phone || "",
      address: student.address || "",
      isActive: student.status === "inactive" ? "false" : "true",
    });

    setEditOpen(true);
  }

  function openDeleteModal(student: Student) {
    setSelectedStudent(student);
    setActionError("");
    setDeleteOpen(true);
  }

  function validateForm() {
    if (!form.firstName.trim()) return "First name is required.";
    if (!form.lastName.trim()) return "Last name is required.";
    if (!form.admissionNumber.trim()) {
      return "Admission number is required.";
    }

    return "";
  }

  async function handleCreateStudent() {
    const validationError = validateForm();

    if (validationError) {
      setActionError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setActionError("");

      const created = await createStudent(form);

      setStudents((previous) => [created, ...previous]);
      setCreateOpen(false);
      resetForm();
    } catch (error: unknown) {
      setActionError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "Failed to create student."
          : "Failed to create student."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditStudent() {
    if (!selectedStudent?._id) return;

    const validationError = validateForm();

    if (validationError) {
      setActionError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setActionError("");

      const updated = await updateStudent(selectedStudent._id, form);

      setStudents((previous) =>
        previous.map((student) =>
          student._id === selectedStudent._id ? updated : student
        )
      );

      setEditOpen(false);
      resetForm();
    } catch (error: unknown) {
      setActionError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "Failed to update student."
          : "Failed to update student."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteStudent() {
    if (!selectedStudent?._id) return;

    try {
      setSubmitting(true);
      setActionError("");

      await deleteStudent(selectedStudent._id);

      setStudents((previous) =>
        previous.filter((student) => student._id !== selectedStudent._id)
      );

      setDeleteOpen(false);
      resetForm();
    } catch (error: unknown) {
      setActionError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "Failed to delete student."
          : "Failed to delete student."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGenerateStudentLogins() {
    try {
      setGeneratingLogins(true);
      setLoginError("");
      setLoginMessage("");

      const result = await generateStudentLoginAccounts();

      setLoginCredentials((previous) => {
        const combined = [...previous, ...result.results];

        return combined.filter(
          (item, index, array) =>
            array.findIndex(
              (candidate) => candidate.studentId === item.studentId
            ) === index
        );
      });

      setHasMoreLogins(result.hasMore);
      setLoginMessage(
        `${result.created} new account(s) created. ` +
          `${result.failed} failed. ` +
          `${result.remaining} student(s) remain without accounts.`
      );
    } catch (error: unknown) {
      setLoginError(
        axios.isAxiosError(error)
          ? error.response?.data?.message ||
              "Could not generate student login accounts."
          : "Could not generate student login accounts."
      );
    } finally {
      setGeneratingLogins(false);
    }
  }

  // Reset-password modal helpers
  function openResetModal(student: Student) {
    setResetTarget(student);
    setTemporaryPassword(generateTemporaryPassword());
    setResetSuccess(false);
    setResetError("");
    setCopyMessage("");
  }

  function closeResetModal() {
    if (resetSubmitting) return;

    setResetTarget(null);
    setTemporaryPassword("");
    setResetSuccess(false);
    setResetError("");
    setCopyMessage("");
  }

  function regeneratePassword() {
    setTemporaryPassword(generateTemporaryPassword());
    setResetError("");
    setCopyMessage("");
  }

  async function copyTemporaryPassword() {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopyMessage("Password copied. Share it privately with the student.");
    } catch {
      setCopyMessage(
        "Copy was blocked by the browser. Select the password and copy it manually."
      );
    }
  }

  async function handleResetPassword() {
    if (!resetTarget?._id) return;

    if (
      temporaryPassword.length < MIN_PASSWORD_LENGTH ||
      temporaryPassword.length > MAX_PASSWORD_LENGTH
    ) {
      setResetError(
        `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`
      );
      return;
    }

    if (!isStudentActive(resetTarget)) {
      setResetError("Activate the student before resetting the password.");
      return;
    }

    try {
      setResetSubmitting(true);
      setResetError("");
      setCopyMessage("");

      await resetStudentPassword(resetTarget._id, temporaryPassword);

      // Show the new password only after the API confirms success.
      setResetSuccess(true);
    } catch (error: unknown) {
      setResetError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "Failed to reset student password."
          : "Failed to reset student password."
      );
    } finally {
      setResetSubmitting(false);
    }
  }

  if (loading) {
    return <PageLoader />;
  }

  if (pageError) {
    return (
      <EmptyState
        title="Unable to load students"
        description={pageError}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <SectionCard
          title="Students"
          subtitle="Manage student records, admissions, and profile data"
          rightAction={
            <div className="flex flex-wrap gap-3">
              <Link
                href="/school-admin/students/bulk"
                className="btn-secondary inline-flex items-center justify-center"
              >
                <Plus size={16} className="mr-2" />
                Bulk Entry
              </Link>

              <Link
                href="/school-admin/students/import"
                className="inline-flex items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 px-5 py-3 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20"
              >
                <Upload size={16} className="mr-2" />
                Import Students
              </Link>

              <button
                type="button"
                onClick={openCreateModal}
                className="btn-primary"
              >
                <Plus size={16} className="mr-2" />
                Add Student
              </button>

              <button
                type="button"
                onClick={() => void handleGenerateStudentLogins()}
                disabled={generatingLogins}
                className="btn-secondary inline-flex items-center justify-center disabled:opacity-60"
              >
                <KeyRound size={16} className="mr-2" />
                {generatingLogins
                  ? "Generating..."
                  : "Generate Student Logins"}
              </button>
            </div>
          }
        >
          <div className="mb-5">
            <div className="relative max-w-md">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-11 text-slate-400"
              />
              <div className="[&_input]:pl-11">
                <FormInput
                  label="Search Students"
                  name="search"
                  value={search}
                  placeholder="Search by name, email, admission number..."
                  onChange={setSearch}
                />
              </div>
            </div>
          </div>

          <StudentsTable
            data={filteredStudents}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
            onResetPassword={openResetModal}
          />
        </SectionCard>

        {loginError && (
          <div
            role="alert"
            className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200"
          >
            {loginError}
          </div>
        )}

        {loginMessage && (
          <div
            role="status"
            className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
          >
            {loginMessage}
          </div>
        )}

        {loginCredentials.length > 0 && (
          <SectionCard
            title="New Student Login Credentials"
            subtitle="Temporary passwords are shown only for accounts created in this generation session."
            rightAction={
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-primary inline-flex items-center"
              >
                <Printer size={16} className="mr-2" />
                Print Login Slips
              </button>
            }
          >
            <div
              id="student-login-slips"
              className="grid gap-4 sm:grid-cols-2"
            >
              {loginCredentials
                .filter((item) => item.accountCreated && item.credentials)
                .map((item) => (
                  <div
                    key={item.studentId}
                    className="student-login-slip rounded-xl border border-slate-300 bg-white p-5 text-slate-900"
                  >
                    <h3 className="text-lg font-bold">
                      EduTrack Student Login
                    </h3>

                    <p className="mt-3">
                      <strong>Student:</strong> {item.student}
                    </p>

                    <p>
                      <strong>Admission number:</strong>{" "}
                      {item.credentials?.admissionNumber}
                    </p>

                    <p className="break-all">
                      <strong>Temporary password:</strong>{" "}
                      {item.credentials?.temporaryPassword}
                    </p>

                    <p className="mt-3 text-sm">
                      Log in using your school’s student login page. Change
                      your temporary password after your first login.
                    </p>
                  </div>
                ))}
            </div>

            {hasMoreLogins && (
              <button
                type="button"
                onClick={() => void handleGenerateStudentLogins()}
                disabled={generatingLogins}
                className="btn-secondary mt-5"
              >
                {generatingLogins
                  ? "Generating..."
                  : "Generate Next Batch"}
              </button>
            )}
          </SectionCard>
        )}
      </div>

      {/* Create student */}
      <Modal
        open={createOpen}
        title="Add Student"
        description="Create a new student record"
        onClose={() => {
          if (submitting) return;
          setCreateOpen(false);
          resetForm();
        }}
      >
        {actionError && (
          <div
            role="alert"
            className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            {actionError}
          </div>
        )}

        <StudentForm
          values={form}
          classes={classes}
          parents={parents}
          loadingOptions={loadingOptions}
          onChange={updateForm}
          onSubmit={handleCreateStudent}
          submitting={submitting}
          submitLabel="Create Student"
        />
      </Modal>

      {/* Edit student */}
      <Modal
        open={editOpen}
        title="Edit Student"
        description="Update selected student information"
        onClose={() => {
          if (submitting) return;
          setEditOpen(false);
          resetForm();
        }}
      >
        {actionError && (
          <div
            role="alert"
            className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            {actionError}
          </div>
        )}

        <StudentForm
          values={form}
          classes={classes}
          parents={parents}
          loadingOptions={loadingOptions}
          onChange={updateForm}
          onSubmit={handleEditStudent}
          submitting={submitting}
          submitLabel="Save Changes"
        />
      </Modal>

      {/* Delete student */}
      <Modal
        open={deleteOpen}
        title="Delete Student"
        description="This action cannot be undone"
        onClose={() => {
          if (submitting) return;
          setDeleteOpen(false);
          resetForm();
        }}
      >
        {actionError && (
          <div
            role="alert"
            className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            {actionError}
          </div>
        )}

        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-300">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">
                {selectedStudent ? getStudentName(selectedStudent) : "this student"}
              </span>
              ?
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleDeleteStudent()}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
            >
              {submitting ? "Deleting..." : "Delete Student"}
            </button>

            <button
              type="button"
              onClick={() => {
                setDeleteOpen(false);
                resetForm();
              }}
              disabled={submitting}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset student password */}
      <Modal
        open={Boolean(resetTarget)}
        title="Reset Student Password"
        description="Set a new temporary password for this student's existing login account."
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
                    {getStudentName(resetTarget)}
                  </p>

                  <p className="mt-1 break-all text-sm text-slate-400">
                    Admission number: {resetTarget.admissionNumber || "—"}
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs ${
                      isStudentActive(resetTarget)
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {isStudentActive(resetTarget)
                      ? "Active student"
                      : "Inactive student"}
                  </span>
                </div>
              </div>
            </div>

            {!resetSuccess && isStudentActive(resetTarget) && (
              <div className="space-y-2">
                <label
                  htmlFor="student-temporary-password"
                  className="block text-sm font-medium text-slate-200"
                >
                  New temporary password
                </label>

                <div className="flex gap-2">
                  <input
                    id="student-temporary-password"
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
                    placeholder="Enter a temporary password"
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
                  You can regenerate or edit it. Use 12–128 characters.
                </p>

                {temporaryPassword.length > 0 &&
                  temporaryPassword.length < MIN_PASSWORD_LENGTH && (
                    <p className="text-xs text-amber-300">
                      Add at least{" "}
                      {MIN_PASSWORD_LENGTH - temporaryPassword.length} more
                      character(s) to enable the reset.
                    </p>
                  )}

                {temporaryPassword.length > MAX_PASSWORD_LENGTH && (
                  <p className="text-xs text-amber-300">
                    Password cannot exceed {MAX_PASSWORD_LENGTH} characters.
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

            {resetTarget && !isStudentActive(resetTarget) && !resetSuccess && (
              <p className="text-sm text-amber-300">
                This student is inactive or suspended. Activate the student
                before resetting the password.
              </p>
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
                      The new password has been saved. Share it privately with
                      the student or their parent/guardian. The student should
                      change it after logging in.
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

              {!resetSuccess && isStudentActive(resetTarget) && (
                <button
                  type="button"
                  onClick={() => void handleResetPassword()}
                  disabled={
                    resetSubmitting ||
                    temporaryPassword.length < MIN_PASSWORD_LENGTH ||
                    temporaryPassword.length > MAX_PASSWORD_LENGTH
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
    </>
  );
}
