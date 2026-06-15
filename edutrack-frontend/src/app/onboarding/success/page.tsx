
import { Suspense } from "react";
import OnboardingSuccessClient from "./SuccessClient";

export default function  OnboardingSuccessPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingSuccessClient />
    </Suspense>
  );
}