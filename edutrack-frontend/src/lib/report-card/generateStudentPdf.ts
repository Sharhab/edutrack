
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

/* =========================================
   TYPES
========================================= */

type GenerateStudentPdfParams = {
  reportCard: StudentReportCard;
  branding?: SchoolBranding;
};

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
  });

  /* =====================================
     DOCUMENT META
  ===================================== */

  pdf.setProperties({
    title: pdfDocumentMeta.title,
    subject: pdfDocumentMeta.subject,
    author: pdfDocumentMeta.author,
    creator: pdfDocumentMeta.creator,
    keywords: pdfDocumentMeta.keywords,
  });

  /* =====================================
     COLORS
  ===================================== */

  const primaryColor =
    branding?.primaryColor ||
    pdfTheme.colors.primary;

  /* =====================================
     HEADER
  ===================================== */

  renderHeader({
    pdf,
    reportCard,
    branding,
    primaryColor,
  });

  /* =====================================
     STUDENT INFO
  ===================================== */

  renderStudentInfo({
    pdf,
    reportCard,
  });

  /* =====================================
     SUBJECT TABLE
  ===================================== */

  renderSubjectTable({
    pdf,
    reportCard,
    primaryColor,
  });

  /* =====================================
     SUMMARY + ATTENDANCE
  ===================================== */

  renderSummary({
    pdf,
    reportCard,
    primaryColor,
  });

  /* =====================================
     COMMENTS
  ===================================== */

  renderComments({
    pdf,
    reportCard,
  });

  /* =====================================
     FOOTER
  ===================================== */

  renderFooter({
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
  pdf.setFillColor(primaryColor);

  pdf.rect(
    0,
    0,
    210,
    24,
    "F"
  );

  pdf.setTextColor("#FFFFFF");

  pdf.setFont(
    pdfFonts.bold
  );

  pdf.setFontSize(18);

  pdf.text(
    branding?.schoolName ||
      "EDUTRACK INTERNATIONAL SCHOOL",
    105,
    12,
    {
      align: "center",
    }
  );

  pdf.setFontSize(10);

  pdf.text(
    reportCardLabels.reportTitle,
    105,
    19,
    {
      align: "center",
    }
  );

  pdf.setTextColor(
    pdfTheme.colors.text
  );
}

/* =========================================
   STUDENT INFO
========================================= */

function renderStudentInfo({
  pdf,
  reportCard,
}: {
  pdf: jsPDF;
  reportCard: StudentReportCard;
}) {
  const student =
    reportCard.student;

  pdf.setFont(
    pdfFonts.bold
  );

  pdf.setFontSize(11);

  pdf.text(
    "Student Information",
    14,
    34
  );

  pdf.setFont(
    pdfFonts.regular
  );

  pdf.setFontSize(10);

  const info = [
    [
      "Name",
      `${student.firstName} ${student.lastName}`,
    ],
    [
      "Admission No",
      student.admissionNumber,
    ],
    [
      "Class",
      student.className,
    ],
    [
      "Session",
      reportCard.session.name,
    ],
    [
      "Term",
      reportCard.term.name,
    ],
    [
      "Gender",
      student.gender || "-",
    ],
  ];

  let y = 42;

  info.forEach(
    ([label, value]) => {
      pdf.setFont(
        pdfFonts.bold
      );

      pdf.text(
        `${label}:`,
        14,
        y
      );

      pdf.setFont(
        pdfFonts.regular
      );

      pdf.text(
        String(value ?? "-"),
        48,
        y
      );

      y += 7;
    }
  );
}

/* =========================================
   SUBJECT TABLE
========================================= */

function renderSubjectTable({
  pdf,
  reportCard,
  primaryColor,
}: {
  pdf: jsPDF;
  reportCard: StudentReportCard;
  primaryColor: string;
}) {
  autoTable(pdf, {
    startY: 88,

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
      reportCard.results.map(
        (subject) => [
          subject.subjectName,
          subject.ca1 ?? 0,
          subject.ca2 ?? 0,
          subject.assignment ?? 0,
          subject.exam ?? 0,
          subject.total ?? 0,
          subject.grade ?? "-",
          subject.remark ?? "-",
        ]
      ),

    theme: "grid",

    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor:
        pdfTheme.colors.border,
    },

    headStyles: {
      fillColor:
        primaryColor,
      textColor: "#FFFFFF",
      fontStyle: "bold",
    },

    alternateRowStyles: {
      fillColor:
        pdfTheme.colors.lightGray,
    },

    margin: {
      left: 14,
      right: 14,
    },
  });
}

