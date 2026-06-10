import mongoose from "mongoose";

const SubpaymentSchema =
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

        index: true,
      },

      /**
       * SUBSCRIPTION LINK
       */
      subscriptionId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Subscription",

        default: null,

        index: true,
      },

      /**
       * AMOUNT
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

        trim: true,

        uppercase: true,
      },

      /**
       * PAYMENT METHOD
       */
      method: {
        type: String,

        enum: [
          "paystack",
          "manual",
          "bank_transfer",
          "cash",
          "flutterwave",
        ],

        default: "paystack",
      },

      /**
       * TRANSACTION REFERENCE
       */
      reference: {
        type: String,

        required: true,

        unique: true,

        index: true,

        trim: true,
      },

      /**
       * STATUS
       */
      status: {
        type: String,

        enum: [
          "pending",
          "processing",
          "success",
          "failed",
          "abandoned",
          "refunded",
        ],

        default: "pending",

        index: true,
      },

      /**
       * PAYMENT TIMESTAMPS
       */
      initiatedAt: {
        type: Date,

        default: Date.now,
      },

      paidAt: {
        type: Date,

        default: null,
      },

      failedAt: {
        type: Date,

        default: null,
      },

      /**
       * PAYSTACK / PROVIDER DATA
       */
      gatewayResponse: {
        type: Object,

        default: {},
      },

      /**
       * WEBHOOK TRACKING
       */
      webhookEvents: [
        {
          event: String,

          receivedAt: {
            type: Date,

            default: Date.now,
          },

          payload: Object,
        },
      ],

      /**
       * SECURITY / FRAUD
       */
      ipAddress: {
        type: String,

        default: "",
      },

      userAgent: {
        type: String,

        default: "",
      },

      /**
       * METADATA (flexible but safe)
       */
      metadata: {
        type: Object,

        default: {},
      },

      /**
       * RECONCILIATION
       */
      reconciled: {
        type: Boolean,

        default: false,
      },

      reconciledAt: {
        type: Date,

        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

/**
 * INDEXES
 */
SubpaymentSchema.index({
  schoolId: 1,
  status: 1,
});

SubpaymentSchema.index({
  reference: 1,
});

SubpaymentSchema.index({
  createdAt: -1,
});

/**
 * EXPORT
 */
export const SubPayment =
  mongoose.models.SubPayment ||
  mongoose.model(
    "SubPayment",
     SubpaymentSchema
  );