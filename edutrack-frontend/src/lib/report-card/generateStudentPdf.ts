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
   PAGE SETTINGS
========================================================= */

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;

const MARGIN_X = 12;
const CONTENT_WIDTH =
  PAGE_WIDTH - MARGIN_X * 2;

const TOP_CONTENT = 34;

/*
 * Keep this area clear for footer/signature.
 */
const FOOTER_HEIGHT = 13;

const CONTENT_BOTTOM =
  PAGE_HEIGHT - FOOTER_HEIGHT - 5;

/*
 * Main school header.
 */
const HEADER_HEIGHT = 30;

/*
 * Continuation-page header.
 */
const CONTINUATION_HEADER_HEIGHT = 17;

/* =========================================================
   EXTENDED BRANDING
========================================================= */

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

  const extendedBranding =
    branding as ExtendedBranding | undefined;

  const primaryColor =
    branding?.primaryColor ||
    pdfTheme.colors.primary;

  /*
   * =======================================================
   * PAGE 1 HEADER
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
  let currentY = renderStudentProfile({
    pdf,
    reportCard,
    branding: extendedBranding,
    primaryColor,
    startY: TOP_CONTENT,
  });

  /*
   * =======================================================
   * SUBJECT TABLE
   * =======================================================
   */

  currentY += 4;

  currentY = ensureSpace({
    pdf,
    currentY,
    requiredHeight: 15,
    reportCard,
    branding: extendedBranding,
    primaryColor,
  });

  renderSectionTitle({
    pdf,
    title: "Academic Performance",
    y: currentY,
    primaryColor,
  });

  const tableStartY = currentY + 4;

  renderSubjectTable({
    pdf,
    reportCard,
    primaryColor,
    startY: tableStartY,
    branding: extendedBranding,
  });

  currentY =
    pdf.lastAutoTable?.finalY
      ? pdf.lastAutoTable.finalY + 4
      : tableStartY + 12;

  /*
   * =======================================================
   * PERFORMANCE SUMMARY
   * =======================================================
   */

  currentY = ensureSpace({
    pdf,
    currentY,
    requiredHeight: 31,
    reportCard,
    branding: extendedBranding,
    primaryColor,
  });

  currentY = renderSummary({
    pdf,
    reportCard,
    primaryColor,
    startY: currentY,
  });

  /*
   * =======================================================
   * ATTENDANCE
   * =======================================================
   */

  currentY += 3;

  currentY = ensureSpace({
    pdf,
    currentY,
    requiredHeight: 27,
    reportCard,
    branding: extendedBranding,
    primaryColor,
  });

  currentY = renderAttendance({
    pdf,
    reportCard,
    primaryColor,
    startY: currentY,
  });

  /*
   * =======================================================
   * COMMENTS
   * =======================================================
   */

  currentY += 3;

  currentY = ensureSpace({
    pdf,
    currentY,
    requiredHeight: 31,
    reportCard,
    branding: extendedBranding,
    primaryColor,
  });

  currentY = renderComments({
    pdf,
    reportCard,
    primaryColor,
    startY: currentY,
  });

  /*
   * =======================================================
   * GRADING SCALE
   * =======================================================
   */

  currentY += 3;

  currentY = ensureSpace({
    pdf,
    currentY,
    requiredHeight: 27,
    reportCard,
    branding: extendedBranding,
    primaryColor,
  });

  currentY = renderGradingScale({
    pdf,
    primaryColor,
    startY: currentY,
  });

  /*
   * =======================================================
   * APPROVAL / SIGNATURE AREA
   * =======================================================
   */

  currentY += 3;

  currentY = ensureSpace({
    pdf,
    currentY,
    requiredHeight: 27,
    reportCard,
    branding: extendedBranding,
    primaryColor,
  });

  renderApprovalArea({
    pdf,
    reportCard,
    branding: extendedBranding,
    primaryColor,
    startY: currentY,
  });

  /*
   * =======================================================
   * FOOTERS
   * =======================================================
   */

  renderFooters({
    pdf,
    branding: extendedBranding,
  });

  return pdf;
}

