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

/* =========================================================
   A4 CONFIGURATION
========================================================= */

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;

const MARGIN_X = 14;

const CONTENT_WIDTH =
  PAGE_WIDTH -
  MARGIN_X * 2;

const HEADER_HEIGHT = 42;

const FOOTER_HEIGHT = 20;

const CONTENT_BOTTOM =
  PAGE_HEIGHT -
  FOOTER_HEIGHT -
  7;

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

  /* -------------------------------------------------------
     HEADER
  ------------------------------------------------------- */

  renderHeader({
    pdf,
    reportCard,
    branding,
    primaryColor,
  });

  /* -------------------------------------------------------
     STUDENT INFORMATION
  ------------------------------------------------------- */

  let currentY =
    renderStudentInfo({
      pdf,
      reportCard,
      primaryColor,
    });

  currentY += 7;

  /* -------------------------------------------------------
     ACADEMIC PERFORMANCE
  ------------------------------------------------------- */

  currentY = ensureSpace({
    pdf,
    currentY,
    requiredHeight: 45,
    reportCard,
    branding,
    primaryColor,
  });

  renderSectionTitle({
    pdf,
    title: "Academic Performance",
    startY: currentY,
    primaryColor,
  });

  currentY += 5;

  renderSubjectTable({
    pdf,
    reportCard,
    primaryColor,
    startY: currentY,
  });

  currentY =
    pdf.lastAutoTable?.finalY
      ? pdf.lastAutoTable.finalY + 7
      : currentY + 30;

  /* -------------------------------------------------------
     PERFORMANCE SUMMARY
  ------------------------------------------------------- */

  currentY = ensureSpace({
    pdf,
    currentY,
    requiredHeight: 50,
    reportCard,
    branding,
    primaryColor,
  });

  currentY =
    renderSummary({
      pdf,
      reportCard,
      primaryColor,
      startY: currentY,
    });

  currentY += 7;

  /* -------------------------------------------------------
     ATTENDANCE
  ------------------------------------------------------- */

  currentY = ensureSpace({
    pdf,
    currentY,
    requiredHeight: 45,
    reportCard,
    branding,
    primaryColor,
  });

  currentY =
    renderAttendance({
      pdf,
      reportCard,
      primaryColor,
      startY: currentY,
    });

  currentY += 7;

  /* -------------------------------------------------------
     GRADING SCALE
  ------------------------------------------------------- */

  currentY = ensureSpace({
    pdf,
    currentY,
    requiredHeight: 45,
    reportCard,
    branding,
    primaryColor,
  });

  currentY =
    renderGradingScale({
      pdf,
      primaryColor,
      startY: currentY,
    });

  currentY += 7;

  /* -------------------------------------------------------
     COMMENTS
  ------------------------------------------------------- */

  currentY = ensureSpace({
    pdf,
    currentY,
    requiredHeight: 82,
    reportCard,
    branding,
    primaryColor,
  });

  renderComments({
    pdf,
    reportCard,
    primaryColor,
    startY: currentY,
  });

  /* -------------------------------------------------------
     FOOTERS
  ------------------------------------------------------- */

  renderFooters({
    pdf,
    branding,
  });

  return pdf;
}

