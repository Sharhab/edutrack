import { getDueInvoices, createReminder } from "./reminder.service.js";

/**
 * RUN DAILY REMINDER JOB
 */
export async function runReminderJob(schoolId) {
  const invoices = await getDueInvoices(schoolId);

  for (const invoice of invoices) {
    await createReminder(
      schoolId,
      invoice.studentId,
      invoice._id
    );
  }
}