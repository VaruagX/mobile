/**
 * Content carried over unchanged from the Varuag Labs website
 * (src/data/team.ts, src/data/site.ts, src/components/home/Hero.tsx).
 * Photos in assets/team are byte-identical copies of the website's team/*-800.webp files.
 */

export const site = {
  name: 'Varuag Labs',
  tagline: 'Technology | Innovation',
  positioning: 'Startup product engineering studio',
  heroLines: ['We turn ideas', 'into digital', 'reality.'],
  heroDescription:
    'Varuag Labs builds modern websites, software applications, and digital products that help businesses turn ambitious ideas into practical technology solutions.',
  focusAreas: ['Web Development', 'Custom Software', 'Product Design', 'Digital Products'],
  website: 'https://varuaglabs.in',
} as const;

export type Leader = {
  id: string;
  name: string;
  role: string;
  bio: string;
  linkedin: string;
  photo: number;
  /** Intrinsic size of the 800px website photo (keeps proportions). */
  size: { width: number; height: number };
};

export const leadership: Leader[] = [
  {
    id: 'gaurav-kale',
    name: 'Gaurav Kale',
    role: 'Founder & CEO',
    bio: 'Leading Varuag Labs in building modern websites, custom software, and scalable digital products that help businesses grow and innovate.',
    linkedin: 'https://www.linkedin.com/in/gauravkale-web/',
    photo: require('../../assets/team/ceo-800.webp'),
    size: { width: 800, height: 800 },
  },
  {
    id: 'shubham-more',
    name: 'Shubham More',
    role: 'Co-Founder & CTO',
    bio: 'Leading technology and software development to build reliable, scalable digital products through Varuag Labs.',
    linkedin: 'https://www.linkedin.com/in/shubham-more-50a2a7428/',
    photo: require('../../assets/team/cto-800.webp'),
    size: { width: 800, height: 800 },
  },
  {
    id: 'gaurav-lokhande',
    name: 'Gaurav Lokhande',
    role: 'Co-Founder & COO',
    bio: 'Coordinating operations, project execution, and team collaboration to deliver quality digital solutions through Varuag Labs.',
    linkedin: 'https://www.linkedin.com/in/gaurav-lokhande-2ab246425/',
    photo: require('../../assets/team/coo-800.webp'),
    size: { width: 800, height: 782 },
  },
  {
    id: 'akash-more',
    name: 'Akash More',
    role: 'Co-Founder & CMO',
    bio: 'Driving marketing, brand awareness, and business growth to connect Varuag Labs with more clients and opportunities.',
    linkedin: 'https://www.linkedin.com/in/akash-more-61019832a/',
    photo: require('../../assets/team/cmo-800.webp'),
    size: { width: 800, height: 1067 },
  },
];

export const altFor = (m: Leader) => `${m.name}, ${m.role.replace('&', 'and')} of Varuag Labs`;
