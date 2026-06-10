import mongoose from "mongoose";

const paymentSchema =
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
       * SUBSCRIPTION
       */
      subscriptionId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Subscription",

        default: null,
      },
     sessionId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Session",
},

termId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Term",
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
      },

      /**
       * TIMESTAMPS
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
       * GATEWAY RESPONSE
       */
      gatewayResponse: {
        type: Object,

        default: {},
      },

      /**
       * WEBHOOKS
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
       * SECURITY
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
       * FLEXIBLE METADATA
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
 * =====================================
 * INDEXES
 * =====================================
 */

/**
 * UNIQUE REFERENCE
 */
paymentSchema.index(
  { reference: 1 },
  { unique: true }
);

/**
 * SCHOOL + STATUS
 */
paymentSchema.index({
  schoolId: 1,
  status: 1,
});

/**
 * CREATED DATE
 */
paymentSchema.index({
  createdAt: -1,
});

/**
 * EXPORT
 */
export const Payment =
  mongoose.models.Payment ||
  mongoose.model(
    "Payment",
    paymentSchema
  );

export default Payment;