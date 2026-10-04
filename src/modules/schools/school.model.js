import mongoose from "mongoose";

const schoolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },

    // 🌐 SaaS domain
    domain: {
      type: String,
      default: undefined,
      lowercase: true,
      trim: true,
      sparse: true,
      unique: true,
    },

    principalName: {
      type: String,
      default: "",
      trim: true,
    },

    currentSession: {
      type: String,
      default: "",
      trim: true,
    },

    currentTerm: {
      type: String,
      default: "",
      trim: true,
    },

    themeColor: {
      type: String,
      default: "#06b6d4",
    },

    logo: {
      type: String,
      default: "",
    },

    favicon: {
      type: String,
      default: "",
    },

    motto: {
      type: String,
      default: "",
      trim: true,
    },

    fullDomain: {
      type: String,
      default: "",
    },

    customDomain: {
      type: String,
      default: "",
    },

    // =========================
    // BILLING (SINGLE SOURCE OF TRUTH)
    // =========================

    billingStatus: {
      type: String,
      enum: [
        "trial",
        "active",
        "pending_payment",
        "expired",
        "blocked",
      ],
      default: "trial",
    },

    trialStartAt: {
      type: Date,
      default: null,
    },

    trialEndsAt: {
      type: Date,
      default: null,
    },

    subscriptionStartedAt: {
      type: Date,
      default: null,
    },

    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },

    plan: {
      type: String,
      enum: ["starter", "growth", "premium"],
      default: "starter",
    },

    billingCycle: {
      type: String,
      enum: ["monthly", "quarterly", "yearly"],
      default: "monthly",
    },

    onboardingStatus: {
      type: String,
      enum: [
        "pending",
        "payment_initiated",
        "active",
        "suspended",
      ],
      default: "pending",
    },

    subscriptionStatus: {
      type: String,
      enum: [
        "trial",
        "inactive",
        "pending",
        "active",
        "past_due",
        "expired",
        "cancelled",
      ],
      default: "inactive",
    },

    // =========================
    // EDU TRACK BILLING PAYSTACK
    // =========================
    // These are for the school's
    // EduTrack subscription billing.
    //
    // DO NOT confuse these with
    // school fee payment settings below.

    paystackCustomerCode: {
      type: String,
      default: "",
    },

    paystackSubscriptionCode: {
      type: String,
      default: "",
    },

    paystackEmailToken: {
      type: String,
      default: "",
    },

    // =========================
    // SCHOOL PAYMENT SETTINGS
    // =========================
    //
    // Used when parents/students pay
    // school fees through EduTrack.
    //
    // EduTrack's Paystack secret key
    // stays ONLY on the backend.
    // We do NOT store it here.

    paymentSettings: {
      enabled: {
        type: Boolean,
        default: false,
      },

      provider: {
        type: String,
        enum: ["paystack"],
        default: "paystack",
      },

      paystack: {
        // Paystack subaccount identifier
        subaccountCode: {
          type: String,
          default: "",
        },

        // Paystack subaccount ID
        subaccountId: {
          type: String,
          default: "",
        },

        // Bank information returned by Paystack
        settlementBank: {
          type: String,
          default: "",
        },

        // We only store the last 4 digits.
        // Never store the full account number.
        accountNumberLast4: {
          type: String,
          default: "",
        },

        // Indicates whether the school has
        // successfully connected its Paystack
        // settlement account.
        connected: {
          type: Boolean,
          default: false,
        },

        connectedAt: {
          type: Date,
          default: null,
        },

        // Latest verification status returned by Paystack.
        // Never set this to true manually.
        isVerified: {
          type: Boolean,
          default: false,
        },

        // Last time EduTrack checked the status with Paystack.
        verificationCheckedAt: {
          type: Date,
          default: null,
        },
      },
    },

    // =========================
    // STATUS
    // =========================

    isActive: {
      type: Boolean,
      default: true,
    },

    // =========================
    // SCHOOL SETTINGS
    // =========================

    settings: {
      allowStudentLogin: {
        type: Boolean,
        default: true,
      },

      allowParentLogin: {
        type: Boolean,
        default: true,
      },
    },
  },
  { timestamps: true }
);

/**
 * =========================
 * INDEXES
 * =========================
 */

// email
schoolSchema.index({ email: 1 });

// slug (tenant key)
schoolSchema.index(
  { slug: 1 },
  { unique: true }
);

// domain (sparse unique)
schoolSchema.index(
  { domain: 1 },
  {
    unique: true,
    sparse: true,
  }
);

// performance
schoolSchema.index({
  billingStatus: 1,
});

// payment lookup
schoolSchema.index({
  "paymentSettings.paystack.subaccountCode": 1,
});

export const School = mongoose.model(
  "School",
  schoolSchema
);

export default School;
