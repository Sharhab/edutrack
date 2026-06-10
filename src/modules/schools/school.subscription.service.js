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

  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(now.getMonth() + 1);

  school.isActive = true;
  school.subscriptionStatus = "active";
  school.expiryDate = nextMonth;

  await school.save();

  return school;
}