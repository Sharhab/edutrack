export const pdfTheme = {
  colors: {
    primary: "#1E3A8A",
    secondary: "#2563EB",

    accent: "#0F172A",

    success: "#16A34A",
    warning: "#D97706",
    danger: "#DC2626",

    text: "#111827",
    mutedText: "#6B7280",

    border: "#D1D5DB",

    background: "#FFFFFF",

    tableHeader: "#EFF6FF",
    tableBorder: "#CBD5E1",

    lightGray: "#F8FAFC",
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },

  fontSizes: {
    xs: 8,
    sm: 10,
    md: 12,
    lg: 14,
    xl: 18,
    xxl: 24,
  },

  borderRadius: {
    sm: 2,
    md: 4,
    lg: 8,
  },

  table: {
    headerHeight: 28,
    rowHeight: 24,

    borderWidth: 1,
  },

  page: {
    paddingTop: 32,
    paddingBottom: 32,

    paddingHorizontal: 40,
  },
};

/* =========================================
   PDF FONT CONFIG
========================================= */

export const pdfFonts = {
  regular: "Helvetica",

  bold: "Helvetica-Bold",

  italic: "Helvetica-Oblique",

  boldItalic:
    "Helvetica-BoldOblique",
};

/* =========================================
   TABLE COLUMN WIDTHS
========================================= */

export const reportCardTableWidths =
  {
    subject: 150,

    ca1: 40,
    ca2: 40,

    assignment: 55,

    exam: 45,

    total: 45,

    grade: 45,

    remark: 120,
  };

/* =========================================
   PDF DOCUMENT META
========================================= */

export const pdfDocumentMeta = {
  author: "EduTrack ERP",

  creator: "EduTrack ERP",

  producer: "EduTrack ERP",

  title: "Student Report Card",

  subject:
    "Academic Performance Report",

  keywords:
    "school, report card, results, education",
};

/* =========================================
   REPORT CARD LABELS
========================================= */

export const reportCardLabels =
  {
    reportTitle:
      "TERMINAL REPORT CARD",

    attendance:
      "Attendance Summary",

    performance:
      "Performance Summary",

    classPosition:
      "Class Position",

    averageScore:
      "Average Score",

    totalScore:
      "Total Score",

    subjects:
      "Subjects Offered",

    principalComment:
      "Principal's Comment",

    teacherComment:
      "Teacher's Comment",

    nextTermBegins:
      "Next Term Begins",

    signature:
      "Authorized Signature",
  };

/* =========================================
   DEFAULT COMMENTS
========================================= */

export const defaultComments = {
  excellent:
    "Excellent performance. Keep it up.",

  veryGood:
    "Very good performance. Maintain consistency.",

  good:
    "Good effort. There is room for improvement.",

  fair:
    "Fair performance. More dedication is required.",

  poor:
    "Performance below expectation. Immediate improvement required.",
};