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

/* =========================================================
   TYPES
========================================================= */

type GenerateStudentPdfParams = {
  reportCard: StudentReportCard;
  branding?: SchoolBranding;
};

type ExtendedBranding = SchoolBranding & {
  address?: string;
  schoolAddress?: string;

  phone?: string;
  phoneNumber?: string;

  email?: string;
  schoolEmail?: string;

  website?: string;
  schoolWebsite?: string;

  principalName?: string;
  headTeacherName?: string;

  schoolLogo?: string;
  principalSignature?: string;
  schoolStamp?: string;
};

/* =========================================================
   PAGE CONFIGURATION

   THIS IS A SINGLE A4 PAPER.

   If your school has another maximum number of subjects,
   change MAX_SUBJECTS only.
========================================================= */

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;

const MARGIN_X = 9;

const CONTENT_WIDTH =
  PAGE_WIDTH - MARGIN_X * 2;

const MAX_SUBJECTS = 15;

/*
 * Fixed areas.
 *
 * The complete page is intentionally designed around
 * these heights so nothing is allowed to create page 2.
 */

const HEADER_Y = 5;
const HEADER_HEIGHT = 29;

const PROFILE_Y = 37;
const PROFILE_HEIGHT = 31;

const ACADEMIC_TITLE_Y = 71;

const TABLE_Y = 76;
const TABLE_HEADER_HEIGHT = 7;
const TABLE_ROW_HEIGHT = 4.25;

const TABLE_HEIGHT =
  TABLE_HEADER_HEIGHT +
  MAX_SUBJECTS * TABLE_ROW_HEIGHT;

const SUMMARY_Y =
  TABLE_Y + TABLE_HEIGHT + 4;

const SUMMARY_HEIGHT = 23;

const ATTENDANCE_Y =
  SUMMARY_Y + SUMMARY_HEIGHT + 4;

const ATTENDANCE_HEIGHT = 18;

const COMMENTS_Y =
  ATTENDANCE_Y + ATTENDANCE_HEIGHT + 4;

const COMMENTS_HEIGHT = 24;

const GRADING_Y =
  COMMENTS_Y + COMMENTS_HEIGHT + 4;

const GRADING_HEIGHT = 18;

const APPROVAL_Y =
  GRADING_Y + GRADING_HEIGHT + 4;

const APPROVAL_HEIGHT = 19;

const FOOTER_Y = 290;

/* =========================================================
   MAIN GENERATOR
========================================================= */

