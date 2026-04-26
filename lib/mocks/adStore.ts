export interface Ad {
  id: string;
  type: 'ad';
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
}

export const MOCK_ADS: Ad[] = [
  {
    id: 'ad-1',
    type: 'ad',
    title: 'Experience Premium Sound',
    description: 'The all-new Konekta Audio Pro. Deep bass, crystal clear highs. Get yours today with 20% off.',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop',
    linkUrl: 'https://example.com/audio-pro',
  },
  {
    id: 'ad-2',
    type: 'ad',
    title: 'Cloud Storage for Creators',
    description: 'Never run out of space again. Secure, fast, and encrypted cloud storage for your photos and videos.',
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=600&auto=format&fit=crop',
    linkUrl: 'https://example.com/cloud',
  },
  {
    id: 'ad-3',
    type: 'ad',
    title: 'Master New Skills',
    description: 'Learn coding, design, and marketing from industry experts. Start your 7-day free trial now.',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop',
    linkUrl: 'https://example.com/learn',
  },
];

export const AD_CAPS = {
  free: 18,
  plus: 9,
  pro: 0,
};

export const AD_INTERVALS = {
  free: 3,
  plus: 25,
  pro: 999999,
};
