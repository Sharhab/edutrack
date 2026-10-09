
"use client";

import ChangePasswordForm from "../../../components/settings/ChangePasswordForm";
import SectionCard from "../../../components/ui/SectionCard";

export default function AccountSecurityPage() {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Account Security"
        subtitle="Change your password to keep your EduTrack account secure."
      >
        <ChangePasswordForm />
      </SectionCard>
    </div>
  );
}