/* =========================================
   SUMMARY
========================================= */

function renderSummary({
  pdf,
  reportCard,
  primaryColor,
}: {
  pdf: jsPDF;
  reportCard: StudentReportCard;
  primaryColor: string;
}) {
  const lastAutoTable =
    (pdf as any).lastAutoTable;

  const finalY =
    lastAutoTable?.finalY
      ? lastAutoTable.finalY + 8
      : 100;

  const attendance =
    reportCard.attendance || {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
    };

  const attendancePercentage =
    calculateAttendancePercentage(
      attendance
    );

  /* =====================================
     PERFORMANCE SUMMARY
  ===================================== */

  pdf.setFont(
    pdfFonts.bold
  );

  pdf.setFontSize(11);

  pdf.text(
    "Performance Summary",
    14,
    finalY
  );

  pdf.setFont(
    pdfFonts.regular
  );

  pdf.setFontSize(10);

  const summary = [
    [
      "Subjects Offered",
      reportCard.summary
        .subjectsCount,
    ],
    [
      "Total Score",
      reportCard.summary
        .totalScore,
    ],
    [
      "Average Score",
      reportCard.summary
        .averageScore,
    ],
    [
      "Class Position",
      reportCard.summary
        .positionLabel,
    ],
  ];

  let summaryY =
    finalY + 8;

  summary.forEach(
    ([label, value]) => {
      pdf.setFont(
        pdfFonts.bold
      );

      pdf.text(
        `${label}:`,
        14,
        summaryY
      );

      pdf.setFont(
        pdfFonts.regular
      );

      pdf.text(
        String(value ?? "-"),
        60,
        summaryY
      );

      summaryY += 7;
    }
  );

  /* =====================================
     ATTENDANCE SECTION
  ===================================== */

  const attendanceY =
    summaryY + 4;

  pdf.setFont(
    pdfFonts.bold
  );

  pdf.setFontSize(11);

  pdf.text(
    "Attendance",
    14,
    attendanceY
  );

  /* =====================================
     ATTENDANCE BOXES
  ===================================== */

  const boxY =
    attendanceY + 5;

  const boxHeight = 17;

  const boxGap = 3;

  const availableWidth = 182;

  const boxWidth =
    (availableWidth -
      boxGap * 4) /
    5;

  const attendanceItems = [
    {
      label: "Total Days",
      value: attendance.total,
    },
    {
      label: "Present",
      value: attendance.present,
    },
    {
      label: "Absent",
      value: attendance.absent,
    },
    {
      label: "Late",
      value: attendance.late,
    },
    {
      label: "Attendance",
      value: `${attendancePercentage}%`,
    },
  ];

  attendanceItems.forEach(
    (item, index) => {
      const x =
        14 +
        index *
          (boxWidth + boxGap);

      /* Box */

      pdf.setDrawColor(
        pdfTheme.colors.border
      );

      pdf.setFillColor(
        "#FFFFFF"
      );

      pdf.roundedRect(
        x,
        boxY,
        boxWidth,
        boxHeight,
        2,
        2,
        "FD"
      );

      /* Label */

      pdf.setFont(
        pdfFonts.regular
      );

      pdf.setFontSize(7);

      pdf.setTextColor(
        pdfTheme.colors.mutedText
      );

      pdf.text(
        item.label,
        x + boxWidth / 2,
        boxY + 5,
        {
          align: "center",
        }
      );

      /* Value */

      pdf.setFont(
        pdfFonts.bold
      );

      pdf.setFontSize(10);

      pdf.setTextColor(
        pdfTheme.colors.text
      );

      pdf.text(
        String(item.value ?? 0),
        x + boxWidth / 2,
        boxY + 12,
        {
          align: "center",
        }
      );
    }
  );

  /* =====================================
     ATTENDANCE PERFORMANCE BAR
  ===================================== */

  const barY =
    boxY + boxHeight + 6;

  pdf.setFont(
    pdfFonts.regular
  );

  pdf.setFontSize(8);

  pdf.setTextColor(
    pdfTheme.colors.text
  );

  pdf.text(
    "Attendance Performance",
    14,
    barY
  );

  pdf.setFont(
    pdfFonts.bold
  );

  pdf.text(
    `${attendancePercentage}%`,
    196,
    barY,
    {
      align: "right",
    }
  );

  /* Background bar */

  const barWidth = 182;
  const barHeight = 3;

  pdf.setFillColor(
    "#E5E7EB"
  );

  pdf.roundedRect(
    14,
    barY + 3,
    barWidth,
    barHeight,
    1.5,
    1.5,
    "F"
  );

  /* Progress */

  const progressWidth =
    (attendancePercentage /
      100) *
    barWidth;

  if (progressWidth > 0) {
    pdf.setFillColor(
      primaryColor
    );

    pdf.roundedRect(
      14,
      barY + 3,
      progressWidth,
      barHeight,
      1.5,
      1.5,
      "F"
    );
  }
}

