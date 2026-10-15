export async function startFreeTrial(schoolId) {
  const school = await School.findById(schoolId);

  if (!school) throw new Error("School not found");

  const now = new Date();

  const trialEnd = new Date();
  trialEnd.setDate(now.getDate() + 7);

  school.isActive = true;
  school.subscriptionStatus = "trial";
  school.trialEndsAt = trialEnd;

  await school.save();

  return school;
}


export async function activatePaidSchool(schoolId) {
  const school = await School.findById(schoolId);

  if (!school) {
    throw new Error("School not found");
  }

  const now = new Date();
  const expiresAt = new Date(now);

  switch (school.billingCycle || "monthly") {
    case "quarterly":
      expiresAt.setMonth(expiresAt.getMonth() + 3);
      break;
    case "yearly":
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      break;
    default:
      expiresAt.setMonth(expiresAt.getMonth() + 1);
  }

  school.isActive = true;
  school.billingStatus = "active";
  school.subscriptionStatus = "active";
  school.onboardingStatus = "active";
  school.subscriptionStartedAt = now;
  school.subscriptionExpiresAt = expiresAt;

  await school.save();

  return school;
}
