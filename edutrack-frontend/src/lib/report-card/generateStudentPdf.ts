import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

type PdfWithTable = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;

const MARGIN_X = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const HEADER_HEIGHT = 30;

const FOOTER_HEIGHT = 22;

const CONTENT_BOTTOM =
  PAGE_HEIGHT - FOOTER_HEIGHT - 8;

/* =========================================
   MAIN GENERATOR
========================================= */

export async function generateStudentPdf({
  reportCard,
  branding,
}: GenerateStudentPdfParams) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  }) as PdfWithTable;

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
   * Render first page.
   */
  renderHeader({
    pdf,
    reportCard,
    branding,
    primaryColor,
  });

  const studentInfoBottom = renderStudentInfo({
    pdf,
    reportCard,
  });

  const tableStartY = studentInfoBottom + 6;

  renderSubjectTable({
    pdf,
    reportCard,
    primaryColor,
    startY: tableStartY,
  });

  let currentY =
    pdf.lastAutoTable?.finalY
      ? pdf.lastAutoTable.finalY + 8
      : tableStartY + 20;

  /*
   * Summary + attendance.
   *
   * These sections are deliberately rendered after the
   * table's actual finalY so they cannot overlap the table.
   */
  currentY = ensureSpace({
    pdf,
    currentY,
    requiredHeight: 72,
    reportCard,
    branding,
    primaryColor,
  });

  currentY = renderSummary({
    pdf,
    reportCard,
    primaryColor,
    startY: currentY,
  });

  currentY += 7;

  currentY = ensureSpace({
    pdf,
    currentY,
    requiredHeight: 43,
    reportCard,
    branding,
    primaryColor,
  });

  currentY = renderAttendance({
    pdf,
    reportCard,
    primaryColor,
    startY: currentY,
  });

  /*
   * Comments.
   */
  currentY += 8;

  currentY = ensureSpace({
    pdf,
    currentY,
    requiredHeight: 48,
    reportCard,
    branding,
    primaryColor,
  });

  renderComments({
    pdf,
    reportCard,
    startY: currentY,
  });

  /*
   * Footer on every page.
   */
  renderFooters({
    pdf,
    branding,
  });

  return pdf;
}

/* =========================================
   HEADER
========================================= */

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
   * Main header background.
   */
  pdf.setFillColor(primaryColor);
  pdf.rect(
    0,
    0,
    PAGE_WIDTH,
    HEADER_HEIGHT,
    "F"
  );

  /*
   * School logo.
   */
  if (branding?.schoolLogo) {
    try {
      pdf.addImage(
        branding.schoolLogo,
        "AUTO",
        10,
        4,
        22,
        22,
        undefined,
        "FAST"
      );
    } catch {
      /*
       * Invalid logo should never break PDF generation.
       */
    }
  }

  /*
   * School name.
   */
  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(16);

  pdf.setTextColor(
    "#FFFFFF"
  );

  const schoolName =
    branding?.schoolName ||
    "SCHOOL";

  const schoolNameX =
    branding?.schoolLogo
      ? 36
      : MARGIN_X;

  pdf.text(
    schoolName,
    schoolNameX,
    11
  );

  /*
   * Report title.
   */
  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(10);

  pdf.text(
    reportCardLabels.reportTitle,
    schoolNameX,
    19
  );

  /*
   * Session / term.
   */
  pdf.setFont(
    pdfFonts.regular,
    "normal"
  );

  pdf.setFontSize(8.5);

  pdf.text(
    `${reportCard.session.name} • ${reportCard.term.name}`,
    schoolNameX,
    25
  );

  /*
   * Reset text color.
   */
  pdf.setTextColor(
    pdfTheme.colors.text
  );
}

/* =========================================
   STUDENT INFORMATION
========================================= */

