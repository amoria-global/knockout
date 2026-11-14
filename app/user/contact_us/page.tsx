import React from 'react';
import ContactUsPage from '../../pages/contact_us';
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Contact Us",
  description: "Get in touch with the Amoria Connekyt team for support, partnerships and press.",
  path: "/user/contact_us",
});

export default function ContactUs() {
  return <ContactUsPage />;
}
