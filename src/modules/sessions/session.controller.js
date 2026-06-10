import { createSessionSchema } from "./session.validation.js";
import {
  createSession,
  getSessionById,
  listSessions,
  setCurrentSession,
} from "./session.service.js";

export async function createSessionHandler(req, res) {
  const parsed = createSessionSchema.parse(req.body);
  const data = await createSession(parsed, req.user.schoolId);

  res.status(201).json({
    success: true,
    message: "Session created successfully",
    data,
  });
}

export async function listSessionsHandler(req, res) {
  const data = await listSessions(req.user.schoolId);

  res.json({
    success: true,
    message: "Sessions fetched successfully",
    data,
  });
}

export async function getSessionHandler(req, res) {
  const data = await getSessionById(req.params.id, req.user.schoolId);

  res.json({
    success: true,
    message: "Session fetched successfully",
    data,
  });
}

export async function setCurrentSessionHandler(req, res) {
  const data = await setCurrentSession(req.params.id, req.user.schoolId);

  res.json({
    success: true,
    message: "Current session updated successfully",
    data,
  });
}