function renderStudentInfo({
  pdf,
  reportCard,
}: {
  pdf: jsPDF;
  reportCard: StudentReportCard;
}) {
  let y = HEADER_HEIGHT + 8;

  const student =
    reportCard.student;

  const rows = [
    [
      "Student Name",
      `${student.firstName} ${student.lastName}`,
      "Admission No.",
      student.admissionNumber || "—",
    ],
    [
      "Class",
      student.className || "—",
      "Gender",
      student.gender || "—",
    ],
    [
      "Session",
      reportCard.session.name || "—",
      "Term",
      reportCard.term.name || "—",
    ],
  ];

  /*
   * Section title.
   */
  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(11);

  pdf.setTextColor(
    pdfTheme.colors.text
  );

  pdf.text(
    "Student Information",
    MARGIN_X,
    y
  );

  y += 5;

  /*
   * Information box.
   */
  const boxHeight = 27;

  pdf.setFillColor(
    pdfTheme.colors.lightGray
  );

  pdf.setDrawColor(
    pdfTheme.colors.border
  );

  pdf.setLineWidth(0.3);

  pdf.roundedRect(
    MARGIN_X,
    y,
    CONTENT_WIDTH,
    boxHeight,
    2,
    2,
    "FD"
  );

  const rowHeight =
    boxHeight / rows.length;

  rows.forEach(
    (row, rowIndex) => {
      const rowY =
        y +
        rowHeight * rowIndex;

      if (rowIndex > 0) {
        pdf.setDrawColor(
          pdfTheme.colors.border
        );

        pdf.line(
          MARGIN_X,
          rowY,
          MARGIN_X + CONTENT_WIDTH,
          rowY
        );
      }

      const label1X =
        MARGIN_X + 4;

      const value1X =
        MARGIN_X + 35;

      const label2X =
        MARGIN_X + CONTENT_WIDTH / 2 + 2;

      const value2X =
        MARGIN_X + CONTENT_WIDTH / 2 + 35;

      const textY =
        rowY + 5.3;

      /*
       * First label.
       */
      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(7.5);

      pdf.setTextColor(
        pdfTheme.colors.mutedText
      );

      pdf.text(
        row[0],
        label1X,
        textY
      );

      /*
       * First value.
       */
      pdf.setFont(
        pdfFonts.regular,
        "normal"
      );

      pdf.setFontSize(8.5);

      pdf.setTextColor(
        pdfTheme.colors.text
      );

      pdf.text(
        truncateText(
          pdf,
          row[1],
          43
        ),
        value1X,
        textY
      );

      /*
       * Second label.
       */
      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(7.5);

      pdf.setTextColor(
        pdfTheme.colors.mutedText
      );

      pdf.text(
        row[2],
        label2X,
        textY
      );

      /*
       * Second value.
       */
      pdf.setFont(
        pdfFonts.regular,
        "normal"
      );

      pdf.setFontSize(8.5);

      pdf.setTextColor(
        pdfTheme.colors.text
      );

      pdf.text(
        truncateText(
          pdf,
          row[3],
          43
        ),
        value2X,
        textY
      );
    }
  );

  return y + boxHeight;
}

/* =========================================
   SUBJECT TABLE
========================================= */