export async function generateStudentPdf({
  reportCard,
  branding,
}: GenerateStudentPdfParams) {
  /*
   * STRICTLY ONE A4 PAGE.
   */
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

  const extendedBranding =
    branding as ExtendedBranding | undefined;

  const primaryColor =
    branding?.primaryColor ||
    pdfTheme.colors.primary;

  /*
   * =======================================================
   * HEADER
   * =======================================================
   */

  renderHeader({
    pdf,
    reportCard,
    branding: extendedBranding,
    primaryColor,
  });

  /*
   * =======================================================
   * STUDENT PROFILE
   * =======================================================
   */

  renderStudentProfile({
    pdf,
    reportCard,
    branding: extendedBranding,
    primaryColor,
  });

  /*
   * =======================================================
   * ACADEMIC PERFORMANCE TITLE
   * =======================================================
   */

  renderSectionTitle({
    pdf,
    title: "Academic Performance",
    y: ACADEMIC_TITLE_Y,
    primaryColor,
  });

  /*
   * =======================================================
   * SUBJECT TABLE
   * =======================================================
   */

  renderSubjectTable({
    pdf,
    reportCard,
    primaryColor,
  });

  /*
   * =======================================================
   * SUMMARY
   * =======================================================
   */

  renderSummary({
    pdf,
    reportCard,
    primaryColor,
  });

  /*
   * =======================================================
   * ATTENDANCE
   * =======================================================
   */

  renderAttendance({
    pdf,
    reportCard,
    primaryColor,
  });

  /*
   * =======================================================
   * COMMENTS
   * =======================================================
   */

  renderComments({
    pdf,
    reportCard,
    primaryColor,
  });

  /*
   * =======================================================
   * GRADING SCALE
   * =======================================================
   */

  renderGradingScale({
    pdf,
    primaryColor,
  });

  /*
   * =======================================================
   * APPROVAL
   * =======================================================
   */

  renderApproval({
    pdf,
    reportCard,
    branding: extendedBranding,
    primaryColor,
  });

  /*
   * =======================================================
   * FOOTER
   * =======================================================
   */

  renderFooter({
    pdf,
    branding: extendedBranding,
  });

  /*
   * IMPORTANT:
   *
   * There is deliberately NO addPage() anywhere.
   *
   * The report is always exactly one paper.
   */

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
  branding?: ExtendedBranding;
  primaryColor: string;
}) {
  /*
   * Outer colored header.
   */

  pdf.setFillColor(primaryColor);

  pdf.roundedRect(
    MARGIN_X,
    HEADER_Y,
    CONTENT_WIDTH,
    HEADER_HEIGHT,
    2,
    2,
    "F"
  );

  /*
   * White inner header.
   */

  pdf.setFillColor("#FFFFFF");

  pdf.roundedRect(
    MARGIN_X + 1.2,
    HEADER_Y + 1.2,
    CONTENT_WIDTH - 2.4,
    HEADER_HEIGHT - 2.4,
    1.2,
    1.2,
    "F"
  );

  /*
   * =======================================================
   * SCHOOL LOGO
   * =======================================================
   */

  const logoX = MARGIN_X + 3;
  const logoY = HEADER_Y + 3;

  const logoSize = 23;

  pdf.setDrawColor(primaryColor);

  pdf.setLineWidth(0.6);

  pdf.roundedRect(
    logoX,
    logoY,
    logoSize,
    logoSize,
    1.5,
    1.5,
    "S"
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
      drawLogoPlaceholder({
        pdf,
        x: logoX,
        y: logoY,
        size: logoSize,
        primaryColor,
      });
    }
  } else {
    drawLogoPlaceholder({
      pdf,
      x: logoX,
      y: logoY,
      size: logoSize,
      primaryColor,
    });
  }

  /*
   * =======================================================
   * SCHOOL DETAILS
   * =======================================================
   */

  const schoolX =
    logoX + logoSize + 5;

  const schoolName =
    branding?.schoolName ||
    "SCHOOL NAME";

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(13);

  pdf.setTextColor(primaryColor);

  pdf.text(
    truncateText(
      pdf,
      schoolName,
      105
    ),
    schoolX,
    HEADER_Y + 9
  );

  /*
   * Address.
   */

  const address =
    branding?.address ||
    branding?.schoolAddress ||
    "";

  if (address) {
    pdf.setFont(
      pdfFonts.regular,
      "normal"
    );

    pdf.setFontSize(5.7);

    pdf.setTextColor(
      pdfTheme.colors.mutedText
    );

    pdf.text(
      truncateText(
        pdf,
        address,
        105
      ),
      schoolX,
      HEADER_Y + 14
    );
  }

  /*
   * Contact.
   */

  const phone =
    branding?.phone ||
    branding?.phoneNumber ||
    "";

  const email =
    branding?.email ||
    branding?.schoolEmail ||
    "";

  const contact = [
    phone,
    email,
  ]
    .filter(Boolean)
    .join("  •  ");

  if (contact) {
    pdf.setFont(
      pdfFonts.regular,
      "normal"
    );

    pdf.setFontSize(5.2);

    pdf.setTextColor(
      pdfTheme.colors.mutedText
    );

    pdf.text(
      truncateText(
        pdf,
        contact,
        105
      ),
      schoolX,
      HEADER_Y + 18.5
    );
  }

  /*
   * =======================================================
   * REPORT TITLE
   * =======================================================
   */

  const rightX =
    PAGE_WIDTH - MARGIN_X - 5;

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(8.2);

  pdf.setTextColor(primaryColor);

  pdf.text(
    "STUDENT REPORT CARD",
    rightX,
    HEADER_Y + 9,
    {
      align: "right",
    }
  );

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(5.8);

  pdf.setTextColor(
    pdfTheme.colors.text
  );

  pdf.text(
    `SESSION: ${
      reportCard.session?.name || "—"
    }`,
    rightX,
    HEADER_Y + 15,
    {
      align: "right",
    }
  );

  pdf.text(
    `TERM: ${
      reportCard.term?.name || "—"
    }`,
    rightX,
    HEADER_Y + 20,
    {
      align: "right",
    }
  );

  /*
   * Small accent line.
   */

  pdf.setFillColor(primaryColor);

  pdf.rect(
    MARGIN_X + 1,
    HEADER_Y +
      HEADER_HEIGHT -
      4,
    CONTENT_WIDTH - 2,
    1.5,
    "F"
  );
}

