import mongoose from "mongoose";
import { FeeStructure } from "../models/feeStructure.model.js";
import { StudentFee } from "./studentFee.model.js";
import { Invoice } from "../models/invoice.model.js";
import { Ledger } from "../models/ledger.model.js";
import { ApiError } from "../../../utils/apiError.js";

/* =========================================
   VALIDATION
========================================= */

/* =========================================
   ASSIGN FEE TO STUDENT (FIXED)
========================================= */
