import {
  getDefaulters,
} from "./defaulters.service.js";

export async function getDefaultersHandler(
  req,
  res
) {
  const data =
    await getDefaulters(
      req.user.schoolId
    );

  res.json({
    success: true,
    data,
  });
}