/* =========================================================
   LOGO PLACEHOLDER
========================================================= */

function drawLogoPlaceholder({
  pdf,
  x,
  y,
  size,
  primaryColor,
}: {
  pdf: jsPDF;
  x: number;
  y: number;
  size: number;
  primaryColor: string;
}) {
  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(5.5);

  pdf.setTextColor(primaryColor);

  pdf.text(
    "SCHOOL",
    x + size / 2,
    y + size / 2 - 1,
    {
      align: "center",
    }
  );

  pdf.setFont(
    pdfFonts.regular,
    "normal"
  );

  pdf.setFontSize(4.5);

  pdf.text(
    "LOGO",
    x + size / 2,
    y + size / 2 + 4,
    {
      align: "center",
    }
  );
}

/* =========================================================
   STUDENT PROFILE
========================================================= */

function renderStudentProfile({
  pdf,
  reportCard,
  primaryColor,
}: {
  pdf: jsPDF;
  reportCard: StudentReportCard;
  branding?: ExtendedBranding;
  primaryColor: string;
}) {
  renderSectionTitle({
    pdf,
    title: "Student Information",
    y: PROFILE_Y,
    primaryColor,
  });

  const boxY =
    PROFILE_Y + 4;

  /*
   * Main profile box.
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
    PROFILE_HEIGHT - 4,
    1.5,
    1.5,
    "FD"
  );

  /*
   * =======================================================
   * PASSPORT AREA
   * =======================================================
   */

  const passportWidth = 23;
  const passportHeight = 23;

  const passportX =
    PAGE_WIDTH -
    MARGIN_X -
    passportWidth -
    3;

  const passportY =
    boxY + 2;

  pdf.setDrawColor(primaryColor);

  pdf.setLineWidth(0.6);

  pdf.rect(
    passportX,
    passportY,
    passportWidth,
    passportHeight,
    "S"
  );

  const studentWithPhoto =
    reportCard.student as typeof reportCard.student & {
      photo?: string;
      passport?: string;
      passportPhoto?: string;
      image?: string;
      profilePhoto?: string;
    };

  const photo =
    studentWithPhoto.photo ||
    studentWithPhoto.passport ||
    studentWithPhoto.passportPhoto ||
    studentWithPhoto.image ||
    studentWithPhoto.profilePhoto ||
    "";

  if (photo) {
    try {
      pdf.addImage(
        photo,
        "AUTO",
        passportX + 1,
        passportY + 1,
        passportWidth - 2,
        passportHeight - 2,
        undefined,
        "FAST"
      );
    } catch {
      drawPassportPlaceholder({
        pdf,
        x: passportX,
        y: passportY,
        width: passportWidth,
        height: passportHeight,
        primaryColor,
      });
    }
  } else {
    drawPassportPlaceholder({
      pdf,
      x: passportX,
      y: passportY,
      width: passportWidth,
      height: passportHeight,
      primaryColor,
    });
  }

  /*
   * =======================================================
   * INFORMATION GRID
   * =======================================================
   */

  const infoWidth =
    CONTENT_WIDTH -
    passportWidth -
    7;

  const infoX =
    MARGIN_X + 3;

  const rowHeight =
    7.5;

  const columns = [
    {
      label: "Student Name",
      value:
        `${reportCard.student?.firstName || ""} ${
          reportCard.student?.lastName || ""
        }`.trim() || "—",
    },
    {
      label: "Admission No.",
      value:
        reportCard.student
          ?.admissionNumber || "—",
    },
    {
      label: "Class",
      value:
        reportCard.student
          ?.className || "—",
    },
    {
      label: "Gender",
      value:
        reportCard.student
          ?.gender || "—",
    },
    {
      label: "Session",
      value:
        reportCard.session
          ?.name || "—",
    },
    {
      label: "Term",
      value:
        reportCard.term
          ?.name || "—",
    },
  ];

  const cellWidth =
    infoWidth / 2;

  columns.forEach(
    (item, index) => {
      const row =
        Math.floor(index / 2);

      const col =
        index % 2;

      const x =
        infoX +
        col * cellWidth;

      const y =
        boxY +
        row * rowHeight;

      /*
       * Vertical divider.
       */

      if (col === 1) {
        pdf.setDrawColor(
          pdfTheme.colors.border
        );

        pdf.line(
          x,
          y,
          x,
          y + rowHeight
        );
      }

      /*
       * Horizontal divider.
       */

      if (row > 0) {
        pdf.setDrawColor(
          pdfTheme.colors.border
        );

        pdf.line(
          x,
          y,
          x + cellWidth,
          y
        );
      }

      /*
       * Label.
       */

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(5.2);

      pdf.setTextColor(
        pdfTheme.colors.mutedText
      );

      pdf.text(
        item.label,
        x + 2,
        y + 3.2
      );

      /*
       * Value.
       */

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(6.8);

      pdf.setTextColor(
        pdfTheme.colors.text
      );

      pdf.text(
        truncateText(
          pdf,
          String(item.value),
          cellWidth - 25
        ),
        x + 24,
        y + 3.2
      );
    }
  );
}

