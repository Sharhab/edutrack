import mongoose from "mongoose";

const onboardingPaymentSchema =
  new mongoose.Schema(
    {
      /**
       * SCHOOL
       */
      schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "School",
        required: true,
      },

      /**
       * CONTACT
       */
      schoolName: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },

      phone: {
        type: String,
        default: "",
        trim: true,
      },

      /**
       * PLAN
       */
      plan: {
        type: String,
        enum: [
          "starter",
          "growth",
          "premium",
           "isTrial",
        ],
        default: "starter",
      },

      billingCycle: {
        type: String,
        enum: [
          "monthly",
          "quarterly",
          "yearly",
        ],
        default: "monthly",
      },

      /**
       * PAYMENT
       */
      amount: {
        type: Number,
        required: true,
        default: 0,
      },

      currency: {
        type: String,
        default: "NGN",
      },
    
      onboardingStep: {
  type: String,
  enum: [
    "draft",
    "created",
    "payment_pending",
    "payment_success",
    "active",
    "failed",
  ],
  default: "draft",
},
      status: {
        type: String,
        enum: [
          "pending",
          "success",
          "failed",
          "abandoned",
        ],
        default: "pending",
      },

      /**
       * PAYSTACK
       */
      reference: {
        type: String,
        required: true,
        trim: true,
      },

      accessCode: {
        type: String,
        default: "",
      },

      authorizationUrl: {
        type: String,
        default: "",
      },

      paidAt: {
        type: Date,
        default: null,
      },

      /**
       * EXPIRATION
       */
      expiresAt: {
        type: Date,
        default: null,
      },

      /**
       * METADATA
       */
      metadata: {
        type: Object,
        default: {},
      },
    },
    {
      timestamps: true,
    }
  );

/**
 * =====================================
 * INDEXES
 * =====================================
 */

/**
 * UNIQUE PAYMENT REFERENCE
 * IMPORTANT:
 * define index ONLY here
 * do NOT use unique:true inside field
 */
onboardingPaymentSchema.index(
  { reference: 1 },
  { unique: true }
);

/**
 * SCHOOL INDEX
 */
onboardingPaymentSchema.index({
  schoolId: 1,
});

/**
 * STATUS INDEX
 */
onboardingPaymentSchema.index({
  status: 1,
});

/**
 * EXPIRATION INDEX
 */
onboardingPaymentSchema.index({
  expiresAt: 1,
});

export const OnboardingPayment =
  mongoose.model(
    "OnboardingPayment",
    onboardingPaymentSchema
  );

export default OnboardingPayment;