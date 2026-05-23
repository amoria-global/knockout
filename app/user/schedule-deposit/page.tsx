import type { Metadata } from "next";
import ScheduleDeposit from "../../pages/schedule-deposit";

export const metadata: Metadata = {
  title: "Pay your booking deposit · Connekyt",
  description: "Complete the 50% deposit for your photography booking.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ScheduleDeposit />;
}
