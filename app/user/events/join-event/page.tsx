import react from 'react';
import JoinEventPage from '../../../pages/events/join-event';
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Join Event",
  description: "Reserve your spot at an event on Amoria Connekyt.",
  path: "/user/events/join-event",
  index: false,
});
const JoinEvent = () => {
    return < JoinEventPage/>;
}
export default JoinEvent;