/* =========================================================
   PASSPORT PLACEHOLDER
========================================================= */

function drawPassportPlaceholder({
  pdf,
  x,
  y,
  width,
  height,
  primaryColor,
}: {
  pdf: jsPDF;
  x: number;
  y: number;
  width: number;
  height: number;
  primaryColor: string;
}) {
  pdf.setFillColor("#F8FAFC");

  pdf.rect(
    x,
    y,
    width,
    height,
    "F"
  );

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(4.5);

  pdf.setTextColor(primaryColor);

  pdf.text(
    "STUDENT",
    x + width / 2,
    y + height / 2 - 1,
    {
      align: "center",
    }
  );

  pdf.setFont(
    pdfFonts.regular,
    "normal"
  );

  pdf.setFontSize(4);

  pdf.setTextColor(
    pdfTheme.colors.mutedText
  );

  pdf.text(
    "PASSPORT",
    x + width / 2,
    y + height / 2 + 3,
    {
      align: "center",
    }
  );
}

/* =========================================================
   SECTION TITLE
========================================================= */

function renderSectionTitle({
  pdf,
  title,
  y,
  primaryColor,
}: {
  pdf: jsPDF;
  title: string;
  y: number;
  primaryColor: string;
}) {
  pdf.setFillColor(primaryColor);

  pdf.roundedRect(
    MARGIN_X,
    y - 3,
    1.8,
    5.5,
    0.7,
    0.7,
    "F"
  );

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(7.8);

  pdf.setTextColor(
    pdfTheme.colors.text
  );

  pdf.text(
    title.toUpperCase(),
    MARGIN_X + 4,
    y + 1
  );
}

