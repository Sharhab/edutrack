import {
  getSchoolGradingScale,
  saveSchoolGradingScale,
} from "./grading-scale.service.js";

export async function getGradingScaleHandler(req, res) {
  const data = await getSchoolGradingScale(req.user);

  return res.status(200).json({
    success: true,
    message: "Grading scale fetched successfully.",
    data,
  });
}

export async function saveGradingScaleHandler(req, res) {
  const data = await saveSchoolGradingScale(
    req.user,
    req.body?.bands
  );

  return res.status(200).json({
    success: true,
    message: "Grading scale saved successfully.",
    data,
  });
}