/* =========================================================
   HEADER
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
  pdf.setFillColor(primaryColor);

  pdf.rect(
    0,
    0,
    PAGE_WIDTH,
    HEADER_HEIGHT,
    "F"
  );

  /*
   * Bottom white accent.
   */
  pdf.setFillColor("#FFFFFF");

  pdf.rect(
    0,
    HEADER_HEIGHT - 1.5,
    PAGE_WIDTH,
    1.5,
    "F"
  );

  /*
   * Logo.
   */
  let contentX = MARGIN_X;

  if (branding?.schoolLogo) {
    try {
      pdf.addImage(
        branding.schoolLogo,
        "AUTO",
        MARGIN_X,
        7,
        28,
        28,
        undefined,
        "FAST"
      );

      contentX =
        MARGIN_X + 34;
    } catch {
      contentX = MARGIN_X;
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

  pdf.text(
    truncateText(
      pdf,
      schoolName,
      110
    ),
    contentX,
    12
  );

  /*
   * Report title.
   */
  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(11);

  pdf.text(
    reportCardLabels.reportTitle,
    contentX,
    20
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
    `${reportCard.session?.name || "—"}  •  ${
      reportCard.term?.name || "—"
    }`,
    contentX,
    27
  );

  /*
   * Student name at right.
   */
  const studentName =
    reportCard.student
      ? `${reportCard.student.firstName || ""} ${
          reportCard.student.lastName || ""
        }`.trim()
      : "";

  if (studentName) {
    pdf.setFont(
      pdfFonts.bold,
      "bold"
    );

    pdf.setFontSize(7);

    pdf.text(
      truncateText(
        pdf,
        studentName,
        55
      ),
      PAGE_WIDTH - MARGIN_X,
      11,
      {
        align: "right",
      }
    );
  }

  pdf.setTextColor(
    pdfTheme.colors.text
  );
}

/* =========================================================
   SECTION TITLE
========================================================= */

function renderSectionTitle({
  pdf,
  title,
  startY,
  primaryColor,
}: {
  pdf: jsPDF;
  title: string;
  startY: number;
  primaryColor: string;
}) {
  pdf.setFillColor(
    primaryColor
  );

  pdf.roundedRect(
    MARGIN_X,
    startY - 4.5,
    1.5,
    6,
    0.7,
    0.7,
    "F"
  );

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(10);

  pdf.setTextColor(
    pdfTheme.colors.text
  );

  pdf.text(
    title,
    MARGIN_X + 5,
    startY
  );
}

/* =========================================================
   STUDENT INFORMATION
========================================================= */

function renderStudentInfo({
  pdf,
  reportCard,
  primaryColor,
}: {
  pdf: jsPDF;
  reportCard: StudentReportCard;
  primaryColor: string;
}) {
  let y =
    HEADER_HEIGHT + 8;

  renderSectionTitle({
    pdf,
    title: "Student Information",
    startY: y,
    primaryColor,
  });

  y += 5;

  const student =
    reportCard.student;

  const studentName =
    student
      ? `${student.firstName || ""} ${
          student.lastName || ""
        }`.trim()
      : "—";

  const boxY = y;

  const boxHeight = 36;

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
    MARGIN_X,
    boxY,
    CONTENT_WIDTH,
    boxHeight,
    2,
    2,
    "FD"
  );

  /*
   * Identity block.
   */
  const identityWidth = 72;

  pdf.setFillColor(
    pdfTheme.colors.lightGray
  );

  pdf.rect(
    MARGIN_X,
    boxY,
    identityWidth,
    boxHeight,
    "F"
  );

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(10);

  pdf.setTextColor(
    primaryColor
  );

  pdf.text(
    truncateText(
      pdf,
      studentName,
      identityWidth - 10
    ),
    MARGIN_X + 5,
    boxY + 13
  );

  pdf.setFont(
    pdfFonts.regular,
    "normal"
  );

  pdf.setFontSize(7);

  pdf.setTextColor(
    pdfTheme.colors.mutedText
  );

  pdf.text(
    "STUDENT",
    MARGIN_X + 5,
    boxY + 21
  );

  /*
   * Information fields.
   */
  const rightX =
    MARGIN_X +
    identityWidth +
    5;

  const availableWidth =
    CONTENT_WIDTH -
    identityWidth -
    15;

  const halfWidth =
    availableWidth / 2;

  const fields = [
    {
      label: "Admission No.",
      value:
        student?.admissionNumber ||
        "—",
    },

    {
      label: "Class",
      value:
        student?.className ||
        "—",
    },

    {
      label: "Gender",
      value:
        student?.gender ||
        "—",
    },

    {
      label: "Session",
      value:
        reportCard.session?.name ||
        "—",
    },

    {
      label: "Term",
      value:
        reportCard.term?.name ||
        "—",
    },
  ];

  fields.forEach(
    (field, index) => {
      const column =
        index % 2;

      const row =
        Math.floor(index / 2);

      const x =
        rightX +
        column *
          (halfWidth + 5);

      const fieldY =
        boxY +
        7 +
        row * 12;

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(6.3);

      pdf.setTextColor(
        pdfTheme.colors.mutedText
      );

      pdf.text(
        field.label.toUpperCase(),
        x,
        fieldY
      );

      pdf.setFont(
        pdfFonts.regular,
        "normal"
      );

      pdf.setFontSize(8);

      pdf.setTextColor(
        pdfTheme.colors.text
      );

      pdf.text(
        truncateText(
          pdf,
          String(field.value),
          halfWidth
        ),
        x,
        fieldY + 4
      );
    }
  );

  /*
   * Separator.
   */
  pdf.setDrawColor(
    pdfTheme.colors.border
  );

  pdf.line(
    MARGIN_X +
      identityWidth,
    boxY,
    MARGIN_X +
      identityWidth,
    boxY +
      boxHeight
  );

  return (
    boxY +
    boxHeight
  );
}

