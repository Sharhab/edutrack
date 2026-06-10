import csv from "fast-csv";

/**
 * Parse CSV buffer into JSON rows
 */
export function parseStudentCSV(buffer) {
  return new Promise((resolve, reject) => {
    const rows = [];

    const stream = csv.parseString(buffer.toString(), {
      headers: true,
      ignoreEmpty: true,
      trim: true,
    });

    stream
      .on("error", (error) => reject(error))
      .on("data", (row) => {
        rows.push({
          admissionNumber: row.admissionNumber?.trim(),
          firstName: row.firstName?.trim(),
          lastName: row.lastName?.trim(),
          gender: row.gender?.toLowerCase(),
          classId: row.classId?.trim(),
          parentIds: row.parentIds
            ? row.parentIds.split(",").map((id) => id.trim())
            : [],
        });
      })
      .on("end", () => resolve(rows));

    stream.write(buffer);
    stream.end();
  });
}