/* =========================================
   COMMENTS
========================================= */

function renderComments({
  pdf,
  reportCard,
}: {
  pdf: jsPDF;
  reportCard: StudentReportCard;
}) {
  const average =
    reportCard.summary
      .averageScore;

  const performanceRemark =
    getPerformanceRemark(
      average
    );

  let comment =
    defaultComments.good;

  if (
    performanceRemark ===
    "Excellent"
  ) {
    comment =
      defaultComments.excellent;
  }

  if (
    performanceRemark ===
    "Very Good"
  ) {
    comment =
      defaultComments.veryGood;
  }

  if (
    performanceRemark ===
    "Fair"
  ) {
    comment =
      defaultComments.fair;
  }

  if (
    performanceRemark ===
    "Needs Improvement"
  ) {
    comment =
      defaultComments.poor;
  }

  /*
   * Put comments below the attendance
   * section instead of using a fixed
   * position that could overlap content.
   */

  const commentsY = 218;

  pdf.setFont(
    pdfFonts.bold
  );

  pdf.setFontSize(11);

  pdf.setTextColor(
    pdfTheme.colors.text
  );

  pdf.text(
    "Teacher's Comment",
    14,
    commentsY
  );

  pdf.setFont(
    pdfFonts.regular
  );

  pdf.setFontSize(10);

  const commentLines =
    pdf.splitTextToSize(
      comment,
      182
    );

  pdf.text(
    commentLines,
    14,
    commentsY + 8
  );
}

/* =========================================
   FOOTER
========================================= */

function renderFooter({
  pdf,
  branding,
}: {
  pdf: jsPDF;
  branding?: SchoolBranding;
}) {
  const footerY = 270;

  pdf.setDrawColor(
    pdfTheme.colors.border
  );

  pdf.line(
    14,
    footerY,
    70,
    footerY
  );

  pdf.line(
    130,
    footerY,
    190,
    footerY
  );

  pdf.setFont(
    pdfFonts.regular
  );

  pdf.setFontSize(9);

  pdf.setTextColor(
    pdfTheme.colors.text
  );

  pdf.text(
    "Class Teacher",
    28,
    footerY + 6
  );

  pdf.text(
    "Principal",
    155,
    footerY + 6
  );

  pdf.setFontSize(8);

  pdf.setTextColor(
    pdfTheme.colors.mutedText
  );

  pdf.text(
    branding?.schoolName
      ? `${branding.schoolName} • Generated by EduTrack ERP`
      : "Generated by EduTrack ERP",
    105,
    287,
    {
      align: "center",
    }
  );

  pdf.setTextColor(
    pdfTheme.colors.text
  );
}
