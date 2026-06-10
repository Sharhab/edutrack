import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  ClassReport,
  RankingStudent,
  SchoolBranding,
} from "../../types/report-card";

import {
  pdfDocumentMeta,
  pdfFonts,
  pdfTheme,
} from "./pdfTheme";

import {
  calculateClassStatistics,
  getPerformanceRemark,
} from "./reportCardCalculations";

/* =========================================
   TYPES
========================================= */

type GenerateClassPdfParams = {
  classReport: ClassReport;

  branding?: SchoolBranding;
};

/* =========================================
   GENERATE CLASS REPORT PDF
========================================= */

export async function generateClassPdf({
  classReport,
  branding,
}: GenerateClassPdfParams) {
  const pdf = new jsPDF({
    orientation: "landscape",

    unit: "mm",

    format: "a4",
  });

  /* =====================================
     DOCUMENT META
  ===================================== */

  pdf.setProperties({
    title:
      "Class Report Sheet",

    subject:
      pdfDocumentMeta.subject,

    author:
      pdfDocumentMeta.author,

    creator:
      pdfDocumentMeta.creator,

    producer:
      pdfDocumentMeta.producer,

    keywords:
      pdfDocumentMeta.keywords,
  });

  const primaryColor =
    branding?.primaryColor ||
    pdfTheme.colors.primary;

  /* =====================================
     HEADER
  ===================================== */

  renderHeader({
    pdf,
    classReport,
    branding,
    primaryColor,
  });

  /* =====================================
     CLASS SUMMARY
  ===================================== */

  renderClassSummary({
    pdf,
    classReport,
  });

  /* =====================================
     STUDENTS TABLE
  ===================================== */

  renderStudentsTable({
    pdf,
    classReport,
    primaryColor,
  });

  /* =====================================
     PERFORMANCE ANALYSIS
  ===================================== */

  renderPerformanceAnalysis({
    pdf,
    classReport,
  });

  /* =====================================
     FOOTER
  ===================================== */

  renderFooter({
    pdf,
  });

  return pdf;
}

/* =========================================
   HEADER
========================================= */

function renderHeader({
  pdf,
  classReport,
  branding,
  primaryColor,
}: any) {
  pdf.setFillColor(primaryColor);

  pdf.rect(
    0,
    0,
    297,
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
    148,
    11,
    {
      align: "center",
    }
  );

  pdf.setFontSize(11);

  pdf.text(
    `CLASS REPORT SHEET — ${classReport.class.name}`,
    148,
    18,
    {
      align: "center",
    }
  );

  pdf.setTextColor(
    pdfTheme.colors.text
  );
}

/* =========================================
   CLASS SUMMARY
========================================= */

function renderClassSummary({
  pdf,
  classReport,
}: any) {
  pdf.setFont(
    pdfFonts.bold
  );

  pdf.setFontSize(11);

  pdf.text(
    "Class Information",
    14,
    36
  );

  pdf.setFont(
    pdfFonts.regular
  );

  pdf.setFontSize(10);

  const info = [
    [
      "Class",
      classReport.class.name,
    ],

    [
      "Level",
      classReport.class.level,
    ],

    [
      "Total Students",
      classReport.totalStudents,
    ],

    [
      "Session",
      classReport.sessionName ||
        "-",
    ],

    [
      "Term",
      classReport.termName ||
        "-",
    ],
  ];

  let y = 44;

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
        50,
        y
      );

      y += 7;
    }
  );
}

/* =========================================
   STUDENT TABLE
========================================= */

function renderStudentsTable({
  pdf,
  classReport,
  primaryColor,
}: any) {
  const body =
    classReport.students.map(
      (
        student: RankingStudent
      ) => [
        student.position,

        student.admissionNumber,

        `${student.firstName} ${student.lastName}`,

        student.subjects.length,

        student.totalScore,

        student.averageScore,

        getPerformanceRemark(
          student.averageScore
        ),
      ]
    );

  autoTable(pdf, {
    startY: 82,

    head: [
      [
        "Pos",

        "Admission No",

        "Student Name",

        "Subjects",

        "Total Score",

        "Average",

        "Remark",
      ],
    ],

    body,

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

    columnStyles: {
      0: {
        halign: "center",
      },

      3: {
        halign: "center",
      },

      4: {
        halign: "center",
      },

      5: {
        halign: "center",
      },
    },
  });
}

/* =========================================
   PERFORMANCE ANALYSIS
========================================= */

function renderPerformanceAnalysis({
  pdf,
  classReport,
}: any) {
  const stats =
    calculateClassStatistics(
      classReport.students
    );

  const y =
    (
      pdf as any
    ).lastAutoTable.finalY + 12;

  pdf.setFont(
    pdfFonts.bold
  );

  pdf.setFontSize(11);

  pdf.text(
    "Performance Analysis",
    14,
    y
  );

  pdf.setFont(
    pdfFonts.regular
  );

  pdf.setFontSize(10);

  const analysis = [
    [
      "Highest Average",
      stats.highestAverage,
    ],

    [
      "Lowest Average",
      stats.lowestAverage,
    ],

    [
      "Class Average",
      stats.classAverage,
    ],

    [
      "Excellent Students",
      stats.excellentCount,
    ],

    [
      "Passed Students",
      stats.passCount,
    ],

    [
      "Failed Students",
      stats.failCount,
    ],
  ];

  let currentY =
    y + 8;

  analysis.forEach(
    ([label, value]) => {
      pdf.setFont(
        pdfFonts.bold
      );

      pdf.text(
        `${label}:`,
        14,
        currentY
      );

      pdf.setFont(
        pdfFonts.regular
      );

      pdf.text(
        String(value),
        65,
        currentY
      );

      currentY += 7;
    }
  );
}

/* =========================================
   FOOTER
========================================= */

function renderFooter({
  pdf,
}: any) {
  const footerY = 195;

  pdf.line(
    20,
    footerY,
    80,
    footerY
  );

  pdf.line(
    210,
    footerY,
    270,
    footerY
  );

  pdf.setFontSize(9);

  pdf.text(
    "Class Teacher",
    38,
    footerY + 6
  );

  pdf.text(
    "Principal",
    232,
    footerY + 6
  );

  pdf.setFontSize(8);

  pdf.setTextColor(
    pdfTheme.colors.mutedText
  );

  pdf.text(
    "Generated by EduTrack ERP",
    148,
    205,
    {
      align: "center",
    }
  );

  pdf.setTextColor(
    pdfTheme.colors.text
  );
}