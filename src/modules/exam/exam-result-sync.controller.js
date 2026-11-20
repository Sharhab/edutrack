
import { syncCbtResults } from "./exam-result-sync.service.js";

export async function syncCbtResultsHandler(req, res, next) {
  try {
    const { examId } = req.params;

    const data = await syncCbtResults({
      user: req.user,
      examId,
    });

    return res.status(200).json({
      success: true,
      message: "CBT marks synchronized with student results.",
      data,
    });
  } catch (error) {
    next(error);
  }
}
