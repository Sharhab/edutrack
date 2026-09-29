import jsPDF from "jspdf";

import {
  StudentReportCard,
  SchoolBranding,
} from "../../types/report-card";

import {
  defaultComments,
  pdfDocumentMeta,
  pdfFonts,
  pdfTheme,
  reportCardLabels,
} from "./pdfTheme";

import {
  calculateAttendancePercentage,
  getPerformanceRemark,
} from "./reportCardCalculations";

type GenerateStudentPdfParams = {
  reportCard: StudentReportCard;
  branding?: SchoolBranding;
};

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;

const MARGIN_X = 9;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

/*
 * The report card is intentionally designed as ONE A4 PAPER.
 *
 * Change this one value if your school's known maximum
 * number of subjects is different.
 */
const MAX_SUBJECTS = 15;

/* =========================================================
   FIXED A4 LAYOUT
========================================================= */

const HEADER_Y = 6;
const HEADER_HEIGHT = 32;

const STUDENT_INFO_Y = 42;
const STUDENT_INFO_HEIGHT = 20;

const ACADEMIC_TITLE_Y = 66;
const TABLE_Y = 71;

const TABLE_HEADER_HEIGHT = 8;
const TABLE_ROW_HEIGHT = 4.45;

const TABLE_HEIGHT =
  TABLE_HEADER_HEIGHT +
  MAX_SUBJECTS * TABLE_ROW_HEIGHT;

const LOWER_Y = TABLE_Y + TABLE_HEIGHT + 4;

const SUMMARY_WIDTH = 94;
const ATTENDANCE_WIDTH =
  CONTENT_WIDTH - SUMMARY_WIDTH - 4;

const LOWER_HEIGHT = 29;

const COMMENTS_Y = LOWER_Y + LOWER_HEIGHT + 4;
const COMMENTS_HEIGHT = 31;

const APPROVAL_Y =
  COMMENTS_Y + COMMENTS_HEIGHT + 4;

const APPROVAL_HEIGHT = 30;

const FOOTER_Y = 290;

/* =========================================================
   MAIN GENERATOR
========================================================= */

export async function generateStudentPdf({
  reportCard,
  branding,
}: GenerateStudentPdfParams) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  pdf.setProperties({
    title: pdfDocumentMeta.title,
    subject: pdfDocumentMeta.subject,
    author: pdfDocumentMeta.author,
    creator: pdfDocumentMeta.creator,
    keywords: pdfDocumentMeta.keywords,
  });

  const primaryColor =
    branding?.primaryColor ||
    pdfTheme.colors.primary;

  /*
   * ONE PAGE ONLY.
   *
   * There is deliberately no addPage()
   * anywhere in this generator.
   */

  renderHeader({
    pdf,
    reportCard,
    branding,
    primaryColor,
  });

  renderStudentInfo({
    pdf,
    reportCard,
  });

  renderAcademicTitle({
    pdf,
    primaryColor,
  });

  renderSubjectTable({
    pdf,
    reportCard,
    primaryColor,
  });

  renderSummaryAndAttendance({
    pdf,
    reportCard,
    primaryColor,
  });

  renderComments({
    pdf,
    reportCard,
  });

  renderApproval({
    pdf,
    branding,
    primaryColor,
  });

  renderFooter({
    pdf,
    branding,
  });

  return pdf;
}

/* =========================================================
   HEADER
   PASSPORT LEFT
   SCHOOL INFORMATION CENTER
   LOGO RIGHT
========================================================= */

