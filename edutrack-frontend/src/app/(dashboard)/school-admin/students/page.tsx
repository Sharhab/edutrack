
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  X,
  Download,
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

type PrintableCredential = {
  studentId: string;
  student: string;
  admissionNumber: string;
  temporaryPassword: string;
  className?: string;
};

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

function generateTemporaryPassword(length = 16) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

  const values = new Uint32Array(length);
  window.crypto.getRandomValues(values);

  return Array.from(values)
    .map((value) => chars[value % chars.length])
    .join("");
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }

  return fallback;
}

function getClassName(student: Student) {
  const classValue = student.classId as any;

  if (typeof classValue === "object" && classValue !== null) {
    return classValue.name || student.className || "";
  }

  return student.className || "";
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

  // Login generation
  const [generatingLogins, setGeneratingLogins] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [loginCredentials, setLoginCredentials] = useState<
    StudentLoginCredential[]
  >([]);
  const [hasMoreLogins, setHasMoreLogins] = useState(false);

  // Password reset
  const [resetTarget, setResetTarget] = useState<Student | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  // Print queue: credentials are kept only in this browser session.
  const [printCredentials, setPrintCredentials] = useState<
    PrintableCredential[]
  >([]);

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");

      const result = await getStudents();
      setStudents(result || []);
    } catch (error) {
      setPageError(
        getErrorMessage(error, "Failed to load students.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

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
  }, [loadStudents]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return students;

    return students.filter((student) => {
      const name = getStudentName(student).toLowerCase();

      return (
        name.includes(query) ||
        (student.email || "").toLowerCase().includes(query) ||
        (student.admissionNumber || "").toLowerCase().includes(query) ||
        getClassName(student).toLowerCase().includes(query)
      );
    });
  }, [students, search]);

  const accountSummary = useMemo(() => {
    const total = students.length;
    const active = students.filter(
      (student) => student.loginAccount?.exists && student.loginAccount.active
    ).length;
    const missing = students.filter(
      (student) => !student.loginAccount?.exists
    ).length;
    const disabled = students.filter(
      (student) =>
        student.loginAccount?.exists && !student.loginAccount.active
    ).length;

    return { total, active, missing, disabled };
  }, [students]);

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
      middleName: (student as any).middleName || "",
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

      await createStudent(form);

      setCreateOpen(false);
      resetForm();
      await loadStudents();
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Failed to create student.")
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

      await updateStudent(selectedStudent._id, form);

      setEditOpen(false);
      resetForm();
      await loadStudents();
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Failed to update student.")
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
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Failed to delete student.")
      );
    } finally {
      setSubmitting(false);
    }
  }

  function addPrintableCredential(credential: PrintableCredential) {
    setPrintCredentials((previous) => {
      const withoutDuplicate = previous.filter(
        (item) => item.studentId !== credential.studentId
      );

      return [...withoutDuplicate, credential];
    });
  }

  async function handleGenerateStudentLogins() {
    try {
      setGeneratingLogins(true);
      setLoginError("");
      setLoginMessage("");

      const result = await generateStudentLoginAccounts();

      const createdCredentials = result.results.filter(
        (item) => item.accountCreated && item.credentials
      );

      setLoginCredentials((previous) => {
        const combined = [...previous, ...createdCredentials];

        return combined.filter(
          (item, index, array) =>
            array.findIndex(
              (candidate) => candidate.studentId === item.studentId
            ) === index
        );
      });

      const newPrintItems: PrintableCredential[] = createdCredentials.map(
        (item) => ({
          studentId: item.studentId,
          student: item.student,
          admissionNumber: item.credentials!.admissionNumber,
          temporaryPassword: item.credentials!.temporaryPassword,
        })
      );

      setPrintCredentials((previous) => {
        const combined = [...previous, ...newPrintItems];

        return combined.filter(
          (item, index, array) =>
            array.findIndex(
              (candidate) => candidate.studentId === item.studentId
            ) === index
        );
      });

      setHasMoreLogins(result.hasMore);

      await loadStudents();

      setLoginMessage(
        `${result.created} new account(s) created. ` +
          `${result.failed} failed. ` +
          `${result.remaining} student(s) remain without accounts.`
      );
    } catch (error) {
      setLoginError(
        getErrorMessage(
          error,
          "Could not generate student login accounts."
        )
      );
    } finally {
      setGeneratingLogins(false);
    }
  }

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
      setCopyMessage("Password copied. Share it privately.");
    } catch {
      setCopyMessage(
        "Copy was blocked. Select the password and copy it manually."
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

      await resetStudentPassword(
        resetTarget._id,
        temporaryPassword
      );

      addPrintableCredential({
        studentId: resetTarget._id,
        student: getStudentName(resetTarget),
        admissionNumber: resetTarget.admissionNumber,
        temporaryPassword,
        className: getClassName(resetTarget),
      });

      setResetSuccess(true);
      await loadStudents();
    } catch (error) {
      setResetError(
        getErrorMessage(error, "Failed to reset student password.")
      );
    } finally {
      setResetSubmitting(false);
    }
  }

  function printLoginSlips() {
    if (!printCredentials.length) return;

    window.print();
  }

  function removePrintCredential(studentId: string) {
    setPrintCredentials((previous) =>
      previous.filter((item) => item.studentId !== studentId)
    );
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
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 12mm;
        }

        @media print {
          html,
          body {
            width: 210mm !important;
            min-width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #111827 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden !important;
          }

          #student-login-print-area,
          #student-login-print-area * {
            visibility: visible !important;
          }

          #student-login-print-area {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          .student-print-slip {
            box-sizing: border-box !important;
            width: 100% !important;
            height: 270mm !important;
            min-height: 270mm !important;
            max-height: 270mm !important;
            margin: 0 !important;
            padding: 15mm !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            break-after: page !important;
            page-break-after: always !important;
            border: 2px solid #0f766e !important;
            border-radius: 8px !important;
          }

          .student-print-slip:last-child {
            break-after: auto !important;
            page-break-after: auto !important;
          }

          .no-print {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>

      <div className="no-print space-y-6">
        <SectionCard
          title="Students"
          subtitle="Manage admissions, student records and login accounts"
          rightAction={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/school-admin/students/bulk"
                className="btn-secondary inline-flex items-center justify-center"
              >
                <Plus size={16} className="mr-2" />
                Bulk Entry
              </Link>

              <Link
                href="/school-admin/students/import"
                className="inline-flex items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-300 hover:bg-blue-500/20"
              >
                <Upload size={16} className="mr-2" />
                Import
              </Link>

              <button
                type="button"
                onClick={openCreateModal}
                className="btn-primary"
              >
                <Plus size={16} className="mr-2" />
                Add Student
              </button>
            </div>
          }
        >
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-slate-400">Total students</p>
              <p className="mt-2 text-2xl font-bold text-white">
                {accountSummary.total}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4">
              <p className="text-sm text-emerald-300">Active login accounts</p>
              <p className="mt-2 text-2xl font-bold text-white">
                {accountSummary.active}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4">
              <p className="text-sm text-amber-300">Missing accounts</p>
              <p className="mt-2 text-2xl font-bold text-white">
                {accountSummary.missing}
              </p>
            </div>

            <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-4">
              <p className="text-sm text-red-300">Disabled accounts</p>
              <p className="mt-2 text-2xl font-bold text-white">
                {accountSummary.disabled}
              </p>
            </div>
          </div>

          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-11 text-slate-400"
              />
              <div className="[&_input]:pl-11">
                <FormInput
                  label="Search Students"
                  name="search"
                  value={search}
                  placeholder="Name, admission number, email or class..."
                  onChange={setSearch}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadStudents()}
                className="btn-secondary"
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </button>

              <button
                type="button"
                onClick={() => void handleGenerateStudentLogins()}
                disabled={generatingLogins || accountSummary.missing === 0}
                className="btn-primary inline-flex items-center justify-center disabled:opacity-50"
              >
                <KeyRound size={16} className="mr-2" />
                {generatingLogins
                  ? "Generating..."
                  : "Generate Missing Logins"}
              </button>
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
            title="Recently Generated Logins"
            subtitle="Passwords are displayed only during this browser session. Save or print these slips before leaving this page."
            rightAction={
              <button
                type="button"
                onClick={printLoginSlips}
                disabled={!printCredentials.length}
                className="btn-primary inline-flex items-center disabled:opacity-50"
              >
                <Printer size={16} className="mr-2" />
                Print All Slips ({printCredentials.length})
              </button>
            }
          >
            <div className="space-y-3">
              {loginCredentials
                .filter((item) => item.accountCreated && item.credentials)
                .map((item) => (
                  <div
                    key={item.studentId}
                    className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {item.student}
                      </p>
                      <p className="text-sm text-slate-400">
                        Admission number: {item.credentials?.admissionNumber}
                      </p>
                      <p className="mt-1 font-mono text-sm text-cyan-300">
                        {item.credentials?.temporaryPassword}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(
                            item.credentials!.temporaryPassword
                          );
                        }}
                        className="btn-secondary"
                      >
                        <Copy size={15} className="mr-2" />
                        Copy
                      </button>

                      <button
                        type="button"
                        onClick={printLoginSlips}
                        className="btn-secondary"
                      >
                        <Printer size={15} className="mr-2" />
                        Print
                      </button>
                    </div>
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

        {printCredentials.length > 0 && (
          <SectionCard
            title="Print Queue"
            subtitle={`${printCredentials.length} student login slip(s) ready to print. Each student will receive a separate A4 page.`}
            rightAction={
              <button
                type="button"
                onClick={printLoginSlips}
                className="btn-primary inline-flex items-center"
              >
                <Printer size={16} className="mr-2" />
                Print All
              </button>
            }
          >
            <div className="space-y-2">
              {printCredentials.map((credential) => (
                <div
                  key={credential.studentId}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      {credential.student}
                    </p>
                    <p className="text-xs text-slate-400">
                      {credential.admissionNumber}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removePrintCredential(credential.studentId)
                    }
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-300"
                    title="Remove from print queue"
                  >
                    <X size={17} />
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>

      {/* PRINT AREA: one complete student slip per A4 page */}
      <div id="student-login-print-area" className="hidden">
        {printCredentials.map((credential) => (
          <article
            key={credential.studentId}
            className="student-print-slip"
          >
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-teal-700 text-3xl font-black text-teal-800">
                E
              </div>

              <p className="text-sm font-bold uppercase tracking-[0.25em] text-teal-700">
                EduTrack
              </p>

              <h1 className="mt-3 text-3xl font-bold text-slate-900">
                Student Login Details
              </h1>

              <p className="mt-2 text-base text-slate-600">
                Keep this slip safe and confidential
              </p>
            </div>

            <div className="my-12 rounded-2xl border-2 border-slate-300 p-8">
              <div className="space-y-7">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                    Student name
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {credential.student}
                  </p>
                </div>

                {credential.className && (
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                      Class
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">
                      {credential.className}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                    Admission number / Username
                  </p>
                  <p className="mt-2 break-all text-2xl font-bold text-slate-900">
                    {credential.admissionNumber}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                    Temporary password
                  </p>
                  <p className="mt-2 break-all rounded-lg bg-slate-100 p-4 font-mono text-2xl font-bold text-slate-900">
                    {credential.temporaryPassword}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-center">
              <h2 className="text-xl font-bold text-slate-900">
                How to log in
              </h2>

              <p className="text-base leading-7 text-slate-700">
                Open your school's EduTrack student portal. Enter your
                admission number as your username and enter the temporary
                password shown above.
              </p>

              <p className="text-base leading-7 text-slate-700">
                After logging in, change your password and keep your new
                password private.
              </p>
            </div>

            <div className="mt-auto border-t border-slate-300 pt-6 text-center">
              <p className="text-sm text-slate-500">
                This login slip is confidential. Do not share it publicly.
              </p>
              <p className="mt-2 text-sm font-semibold text-teal-800">
                Powered by EduTrack
              </p>
            </div>
          </article>
        ))}
      </div>

      {/* CREATE STUDENT */}
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
          <div className="mb-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
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

      {/* EDIT STUDENT */}
      <Modal
        open={editOpen}
        title="Edit Student"
        description="Update student information"
        onClose={() => {
          if (submitting) return;
          setEditOpen(false);
          resetForm();
        }}
      >
        {actionError && (
          <div className="mb-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
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

      {/* DELETE STUDENT */}
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
          <div className="mb-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
            {actionError}
          </div>
        )}

        <div className="space-y-5">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete{" "}
            <strong className="text-white">
              {selectedStudent ? getStudentName(selectedStudent) : "this student"}
            </strong>
            ?
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleDeleteStudent()}
              disabled={submitting}
              className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Deleting..." : "Delete Student"}
            </button>

            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              disabled={submitting}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* RESET PASSWORD */}
      <Modal
        open={Boolean(resetTarget)}
        title="Regenerate Student Login"
        description="Generate a new password for this student's existing login account."
        onClose={closeResetModal}
      >
        {resetTarget && (
          <div className="space-y-5">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="font-semibold text-white">
                {getStudentName(resetTarget)}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Admission number: {resetTarget.admissionNumber}
              </p>
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
                    }}
                    disabled={resetSubmitting}
                    className="input min-w-0 flex-1 font-mono"
                  />

                  <button
                    type="button"
                    onClick={regeneratePassword}
                    disabled={resetSubmitting}
                    className="rounded-lg border border-white/10 px-3 text-cyan-300"
                    title="Generate another password"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>

                <p className="text-xs text-slate-400">
                  Use 12–128 characters. This password will be shown once
                  after a successful reset.
                </p>
              </div>
            )}

            {resetError && (
              <div role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
                <AlertCircle size={16} className="mr-2 inline" />
                {resetError}
              </div>
            )}

            {!isStudentActive(resetTarget) && !resetSuccess && (
              <p className="text-sm text-amber-300">
                Activate this student before resetting the password.
              </p>
            )}

            {resetSuccess && (
              <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="shrink-0 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-emerald-300">
                      Password reset successfully
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      A new login slip has been added to the print queue.
                      Print it now or copy the password securely.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    readOnly
                    value={temporaryPassword}
                    className="input min-w-0 flex-1 font-mono"
                    onFocus={(event) => event.currentTarget.select()}
                  />

                  <button
                    type="button"
                    onClick={() => void copyTemporaryPassword()}
                    className="btn-secondary"
                  >
                    <Copy size={16} />
                  </button>
                </div>

                {copyMessage && (
                  <p role="status" className="text-xs text-slate-300">
                    {copyMessage}
                  </p>
                )}

                <button
                  type="button"
                  onClick={printLoginSlips}
                  className="btn-primary w-full"
                >
                  <Printer size={16} className="mr-2 inline" />
                  Print Login Slip
                </button>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeResetModal}
                disabled={resetSubmitting}
                className="btn-secondary"
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
                  className="btn-primary disabled:opacity-50"
                >
                  {resetSubmitting ? (
                    <>
                      <RefreshCw size={16} className="mr-2 inline animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <KeyRound size={16} className="mr-2 inline" />
                      Save New Password
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