/* =========================================================
   SUBJECT TABLE
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
   * Fixed column widths.
   *
   * Total = 192mm
   * which matches the available A4 width.
   */

  const widths = [
    50, // Subject
    14, // CA1
    14, // CA2
    20, // Assignment
    14, // Exam
    14, // Total
    13, // Grade
    53, // Remark
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

  pdf.setFillColor(primaryColor);

  pdf.setDrawColor(
    pdfTheme.colors.tableBorder
  );

  pdf.setLineWidth(0.25);

  let currentX = x;

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

      pdf.setFontSize(
        index === 3
          ? 4.7
          : 5.2
      );

      pdf.setTextColor("#FFFFFF");

      pdf.text(
        header,
        currentX +
          widths[index] / 2,
        y + 4.7,
        {
          align: "center",
        }
      );

      currentX += widths[index];
    }
  );

  /*
   * Subject data.
   */

  const results =
    Array.isArray(
      reportCard.results
    )
      ? reportCard.results
      : [];

  /*
   * Always render MAX_SUBJECTS rows.
   *
   * Empty rows are intentional.
   * They reserve the exact professional
   * paper space.
   */

  for (
    let rowIndex = 0;
    rowIndex < MAX_SUBJECTS;
    rowIndex++
  ) {
    const subject =
      results[rowIndex];

    const rowY =
      y +
      TABLE_HEADER_HEIGHT +
      rowIndex *
        TABLE_ROW_HEIGHT;

    /*
     * Alternating row background.
     */

    if (rowIndex % 2 === 1) {
      pdf.setFillColor(
        pdfTheme.colors.lightGray
      );
    } else {
      pdf.setFillColor(
        "#FFFFFF"
      );
    }

    pdf.setDrawColor(
      pdfTheme.colors.tableBorder
    );

    currentX = x;

    const values = subject
      ? [
          subject.subjectName || "—",
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

    values.forEach(
      (value, columnIndex) => {
        pdf.rect(
          currentX,
          rowY,
          widths[columnIndex],
          TABLE_ROW_HEIGHT,
          "FD"
        );

        if (value) {
          pdf.setFont(
            pdfFonts.regular,
            "normal"
          );

          if (
            columnIndex === 0
          ) {
            pdf.setFont(
              pdfFonts.bold,
              "bold"
            );
          }

          pdf.setFontSize(
            columnIndex === 0
              ? 5.3
              : 5.1
          );

          pdf.setTextColor(
            pdfTheme.colors.text
          );

          const maxWidth =
            widths[columnIndex] -
            2.5;

          const text =
            truncateText(
              pdf,
              String(value),
              maxWidth
            );

          const alignCenter =
            columnIndex >= 1 &&
            columnIndex <= 6;

          pdf.text(
            text,
            alignCenter
              ? currentX +
                  widths[
                    columnIndex
                  ] /
                    2
              : currentX + 1.3,
            rowY + 2.9,
            alignCenter
              ? {
                  align:
                    "center",
                }
              : undefined
          );
        }

        currentX +=
          widths[columnIndex];
      }
    );
  }

  /*
   * If backend returns more than MAX_SUBJECTS,
   * we intentionally keep the page fixed.
   *
   * The maximum should match the school's actual
   * curriculum configuration.
   */
}

/* =========================================================
   PERFORMANCE SUMMARY
========================================================= */

