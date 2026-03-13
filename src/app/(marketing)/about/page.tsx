import { Metadata } from 'next';
import AboutContent from './about-content';

export const metadata: Metadata = {
    title: 'About Us | Krishna Connect',
    description: "India's first Spiritual Social Media platform. Made in India, for the world.",
};

export default function AboutPage() {
  return <AboutContent />;
}
