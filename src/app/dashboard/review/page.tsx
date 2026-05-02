import { getTherapistSettings } from "@/app/dashboard/settings/settings-actions";
import { MonthlyReviewClientPage } from "./review-client";

export default async function MonthlyReviewPage() {
  const settings = await getTherapistSettings().catch(() => null);
  const practiceLabel = settings?.practice_name ?? settings?.full_name ?? "Cabinet";

  return <MonthlyReviewClientPage practiceLabel={practiceLabel} />;
}
