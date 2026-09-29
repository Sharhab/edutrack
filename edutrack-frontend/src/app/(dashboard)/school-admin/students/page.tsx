"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
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
} from "../../../../lib/students";
import { getClassOptions, getParentOptions } from "../../../../lib/options";
import { Student, StudentFormValues } from "../../../../types/student";
import { ClassOption, ParentOption } from "../../../../types/options";
import { Plus, Search, Upload } from "lucide-react";
import Link from "next/link";

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

  async function loadStudents() {
    try {
      setLoading(true);
      setPageError("");

      const result = await getStudents({
        search: search.trim(),
      });

      setStudents(result || []);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPageError(
          err.response?.data?.message || "Failed to load students."
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
    } catch (err) {
      console.error("Failed to load form options", err);
    } finally {
      setLoadingOptions(false);
    }
  }

  useEffect(() => {
    loadStudents();
    loadOptions();
  }, []);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;

    const query = search.toLowerCase();

    return students.filter((student) => {
      return (
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(query) ||
        (student.email || "").toLowerCase().includes(query) ||
        (student.admissionNumber || "").toLowerCase().includes(query) ||
        (student.className || student.classId || "").toLowerCase().includes(query)
      );
    });
  }, [students, search]);

  function updateForm(field: keyof StudentFormValues, value: string) {
    setForm((prev) => ({
      ...prev,
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
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      admissionNumber: student.admissionNumber || "",
      gender: student.gender || "male",
      dateOfBirth: student.dateOfBirth
        ? new Date(student.dateOfBirth).toISOString().slice(0, 10)
        : "",
      classId: student.classId || "",
      parentId: student.parentId || "",
      email: student.email || "",
      phone: student.phone || "",
      address: student.address || "",
     isActive:
  student.status === "inactive"
    ? "false"
    : "true",
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
    if (!form.admissionNumber.trim()) return "Admission number is required.";
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

      setStudents((prev) => [created, ...prev]);
      setCreateOpen(false);
      resetForm();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message || "Failed to create student."
        );
      } else {
        setActionError("Failed to create student.");
      }
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

      setStudents((prev) =>
        prev.map((item) => (item._id === selectedStudent._id ? updated : item))
      );

      setEditOpen(false);
      resetForm();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message || "Failed to update student."
        );
      } else {
        setActionError("Failed to update student.");
      }
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

      setStudents((prev) =>
        prev.filter((item) => item._id !== selectedStudent._id)
      );

      setDeleteOpen(false);
      resetForm();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message || "Failed to delete student."
        );
      } else {
        setActionError("Failed to delete student.");
      }
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
  <div className="flex gap-3">
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
          />
        </SectionCard>
      </div>

      <Modal
        open={createOpen}
        title="Add Student"
        description="Create a new student record"
        onClose={() => {
          setCreateOpen(false);
          resetForm();
        }}
      >
        {actionError ? (
          <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {actionError}
          </div>
        ) : null}

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

      <Modal
        open={editOpen}
        title="Edit Student"
        description="Update selected student information"
        onClose={() => {
          setEditOpen(false);
          resetForm();
        }}
      >
        {actionError ? (
          <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {actionError}
          </div>
        ) : null}

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

      <Modal
        open={deleteOpen}
        title="Delete Student"
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
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-300">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">
                {selectedStudent?.firstName} {selectedStudent?.lastName}
              </span>
              ?
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDeleteStudent}
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