function renderHeader({
  pdf,
  reportCard,
  branding,
  primaryColor,
}: {
  pdf: jsPDF;
  reportCard: StudentReportCard;
  branding?: SchoolBranding;
  primaryColor: string;
}) {
  /*
   * Header border/background.
   */
  pdf.setFillColor(
    pdfTheme.colors.background
  );

  pdf.setDrawColor(
    primaryColor
  );

  pdf.setLineWidth(0.6);

  pdf.roundedRect(
    MARGIN_X,
    HEADER_Y,
    CONTENT_WIDTH,
    HEADER_HEIGHT,
    2,
    2,
    "FD"
  );

  /*
   * Bottom accent line.
   */
  pdf.setFillColor(primaryColor);

  pdf.roundedRect(
    MARGIN_X,
    HEADER_Y + HEADER_HEIGHT - 2,
    CONTENT_WIDTH,
    2,
    1,
    1,
    "F"
  );

  /*
   * -------------------------------------------------------
   * PASSPORT — TOP LEFT
   * -------------------------------------------------------
   *
   * We do not invent a new student data field here.
   *
   * The current StudentReportCard type is the source of
   * student data. If the existing branding/data layer later
   * provides a passport image, it can be placed here.
   *
   * For now the box remains a clean reserved passport area
   * rather than displaying fake data.
   */

  const passportX = MARGIN_X + 3;
  const passportY = HEADER_Y + 3;
  const passportWidth = 22;
  const passportHeight = 26;

  pdf.setFillColor(
    pdfTheme.colors.lightGray
  );

  pdf.setDrawColor(
    pdfTheme.colors.border
  );

  pdf.rect(
    passportX,
    passportY,
    passportWidth,
    passportHeight,
    "FD"
  );

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(6);

  pdf.setTextColor(
    pdfTheme.colors.mutedText
  );

  pdf.text(
    "PASSPORT",
    passportX + passportWidth / 2,
    passportY + passportHeight / 2 - 1,
    {
      align: "center",
    }
  );

  pdf.text(
    "PHOTO",
    passportX + passportWidth / 2,
    passportY + passportHeight / 2 + 3,
    {
      align: "center",
    }
  );

  /*
   * -------------------------------------------------------
   * CENTER SCHOOL INFORMATION
   * -------------------------------------------------------
   */

  const centerX =
    MARGIN_X +
    CONTENT_WIDTH / 2;

  const schoolName =
    branding?.schoolName || "";

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setTextColor(
    primaryColor
  );

  pdf.setFontSize(15);

  if (schoolName) {
    pdf.text(
      truncateText(
        pdf,
        schoolName,
        105
      ),
      centerX,
      HEADER_Y + 9,
      {
        align: "center",
      }
    );
  }

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(10);

  pdf.setTextColor(
    pdfTheme.colors.text
  );

  pdf.text(
    reportCardLabels.reportTitle,
    centerX,
    HEADER_Y + 17,
    {
      align: "center",
    }
  );

  pdf.setFont(
    pdfFonts.regular,
    "normal"
  );

  pdf.setFontSize(8);

  pdf.setTextColor(
    pdfTheme.colors.mutedText
  );

  pdf.text(
    `Session: ${reportCard.session.name || "—"}`,
    centerX,
    HEADER_Y + 23,
    {
      align: "center",
    }
  );

  pdf.text(
    `Term: ${reportCard.term.name || "—"}`,
    centerX,
    HEADER_Y + 28,
    {
      align: "center",
    }
  );

  /*
   * -------------------------------------------------------
   * LOGO — TOP RIGHT
   * -------------------------------------------------------
   */

  const logoSize = 23;

  const logoX =
    PAGE_WIDTH -
    MARGIN_X -
    logoSize -
    3;

  const logoY =
    HEADER_Y + 4;

  pdf.setFillColor("#FFFFFF");

  pdf.setDrawColor(
    pdfTheme.colors.border
  );

  pdf.rect(
    logoX,
    logoY,
    logoSize,
    logoSize,
    "FD"
  );

  if (branding?.schoolLogo) {
    try {
      pdf.addImage(
        branding.schoolLogo,
        "AUTO",
        logoX + 1,
        logoY + 1,
        logoSize - 2,
        logoSize - 2,
        undefined,
        "FAST"
      );
    } catch {
      /*
       * Invalid logo must not break PDF generation.
       */
    }
  }

  pdf.setTextColor(
    pdfTheme.colors.text
  );
}

