"use client";

import { useEffect, useState } from "react";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../../../lib/announcements";
import {
  Announcement,
  AnnouncementFormValues,
} from "../../../../types/announcement";
import SectionCard from "../../../../components/ui/SectionCard";
import Modal from "../../../../components/ui/Modal";
import AnnouncementForm from "../../../../components/announcements/AnnouncementForm";
import AnnouncementsTable from "../../../../components/announcements/AnnouncementsTable";
import { getClassOptions } from "../../../../lib/options";
import { ClassOption } from "../../../../types/options";
import PageLoader from "../../../../components/ui/PageLoader";
import EmptyState from "../../../../components/ui/EmptyState";

const initial: AnnouncementFormValues = {
  title: "",
  message: "",
  target: "all",
  classId: "",
};

export default function Page() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AnnouncementFormValues>(initial);
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setPageError("");

      const [announcementsData, classesData] = await Promise.all([
        getAnnouncements(),
        getClassOptions(),
      ]);

      setItems(announcementsData || []);
      setClasses(classesData || []);
    } catch (error) {
      console.error("Failed to load announcements page:", error);
      setPageError("Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function change(field: keyof AnnouncementFormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm(initial);
    setSelected(null);
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(a: Announcement) {
    setSelected(a);
    setForm({
      title: a.title || "",
      message: a.message || "",
      target: a.target || "all",
      classId: a.classId || "",
    });
    setOpen(true);
  }

  async function submit() {
    try {
      setSubmitting(true);

      if (selected) {
        const updated = await updateAnnouncement(selected._id, form);
        setItems((prev) =>
          prev.map((i) => (i._id === selected._id ? updated : i))
        );
      } else {
        const created = await createAnnouncement(form);
        setItems((prev) => [created, ...prev]);
      }

      setOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save announcement:", error);
      alert("Failed to save announcement");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(a: Announcement) {
    const ok = window.confirm("Delete this announcement?");
    if (!ok) return;

    try {
      await deleteAnnouncement(a._id);
      setItems((prev) => prev.filter((i) => i._id !== a._id));
    } catch (error) {
      console.error("Failed to delete announcement:", error);
      alert("Failed to delete announcement");
    }
  }

  if (loading) return <PageLoader />;

  if (pageError) {
    return (
      <EmptyState
        title="Unable to load announcements"
        description={pageError}
      />
    );
  }

  return (
    <>
      <SectionCard
        title="Announcements"
        subtitle="Create, edit, and manage school notices"
        rightAction={
          <button onClick={openCreate} className="btn-primary">
            Add Announcement
          </button>
        }
      >
        <AnnouncementsTable
          data={items}
          onEdit={openEdit}
          onDelete={remove}
        />
      </SectionCard>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title={selected ? "Edit Announcement" : "Announcement"}
      >
        <AnnouncementForm
          values={form}
          classes={classes}
          onChange={change}
          onSubmit={submit}
          submitting={submitting}
        />
      </Modal>
    </>
  );
}