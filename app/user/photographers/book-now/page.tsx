import React from 'react';
import BookNowPage from '../../../pages/photographer/book-now';
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Book a Photographer",
  description: "Book a photographer for your event.",
  path: "/user/photographers/book-now",
  index: false,
});

const Page = () => {
    return <BookNowPage />;
}

export default Page;