/* =========================================================
   STUDENT INFORMATION
   HORIZONTAL SINGLE ROW
========================================================= */

function renderStudentInfo({
  pdf,
  reportCard,
}: {
  pdf: jsPDF;
  reportCard: StudentReportCard;
}) {
  const student =
    reportCard.student;

  const x = MARGIN_X;
  const y = STUDENT_INFO_Y;

  /*
   * Outer box.
   */
  pdf.setFillColor(
    pdfTheme.colors.background
  );

  pdf.setDrawColor(
    pdfTheme.colors.border
  );

  pdf.setLineWidth(0.3);

  pdf.roundedRect(
    x,
    y,
    CONTENT_WIDTH,
    STUDENT_INFO_HEIGHT,
    1.5,
    1.5,
    "FD"
  );

  /*
   * Six horizontal columns.
   */

  const columns = [
    {
      label: "Student Name",
      value:
        `${student.firstName || ""} ${
          student.lastName || ""
        }`.trim() || "—",
      width: 49,
    },
    {
      label: "Admission No.",
      value:
        student.admissionNumber || "—",
      width: 35,
    },
    {
      label: "Class",
      value:
        student.className || "—",
      width: 25,
    },
    {
      label: "Gender",
      value:
        student.gender || "—",
      width: 25,
    },
    {
      label: "Session",
      value:
        reportCard.session.name || "—",
      width: 29,
    },
    {
      label: "Term",
      value:
        reportCard.term.name || "—",
      width: 29,
    },
  ];

  let currentX = x;

  columns.forEach(
    (column, index) => {
      if (index > 0) {
        pdf.setDrawColor(
          pdfTheme.colors.border
        );

        pdf.line(
          currentX,
          y,
          currentX,
          y + STUDENT_INFO_HEIGHT
        );
      }

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(6.2);

      pdf.setTextColor(
        pdfTheme.colors.mutedText
      );

      pdf.text(
        column.label,
        currentX + 2,
        y + 6
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(7.4);

      pdf.setTextColor(
        pdfTheme.colors.text
      );

      pdf.text(
        truncateText(
          pdf,
          column.value,
          column.width - 4
        ),
        currentX + 2,
        y + 13
      );

      currentX += column.width;
    }
  );
}

/* =========================================================
   ACADEMIC TITLE
========================================================= */

function renderAcademicTitle({
  pdf,
  primaryColor,
}: {
  pdf: jsPDF;
  primaryColor: string;
}) {
  pdf.setFillColor(
    primaryColor
  );

  pdf.rect(
    MARGIN_X,
    ACADEMIC_TITLE_Y - 4,
    3,
    8,
    "F"
  );

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(9);

  pdf.setTextColor(
    pdfTheme.colors.text
  );

  pdf.text(
    "Academic Performance",
    MARGIN_X + 6,
    ACADEMIC_TITLE_Y + 1
  );
}

/* =========================================================
   SUBJECT TABLE
   FIXED NUMBER OF ROWS
========================================================= */

function renderSubjectTable({
  pdf,
  reportCard,
  primaryColor,
}: {
  pdf: jsPDF;
  reportCard: StudentReportCard;
  primaryColor: string;
}) {
  const x = MARGIN_X;
  const y = TABLE_Y;

  /*
   * Exact table width.
   */
  const widths = [
    48,
    14,
    14,
    20,
    14,
    14,
    14,
    54,
  ];

  const headers = [
    "Subject",
    "CA1",
    "CA2",
    "Assignment",
    "Exam",
    "Total",
    "Grade",
    "Remark",
  ];

  /*
   * Header.
   */

  let currentX = x;

  pdf.setFillColor(
    primaryColor
  );

  pdf.setDrawColor(
    primaryColor
  );

  headers.forEach(
    (header, index) => {
      pdf.rect(
        currentX,
        y,
        widths[index],
        TABLE_HEADER_HEIGHT,
        "FD"
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(6.8);

      pdf.setTextColor(
        "#FFFFFF"
      );

      pdf.text(
        header,
        currentX +
          widths[index] / 2,
        y + 5.2,
        {
          align: "center",
        }
      );

      currentX += widths[index];
    }
  );

  /*
   * Rows.
   *
   * Only existing reportCard.results are rendered.
   * Empty reserved rows contain no invented data.
   */

  for (
    let rowIndex = 0;
    rowIndex < MAX_SUBJECTS;
    rowIndex++
  ) {
    const subject =
      reportCard.results?.[rowIndex];

    const rowY =
      y +
      TABLE_HEADER_HEIGHT +
      rowIndex *
        TABLE_ROW_HEIGHT;

    const values = subject
      ? [
          subject.subjectName || "—",
          formatNumber(subject.ca1),
          formatNumber(subject.ca2),
          formatNumber(
            subject.assignment
          ),
          formatNumber(subject.exam),
          formatNumber(subject.total),
          subject.grade || "—",
          subject.remark || "—",
        ]
      : [
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ];

    currentX = x;

    for (
      let columnIndex = 0;
      columnIndex < widths.length;
      columnIndex++
    ) {
      pdf.setFillColor(
        rowIndex % 2 === 0
          ? pdfTheme.colors.background
          : pdfTheme.colors.lightGray
      );

      pdf.setDrawColor(
        pdfTheme.colors.tableBorder
      );

      pdf.setLineWidth(0.2);

      pdf.rect(
        currentX,
        rowY,
        widths[columnIndex],
        TABLE_ROW_HEIGHT,
        "FD"
      );

      pdf.setFont(
        columnIndex === 0
          ? pdfFonts.bold
          : pdfFonts.regular,
        columnIndex === 0
          ? "bold"
          : "normal"
      );

      pdf.setFontSize(6.1);

      pdf.setTextColor(
        pdfTheme.colors.text
      );

      const value =
        values[columnIndex];

      if (value) {
        const alignment =
          columnIndex === 0 ||
          columnIndex === 7
            ? "left"
            : "center";

        const textX =
          alignment === "center"
            ? currentX +
              widths[columnIndex] / 2
            : currentX + 2;

        pdf.text(
          truncateText(
            pdf,
            value,
            widths[columnIndex] -
              (alignment ===
              "center"
                ? 3
                : 4)
          ),
          textX,
          rowY + 3.05,
          {
            align: alignment,
          }
        );
      }

      currentX +=
        widths[columnIndex];
    }
  }
}

/* =========================================================
   SUMMARY + ATTENDANCE
   HORIZONTAL
========================================================= */

function renderSummaryAndAttendance({
  pdf,
  reportCard,
  primaryColor,
}: {
  pdf: jsPDF;
  reportCard: StudentReportCard;
  primaryColor: string;
}) {
  const summaryX =
    MARGIN_X;

  const attendanceX =
    MARGIN_X +
    SUMMARY_WIDTH +
    4;

  const y = LOWER_Y;

  /*
   * SUMMARY
   */

  renderBox(
    pdf,
    summaryX,
    y,
    SUMMARY_WIDTH,
    LOWER_HEIGHT
  );

  renderBoxTitle(
    pdf,
    "Performance Summary",
    summaryX,
    y,
    SUMMARY_WIDTH,
    primaryColor
  );

  const summary =
    reportCard.summary;

  const average =
    Number(
      summary?.averageScore || 0
    );

  const performance =
    getPerformanceRemark(
      average
    );

  const stats = [
    {
      label:
        reportCardLabels.totalScore,
      value:
        formatNumber(
          summary?.totalScore
        ),
    },
    {
      label:
        reportCardLabels.averageScore,
      value:
        `${average.toFixed(2)}%`,
    },
    {
      label:
        reportCardLabels.subjects,
      value:
        String(
          summary?.subjectsCount || 0
        ),
    },
    {
      label:
        reportCardLabels.classPosition,
      value:
        summary?.positionLabel ||
        "—",
    },
  ];

  const statGap = 2;

  const statWidth =
    (SUMMARY_WIDTH -
      8 -
      statGap * 3) /
    4;

  stats.forEach(
    (stat, index) => {
      const statX =
        summaryX +
        4 +
        index *
          (statWidth + statGap);

      const statY =
        y + 10;

      pdf.setFillColor(
        pdfTheme.colors.lightGray
      );

      pdf.setDrawColor(
        pdfTheme.colors.border
      );

      pdf.roundedRect(
        statX,
        statY,
        statWidth,
        11,
        1,
        1,
        "FD"
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(5.2);

      pdf.setTextColor(
        pdfTheme.colors.mutedText
      );

      pdf.text(
        stat.label,
        statX +
          statWidth / 2,
        statY + 4,
        {
          align: "center",
        }
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(7.2);

      pdf.setTextColor(
        primaryColor
      );

      pdf.text(
        truncateText(
          pdf,
          stat.value,
          statWidth - 2
        ),
        statX +
          statWidth / 2,
        statY + 9,
        {
          align: "center",
        }
      );
    }
  );

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(6.3);

  pdf.setTextColor(
    pdfTheme.colors.text
  );

  pdf.text(
    `Performance: ${performance}`,
    summaryX + 4,
    y + 26
  );

  /*
   * ATTENDANCE
   */

  renderBox(
    pdf,
    attendanceX,
    y,
    ATTENDANCE_WIDTH,
    LOWER_HEIGHT
  );

  renderBoxTitle(
    pdf,
    reportCardLabels.attendance,
    attendanceX,
    y,
    ATTENDANCE_WIDTH,
    primaryColor
  );

  const attendance =
    reportCard.attendance || {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
    };

  const percentage =
    calculateAttendancePercentage(
      attendance
    );

  const attendanceItems = [
    {
      label: "Total Days",
      value:
        String(
          attendance.total || 0
        ),
    },
    {
      label: "Present",
      value:
        String(
          attendance.present || 0
        ),
    },
    {
      label: "Absent",
      value:
        String(
          attendance.absent || 0
        ),
    },
    {
      label: "Late",
      value:
        String(
          attendance.late || 0
        ),
    },
    {
      label: "Attendance",
      value:
        `${percentage.toFixed(2)}%`,
    },
  ];

  const attendanceGap = 2;

  const attendanceWidth =
    (ATTENDANCE_WIDTH -
      8 -
      attendanceGap * 4) /
    5;

  attendanceItems.forEach(
    (item, index) => {
      const itemX =
        attendanceX +
        4 +
        index *
          (attendanceWidth +
            attendanceGap);

      const itemY =
        y + 10;

      const isPercentage =
        index === 4;

      pdf.setFillColor(
        isPercentage
          ? primaryColor
          : pdfTheme.colors.lightGray
      );

      pdf.setDrawColor(
        pdfTheme.colors.border
      );

      pdf.roundedRect(
        itemX,
        itemY,
        attendanceWidth,
        11,
        1,
        1,
        "FD"
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(4.8);

      pdf.setTextColor(
        isPercentage
          ? "#FFFFFF"
          : pdfTheme.colors.mutedText
      );

      pdf.text(
        item.label,
        itemX +
          attendanceWidth / 2,
        itemY + 4,
        {
          align: "center",
        }
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(7);

      pdf.setTextColor(
        isPercentage
          ? "#FFFFFF"
          : primaryColor
      );

      pdf.text(
        item.value,
        itemX +
          attendanceWidth / 2,
        itemY + 9,
        {
          align: "center",
        }
      );
    }
  );
}

/* =========================================================
   COMMENTS
   TWO COLUMNS
========================================================= */

function renderComments({
  pdf,
  reportCard,
}: {
  pdf: jsPDF;
  reportCard: StudentReportCard;
}) {
  const gap = 4;

  const boxWidth =
    (CONTENT_WIDTH - gap) /
    2;

  const teacherX =
    MARGIN_X;

  const principalX =
    MARGIN_X +
    boxWidth +
    gap;

  /*
   * Teacher comment.
   */

  renderBox(
    pdf,
    teacherX,
    COMMENTS_Y,
    boxWidth,
    COMMENTS_HEIGHT
  );

  renderBoxTitle(
    pdf,
    reportCardLabels.teacherComment,
    teacherX,
    COMMENTS_Y,
    boxWidth,
    pdfTheme.colors.primary
  );

  const average =
    Number(
      reportCard.summary
        ?.averageScore || 0
    );

  const performance =
    getPerformanceRemark(
      average
    );

  const teacherComment =
    getDefaultComment(
      performance
    );

  pdf.setFont(
    pdfFonts.regular,
    "normal"
  );

  pdf.setFontSize(6.8);

  pdf.setTextColor(
    pdfTheme.colors.text
  );

  const wrapped =
    pdf.splitTextToSize(
      teacherComment,
      boxWidth - 8
    );

  pdf.text(
    wrapped.slice(0, 3),
    teacherX + 4,
    COMMENTS_Y + 13
  );

  /*
   * Principal comment.
   *
   * This is intentionally a blank writing area.
   * We do not invent a principal comment.
   */

  renderBox(
    pdf,
    principalX,
    COMMENTS_Y,
    boxWidth,
    COMMENTS_HEIGHT
  );

  renderBoxTitle(
    pdf,
    reportCardLabels.principalComment,
    principalX,
    COMMENTS_Y,
    boxWidth,
    pdfTheme.colors.primary
  );

  pdf.setDrawColor(
    pdfTheme.colors.border
  );

  pdf.setLineWidth(0.25);

  for (
    let i = 0;
    i < 3;
    i++
  ) {
    const lineY =
      COMMENTS_Y +
      15 +
      i * 6;

    pdf.line(
      principalX + 4,
      lineY,
      principalX +
        boxWidth -
        4,
      lineY
    );
  }
}

/* =========================================================
   APPROVAL
   EXISTING SIGNATURE / STAMP ONLY
========================================================= */

function renderApproval({
  pdf,
  branding,
  primaryColor,
}: {
  pdf: jsPDF;
  branding?: SchoolBranding;
  primaryColor: string;
}) {
  renderBox(
    pdf,
    MARGIN_X,
    APPROVAL_Y,
    CONTENT_WIDTH,
    APPROVAL_HEIGHT
  );

  renderBoxTitle(
    pdf,
    reportCardLabels.signature,
    MARGIN_X,
    APPROVAL_Y,
    CONTENT_WIDTH,
    primaryColor
  );

  /*
   * Teacher signature area.
   */

  const teacherX =
    MARGIN_X + 7;

  const teacherWidth = 54;

  pdf.setDrawColor(
    pdfTheme.colors.border
  );

  pdf.line(
    teacherX,
    APPROVAL_Y + 21,
    teacherX + teacherWidth,
    APPROVAL_Y + 21
  );

  pdf.setFont(
    pdfFonts.regular,
    "normal"
  );

  pdf.setFontSize(6.5);

  pdf.setTextColor(
    pdfTheme.colors.mutedText
  );

  pdf.text(
    "Class Teacher",
    teacherX +
      teacherWidth / 2,
    APPROVAL_Y + 25,
    {
      align: "center",
    }
  );

  /*
   * Existing principal signature image.
   */

  const principalX =
    MARGIN_X +
    CONTENT_WIDTH / 2 -
    27;

  const principalWidth = 54;

  if (
    branding?.principalSignature
  ) {
    try {
      pdf.addImage(
        branding.principalSignature,
        "AUTO",
        principalX + 13,
        APPROVAL_Y + 8,
        28,
        10,
        undefined,
        "FAST"
      );
    } catch {
      /*
       * Invalid signature must not break PDF.
       */
    }
  }

  pdf.setDrawColor(
    pdfTheme.colors.border
  );

  pdf.line(
    principalX,
    APPROVAL_Y + 21,
    principalX +
      principalWidth,
    APPROVAL_Y + 21
  );

  pdf.setFont(
    pdfFonts.regular,
    "normal"
  );

  pdf.setFontSize(6.5);

  pdf.text(
    reportCardLabels.signature,
    principalX +
      principalWidth / 2,
    APPROVAL_Y + 25,
    {
      align: "center",
    }
  );

  /*
   * Existing school stamp.
   */

  if (
    branding?.schoolStamp
  ) {
    try {
      pdf.addImage(
        branding.schoolStamp,
        "AUTO",
        PAGE_WIDTH -
          MARGIN_X -
          34,
        APPROVAL_Y + 5,
        27,
        21,
        undefined,
        "FAST"
      );
    } catch {
      /*
       * Invalid stamp must not break PDF.
       */
    }
  }
}

/* =========================================================
   FOOTER
========================================================= */

function renderFooter({
  pdf,
  branding,
}: {
  pdf: jsPDF;
  branding?: SchoolBranding;
}) {
  const y =
    FOOTER_Y;

  pdf.setDrawColor(
    pdfTheme.colors.border
  );

  pdf.setLineWidth(0.3);

  pdf.line(
    MARGIN_X,
    y - 4,
    PAGE_WIDTH - MARGIN_X,
    y - 4
  );

  pdf.setFont(
    pdfFonts.regular,
    "normal"
  );

  pdf.setFontSize(6.5);

  pdf.setTextColor(
    pdfTheme.colors.mutedText
  );

  /*
   * Use existing school name only.
   */
  if (branding?.schoolName) {
    pdf.text(
      branding.schoolName,
      MARGIN_X,
      y
    );
  }

  pdf.text(
    "Page 1 of 1",
    PAGE_WIDTH - MARGIN_X,
    y,
    {
      align: "right",
    }
  );

  pdf.setTextColor(
    pdfTheme.colors.text
  );
}

/* =========================================================
   BOX HELPERS
========================================================= */

function renderBox(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number
) {
  pdf.setFillColor(
    pdfTheme.colors.background
  );

  pdf.setDrawColor(
    pdfTheme.colors.border
  );

  pdf.setLineWidth(0.3);

  pdf.roundedRect(
    x,
    y,
    width,
    height,
    1.5,
    1.5,
    "FD"
  );
}

function renderBoxTitle(
  pdf: jsPDF,
  title: string,
  x: number,
  y: number,
  width: number,
  primaryColor: string
) {
  pdf.setFillColor(
    primaryColor
  );

  pdf.roundedRect(
    x,
    y,
    width,
    7,
    1.5,
    1.5,
    "F"
  );

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(6.5);

  pdf.setTextColor(
    "#FFFFFF"
  );

  pdf.text(
    title,
    x + 3,
    y + 4.7
  );

  pdf.setTextColor(
    pdfTheme.colors.text
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatNumber(
  value:
    | number
    | null
    | undefined
) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "0";
  }

  return Number(value).toFixed(0);
}

function truncateText(
  pdf: jsPDF,
  text: string,
  maxWidth: number
) {
  if (!text) {
    return "—";
  }

  if (
    pdf.getTextWidth(text) <=
    maxWidth
  ) {
    return text;
  }

  let result = text;

  while (
    result.length > 1 &&
    pdf.getTextWidth(
      `${result}…`
    ) > maxWidth
  ) {
    result =
      result.slice(0, -1);
  }

  return `${result}…`;
}

function getDefaultComment(
  performance: string
) {
  switch (performance) {
    case "Excellent":
      return defaultComments.excellent;

    case "Very Good":
      return defaultComments.veryGood;

    case "Good":
      return defaultComments.good;

    case "Fair":
      return defaultComments.fair;

    default:
      return defaultComments.poor;
  }
}
