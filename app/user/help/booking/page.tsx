import BookingHelp from '../../../pages/help/booking';
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Booking Help",
  description: "How to book a photographer, reserve event spots and manage your bookings.",
  path: "/user/help/booking",
});

export default function BookingHelpPage() {
  return <BookingHelp />;
}