/* =========================================================
   MAIN SCHOOL HEADER
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
   * Outer header background.
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
   * White inner area.
   */
  pdf.setFillColor("#FFFFFF");

  pdf.roundedRect(
    MARGIN_X,
    4,
    CONTENT_WIDTH,
    HEADER_HEIGHT - 7,
    2,
    2,
    "F"
  );

  /*
   * Logo area.
   */
  const logoX = MARGIN_X + 4;
  const logoY = 7;

  const logoSize = 20;

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
   * School text area.
   */
  const textX = logoX + logoSize + 5;

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
    textX,
    10
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

    pdf.setFontSize(6.4);

    pdf.setTextColor(
      pdfTheme.colors.mutedText
    );

    pdf.text(
      truncateText(
        pdf,
        address,
        105
      ),
      textX,
      15
    );
  }

  /*
   * Contact line.
   */
  const phone =
    branding?.phone ||
    branding?.phoneNumber ||
    "";

  const email =
    branding?.email ||
    branding?.schoolEmail ||
    "";

  const website =
    branding?.website ||
    branding?.schoolWebsite ||
    "";

  const contactParts = [
    phone,
    email,
    website,
  ].filter(Boolean);

  if (contactParts.length > 0) {
    pdf.setFont(
      pdfFonts.regular,
      "normal"
    );

    pdf.setFontSize(5.8);

    pdf.setTextColor(
      pdfTheme.colors.mutedText
    );

    pdf.text(
      truncateText(
        pdf,
        contactParts.join("  •  "),
        105
      ),
      textX,
      19.5
    );
  }

  /*
   * Report title block.
   */
  const titleX =
    PAGE_WIDTH - MARGIN_X - 45;

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(8.5);

  pdf.setTextColor(primaryColor);

  pdf.text(
    reportCardLabels.reportTitle ||
      "STUDENT REPORT CARD",
    titleX,
    11,
    {
      align: "center",
    }
  );

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(6.5);

  pdf.setTextColor(
    pdfTheme.colors.text
  );

  pdf.text(
    `SESSION: ${
      reportCard.session?.name || "—"
    }`,
    titleX,
    16,
    {
      align: "center",
    }
  );

  pdf.text(
    `TERM: ${
      reportCard.term?.name || "—"
    }`,
    titleX,
    20.5,
    {
      align: "center",
    }
  );

  /*
   * Bottom accent.
   */
  pdf.setFillColor(primaryColor);

  pdf.rect(
    MARGIN_X,
    HEADER_HEIGHT - 4,
    CONTENT_WIDTH,
    1.5,
    "F"
  );

  pdf.setTextColor(
    pdfTheme.colors.text
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
  pdf.setFillColor(primaryColor);

  pdf.rect(
    0,
    0,
    PAGE_WIDTH,
    CONTINUATION_HEADER_HEIGHT,
    "F"
  );

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(8);

  pdf.setTextColor("#FFFFFF");

  const studentName =
    `${reportCard.student?.firstName || ""} ${
      reportCard.student?.lastName || ""
    }`.trim() ||
    "Student Report Card";

  pdf.text(
    studentName,
    MARGIN_X,
    10
  );

  pdf.setFont(
    pdfFonts.regular,
    "normal"
  );

  pdf.setFontSize(6.5);

  pdf.text(
    `${reportCard.session?.name || "—"}  •  ${
      reportCard.term?.name || "—"
    }`,
    PAGE_WIDTH / 2,
    10,
    {
      align: "center",
    }
  );

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.text(
    "ACADEMIC REPORT CARD",
    PAGE_WIDTH - MARGIN_X,
    10,
    {
      align: "right",
    }
  );

  pdf.setTextColor(
    pdfTheme.colors.text
  );
}

/* =========================================================
   STUDENT PROFILE
========================================================= */

