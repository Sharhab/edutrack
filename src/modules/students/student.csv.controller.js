import { parseStudentCSV } from "./csv.parser.js";
import { bulkUpsertStudents } from "./student.service.js";

/**
 * STEP 1: PREVIEW CSV (DO NOT SAVE)
 */
export async function previewStudentCSVHandler(req, res) {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "CSV file is required",
      });
    }

    const rows = await parseStudentCSV(file.buffer);

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * STEP 2: IMPORT (FINAL SAVE)
 */
export async function importStudentCSVHandler(req, res) {
  try {
    const schoolId = req.user.schoolId;
    const { students } = req.body;

    const result = await bulkUpsertStudents(
      students,
      schoolId
    );

    return res.json({
      success: true,
      message: "Import completed",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}