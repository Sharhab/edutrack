import { createTermSchema } from "./term.validation.js";
import {
  createTerm,
  getTermById,
  listTerms,
  setCurrentTerm,
} from "./term.service.js";

export async function createTermHandler(req, res) {
  const parsed = createTermSchema.parse(req.body);
  const data = await createTerm(parsed, req.user.schoolId);

  res.status(201).json({
    success: true,
    message: "Term created successfully",
    data,
  });
}

export async function listTermsHandler(req, res) {
  const data = await listTerms(req.user.schoolId);

  res.json({
    success: true,
    message: "Terms fetched successfully",
    data,
  });
}

export async function getTermHandler(req, res) {
  const data = await getTermById(req.params.id, req.user.schoolId);

  res.json({
    success: true,
    message: "Term fetched successfully",
    data,
  });
}

export async function setCurrentTermHandler(req, res) {
  const data = await setCurrentTerm(req.params.id, req.user.schoolId);

  res.json({
    success: true,
    message: "Current term updated successfully",
    data,
  });
}