function renderStudentProfile({
  pdf,
  reportCard,
  branding,
  primaryColor,
  startY,
}: {
  pdf: jsPDF;
  reportCard: StudentReportCard;
  branding?: ExtendedBranding;
  primaryColor: string;
  startY: number;
}) {
  const student =
    reportCard.student;

  let y = startY;

  renderSectionTitle({
    pdf,
    title: "Student Information",
    y,
    primaryColor,
  });

  y += 4;

  const boxHeight = 27;

  pdf.setFillColor(
    pdfTheme.colors.background
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

  /*
   * Passport box.
   */
  const passportWidth = 22;
  const passportX =
    MARGIN_X +
    CONTENT_WIDTH -
    passportWidth -
    3;

  const passportY = y + 2.5;
  const passportHeight = 22;

  pdf.setDrawColor(primaryColor);

  pdf.setLineWidth(0.5);

  pdf.rect(
    passportX,
    passportY,
    passportWidth,
    passportHeight,
    "S"
  );

  const studentWithPhoto =
    student as typeof student & {
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
   * Information area.
   */
  const infoWidth =
    CONTENT_WIDTH -
    passportWidth -
    7;

  const leftX =
    MARGIN_X + 3;

  const halfWidth =
    (infoWidth - 4) / 2;

  const rightX =
    leftX + halfWidth + 4;

  const rows = [
    [
      "Student Name",
      `${student?.firstName || ""} ${
        student?.lastName || ""
      }`.trim() || "—",
      "Admission No.",
      student?.admissionNumber || "—",
    ],
    [
      "Class",
      student?.className || "—",
      "Gender",
      student?.gender || "—",
    ],
    [
      "Session",
      reportCard.session?.name || "—",
      "Term",
      reportCard.term?.name || "—",
    ],
  ];

  const rowHeight =
    boxHeight / 3;

  rows.forEach(
    (row, index) => {
      const rowY =
        y + index * rowHeight;

      if (index > 0) {
        pdf.setDrawColor(
          pdfTheme.colors.border
        );

        pdf.line(
          leftX,
          rowY,
          leftX + infoWidth,
          rowY
        );
      }

      /*
       * First label.
       */
      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(5.7);

      pdf.setTextColor(
        pdfTheme.colors.mutedText
      );

      pdf.text(
        row[0],
        leftX,
        rowY + 4.5
      );

      /*
       * First value.
       */
      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(7.2);

      pdf.setTextColor(
        pdfTheme.colors.text
      );

      pdf.text(
        truncateText(
          pdf,
          row[1],
          halfWidth - 28
        ),
        leftX + 27,
        rowY + 4.5
      );

      /*
       * Second label.
       */
      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(5.7);

      pdf.setTextColor(
        pdfTheme.colors.mutedText
      );

      pdf.text(
        row[2],
        rightX,
        rowY + 4.5
      );

      /*
       * Second value.
       */
      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(7.2);

      pdf.setTextColor(
        pdfTheme.colors.text
      );

      pdf.text(
        truncateText(
          pdf,
          row[3],
          halfWidth - 28
        ),
        rightX + 27,
        rowY + 4.5
      );
    }
  );

  return y + boxHeight;
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
    y - 3.5,
    2,
    6,
    0.8,
    0.8,
    "F"
  );

  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(8.5);

  pdf.setTextColor(
    pdfTheme.colors.text
  );

  pdf.text(
    title,
    MARGIN_X + 5,
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
  startY,
}: {
  pdf: PdfWithTable;
  reportCard: StudentReportCard;
  primaryColor: string;
  startY: number;
  branding?: ExtendedBranding;
}) {
  autoTable(pdf, {
    startY,

    margin: {
      left: MARGIN_X,
      right: MARGIN_X,
      top: CONTINUATION_HEADER_HEIGHT + 4,
      bottom: FOOTER_HEIGHT + 4,
    },

    tableWidth: CONTENT_WIDTH,

    pageBreak: "auto",
    rowPageBreak: "avoid",

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
      reportCard.results &&
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
      fontSize: 6.3,

      cellPadding: {
        top: 1.15,
        bottom: 1.15,
        left: 1.2,
        right: 1.2,
      },

      textColor:
        pdfTheme.colors.text,

      lineColor:
        pdfTheme.colors.tableBorder,

      lineWidth: 0.2,

      valign: "middle",

      overflow: "ellipsize",
    },

    headStyles: {
      font: pdfFonts.bold,
      fontStyle: "bold",
      fontSize: 6.2,

      fillColor: primaryColor,
      textColor: "#FFFFFF",

      halign: "center",
      valign: "middle",

      cellPadding: {
        top: 1.7,
        bottom: 1.7,
        left: 1.2,
        right: 1.2,
      },
    },

    bodyStyles: {
      minCellHeight: 5.2,
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
        cellWidth: 18,
        halign: "center",
      },

      4: {
        cellWidth: 13,
        halign: "center",
      },

      5: {
        cellWidth: 13,
        halign: "center",
      },

      6: {
        cellWidth: 13,
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
    },

    willDrawPage(data) {
      /*
       * Every table page after page 1 receives
       * a controlled continuation header.
       */
      if (data.pageNumber > 1) {
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
    title:
      reportCardLabels.performance ||
      "Overall Performance",
    y: startY,
    primaryColor,
  });

  const boxY =
    startY + 4;

  const boxHeight = 23;

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

  const boxes = [
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
        `${average.toFixed(1)}%`,
    },

    {
      label:
        reportCardLabels.subjects ||
        "Subjects",
      value:
        String(
          summary?.subjectsCount || 0
        ),
    },

    {
      label:
        reportCardLabels.classPosition ||
        "Position",
      value:
        summary?.positionLabel ||
        "—",
    },
  ];

  const gap = 2;

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
        boxY + 3,
        boxWidth,
        14,
        1.2,
        1.2,
        "FD"
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(5.4);

      pdf.setTextColor(
        pdfTheme.colors.mutedText
      );

      pdf.text(
        item.label,
        x + boxWidth / 2,
        boxY + 7,
        {
          align: "center",
        }
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(8);

      pdf.setTextColor(primaryColor);

      pdf.text(
        item.value,
        x + boxWidth / 2,
        boxY + 13,
        {
          align: "center",
        }
      );
    }
  );

  /*
   * Performance label.
   */
  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(5.8);

  pdf.setTextColor(
    pdfTheme.colors.text
  );

  pdf.text(
    `Performance: ${performance}`,
    MARGIN_X + 3,
    boxY + 21
  );

  /*
   * Progress bar.
   */
  const barX =
    MARGIN_X + 37;

  const barY =
    boxY + 19;

  const barWidth =
    CONTENT_WIDTH - 43;

  const barHeight = 2;

  pdf.setFillColor(
    pdfTheme.colors.border
  );

  pdf.roundedRect(
    barX,
    barY,
    barWidth,
    barHeight,
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
      barHeight,
      1,
      1,
      "F"
    );
  }

  return boxY + boxHeight;
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
      reportCardLabels.attendance ||
      "Attendance",
    y: startY,
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
    startY + 4;

  const boxHeight = 19;

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
      const x =
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
        x,
        boxY + 2.5,
        itemWidth,
        13.5,
        1.2,
        1.2,
        "FD"
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(5.2);

      pdf.setTextColor(
        isPercentage
          ? "#E5E7EB"
          : pdfTheme.colors.mutedText
      );

      pdf.text(
        item.label,
        x + itemWidth / 2,
        boxY + 6.5,
        {
          align: "center",
        }
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(7.8);

      pdf.setTextColor(
        isPercentage
          ? "#FFFFFF"
          : pdfTheme.colors.text
      );

      pdf.text(
        item.value,
        x + itemWidth / 2,
        boxY + 12,
        {
          align: "center",
        }
      );
    }
  );

  return boxY + boxHeight;
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
    title: "Assessment & Comments",
    y: startY,
    primaryColor,
  });

  const boxY =
    startY + 4;

  /*
   * Two equal comment boxes.
   */
  const gap = 4;

  const boxWidth =
    (CONTENT_WIDTH - gap) /
    2;

  const boxHeight = 23;

  const teacherX =
    MARGIN_X;

  const principalX =
    MARGIN_X +
    boxWidth +
    gap;

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
  drawCommentBox({
    pdf,
    x: teacherX,
    y: boxY,
    width: boxWidth,
    height: boxHeight,
    title:
      reportCardLabels.teacherComment ||
      "Class Teacher's Comment",
    comment: teacherComment,
    primaryColor,
  });

  /*
   * Principal comment.
   *
   * This is deliberately a blank writing area.
   */
  drawCommentBox({
    pdf,
    x: principalX,
    y: boxY,
    width: boxWidth,
    height: boxHeight,
    title:
      reportCardLabels.principalComment ||
      "Principal's Comment",
    comment: "",
    primaryColor,
    blankLines: true,
  });

  return boxY + boxHeight;
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
    1.5,
    1.5,
    "FD"
  );

  /*
   * Title.
   */
  pdf.setFont(
    pdfFonts.bold,
    "bold"
  );

  pdf.setFontSize(5.8);

  pdf.setTextColor(primaryColor);

  pdf.text(
    title,
    x + 3,
    y + 5
  );

  /*
   * Divider.
   */
  pdf.setDrawColor(
    pdfTheme.colors.border
  );

  pdf.line(
    x + 3,
    y + 7,
    x + width - 3,
    y + 7
  );

  if (blankLines) {
    /*
     * Proper writing lines.
     */
    pdf.setDrawColor(
      pdfTheme.colors.border
    );

    for (
      let i = 0;
      i < 3;
      i++
    ) {
      const lineY =
        y + 12 + i * 4.5;

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

  pdf.setFontSize(6.2);

  pdf.setTextColor(
    pdfTheme.colors.text
  );

  const wrapped =
    pdf.splitTextToSize(
      comment || "—",
      width - 6
    );

  pdf.text(
    wrapped.slice(0, 3),
    x + 3,
    y + 11
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
  pdf: jsPDF;
  primaryColor: string;
  startY: number;
}) {
  renderSectionTitle({
    pdf,
    title: "Grading Scale",
    y: startY,
    primaryColor,
  });

  const boxY =
    startY + 4;

  const boxHeight = 21;

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
    1.5,
    1.5,
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
      const x =
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
        x,
        boxY + 2.5,
        itemWidth,
        16,
        1,
        1,
        "FD"
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(7);

      pdf.setTextColor(
        index === 0
          ? "#FFFFFF"
          : primaryColor
      );

      pdf.text(
        item.grade,
        x + itemWidth / 2,
        boxY + 7,
        {
          align: "center",
        }
      );

      pdf.setFont(
        pdfFonts.bold,
        "bold"
      );

      pdf.setFontSize(4.8);

      pdf.setTextColor(
        index === 0
          ? "#FFFFFF"
          : pdfTheme.colors.text
      );

      pdf.text(
        item.range,
        x + itemWidth / 2,
        boxY + 11,
        {
          align: "center",
        }
      );

      pdf.setFont(
        pdfFonts.regular,
        "normal"
      );

      pdf.setFontSize(4.2);

      pdf.setTextColor(
        index === 0
          ? "#E5E7EB"
          : pdfTheme.colors.mutedText
      );

      pdf.text(
        item.remark,
        x + itemWidth / 2,
        boxY + 14.5,
        {
          align: "center",
        }
      );
    }
  );

  return boxY + boxHeight;
}

