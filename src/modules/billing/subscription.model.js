import mongoose from "mongoose";

const subscriptionSchema =
  new mongoose.Schema(
    {
      /**
       * SCHOOL
       */
      schoolId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "School",

        required: true,
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
        ],

        required: true,

        default: "starter",
      },

      /**
       * PRICE
       */
      amount: {
        type: Number,

        required: true,

        min: 0,
      },

      /**
       * CURRENCY
       */
      currency: {
        type: String,

        default: "NGN",

        uppercase: true,

        trim: true,
      },

      /**
       * BILLING
       */
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
       * STATUS
       */
      status: {
        type: String,

        enum: [
          "trial",
          "active",
          "expired",
          "pending",
          "cancelled",
          "past_due",
          "suspended",
        ],

        default: "pending",
      },

      /**
       * TRIAL SUPPORT
       */
      isTrial: {
        type: Boolean,

        default: false,
      },

      trialEndsAt: {
        type: Date,

        default: null,
      },

      /**
       * DATES
       */
      startsAt: {
        type: Date,

        default: null,
      },

      expiresAt: {
        type: Date,

        default: null,
      },

      cancelledAt: {
        type: Date,

        default: null,
      },

      /**
       * AUTO RENEW
       */
      autoRenew: {
        type: Boolean,

        default: true,
      },

      /**
       * DUNNING
       */
      failedPaymentAttempts: {
        type: Number,

        default: 0,
      },

      /**
       * PAYSTACK
       */
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

      /**
       * ENABLED MODULES
       */
      enabledModules: {
        type: [String],

        default: [],
      },

      /**
       * NOTES
       */
      notes: {
        type: String,

        default: "",

        trim: true,
      },

      /**
       * CREATED BY
       */
      createdBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

/**
 * =========================================
 * INDEXES
 * =========================================
 */

subscriptionSchema.index({
  schoolId: 1,
  status: 1,
});

subscriptionSchema.index({
  expiresAt: 1,
});

subscriptionSchema.index({
  createdAt: -1,
});

/**
 * =========================================
 * EXPORT
 * =========================================
 */

export const Subscription =
  mongoose.models
    .Subscription ||
  mongoose.model(
    "Subscription",
    subscriptionSchema
  );

export default Subscription;