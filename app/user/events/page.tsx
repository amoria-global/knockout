import Events from '../../pages/events/events';
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Events",
  description: "Discover upcoming and recent events, reserve your spot or watch live on Amoria Connekyt.",
  path: "/user/events",
});

export default Events;
