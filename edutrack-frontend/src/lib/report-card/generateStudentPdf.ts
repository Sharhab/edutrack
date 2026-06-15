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
    title:
      pdfDocumentMeta.title,
    subject:
      pdfDocumentMeta.subject,
    author:
      pdfDocumentMeta.author,
    creator:
      pdfDocumentMeta.creator,
    keywords:
      pdfDocumentMeta.keywords,
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
     SUMMARY
  ===================================== */

  renderSummary({
    pdf,
    reportCard,
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
}: any) {
  pdf.setFillColor(primaryColor);

  pdf.rect(
    0,
    0,
    210,
    24,
    "F"
  );

  pdf.setTextColor(
    "#FFFFFF"
  );

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
}: any) {
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
      student.gender ||
        "-",
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
        String(value),
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
}: any) {
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
        (subject: any) => [
          subject.subjectName,

          subject.ca1,
          subject.ca2,

          subject.assignment,

          subject.exam,

          subject.total,

          subject.grade,

          subject.remark,
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
  });
}

/* =========================================
   SUMMARY
========================================= */

function renderSummary({
  pdf,
  reportCard,
}: any) {
  const finalY =
    (
      pdf as any
    ).lastAutoTable.finalY + 10;

  const attendancePercentage =
    calculateAttendancePercentage(
      reportCard.attendance
    );

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

    [
      "Attendance %",
      `${attendancePercentage}%`,
    ],
  ];

  let y = finalY + 8;

  summary.forEach(
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
        String(value),
        60,
        y
      );

      y += 7;
    }
  );
}

/* =========================================
   COMMENTS
========================================= */

function renderComments({
  pdf,
  reportCard,
}: any) {
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

  const y = 220;

  pdf.setFont(
    pdfFonts.bold
  );

  pdf.setFontSize(11);

  pdf.text(
    "Teacher's Comment",
    14,
    y
  );

  pdf.setFont(
    pdfFonts.regular
  );

  pdf.setFontSize(10);

  pdf.text(
    comment,
    14,
    y + 10
  );
}

/* =========================================
   FOOTER
========================================= */

function renderFooter({
  pdf,
  branding,
}: any) {
  const footerY = 270;

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

  pdf.setFontSize(9);

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
    "Generated by EduTrack ERP",
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