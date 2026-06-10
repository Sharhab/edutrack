import { getRecentActivity } from "./activity.service.js";

export async function recentActivityHandler(req, res) {
  const data = await getRecentActivity(req.user);

  res.json({
    success: true,
    message: "Recent activity fetched successfully",
    data,
  });
}