function renderSubjectTable({
  pdf,
  reportCard,
  primaryColor,
  startY,
}: {
  pdf: PdfWithTable;
  reportCard: StudentReportCard;
  primaryColor: string;
  startY: number;
}) {
  pdf.setFont(
    pdfFonts.regular,
    "normal"
  );

  autoTable(pdf, {
    startY,

    margin: {
      left: MARGIN_X,
      right: MARGIN_X,
      top: HEADER_HEIGHT + 5,
      bottom: FOOTER_HEIGHT + 8,
    },

    tableWidth: CONTENT_WIDTH,

    showHead: "everyPage",

    head: [
      [
        "Subject",
        "CA1",
        "CA2",
        "Assignment",
        "Exam",
        "Total",
        "Grade",
        "Remark",
      ],
    ],

    body:
      reportCard.results.length > 0
        ? reportCard.results.map(
            (subject) => [
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
          )
        : [
            [
              "No subject results available",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
            ],
          ],

    theme: "grid",

    styles: {
      font: pdfFonts.regular,
      fontStyle: "normal",
      fontSize: 7.8,
      cellPadding: {
        top: 2.4,
        bottom: 2.4,
        left: 2,
        right: 2,
      },
      textColor:
        pdfTheme.colors.text,
      lineColor:
        pdfTheme.colors.tableBorder,
      lineWidth: 0.25,
      valign: "middle",
      overflow: "linebreak",
    },

    headStyles: {
      font: pdfFonts.bold,
      fontStyle: "bold",
      fontSize: 7.5,
      fillColor: primaryColor,
      textColor: "#FFFFFF",
      halign: "center",
      valign: "middle",
      cellPadding: 2.8,
    },

    bodyStyles: {
      minCellHeight: 7,
    },

    alternateRowStyles: {
      fillColor:
        pdfTheme.colors.lightGray,
    },

    columnStyles: {
      0: {
        cellWidth: 43,
        halign: "left",
      },

      1: {
        cellWidth: 14,
        halign: "center",
      },

      2: {
        cellWidth: 14,
        halign: "center",
      },

      3: {
        cellWidth: 18,
        halign: "center",
      },

      4: {
        cellWidth: 14,
        halign: "center",
      },

      5: {
        cellWidth: 14,
        halign: "center",
      },

      6: {
        cellWidth: 14,
        halign: "center",
      },

      7: {
        cellWidth: "auto",
        halign: "left",
      },
    },

    didParseCell(data) {
      /*
       * Keep subject name readable.
       */
      if (
        data.section === "body" &&
        data.column.index === 0
      ) {
        data.cell.styles.fontStyle =
          "bold";
      }

      /*
       * Center numerical columns.
       */
      if (
        data.section === "body" &&
        data.column.index >= 1 &&
        data.column.index <= 6
      ) {
        data.cell.styles.halign =
          "center";
      }
    },

    didDrawPage(data) {
      /*
       * Header repeats on table pages.
       *
       * This is intentionally lightweight so it
       * does not cover the table.
       */
      if (data.pageNumber > 1) {
        pdf.setFillColor(
          primaryColor
        );

        pdf.rect(
          0,
          0,
          PAGE_WIDTH,
          15,
          "F"
        );

        pdf.setFont(
          pdfFonts.bold,
          "bold"
        );

        pdf.setFontSize(8);

        pdf.setTextColor(
          "#FFFFFF"
        );

        pdf.text(
          reportCard.student
            ? `${reportCard.student.firstName} ${reportCard.student.lastName}`
            : "Student Report Card",
          MARGIN_X,
          9
        );

        pdf.text(
          reportCardLabels.reportTitle,
          PAGE_WIDTH - MARGIN_X,
          9,
          {
            align: "right",
          }
        );

        pdf.setTextColor(
          pdfTheme.colors.text
        );
      }
    },
  });
}

/* =========================================
   PERFORMANCE SUMMARY
========================================= */

function renderSummary({
  pdf,
  reportCard,
  primaryColor,
  startY,
}: {
  pdf: jsPDF;
  reportCard: StudentReportCard;
  primaryColor: string;
  startY: number;
}) {
  const summary =
    reportCard.summary;

  const boxHeight = 42;

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(11);

  pdf.setTextColor(
    pdfTheme.colors.text
  );

  pdf.text(
    reportCardLabels.performance,
    MARGIN_X,
    startY
  );

  const boxY = startY + 4;

  pdf.setFillColor(
    pdfTheme.colors.background
  );

  pdf.setDrawColor(
    pdfTheme.colors.border
  );

  pdf.setLineWidth(0.3);

  pdf.roundedRect(
    MARGIN_X,
    boxY,
    CONTENT_WIDTH,
    boxHeight,
    2,
    2,
    "FD"
  );

  const average =
    Number(summary.averageScore || 0);

  const performance =
    getPerformanceRemark(
      average
    );

  /*
   * Four statistics.
   */
  const boxes = [
    {
      label:
        reportCardLabels.totalScore,
      value:
        formatNumber(
          summary.totalScore
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
          summary.subjectsCount || 0
        ),
    },
    {
      label:
        reportCardLabels.classPosition,
      value:
        summary.positionLabel ||
        "—",
    },
  ];

  const gap = 3;

  const boxWidth =
    (CONTENT_WIDTH -
      gap * 3) /
    4;

  boxes.forEach(
    (item, index) => {
      const x =
        MARGIN_X +
        index *
          (boxWidth + gap);

      pdf.setFillColor(
        pdfTheme.colors.lightGray
      );

      pdf.setDrawColor(
        pdfTheme.colors.border
      );

      pdf.roundedRect(
        x,
        boxY + 5,
        boxWidth,
        22,
        1.5,
        1.5,
        "FD"
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(6.8);

      pdf.setTextColor(
        pdfTheme.colors.mutedText
      );

      pdf.text(
        item.label,
        x + boxWidth / 2,
        boxY + 11,
        {
          align: "center",
        }
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(10.5);

      pdf.setTextColor(
        primaryColor
      );

      pdf.text(
        item.value,
        x + boxWidth / 2,
        boxY + 21,
        {
          align: "center",
        }
      );
    }
  );

  /*
   * Performance indicator.
   */
  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(8);

  pdf.setTextColor(
    pdfTheme.colors.text
  );

  pdf.text(
    `Performance: ${performance}`,
    MARGIN_X + 4,
    boxY + 35
  );

  /*
   * Performance progress bar.
   */
  const barX =
    MARGIN_X + 54;

  const barY =
    boxY + 32;

  const barWidth =
    CONTENT_WIDTH - 64;

  const barHeight = 3;

  pdf.setFillColor(
    pdfTheme.colors.border
  );

  pdf.roundedRect(
    barX,
    barY,
    barWidth,
    barHeight,
    1.5,
    1.5,
    "F"
  );

  const progress =
    Math.max(
      0,
      Math.min(
        100,
        average
      )
    );

  if (progress > 0) {
    pdf.setFillColor(
      primaryColor
    );

    pdf.roundedRect(
      barX,
      barY,
      (barWidth *
        progress) /
        100,
      barHeight,
      1.5,
      1.5,
      "F"
    );
  }

  return boxY + boxHeight;
}

/* =========================================
   ATTENDANCE
========================================= */

function renderAttendance({
  pdf,
  reportCard,
  primaryColor,
  startY,
}: {
  pdf: jsPDF;
  reportCard: StudentReportCard;
  primaryColor: string;
  startY: number;
}) {
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

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(11);

  pdf.setTextColor(
    pdfTheme.colors.text
  );

  pdf.text(
    reportCardLabels.attendance,
    MARGIN_X,
    startY
  );

  const boxY = startY + 4;

  const boxHeight = 32;

  pdf.setFillColor(
    pdfTheme.colors.background
  );

  pdf.setDrawColor(
    pdfTheme.colors.border
  );

  pdf.setLineWidth(0.3);

  pdf.roundedRect(
    MARGIN_X,
    boxY,
    CONTENT_WIDTH,
    boxHeight,
    2,
    2,
    "FD"
  );

  const items = [
    {
      label: "Total Days",
      value: String(
        attendance.total || 0
      ),
    },
    {
      label: "Present",
      value: String(
        attendance.present || 0
      ),
    },
    {
      label: "Absent",
      value: String(
        attendance.absent || 0
      ),
    },
    {
      label: "Late",
      value: String(
        attendance.late || 0
      ),
    },
    {
      label: "Attendance",
      value: `${percentage.toFixed(
        2
      )}%`,
    },
  ];

  const gap = 3;

  const itemWidth =
    (CONTENT_WIDTH -
      gap * 4) /
    5;

  items.forEach(
    (item, index) => {
      const x =
        MARGIN_X +
        index *
          (itemWidth + gap);

      const fill =
        index === 4
          ? primaryColor
          : pdfTheme.colors.lightGray;

      const text =
        index === 4
          ? "#FFFFFF"
          : pdfTheme.colors.text;

      pdf.setFillColor(fill);

      pdf.setDrawColor(
        pdfTheme.colors.border
      );

      pdf.roundedRect(
        x,
        boxY + 5,
        itemWidth,
        21,
        1.5,
        1.5,
        "FD"
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(6.5);

      pdf.setTextColor(
        index === 4
          ? "#E5E7EB"
          : pdfTheme.colors.mutedText
      );

      pdf.text(
        item.label,
        x + itemWidth / 2,
        boxY + 11,
        {
          align: "center",
        }
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(9.5);

      pdf.setTextColor(text);

      pdf.text(
        item.value,
        x + itemWidth / 2,
        boxY + 20,
        {
          align: "center",
        }
      );
    }
  );

  return boxY + boxHeight;
}

/* =========================================
   COMMENTS
========================================= */

function renderComments({
  pdf,
  reportCard,
  startY,
}: {
  pdf: jsPDF;
  reportCard: StudentReportCard;
  startY: number;
}) {
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
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(11);

  pdf.setTextColor(
    pdfTheme.colors.text
  );

  pdf.text(
    reportCardLabels.teacherComment,
    MARGIN_X,
    startY
  );

  const commentY =
    startY + 5;

  const commentHeight = 28;

  pdf.setFillColor(
    pdfTheme.colors.lightGray
  );

  pdf.setDrawColor(
    pdfTheme.colors.border
  );

  pdf.setLineWidth(0.3);

  pdf.roundedRect(
    MARGIN_X,
    commentY,
    CONTENT_WIDTH,
    commentHeight,
    2,
    2,
    "FD"
  );

  pdf.setFont(
    pdfFonts.regular,
    "normal"
  );

  pdf.setFontSize(8.5);

  pdf.setTextColor(
    pdfTheme.colors.text
  );

  const wrapped =
    pdf.splitTextToSize(
      teacherComment,
      CONTENT_WIDTH - 8
    );

  pdf.text(
    wrapped,
    MARGIN_X + 4,
    commentY + 8
  );

  /*
   * Principal comment area.
   */
  const principalY =
    commentY + commentHeight + 5;

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(9);

  pdf.setTextColor(
    pdfTheme.colors.mutedText
  );

  pdf.text(
    reportCardLabels.principalComment,
    MARGIN_X,
    principalY
  );

  pdf.setDrawColor(
    pdfTheme.colors.border
  );

  pdf.line(
    MARGIN_X,
    principalY + 5,
    MARGIN_X + CONTENT_WIDTH,
    principalY + 5
  );
}

/* =========================================
   FOOTER
========================================= */

function renderFooters({
  pdf,
  branding,
}: {
  pdf: jsPDF;
  branding?: SchoolBranding;
}) {
  const pageCount =
    pdf.getNumberOfPages();

  for (
    let page = 1;
    page <= pageCount;
    page++
  ) {
    pdf.setPage(page);

    const footerY =
      PAGE_HEIGHT - 14;

    pdf.setDrawColor(
      pdfTheme.colors.border
    );

    pdf.setLineWidth(0.3);

    pdf.line(
      MARGIN_X,
      footerY - 5,
      PAGE_WIDTH - MARGIN_X,
      footerY - 5
    );

    /*
     * Authorized signature.
     */
    pdf.setFont(
      pdfFonts.regular,
      "normal"
    );

    pdf.setFontSize(7);

    pdf.setTextColor(
      pdfTheme.colors.mutedText
    );

    pdf.text(
      reportCardLabels.signature,
      MARGIN_X,
      footerY
    );

    /*
     * Signature image.
     */
    if (
      branding?.principalSignature
    ) {
      try {
        pdf.addImage(
          branding.principalSignature,
          "AUTO",
          MARGIN_X + 28,
          footerY - 9,
          28,
          10,
          undefined,
          "FAST"
        );
      } catch {
        /*
         * Ignore invalid signature image.
         */
      }
    }

    /*
     * Page number.
     */
    pdf.text(
      `Page ${page} of ${pageCount}`,
      PAGE_WIDTH - MARGIN_X,
      footerY,
      {
        align: "right",
      }
    );

    /*
     * School stamp.
     */
    if (
      branding?.schoolStamp &&
      page === pageCount
    ) {
      try {
        pdf.addImage(
          branding.schoolStamp,
          "AUTO",
          PAGE_WIDTH - MARGIN_X - 30,
          footerY - 18,
          25,
          18,
          undefined,
          "FAST"
        );
      } catch {
        /*
         * Ignore invalid stamp image.
         */
      }
    }

    pdf.setTextColor(
      pdfTheme.colors.text
    );
  }
}

/* =========================================
   PAGE SPACE MANAGEMENT
========================================= */

function ensureSpace({
  pdf,
  currentY,
  requiredHeight,
  reportCard,
  branding,
  primaryColor,
}: {
  pdf: PdfWithTable;
  currentY: number;
  requiredHeight: number;
  reportCard: StudentReportCard;
  branding?: SchoolBranding;
  primaryColor: string;
}) {
  if (
    currentY + requiredHeight <=
    CONTENT_BOTTOM
  ) {
    return currentY;
  }

  /*
   * Not enough room:
   * create a clean page.
   */
  pdf.addPage();

  renderHeader({
    pdf,
    reportCard,
    branding,
    primaryColor,
  });

  return HEADER_HEIGHT + 8;
}

/* =========================================
   HELPERS
========================================= */

function formatNumber(
  value: number | null | undefined
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
  if (!text) return "—";

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
