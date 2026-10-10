
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../../../lib/axios";

type PaymentMode =
  | "full_only"
  | "flexible_partial"
  | "fixed_installment";

type PaymentPolicy = {
  mode: PaymentMode;
  minimumPaymentAmount?: number | null;
  installmentAmount?: number | null;
};

type SelectReference =
  | string
  | { _id?: string; name?: string }
  | null;

type FeePlan = {
  _id: string;
  title: string;
  totalAmount: number;
  description?: string;
  classId: SelectReference;
  sessionId: SelectReference;
  termId: SelectReference;
  paymentPolicy?: PaymentPolicy;
};

type ClassItem = { _id: string; name: string };
type SessionItem = { _id: string; name: string };
type TermItem = { _id: string; name: string };

type StudentItem = {
  _id: string;
  firstName: string;
  lastName: string;
  classId?: SelectReference;
};

const PAYMENT_MODES: {
  value: PaymentMode;
  label: string;
  description: string;
}[] = [
  {
    value: "full_only",
    label: "Full payment only",
    description: "Parents must pay the entire outstanding balance.",
  },
  {
    value: "flexible_partial",
    label: "Flexible partial payment",
    description:
      "Parents choose how much to pay, subject to the minimum payment if configured.",
  },
  {
    value: "fixed_installment",
    label: "Fixed installment",
    description:
      "Parents pay the configured installment or the smaller remaining balance.",
  },
];

const initialForm = {
  title: "",
  amount: "",
  classId: "",
  sessionId: "",
  termId: "",
  description: "",
  paymentMode: "full_only" as PaymentMode,
  minimumPaymentAmount: "",
  installmentAmount: "",
};

function getReferenceId(reference: SelectReference): string {
  if (!reference) return "";
  if (typeof reference === "string") return reference;
  return reference._id || "";
}

function getReferenceName(reference: SelectReference): string {
  if (!reference) return "—";
  if (typeof reference === "string") return reference;
  return reference.name || "—";
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

function getErrorMessage(error: unknown, fallback: string): string {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };

  return err?.response?.data?.message || err?.message || fallback;
}