/* =========================================================
   APPROVAL / SIGNATURE AREA
========================================================= */

function renderApprovalArea({
  pdf,
  reportCard,
  branding,
  primaryColor,
  startY,
}: {
  pdf: jsPDF;
  reportCard: StudentReportCard;
  branding?: ExtendedBranding;
  primaryColor: string;
  startY: number;
}) {
  renderSectionTitle({
    pdf,
    title: "Approval",
    y: startY,
    primaryColor,
  });

  const boxY =
    startY + 4;

  const boxHeight = 21;

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
    1.5,
    1.5,
    "FD"
  );

  const gap = 5;

  const columnWidth =
    (CONTENT_WIDTH - gap * 2) /
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
       * Signature image in middle column.
       */
      if (
        index === 1 &&
        branding?.principalSignature
      ) {
        try {
          pdf.addImage(
            branding.principalSignature,
            "AUTO",
            x + 4,
            boxY + 1,
            columnWidth - 8,
            8,
            undefined,
            "FAST"
          );
        } catch {
          // Ignore invalid signature.
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
        boxY + 13,
        x + columnWidth - 3,
        boxY + 13
      );

      /*
       * Name.
       */
      pdf.setFont(
        pdfFonts.regular,
        "normal"
      );

      pdf.setFontSize(4.8);

      pdf.setTextColor(
        pdfTheme.colors.mutedText
      );

      if (item.name) {
        pdf.text(
          truncateText(
            pdf,
            item.name,
            columnWidth - 6
          ),
          x + columnWidth / 2,
          boxY + 17,
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

      pdf.setFontSize(5.5);

      pdf.setTextColor(
        pdfTheme.colors.text
      );

      pdf.text(
        item.label,
        x + columnWidth / 2,
        boxY + 20,
        {
          align: "center",
        }
      );
    }
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
  branding?: ExtendedBranding;
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
      PAGE_HEIGHT - 6;

    /*
     * Footer line.
     */
    pdf.setDrawColor(
      pdfTheme.colors.border
    );

    pdf.setLineWidth(0.25);

    pdf.line(
      MARGIN_X,
      footerY - 4,
      PAGE_WIDTH - MARGIN_X,
      footerY - 4
    );

    /*
     * School identity.
     */
    pdf.setFont(
      pdfFonts.regular,
      "normal"
    );

    pdf.setFontSize(5.5);

    pdf.setTextColor(
      pdfTheme.colors.mutedText
    );

    const schoolName =
      branding?.schoolName ||
      "School";

    pdf.text(
      truncateText(
        pdf,
        schoolName,
        70
      ),
      MARGIN_X,
      footerY
    );

    /*
     * Generated text.
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
          PAGE_WIDTH -
            MARGIN_X -
            25,
          footerY - 20,
          22,
          15,
          undefined,
          "FAST"
        );
      } catch {
        // Ignore invalid stamp.
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
  branding?: ExtendedBranding;
  primaryColor: string;
}) {
  /*
   * There is enough space.
   */
  if (
    currentY + requiredHeight <=
    CONTENT_BOTTOM
  ) {
    return currentY;
  }

  /*
   * Not enough space:
   * create a completely clean page.
   */
  pdf.addPage();

  renderContinuationHeader({
    pdf,
    reportCard,
    primaryColor,
  });

  /*
   * Start below continuation header.
   */
  return (
    CONTINUATION_HEADER_HEIGHT +
    5
  );
}

/* =========================================================
   NUMBER FORMAT
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
