"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import SectionCard from "../../../../components/ui/SectionCard";
import Modal from "../../../../components/ui/Modal";
import PageLoader from "../../../../components/ui/PageLoader";
import EmptyState from "../../../../components/ui/EmptyState";
import FormInput from "../../../../components/ui/FormInput";
import TeacherForm from "../../../../components/teachers/TeacherForm";
import TeachersTable from "../../../../components/teachers/TeachersTable";

import {
  createTeacher,
  deleteTeacher,
  getTeachers,
  updateTeacher,
} from "../../../../lib/teachers";

import {
  getSubjectOptions,
  getTeacherClassOptions,
} from "../../../../lib/teacher-options";

import { ClassOption, SubjectOption } from "../../../../types/options";
import { Teacher, TeacherFormValues } from "../../../../types/teacher";

import { Plus, Search } from "lucide-react";

/* =========================
   INITIAL FORM (FIXED)
========================= */
const initialForm: TeacherFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  employeeId: "",

  // ✅ FIXED: MULTI SELECT
  subjectIds: [],
  classIds: [],

  gender: "male",
  address: "",
  isActive: "true",
  password: "",
};

export default function SchoolAdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");

  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<TeacherFormValues>(initialForm);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  /* =========================
     LOAD DATA
  ========================= */
  async function loadTeachers() {
    try {
      setLoading(true);
      setPageError("");

      const result = await getTeachers({
        search: search.trim(),
      });

      setTeachers(result);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPageError(err.response?.data?.message || "Failed to load teachers.");
      } else {
        setPageError("Failed to load teachers.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadOptions() {
    try {
      setLoadingOptions(true);

      const [subjectResults, classResults] = await Promise.all([
        getSubjectOptions(),
        getTeacherClassOptions(),
      ]);

      setSubjects(subjectResults);
      setClasses(classResults);
    } catch (err) {
      console.error("Failed to load options", err);
    } finally {
      setLoadingOptions(false);
    }
  }

  useEffect(() => {
    loadTeachers();
    loadOptions();
  }, []);

  /* =========================
     FILTER
  ========================= */
  const filteredTeachers = useMemo(() => {
    if (!search.trim()) return teachers;

    const q = search.toLowerCase();

    return teachers.filter((t) => {
      return (
        `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
        (t.email || "").toLowerCase().includes(q) ||
        (t.employeeId || "").toLowerCase().includes(q)
      );
    });
  }, [teachers, search]);

  /* =========================
     FORM HANDLER
  ========================= */
  function updateForm(field: keyof TeacherFormValues, value: any) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setSelectedTeacher(null);
    setActionError("");
  }

  /* =========================
     MODALS
  ========================= */
  function openCreate() {
    resetForm();
    setCreateOpen(true);
  }

  function openEdit(teacher: Teacher) {
    setSelectedTeacher(teacher);
    setActionError("");

    setForm({
      firstName: teacher.firstName || "",
      lastName: teacher.lastName || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      employeeId: teacher.employeeId || "",

      // ✅ FIXED MAPPING
      subjectIds:
        teacher.subjectIds?.map((s: any) => s._id || s) || [],

      classIds:
        teacher.classIds?.map((c: any) => c._id || c) || [],

      gender: teacher.gender || "male",
      address: teacher.address || "",
      isActive: String(teacher.isActive ?? true),
      password: "",
    });

    setEditOpen(true);
  }

  function openDelete(teacher: Teacher) {
    setSelectedTeacher(teacher);
    setActionError("");
    setDeleteOpen(true);
  }

  /* =========================
     VALIDATION (FIXED)
  ========================= */

function validateForm() {
  if (!form.firstName.trim()) return "First name is required.";
  if (!form.lastName.trim()) return "Last name is required.";
  if (!form.employeeId.trim()) return "Employee ID is required.";

    // class validation (also correct)

  if (!form.classIds || form.classIds.length === 0) {
    return "Class is required.";
  }

  // ✅ FIXED: subjectIds (NOT subject)
  if (!form.subjectIds || form.subjectIds.length === 0) {
    return "NO Subject AND  is required.";
  }

  return "";
}
  /* =========================
     CREATE
  ========================= */
  async function handleCreate() {
    const error = validateForm();
    if (error) return setActionError(error);

    try {
      setSubmitting(true);
      setActionError("");

      const created = await createTeacher(form);

      setTeachers((prev) => [created, ...prev]);

      setCreateOpen(false);
      resetForm();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setActionError(err.response?.data?.message || "Create failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  /* =========================
     UPDATE
  ========================= */
  async function handleUpdate() {
    if (!selectedTeacher?._id) return;

    const error = validateForm();
    if (error) return setActionError(error);

    try {
      setSubmitting(true);
      setActionError("");

      const updated = await updateTeacher(selectedTeacher._id, form);

      setTeachers((prev) =>
        prev.map((t) =>
          t._id === selectedTeacher._id ? updated : t
        )
      );

      setEditOpen(false);
      resetForm();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setActionError(err.response?.data?.message || "Update failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  /* =========================
     DELETE
  ========================= */
  async function handleDelete() {
    if (!selectedTeacher?._id) return;

    try {
      setSubmitting(true);

      await deleteTeacher(selectedTeacher._id);

      setTeachers((prev) =>
        prev.filter((t) => t._id !== selectedTeacher._id)
      );

      setDeleteOpen(false);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  }

  /* =========================
     LOADING / ERROR
  ========================= */
  if (loading) return <PageLoader />;

  if (pageError) {
    return (
      <EmptyState
        title="Failed to load teachers"
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
        subtitle="Manage teachers, subjects and class assignments"
        rightAction={
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} className="mr-2" />
            Add Teacher
          </button>
        }
      >
        {/* SEARCH */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 text-gray-400" />
            <FormInput
              label="Search"
              name="search"
              value={search}
              onChange={setSearch}
            />
          </div>
        </div>

        {/* TABLE */}
        <TeachersTable
          data={filteredTeachers}
          onEdit={openEdit}
          onDelete={openDelete}
        />
      </SectionCard>

      {/* CREATE MODAL */}
      <Modal open={createOpen} title="Add Teacher" onClose={() => setCreateOpen(false)}>
        {actionError && (
          <p className="text-red-400 mb-2">{actionError}</p>
        )}

        <TeacherForm
          values={form}
          subjects={subjects}
          classes={classes}
          loadingOptions={loadingOptions}
          onChange={updateForm}
          onSubmit={handleCreate}
          submitting={submitting}
          submitLabel="Create Teacher"
        />
      </Modal>

      {/* EDIT MODAL */}
      <Modal open={editOpen} title="Edit Teacher" onClose={() => setEditOpen(false)}>
        {actionError && (
          <p className="text-red-400 mb-2">{actionError}</p>
        )}

        <TeacherForm
          values={form}
          subjects={subjects}
          classes={classes}
          loadingOptions={loadingOptions}
          onChange={updateForm}
          onSubmit={handleUpdate}
          submitting={submitting}
          submitLabel="Save Changes"
        />
      </Modal>

      {/* DELETE MODAL */}
      <Modal open={deleteOpen} title="Delete Teacher" onClose={() => setDeleteOpen(false)}>
        <p className="mb-4 text-red-400">
          Are you sure you want to delete this teacher?
        </p>

        <button
          onClick={handleDelete}
          className="btn-danger"
        >
          {submitting ? "Deleting..." : "Delete"}
        </button>
      </Modal>
    </>
  );
}