/* =========================================================
   SUBJECT TABLE
========================================================= */

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
  autoTable(pdf, {
    startY,

    margin: {
      left: MARGIN_X,
      right: MARGIN_X,
      top: HEADER_HEIGHT + 5,
      bottom: FOOTER_HEIGHT + 7,
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
      reportCard.results?.length > 0
        ? reportCard.results.map(
            (subject) => [
              subject.subjectName ||
                "—",

              formatNumber(
                subject.ca1
              ),

              formatNumber(
                subject.ca2
              ),

              formatNumber(
                subject.assignment
              ),

              formatNumber(
                subject.exam
              ),

              formatNumber(
                subject.total
              ),

              subject.grade ||
                "—",

              subject.remark ||
                "—",
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
      fontSize: 7.2,

      cellPadding: {
        top: 2.5,
        bottom: 2.5,
        left: 1.8,
        right: 1.8,
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
      fontSize: 7,

      fillColor: primaryColor,

      textColor: "#FFFFFF",

      halign: "center",
      valign: "middle",

      cellPadding: 2.7,
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
        cellWidth: 42,
        halign: "left",
      },

      1: {
        cellWidth: 13,
        halign: "center",
      },

      2: {
        cellWidth: 13,
        halign: "center",
      },

      3: {
        cellWidth: 17,
        halign: "center",
      },

      4: {
        cellWidth: 13,
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
      if (
        data.section === "body" &&
        data.column.index === 0
      ) {
        data.cell.styles.fontStyle =
          "bold";
      }

      if (
        data.section === "body" &&
        data.column.index >= 1 &&
        data.column.index <= 6
      ) {
        data.cell.styles.halign =
          "center";
      }

      if (
        data.section === "body" &&
        data.column.index === 6
      ) {
        data.cell.styles.fontStyle =
          "bold";
      }
    },

    didDrawPage(data) {
      if (
        data.pageNumber > 1
      ) {
        renderContinuationHeader({
          pdf,
          reportCard,
          primaryColor,
        });
      }
    },
  });
}

/* =========================================================
   CONTINUATION HEADER
========================================================= */

function renderContinuationHeader({
  pdf,
  reportCard,
  primaryColor,
}: {
  pdf: jsPDF;
  reportCard: StudentReportCard;
  primaryColor: string;
}) {
  pdf.setFillColor(
    primaryColor
  );

  pdf.rect(
    0,
    0,
    PAGE_WIDTH,
    14,
    "F"
  );

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(7.5);

  pdf.setTextColor(
    "#FFFFFF"
  );

  const studentName =
    reportCard.student
      ? `${reportCard.student.firstName || ""} ${
          reportCard.student.lastName || ""
        }`.trim()
      : "Student";

  pdf.text(
    studentName,
    MARGIN_X,
    8.5
  );

  pdf.text(
    reportCardLabels.reportTitle,
    PAGE_WIDTH - MARGIN_X,
    8.5,
    {
      align: "right",
    }
  );

  pdf.setTextColor(
    pdfTheme.colors.text
  );
}

/* =========================================================
   PERFORMANCE SUMMARY
========================================================= */

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
  renderSectionTitle({
    pdf,
    title: "Overall Performance",
    startY,
    primaryColor,
  });

  const boxY =
    startY + 5;

  const boxHeight = 48;

  pdf.setFillColor(
    pdfTheme.colors.background
  );

  pdf.setDrawColor(
    pdfTheme.colors.border
  );

  pdf.roundedRect(
    MARGIN_X,
    boxY,
    CONTENT_WIDTH,
    boxHeight,
    2,
    2,
    "FD"
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

  const items = [
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
          summary?.subjectsCount ||
            0
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

  const gap = 3;

  const cardWidth =
    (CONTENT_WIDTH -
      gap * 3) /
    4;

  items.forEach(
    (item, index) => {
      const x =
        MARGIN_X +
        index *
          (cardWidth + gap);

      pdf.setFillColor(
        pdfTheme.colors.lightGray
      );

      pdf.setDrawColor(
        pdfTheme.colors.border
      );

      pdf.roundedRect(
        x,
        boxY + 5,
        cardWidth,
        23,
        1.5,
        1.5,
        "FD"
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(6.4);

      pdf.setTextColor(
        pdfTheme.colors.mutedText
      );

      pdf.text(
        item.label,
        x +
          cardWidth / 2,
        boxY + 11,
        {
          align: "center",
        }
      );

      pdf.setFontSize(10);

      pdf.setTextColor(
        primaryColor
      );

      pdf.text(
        item.value,
        x +
          cardWidth / 2,
        boxY + 21,
        {
          align: "center",
        }
      );
    }
  );

  /*
   * Performance text.
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
    boxY + 36
  );

  /*
   * Progress background.
   */
  const barX =
    MARGIN_X + 50;

  const barY =
    boxY + 33;

  const barWidth =
    CONTENT_WIDTH - 55;

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

  pdf.setFont(
    pdfFonts.regular,
    "normal"
  );

  pdf.setFontSize(6.5);

  pdf.setTextColor(
    pdfTheme.colors.mutedText
  );

  pdf.text(
    "0%",
    barX,
    boxY + 41
  );

  pdf.text(
    "50%",
    barX +
      barWidth / 2,
    boxY + 41,
    {
      align: "center",
    }
  );

  pdf.text(
    "100%",
    barX + barWidth,
    boxY + 41,
    {
      align: "right",
    }
  );

  return (
    boxY +
    boxHeight
  );
}

/* =========================================================
   ATTENDANCE
========================================================= */

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
  renderSectionTitle({
    pdf,
    title:
      reportCardLabels.attendance,
    startY,
    primaryColor,
  });

  const attendance =
    reportCard.attendance || {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
    };

  const calculatedPercentage =
    calculateAttendancePercentage(
      attendance
    );

  const percentage =
    Number.isFinite(
      Number(
        attendance.percentage
      )
    )
      ? Number(
          attendance.percentage
        )
      : calculatedPercentage;

  const boxY =
    startY + 5;

  const boxHeight = 38;

  pdf.setFillColor(
    pdfTheme.colors.background
  );

  pdf.setDrawColor(
    pdfTheme.colors.border
  );

  pdf.roundedRect(
    MARGIN_X,
    boxY,
    CONTENT_WIDTH,
    boxHeight,
    2,
    2,
    "FD"
  );

  /*
   * Four statistics.
   */
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
  ];

  const gap = 3;

  const itemWidth =
    (CONTENT_WIDTH -
      gap * 3) /
    4;

  items.forEach(
    (item, index) => {
      const x =
        MARGIN_X +
        index *
          (itemWidth + gap);

      pdf.setFillColor(
        pdfTheme.colors.lightGray
      );

      pdf.setDrawColor(
        pdfTheme.colors.border
      );

      pdf.roundedRect(
        x,
        boxY + 5,
        itemWidth,
        20,
        1.5,
        1.5,
        "FD"
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(6.2);

      pdf.setTextColor(
        pdfTheme.colors.mutedText
      );

      pdf.text(
        item.label,
        x +
          itemWidth / 2,
        boxY + 11,
        {
          align: "center",
        }
      );

      pdf.setFontSize(9.5);

      pdf.setTextColor(
        index === 1
          ? primaryColor
          : pdfTheme.colors.text
      );

      pdf.text(
        item.value,
        x +
          itemWidth / 2,
        boxY + 19,
        {
          align: "center",
        }
      );
    }
  );

  /*
   * Percentage progress bar.
   */
  const barX =
    MARGIN_X + 4;

  const barY =
    boxY + 30;

  const barWidth =
    CONTENT_WIDTH - 35;

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
        percentage
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

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(8);

  pdf.setTextColor(
    primaryColor
  );

  pdf.text(
    `${percentage.toFixed(0)}%`,
    PAGE_WIDTH -
      MARGIN_X -
      4,
    boxY + 33,
    {
      align: "right",
    }
  );

  return (
    boxY +
    boxHeight
  );
}

/* =========================================================
   GRADING SCALE
========================================================= */

function renderGradingScale({
  pdf,
  primaryColor,
  startY,
}: {
  pdf: PdfWithTable;
  primaryColor: string;
  startY: number;
}) {
  renderSectionTitle({
    pdf,
    title: "Grading Scale",
    startY,
    primaryColor,
  });

  const tableY =
    startY + 5;

  autoTable(pdf, {
    startY: tableY,

    margin: {
      left: MARGIN_X,
      right: MARGIN_X,
      bottom: FOOTER_HEIGHT + 7,
    },

    tableWidth: CONTENT_WIDTH,

    theme: "grid",

    head: [
      [
        "Grade",
        "Score Range",
        "Meaning",
      ],
    ],

    body: [
      ["A", "70 – 100", "Excellent"],
      ["B", "60 – 69", "Very Good"],
      ["C", "50 – 59", "Good"],
      ["D", "45 – 49", "Pass"],
      ["E", "40 – 44", "Weak Pass"],
      ["F", "0 – 39", "Fail"],
    ],

    styles: {
      font: pdfFonts.regular,
      fontSize: 6.8,

      cellPadding: {
        top: 1.8,
        bottom: 1.8,
        left: 2,
        right: 2,
      },

      lineWidth: 0.25,

      lineColor:
        pdfTheme.colors.tableBorder,

      textColor:
        pdfTheme.colors.text,

      valign: "middle",
    },

    headStyles: {
      font: pdfFonts.bold,
      fontStyle: "bold",
      fontSize: 6.7,

      fillColor: primaryColor,
      textColor: "#FFFFFF",

      halign: "center",
    },

    columnStyles: {
      0: {
        cellWidth: 25,
        halign: "center",
      },

      1: {
        cellWidth: 45,
        halign: "center",
      },

      2: {
        cellWidth: "auto",
        halign: "left",
      },
    },

    alternateRowStyles: {
      fillColor:
        pdfTheme.colors.lightGray,
    },

    didParseCell(data) {
      if (
        data.section === "body" &&
        data.column.index === 0
      ) {
        data.cell.styles.fontStyle =
          "bold";
      }
    },
  });

  return (
    pdf.lastAutoTable?.finalY ||
    tableY + 35
  );
}

/* =========================================================
   COMMENTS
========================================================= */

function renderComments({
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
  renderSectionTitle({
    pdf,
    title: "Assessment & Approval",
    startY,
    primaryColor,
  });

  let y =
    startY + 5;

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

  /*
   * Teacher comment.
   */
  y =
    renderCommentBox({
      pdf,
      title:
        reportCardLabels.teacherComment ||
        "Class Teacher's Comment",
      text: teacherComment,
      startY: y,
      height: 23,
      primaryColor,
    });

  y += 4;

  /*
   * Principal comment.
   */
  y =
    renderCommentBox({
      pdf,
      title:
        reportCardLabels.principalComment ||
        "Principal / Head Teacher's Comment",
      text: "",
      startY: y,
      height: 23,
      primaryColor,
    });

  y += 7;

  /*
   * Signature lines.
   */
  const signatureWidth =
    (CONTENT_WIDTH - 10) /
    3;

  const labels = [
    "Class Teacher",
    "Principal / Head Teacher",
    "Date",
  ];

  labels.forEach(
    (label, index) => {
      const x =
        MARGIN_X +
        index *
          (signatureWidth + 5);

      pdf.setDrawColor(
        pdfTheme.colors.border
      );

      pdf.setLineWidth(0.3);

      pdf.line(
        x,
        y + 12,
        x + signatureWidth,
        y + 12
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(6.5);

      pdf.setTextColor(
        pdfTheme.colors.mutedText
      );

      pdf.text(
        label,
        x +
          signatureWidth / 2,
        y + 17,
        {
          align: "center",
        }
      );
    }
  );
}

/* =========================================================
   COMMENT BOX
========================================================= */

function renderCommentBox({
  pdf,
  title,
  text,
  startY,
  height,
  primaryColor,
}: {
  pdf: jsPDF;
  title: string;
  text: string;
  startY: number;
  height: number;
  primaryColor: string;
}) {
  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(6.8);

  pdf.setTextColor(
    primaryColor
  );

  pdf.text(
    title,
    MARGIN_X,
    startY
  );

  const boxY =
    startY + 3;

  pdf.setFillColor(
    pdfTheme.colors.lightGray
  );

  pdf.setDrawColor(
    pdfTheme.colors.border
  );

  pdf.setLineWidth(0.3);

  pdf.roundedRect(
    MARGIN_X,
    boxY,
    CONTENT_WIDTH,
    height,
    1.5,
    1.5,
    "FD"
  );

  /*
   * Teacher comment.
   */
  if (text) {
    pdf.setFont(
      pdfFonts.regular,
      "normal"
    );

    pdf.setFontSize(7.2);

    pdf.setTextColor(
      pdfTheme.colors.text
    );

    const wrapped =
      pdf.splitTextToSize(
        text,
        CONTENT_WIDTH - 8
      );

    pdf.text(
      wrapped,
      MARGIN_X + 4,
      boxY + 7
    );
  } else {
    /*
     * Writing lines.
     */
    pdf.setDrawColor(
      pdfTheme.colors.border
    );

    for (
      let line = 0;
      line < 2;
      line++
    ) {
      const lineY =
        boxY +
        9 +
        line * 7;

      pdf.line(
        MARGIN_X + 4,
        lineY,
        MARGIN_X +
          CONTENT_WIDTH -
          4,
        lineY
      );
    }
  }

  return (
    boxY +
    height
  );
}

/* =========================================================
   FOOTER
========================================================= */

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
      PAGE_HEIGHT - 9;

    /*
     * Footer line.
     */
    pdf.setDrawColor(
      pdfTheme.colors.border
    );

    pdf.setLineWidth(0.3);

    pdf.line(
      MARGIN_X,
      footerY - 5,
      PAGE_WIDTH -
        MARGIN_X,
      footerY - 5
    );

    /*
     * School name.
     */
    pdf.setFont(
      pdfFonts.regular,
      "normal"
    );

    pdf.setFontSize(6.5);

    pdf.setTextColor(
      pdfTheme.colors.mutedText
    );

    pdf.text(
      truncateText(
        pdf,
        branding?.schoolName ||
          "School",
        70
      ),
      MARGIN_X,
      footerY
    );

    /*
     * EduTrack.
     */
    pdf.text(
      "Generated by EduTrack",
      PAGE_WIDTH / 2,
      footerY,
      {
        align: "center",
      }
    );

    /*
     * Page number.
     */
    pdf.text(
      `Page ${page} of ${pageCount}`,
      PAGE_WIDTH -
        MARGIN_X,
      footerY,
      {
        align: "right",
      }
    );

    /*
     * Principal signature.
     */
    if (
      page === pageCount &&
      branding?.principalSignature
    ) {
      try {
        pdf.addImage(
          branding.principalSignature,
          "AUTO",
          PAGE_WIDTH -
            MARGIN_X -
            40,
          footerY - 15,
          25,
          9,
          undefined,
          "FAST"
        );
      } catch {
        /*
         * Ignore invalid signature.
         */
      }
    }

    /*
     * School stamp.
     */
    if (
      page === pageCount &&
      branding?.schoolStamp
    ) {
      try {
        pdf.addImage(
          branding.schoolStamp,
          "AUTO",
          PAGE_WIDTH -
            MARGIN_X -
            70,
          footerY - 18,
          22,
          18,
          undefined,
          "FAST"
        );
      } catch {
        /*
         * Ignore invalid stamp.
         */
      }
    }

    pdf.setTextColor(
      pdfTheme.colors.text
    );
  }
}

/* =========================================================
   PAGE SPACE MANAGEMENT
========================================================= */

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
    currentY +
      requiredHeight <=
    CONTENT_BOTTOM
  ) {
    return currentY;
  }

  pdf.addPage();

  renderContinuationHeader({
    pdf,
    reportCard,
    primaryColor,
  });

  return 21;
}

/* =========================================================
   NUMBER FORMAT
========================================================= */

function formatNumber(
  value: number | null | undefined
) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(
      Number(value)
    )
  ) {
    return "0";
  }

  return Number(value).toFixed(0);
}

/* =========================================================
   TEXT TRUNCATION
========================================================= */

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

/* =========================================================
   DEFAULT COMMENT
========================================================= */

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
