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

    fullDomain: { type: String, default: "" },

    customDomain: { type: String, default: "" }, // optional future

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

    trialStartAt: { type: Date, default: null },
    trialEndsAt: { type: Date, default: null },

    subscriptionStartedAt: { type: Date, default: null },
    subscriptionExpiresAt: { type: Date, default: null },

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
    // PAYSTACK — EDUTRACK SUBSCRIPTION
    // =========================
    paystackCustomerCode: { type: String, default: "" },
    paystackSubscriptionCode: { type: String, default: "" },
    paystackEmailToken: { type: String, default: "" },

    // =========================
    // SCHOOL FEE PAYMENT SETTINGS
    // =========================
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
        subaccountCode: {
          type: String,
          default: "",
          trim: true,
        },

        subaccountId: {
          type: String,
          default: "",
          trim: true,
        },

        settlementBank: {
          type: String,
          default: "",
          trim: true,
        },

        accountName: {
          type: String,
          default: "",
          trim: true,
        },

        accountNumberLast4: {
          type: String,
          default: "",
          trim: true,
        },

        connected: {
          type: Boolean,
          default: false,
        },

        connectedAt: {
          type: Date,
          default: null,
        },
      },
    },

    // =========================
    // STATUS
    // =========================
    isActive: { type: Boolean, default: true },

    settings: {
      allowStudentLogin: { type: Boolean, default: true },
      allowParentLogin: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

/**
 * =========================
 * INDEXES (FIXED)
 * =========================
 */

// email
schoolSchema.index({ email: 1 });

// slug (tenant key)
schoolSchema.index({ slug: 1 }, { unique: true });

// domain (sparse unique only ONCE)
schoolSchema.index({ domain: 1 }, { unique: true, sparse: true });

// performance
schoolSchema.index({ billingStatus: 1 });

export const School = mongoose.model("School", schoolSchema);
export default School;