function renderSummary({
  pdf,
  reportCard,
  primaryColor,
}: {
  pdf: jsPDF;
  reportCard: StudentReportCard;
  primaryColor: string;
}) {
  renderSectionTitle({
    pdf,
    title: "Overall Performance",
    y: SUMMARY_Y,
    primaryColor,
  });

  const boxY =
    SUMMARY_Y + 4;

  /*
   * Outer box.
   */

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
    SUMMARY_HEIGHT - 4,
    1.5,
    1.5,
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
        reportCardLabels.totalScore ||
        "Total Score",
      value:
        formatNumber(
          summary?.totalScore
        ),
    },

    {
      label:
        reportCardLabels.averageScore ||
        "Average",
      value:
        `${average.toFixed(
          1
        )}%`,
    },

    {
      label:
        reportCardLabels.subjects ||
        "Subjects",
      value:
        String(
          summary?.subjectsCount ||
            0
        ),
    },

    {
      label:
        reportCardLabels.classPosition ||
        "Class Position",
      value:
        summary?.positionLabel ||
        "—",
    },
  ];

  const gap = 2;

  const itemWidth =
    (CONTENT_WIDTH -
      gap * 3) /
    4;

  items.forEach(
    (item, index) => {
      const itemX =
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
        itemX,
        boxY + 2,
        itemWidth,
        12,
        1,
        1,
        "FD"
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(4.9);

      pdf.setTextColor(
        pdfTheme.colors.mutedText
      );

      pdf.text(
        item.label,
        itemX +
          itemWidth / 2,
        boxY + 5.5,
        {
          align: "center",
        }
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(7.5);

      pdf.setTextColor(primaryColor);

      pdf.text(
        item.value,
        itemX +
          itemWidth / 2,
        boxY + 10,
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

  pdf.setFontSize(5.4);

  pdf.setTextColor(
    pdfTheme.colors.text
  );

  pdf.text(
    `Performance: ${performance}`,
    MARGIN_X + 3,
    boxY + 19
  );

  /*
   * Progress bar.
   */

  const barX =
    MARGIN_X + 38;

  const barY =
    boxY + 17;

  const barWidth =
    CONTENT_WIDTH - 43;

  pdf.setFillColor(
    pdfTheme.colors.border
  );

  pdf.roundedRect(
    barX,
    barY,
    barWidth,
    2,
    1,
    1,
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
    pdf.setFillColor(primaryColor);

    pdf.roundedRect(
      barX,
      barY,
      (barWidth *
        progress) /
        100,
      2,
      1,
      1,
      "F"
    );
  }
}

/* =========================================================
   ATTENDANCE
========================================================= */

function renderAttendance({
  pdf,
  reportCard,
  primaryColor,
}: {
  pdf: jsPDF;
  reportCard: StudentReportCard;
  primaryColor: string;
}) {
  renderSectionTitle({
    pdf,
    title: "Attendance",
    y: ATTENDANCE_Y,
    primaryColor,
  });

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

  const boxY =
    ATTENDANCE_Y + 4;

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
    ATTENDANCE_HEIGHT - 4,
    1.5,
    1.5,
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
        1
      )}%`,
    },
  ];

  const gap = 2;

  const itemWidth =
    (CONTENT_WIDTH -
      gap * 4) /
    5;

  items.forEach(
    (item, index) => {
      const itemX =
        MARGIN_X +
        index *
          (itemWidth + gap);

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
        boxY + 2,
        itemWidth,
        10.5,
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
          ? "#E5E7EB"
          : pdfTheme.colors.mutedText
      );

      pdf.text(
        item.label,
        itemX +
          itemWidth / 2,
        boxY + 5.2,
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
        isPercentage
          ? "#FFFFFF"
          : pdfTheme.colors.text
      );

      pdf.text(
        item.value,
        itemX +
          itemWidth / 2,
        boxY + 9.5,
        {
          align: "center",
        }
      );
    }
  );
}

/* =========================================================
   COMMENTS
========================================================= */

function renderComments({
  pdf,
  reportCard,
  primaryColor,
}: {
  pdf: jsPDF;
  reportCard: StudentReportCard;
  primaryColor: string;
}) {
  renderSectionTitle({
    pdf,
    title: "Assessment & Comments",
    y: COMMENTS_Y,
    primaryColor,
  });

  const boxY =
    COMMENTS_Y + 4;

  const gap = 4;

  const boxWidth =
    (CONTENT_WIDTH - gap) /
    2;

  const boxHeight =
    COMMENTS_HEIGHT - 4;

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
   * Teacher.
   */

  drawCommentBox({
    pdf,
    x: MARGIN_X,
    y: boxY,
    width: boxWidth,
    height: boxHeight,
    title:
      "Class Teacher's Comment",
    comment:
      teacherComment,
    primaryColor,
  });

  /*
   * Principal.
   */

  drawCommentBox({
    pdf,
    x:
      MARGIN_X +
      boxWidth +
      gap,
    y: boxY,
    width: boxWidth,
    height: boxHeight,
    title:
      "Principal / Head Teacher's Comment",
    comment: "",
    primaryColor,
    blankLines: true,
  });
}

/* =========================================================
   COMMENT BOX
========================================================= */

function drawCommentBox({
  pdf,
  x,
  y,
  width,
  height,
  title,
  comment,
  primaryColor,
  blankLines = false,
}: {
  pdf: jsPDF;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  comment: string;
  primaryColor: string;
  blankLines?: boolean;
}) {
  pdf.setFillColor(
    pdfTheme.colors.background
  );

  pdf.setDrawColor(
    pdfTheme.colors.border
  );

  pdf.roundedRect(
    x,
    y,
    width,
    height,
    1.2,
    1.2,
    "FD"
  );

  /*
   * Title.
   */

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(5.2);

  pdf.setTextColor(primaryColor);

  pdf.text(
    title,
    x + 3,
    y + 4.5
  );

  /*
   * Divider.
   */

  pdf.setDrawColor(
    pdfTheme.colors.border
  );

  pdf.line(
    x + 3,
    y + 6.5,
    x + width - 3,
    y + 6.5
  );

  /*
   * Principal blank writing lines.
   */

  if (blankLines) {
    for (
      let i = 0;
      i < 3;
      i++
    ) {
      const lineY =
        y +
        10 +
        i * 4;

      pdf.line(
        x + 3,
        lineY,
        x + width - 3,
        lineY
      );
    }

    return;
  }

  /*
   * Teacher comment.
   */

  pdf.setFont(
    pdfFonts.regular,
    "normal"
  );

  pdf.setFontSize(5.5);

  pdf.setTextColor(
    pdfTheme.colors.text
  );

  const lines =
    pdf.splitTextToSize(
      comment || "—",
      width - 6
    );

  pdf.text(
    lines.slice(0, 3),
    x + 3,
    y + 10
  );
}

/* =========================================================
   GRADING SCALE
========================================================= */

function renderGradingScale({
  pdf,
  primaryColor,
}: {
  pdf: jsPDF;
  primaryColor: string;
}) {
  renderSectionTitle({
    pdf,
    title: "Grading Scale",
    y: GRADING_Y,
    primaryColor,
  });

  const boxY =
    GRADING_Y + 4;

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
    GRADING_HEIGHT - 4,
    1.2,
    1.2,
    "FD"
  );

  const grades = [
    {
      grade: "A",
      range: "80–100",
      remark: "Excellent",
    },

    {
      grade: "B",
      range: "70–79",
      remark: "Very Good",
    },

    {
      grade: "C",
      range: "60–69",
      remark: "Good",
    },

    {
      grade: "D",
      range: "50–59",
      remark: "Fair",
    },

    {
      grade: "E",
      range: "40–49",
      remark: "Pass",
    },

    {
      grade: "F",
      range: "0–39",
      remark: "Fail",
    },
  ];

  const gap = 1.5;

  const itemWidth =
    (CONTENT_WIDTH -
      gap * 5) /
    6;

  grades.forEach(
    (item, index) => {
      const itemX =
        MARGIN_X +
        index *
          (itemWidth + gap);

      pdf.setFillColor(
        index === 0
          ? primaryColor
          : pdfTheme.colors.lightGray
      );

      pdf.setDrawColor(
        pdfTheme.colors.border
      );

      pdf.roundedRect(
        itemX,
        boxY + 2,
        itemWidth,
        11,
        0.8,
        0.8,
        "FD"
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(6.2);

      pdf.setTextColor(
        index === 0
          ? "#FFFFFF"
          : primaryColor
      );

      pdf.text(
        item.grade,
        itemX +
          itemWidth / 2,
        boxY + 5.5,
        {
          align: "center",
        }
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(4.2);

      pdf.setTextColor(
        index === 0
          ? "#FFFFFF"
          : pdfTheme.colors.text
      );

      pdf.text(
        item.range,
        itemX +
          itemWidth / 2,
        boxY + 8.5,
        {
          align: "center",
        }
      );

      pdf.setFont(
        pdfFonts.regular,
        "normal"
      );

      pdf.setFontSize(3.7);

      pdf.setTextColor(
        index === 0
          ? "#E5E7EB"
          : pdfTheme.colors.mutedText
      );

      pdf.text(
        item.remark,
        itemX +
          itemWidth / 2,
        boxY + 11.2,
        {
          align: "center",
        }
      );
    }
  );
}

/* =========================================================
   APPROVAL
========================================================= */

function renderApproval({
  pdf,
  reportCard,
  branding,
  primaryColor,
}: {
  pdf: jsPDF;
  reportCard: StudentReportCard;
  branding?: ExtendedBranding;
  primaryColor: string;
}) {
  renderSectionTitle({
    pdf,
    title: "Approval",
    y: APPROVAL_Y,
    primaryColor,
  });

  const boxY =
    APPROVAL_Y + 4;

  const boxHeight =
    APPROVAL_HEIGHT - 4;

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
    1.2,
    1.2,
    "FD"
  );

  const gap = 5;

  const columnWidth =
    (CONTENT_WIDTH -
      gap * 2) /
    3;

  const columns = [
    {
      label: "Class Teacher",
      name:
        branding?.headTeacherName ||
        "",
    },

    {
      label: "Principal / Head Teacher",
      name:
        branding?.principalName ||
        "",
    },

    {
      label: "Date",
      name: "",
    },
  ];

  columns.forEach(
    (item, index) => {
      const x =
        MARGIN_X +
        index *
          (columnWidth + gap);

      /*
       * Principal signature.
       */

      if (
        index === 1 &&
        branding?.principalSignature
      ) {
        try {
          pdf.addImage(
            branding.principalSignature,
            "AUTO",
            x + 8,
            boxY + 1,
            columnWidth - 16,
            7,
            undefined,
            "FAST"
          );
        } catch {
          // Invalid signature is ignored.
        }
      }

      /*
       * Signature line.
       */

      pdf.setDrawColor(
        pdfTheme.colors.border
      );

      pdf.line(
        x + 3,
        boxY + 10,
        x +
          columnWidth -
          3,
        boxY + 10
      );

      /*
       * Name.
       */

      if (item.name) {
        pdf.setFont(
          pdfFonts.regular,
          "normal"
        );

        pdf.setFontSize(4.5);

        pdf.setTextColor(
          pdfTheme.colors.mutedText
        );

        pdf.text(
          truncateText(
            pdf,
            item.name,
            columnWidth - 6
          ),
          x +
            columnWidth / 2,
          boxY + 13,
          {
            align: "center",
          }
        );
      }

      /*
       * Label.
       */

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(5);

      pdf.setTextColor(
        pdfTheme.colors.text
      );

      pdf.text(
        item.label,
        x +
          columnWidth / 2,
        boxY + 17,
        {
          align: "center",
        }
      );
    }
  );

  /*
   * Optional school stamp.
   */

  if (branding?.schoolStamp) {
    try {
      pdf.addImage(
        branding.schoolStamp,
        "AUTO",
        PAGE_WIDTH -
          MARGIN_X -
          24,
        boxY - 3,
        20,
        15,
        undefined,
        "FAST"
      );
    } catch {
      // Ignore invalid stamp.
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
  branding?: ExtendedBranding;
}) {
  const y = FOOTER_Y;

  pdf.setDrawColor(
    pdfTheme.colors.border
  );

  pdf.setLineWidth(0.25);

  pdf.line(
    MARGIN_X,
    y - 3,
    PAGE_WIDTH - MARGIN_X,
    y - 3
  );

  pdf.setFont(
    pdfFonts.regular,
    "normal"
  );

  pdf.setFontSize(5);

  pdf.setTextColor(
    pdfTheme.colors.mutedText
  );

  /*
   * School.
   */

  pdf.text(
    truncateText(
      pdf,
      branding?.schoolName ||
        "School",
      65
    ),
    MARGIN_X,
    y
  );

  /*
   * EduTrack.
   */

  pdf.text(
    "Generated by EduTrack",
    PAGE_WIDTH / 2,
    y,
    {
      align: "center",
    }
  );

  /*
   * Page.
   */

  pdf.text(
    "Page 1 of 1",
    PAGE_WIDTH -
      MARGIN_X,
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
   TEXT HELPERS
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
    Number.isNaN(
      Number(value)
    )
  ) {
    return "0";
  }

  return Number(value).toFixed(0);
}

/* =========================================================
   SAFE TEXT FIT
========================================================= */

function truncateText(
  pdf: jsPDF,
  text: string,
  maxWidth: number
) {
  if (!text) {
    return "—";
  }

  const value =
    String(text);

  if (
    pdf.getTextWidth(value) <=
    maxWidth
  ) {
    return value;
  }

  let result = value;

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