export default function FeePlansPage() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [feePlans, setFeePlans] = useState<FeePlan[]>([]);

  const [form, setForm] = useState(initialForm);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const [assignStudent, setAssignStudent] = useState({
    studentId: "",
    feePlanId: "",
  });

  const [assignClass, setAssignClass] = useState({
    classId: "",
    feePlanId: "",
  });

  const loadAll = useCallback(async () => {
    setLoadingData(true);
    setLoadError("");

    try {
      const [
        classResponse,
        sessionResponse,
        termResponse,
        studentResponse,
        planResponse,
      ] = await Promise.all([
        api.get("/classes"),
        api.get("/sessions"),
        api.get("/terms"),
        api.get("/students"),
        api.get("/finance/fees/plans"),
      ]);

      setClasses(classResponse.data?.data || []);
      setSessions(sessionResponse.data?.data || []);
      setTerms(termResponse.data?.data || []);
      setStudents(studentResponse.data?.data || []);
      setFeePlans(planResponse.data?.data || []);
    } catch (error: unknown) {
      setLoadError(
        getErrorMessage(
          error,
          "Could not load fee plans and school data."
        )
      );
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const selectedModeDescription = useMemo(
    () =>
      PAYMENT_MODES.find(
        (item) => item.value === form.paymentMode
      )?.description || "",
    [form.paymentMode]
  );

  const availableStudentPlans = useMemo(() => {
    const student = students.find(
      (item) => item._id === assignStudent.studentId
    );

    if (!student?.classId) return feePlans;

    const studentClassId = getReferenceId(student.classId);

    return feePlans.filter(
      (plan) => getReferenceId(plan.classId) === studentClassId
    );
  }, [feePlans, students, assignStudent.studentId]);

  const availableClassPlans = useMemo(() => {
    if (!assignClass.classId) return feePlans;

    return feePlans.filter(
      (plan) => getReferenceId(plan.classId) === assignClass.classId
    );
  }, [feePlans, assignClass.classId]);

  function startEditing(plan: FeePlan) {
    const policy = plan.paymentPolicy || { mode: "full_only" as PaymentMode };

    setEditingPlanId(plan._id);
    setPageError("");
    setNotice("");

    setForm({
      title: plan.title || "",
      amount: String(plan.totalAmount ?? ""),
      classId: getReferenceId(plan.classId),
      sessionId: getReferenceId(plan.sessionId),
      termId: getReferenceId(plan.termId),
      description: plan.description || "",
      paymentMode: policy.mode || "full_only",
      minimumPaymentAmount:
        policy.minimumPaymentAmount == null
          ? ""
          : String(policy.minimumPaymentAmount),
      installmentAmount:
        policy.installmentAmount == null
          ? ""
          : String(policy.installmentAmount),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingPlanId(null);
    setForm(initialForm);
    setPageError("");
    setNotice("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPageError("");
    setNotice("");

    const amount = Number(form.amount);

    const minimumPaymentAmount =
      form.minimumPaymentAmount.trim() === ""
        ? null
        : Number(form.minimumPaymentAmount);

    const installmentAmount =
      form.installmentAmount.trim() === ""
        ? null
        : Number(form.installmentAmount);

    if (!form.title.trim()) {
      setPageError("Enter a fee-plan title.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setPageError("Enter a valid fee amount greater than zero.");
      return;
    }

    if (!editingPlanId && (!form.classId || !form.sessionId || !form.termId)) {
      setPageError("Select a class, academic session, and term.");
      return;
    }

    if (
      form.paymentMode === "flexible_partial" &&
      minimumPaymentAmount !== null &&
      (!Number.isFinite(minimumPaymentAmount) ||
        minimumPaymentAmount <= 0 ||
        minimumPaymentAmount > amount)
    ) {
      setPageError(
        "The minimum payment must be greater than zero and cannot exceed the total fee."
      );
      return;
    }

    if (
      form.paymentMode === "fixed_installment" &&
      (installmentAmount === null ||
        !Number.isFinite(installmentAmount) ||
        installmentAmount <= 0 ||
        installmentAmount > amount)
    ) {
      setPageError(
        "The installment must be greater than zero and cannot exceed the total fee."
      );
      return;
    }

    const paymentPolicy: PaymentPolicy = {
      mode: form.paymentMode,
      minimumPaymentAmount:
        form.paymentMode === "flexible_partial"
          ? minimumPaymentAmount
          : null,
      installmentAmount:
        form.paymentMode === "fixed_installment"
          ? installmentAmount
          : null,
    };

    const payload = {
      title: form.title.trim(),
      amount,
      description: form.description.trim(),
      paymentPolicy,
    };

    try {
      setLoading(true);

      if (editingPlanId) {
        await api.patch(
          `/finance/fees/plans/${editingPlanId}`,
          payload
        );

        setNotice(
          "Fee plan updated successfully. Existing recorded payments and student balances were not reset."
        );
      } else {
        await api.post("/finance/fees/plans", {
          ...payload,
          classId: form.classId,
          sessionId: form.sessionId,
          termId: form.termId,
        });

        setNotice("Fee plan created successfully.");
      }

      setEditingPlanId(null);
      setForm(initialForm);

      await loadAll();
    } catch (error: unknown) {
      setPageError(
        getErrorMessage(
          error,
          editingPlanId
            ? "Failed to update fee plan."
            : "Failed to create fee plan."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function assignToStudent(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setPageError("");
    setNotice("");

    if (!assignStudent.studentId || !assignStudent.feePlanId) {
      setPageError("Select a student and fee plan.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/finance/fees/assign-student", {
        studentId: assignStudent.studentId,
        feePlanId: assignStudent.feePlanId,
      });

      setNotice(
        response.data?.message || "Fee plan assigned to the student."
      );

      setAssignStudent({ studentId: "", feePlanId: "" });
      await loadAll();
    } catch (error: unknown) {
      setPageError(
        getErrorMessage(error, "Failed to assign fee plan to student.")
      );
    } finally {
      setLoading(false);
    }
  }

  async function assignToClass(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setPageError("");
    setNotice("");

    if (!assignClass.classId || !assignClass.feePlanId) {
      setPageError("Select a class and fee plan.");
      return;
    }

    const plan = feePlans.find(
      (item) => item._id === assignClass.feePlanId
    );

    if (
      !plan ||
      getReferenceId(plan.classId) !== assignClass.classId
    ) {
      setPageError(
        "The selected fee plan does not belong to the selected class."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/finance/fees/assign-class", {
        classId: assignClass.classId,
        feePlanId: assignClass.feePlanId,
      });

      setNotice(
        response.data?.message ||
          "Fee plan assignment to the class completed."
      );

      setAssignClass({ classId: "", feePlanId: "" });
      await loadAll();
    } catch (error: unknown) {
      setPageError(
        getErrorMessage(error, "Failed to assign fee plan to class.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 text-white sm:p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Fee Plans</h1>
        <p className="text-sm text-white/60">
          Create and edit school fees, configure parent payment options,
          and assign fees to students or classes.
        </p>
      </header>

      {loadError && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4"
        >
          <p className="text-sm">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadAll()}
            className="mt-2 rounded-lg border border-white/20 px-3 py-2 text-sm"
          >
            Retry loading
          </button>
        </div>
      )}

      {pageError && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm"
        >
          {pageError}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm"
        >
          {notice}
        </div>
      )}

      {/* CREATE OR EDIT FEE PLAN */}
      <section className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">
            {editingPlanId ? "Edit Fee Plan" : "Create Fee Plan"}
          </h2>
          <p className="mt-1 text-sm text-white/60">
            {editingPlanId
              ? "Update this existing fee plan. Its class, session, and term cannot be changed here."
              : "Choose the academic period and how parents are allowed to pay."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span>Fee plan title</span>
              <input
                required
                maxLength={120}
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                placeholder="e.g. First Term School Fees"
                className="w-full rounded-xl border border-white/10 bg-black/30 p-3"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span>Total fee amount (₦)</span>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(event) =>
                  setForm({ ...form, amount: event.target.value })
                }
                placeholder="e.g. 50000"
                className="w-full rounded-xl border border-white/10 bg-black/30 p-3"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span>Class</span>
              <select
                required
                disabled={Boolean(editingPlanId)}
                value={form.classId}
                onChange={(event) =>
                  setForm({ ...form, classId: event.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 p-3 disabled:opacity-60"
              >
                <option value="">Select class</option>
                {classes.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span>Academic session</span>
              <select
                required
                disabled={Boolean(editingPlanId)}
                value={form.sessionId}
                onChange={(event) =>
                  setForm({ ...form, sessionId: event.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 p-3 disabled:opacity-60"
              >
                <option value="">Select session</option>
                {sessions.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm sm:col-span-2">
              <span>Term</span>
              <select
                required
                disabled={Boolean(editingPlanId)}
                value={form.termId}
                onChange={(event) =>
                  setForm({ ...form, termId: event.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 p-3 disabled:opacity-60"
              >
                <option value="">Select term</option>
                {terms.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm sm:col-span-2">
              <span>Description (optional)</span>
              <textarea
                rows={2}
                maxLength={500}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Describe what this fee covers"
                className="w-full rounded-xl border border-white/10 bg-black/30 p-3"
              />
            </label>
          </div>

          <div className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-4">
            <div>
              <h3 className="font-semibold">Parent Payment Policy</h3>
              <p className="mt-1 text-sm text-white/60">
                Choose whether parents pay in full, choose a partial amount,
                or pay fixed installments.
              </p>
            </div>

            <label className="block space-y-1 text-sm">
              <span>Payment policy</span>
              <select
                value={form.paymentMode}
                onChange={(event) =>
                  setForm({
                    ...form,
                    paymentMode: event.target.value as PaymentMode,
                    minimumPaymentAmount: "",
                    installmentAmount: "",
                  })
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 p-3"
              >
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </label>

            <p className="text-sm text-white/60">
              {selectedModeDescription}
            </p>

            {form.paymentMode === "flexible_partial" && (
              <label className="block space-y-1 text-sm">
                <span>Minimum payment amount (₦)</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={form.amount || undefined}
                  value={form.minimumPaymentAmount}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      minimumPaymentAmount: event.target.value,
                    })
                  }
                  placeholder="Leave empty to allow any positive amount"
                  className="w-full rounded-xl border border-white/10 bg-black/30 p-3"
                />
                <span className="block text-xs text-white/50">
                  Parents can pay any positive amount up to the outstanding
                  balance if you leave this empty.
                </span>
              </label>
            )}

            {form.paymentMode === "fixed_installment" && (
              <label className="block space-y-1 text-sm">
                <span>Required installment amount (₦)</span>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={form.amount || undefined}
                  value={form.installmentAmount}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      installmentAmount: event.target.value,
                    })
                  }
                  placeholder="e.g. 10000"
                  className="w-full rounded-xl border border-white/10 bg-black/30 p-3"
                />
                <span className="block text-xs text-white/50">
                  The final payment can be smaller if the remaining balance
                  is less than the installment.
                </span>
              </label>
            )}

            {form.amount && Number(form.amount) > 0 && (
              <div className="rounded-lg bg-white/5 p-3 text-sm">
                <span className="text-white/60">Total fee: </span>
                <strong>{formatMoney(Number(form.amount))}</strong>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={loading || loadingData}
              className="w-full rounded-xl bg-green-600 p-3 font-semibold transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : editingPlanId
                  ? "Save Fee Plan Changes"
                  : "Create Fee Plan"}
            </button>

            {editingPlanId && (
              <button
                type="button"
                onClick={cancelEditing}
                disabled={loading}
                className="w-full rounded-xl border border-white/20 p-3 font-semibold disabled:opacity-50"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      {/* EXISTING FEE PLANS */}
      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Existing Fee Plans</h2>
            <p className="text-sm text-white/60">
              {feePlans.length} active fee plan(s)
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadAll()}
            disabled={loadingData}
            className="rounded-lg border border-white/20 px-3 py-2 text-sm disabled:opacity-50"
          >
            {loadingData ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loadingData && feePlans.length === 0 ? (
          <p className="text-sm text-white/60">Loading fee plans...</p>
        ) : feePlans.length === 0 ? (
          <p className="text-sm text-white/60">
            No active fee plans found. Create your first plan above.
          </p>
        ) : (
          <div className="space-y-3">
            {feePlans.map((plan) => {
              const policy = plan.paymentPolicy;
              const modeLabel =
                PAYMENT_MODES.find(
                  (mode) => mode.value === (policy?.mode || "full_only")
                )?.label || "Full payment only";

              return (
                <article
                  key={plan._id}
                  className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{plan.title}</h3>
                      <p className="text-sm text-white/60">
                        {getReferenceName(plan.classId)} ·{" "}
                        {getReferenceName(plan.sessionId)} ·{" "}
                        {getReferenceName(plan.termId)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <strong>{formatMoney(plan.totalAmount)}</strong>
                      <button
                        type="button"
                        onClick={() => startEditing(plan)}
                        disabled={loading}
                        className="rounded-lg border border-cyan-400/40 px-3 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-400/10 disabled:opacity-50"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  <p className="text-sm">
                    Payment policy:{" "}
                    <span className="text-white/70">{modeLabel}</span>
                  </p>

                  {policy?.mode === "flexible_partial" &&
                    policy.minimumPaymentAmount != null && (
                      <p className="text-sm text-white/60">
                        Minimum: {formatMoney(policy.minimumPaymentAmount)}
                      </p>
                    )}

                  {policy?.mode === "fixed_installment" &&
                    policy.installmentAmount != null && (
                      <p className="text-sm text-white/60">
                        Installment: {formatMoney(policy.installmentAmount)}
                      </p>
                    )}

                  {plan.description && (
                    <p className="text-sm text-white/60">
                      {plan.description}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ASSIGN TO STUDENT */}
      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Assign to Student</h2>
          <p className="text-sm text-white/60">
            Assign a fee plan to one student.
          </p>
        </div>

        <form onSubmit={assignToStudent} className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span>Student</span>
            <select
              required
              value={assignStudent.studentId}
              onChange={(event) =>
                setAssignStudent({
                  studentId: event.target.value,
                  feePlanId: "",
                })
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 p-3"
            >
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.firstName} {student.lastName}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm">
            <span>Fee plan</span>
            <select
              required
              value={assignStudent.feePlanId}
              onChange={(event) =>
                setAssignStudent({
                  ...assignStudent,
                  feePlanId: event.target.value,
                })
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 p-3"
            >
              <option value="">Select fee plan</option>
              {availableStudentPlans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.title} — {formatMoney(plan.totalAmount)}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={loading || loadingData}
            className="w-full rounded-xl bg-blue-600 p-3 font-semibold disabled:opacity-50"
          >
            Assign to Student
          </button>
        </form>
      </section>

      {/* ASSIGN TO CLASS */}
      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Assign to Class</h2>
          <p className="text-sm text-white/60">
            Assign a fee plan to every student in its class.
          </p>
        </div>

        <form onSubmit={assignToClass} className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span>Class</span>
            <select
              required
              value={assignClass.classId}
              onChange={(event) =>
                setAssignClass({
                  classId: event.target.value,
                  feePlanId: "",
                })
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 p-3"
            >
              <option value="">Select class</option>
              {classes.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm">
            <span>Fee plan</span>
            <select
              required
              value={assignClass.feePlanId}
              onChange={(event) =>
                setAssignClass({
                  ...assignClass,
                  feePlanId: event.target.value,
                })
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 p-3"
            >
              <option value="">Select fee plan</option>
              {availableClassPlans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.title} — {formatMoney(plan.totalAmount)}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={loading || loadingData}
            className="w-full rounded-xl bg-purple-600 p-3 font-semibold disabled:opacity-50"
          >
            Assign to Class
          </button>
        </form>
      </section>
    </div>
  );
}
