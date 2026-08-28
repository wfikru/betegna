/**
 * Service taxonomy: categories → services → configuration-driven questionnaires.
 * In production this lives in Firestore (collections: categories, services,
 * serviceQuestions) and is editable by admins without app changes. The shape
 * below mirrors those documents exactly, so seeding is a 1:1 upload.
 */
import type { Category, Question, ServiceDefinition } from '../../models/types';

/* ── reusable question builders ── */
const qProperty = (): Question => ({
  id: 'property',
  type: 'single',
  label: 'Property type',
  required: true,
  options: [
    { value: 'apartment', label: 'Apartment / Condo' },
    { value: 'house', label: 'House / Villa' },
    { value: 'office', label: 'Office / Business' },
    { value: 'other', label: 'Other' },
  ],
});

const qPhotos = (): Question => ({
  id: 'photos',
  type: 'photos',
  label: 'Add photos',
  helpText: 'Photos help professionals quote accurately — often cheaper.',
});

const qEmergency = (): Question => ({
  id: 'emergency',
  type: 'boolean',
  label: 'Is this an emergency?',
  helpText: 'Emergency jobs are prioritized to on-call professionals.',
});

const genericQuestions = (example: string): Question[] => [
  {
    id: 'scope',
    type: 'text',
    label: 'Describe what you need done',
    required: true,
    placeholder: example,
  },
  qProperty(),
  qEmergency(),
  qPhotos(),
];

export const CATEGORIES: Category[] = [
  {
    id: 'cleaning',
    name: 'Cleaning',
    nameAm: 'ጽዳት',
    emoji: '🧹',
    color: '#0B6B45',
    description: 'Home, office and deep cleaning',
    popular: true,
    serviceIds: ['house-cleaning', 'deep-cleaning', 'move-out-cleaning', 'office-cleaning'],
  },
  {
    id: 'plumbing',
    name: 'Plumbing',
    nameAm: 'ቧንቧ',
    emoji: '🚰',
    color: '#1D6FB8',
    description: 'Repairs, leaks, drains, water heaters',
    popular: true,
    serviceIds: ['plumbing-general', 'drain-cleaning', 'faucet-leak', 'water-heater', 'emergency-plumbing'],
  },
  {
    id: 'electrical',
    name: 'Electrical',
    nameAm: 'ኤሌክትሪክ',
    emoji: '⚡',
    color: '#B45309',
    description: 'Repairs, wiring, lighting, panels',
    popular: true,
    serviceIds: ['electrical-repair', 'lighting', 'wiring', 'panel-upgrade'],
  },
  {
    id: 'home-repair',
    name: 'Home Repair',
    nameAm: 'የቤት ጥገና',
    emoji: '🛠️',
    color: '#6D28D9',
    description: 'Carpentry, painting, appliances, AC',
    popular: true,
    serviceIds: ['furniture-assembly', 'carpentry', 'painting', 'appliance-repair', 'hvac'],
  },
  {
    id: 'moving',
    name: 'Moving & Delivery',
    nameAm: 'ማጓጓዝ',
    emoji: '🚚',
    color: '#BE185D',
    description: 'Moving help, packing, courier',
    popular: true,
    serviceIds: ['moving-help', 'packing', 'delivery'],
  },
  {
    id: 'events',
    name: 'Events',
    nameAm: 'ክንውኖች',
    emoji: '🎉',
    color: '#D98E04',
    description: 'Planning, photography, catering, tents',
    popular: true,
    serviceIds: ['event-planning', 'photography', 'catering', 'tents-rentals'],
  },
  {
    id: 'beauty',
    name: 'Beauty & Wellness',
    nameAm: 'ውበት',
    emoji: '💅',
    color: '#DB2777',
    description: 'Hair, makeup, nails, massage',
    serviceIds: ['hair-barber', 'makeup-nails', 'massage'],
  },
  {
    id: 'lessons',
    name: 'Lessons',
    nameAm: 'ትምህርት',
    emoji: '📚',
    color: '#0E7490',
    description: 'Tutoring, music, languages',
    serviceIds: ['tutoring', 'music-lessons', 'language-lessons'],
  },
  {
    id: 'tech',
    name: 'Technology',
    nameAm: 'ቴክኖሎጂ',
    emoji: '💻',
    color: '#334155',
    description: 'Computer, phone, IT & networks',
    serviceIds: ['computer-repair', 'phone-repair', 'it-network'],
  },
  {
    id: 'gardening',
    name: 'Gardening',
    nameAm: 'አትክልት',
    emoji: '🌱',
    color: '#15803D',
    description: 'Gardens, landscaping, irrigation',
    serviceIds: ['gardening', 'landscaping'],
  },

  /* ── Ethiopia expansion (see docs/CATEGORY_RESEARCH.md) ── */
  {
    id: 'pest-control', name: 'Pest Control', nameAm: 'ተባይ ቁጥጥር', emoji: '🐜', color: '#7C2D12',
    description: 'Insects, rodents, bed bugs', popular: true,
    serviceIds: ['pest-general', 'bed-bugs', 'rodent-removal'],
  },
  {
    id: 'auto', name: 'Auto Care', nameAm: 'የመኪና አገልግሎት', emoji: '🚗', color: '#B91C1C',
    description: 'Mobile mechanic, battery, roadside', popular: true,
    serviceIds: ['auto-mechanic', 'auto-battery', 'auto-detailing', 'roadside'],
  },
  {
    id: 'tailoring', name: 'Tailoring & Crafts', nameAm: 'ሻምበሎ እና ስራ', emoji: '✂️', color: '#BE185D',
    description: 'Alterations, habesha kemis, embroidery', popular: true,
    serviceIds: ['alterations', 'traditional-wear', 'embroidery'],
  },
  {
    id: 'pets', name: 'Pet Care', nameAm: 'የእንስሳት እንክብካቤ', emoji: '🐾', color: '#9D174D',
    description: 'Walking, grooming, sitting',
    serviceIds: ['dog-walking', 'pet-grooming', 'pet-sitting'],
  },
  {
    id: 'security', name: 'Security & Locks', nameAm: 'ጥበቃ እና ቁልፍ', emoji: '🔐', color: '#334155',
    description: 'CCTV, alarms, locksmith',
    serviceIds: ['cctv-install', 'locksmith'],
  },
  {
    id: 'business', name: 'Business & Admin', nameAm: 'ቢሮ አገልግሎት', emoji: '💼', color: '#0369A1',
    description: 'Translation, accounting, design',
    serviceIds: ['translation', 'bookkeeping', 'design-printing', 'cv-writing'],
  },
  {
    id: 'wellness', name: 'Health & Fitness', nameAm: 'ጤና እና ስፖርት', emoji: '💪', color: '#047857',
    description: 'Personal training, yoga, nutrition',
    serviceIds: ['personal-training', 'yoga-pilates', 'nutrition'],
  },
  {
    id: 'driving', name: 'Driving Lessons', nameAm: 'የመኪና ትምህርት', emoji: '🚦', color: '#4D7C0F',
    description: 'Lessons and license test prep',
    serviceIds: ['driving-lessons', 'license-prep'],
  },
  {
    id: 'laundry', name: 'Laundry & Ironing', nameAm: 'ልብስ ማጠብ', emoji: '🧺', color: '#0E7490',
    description: 'Wash & fold, dry cleaning, ironing',
    serviceIds: ['laundry-wash', 'dry-cleaning', 'ironing'],
  },
];

export const SERVICES: ServiceDefinition[] = [
  /* ── Cleaning ── */
  {
    id: 'house-cleaning',
    categoryId: 'cleaning',
    name: 'House Cleaning',
    nameAm: 'የቤት ጽዳት',
    description: 'Regular cleaning for homes and apartments',
    fromPrice: 600,
    priceUnit: 'visit',
    supportsUrgency: true,
    questions: [
      {
        id: 'home_type',
        type: 'single',
        label: 'What kind of home is it?',
        required: true,
        options: [
          { value: 'apartment', label: 'Apartment / Condo' },
          { value: 'house', label: 'House / Villa' },
          { value: 'compound', label: 'Compound house' },
        ],
      },
      { id: 'bedrooms', type: 'number', label: 'How many bedrooms?', required: true, min: 0, max: 20 },
      { id: 'bathrooms', type: 'number', label: 'How many bathrooms?', required: true, min: 1, max: 10 },
      {
        id: 'cleaning_scope',
        type: 'multi',
        label: 'What should be included?',
        options: [
          { value: 'sweep_mop', label: 'Sweep & mop' },
          { value: 'kitchen', label: 'Kitchen deep wipe' },
          { value: 'bathrooms', label: 'Bathrooms' },
          { value: 'windows', label: 'Windows' },
          { value: 'laundry', label: 'Laundry & ironing' },
          { value: 'balcony', label: 'Balcony / yard' },
        ],
      },
      { id: 'pets', type: 'boolean', label: 'Any pets at home?' },
      {
        id: 'supplies',
        type: 'single',
        label: 'Cleaning supplies',
        options: [
          { value: 'pro_brings', label: 'Professional brings supplies' },
          { value: 'i_have', label: 'I have supplies at home' },
        ],
      },
      qPhotos(),
    ],
  },
  {
    id: 'deep-cleaning',
    categoryId: 'cleaning',
    name: 'Deep Cleaning',
    nameAm: 'ጥልቅ ጽዳት',
    description: 'Top-to-bottom deep clean',
    fromPrice: 1200,
    priceUnit: 'visit',
    supportsUrgency: true,
    questions: [
      { id: 'home_type', type: 'single', label: 'Property type', required: true, options: [
        { value: 'apartment', label: 'Apartment / Condo' }, { value: 'house', label: 'House / Villa' }, { value: 'office', label: 'Office' },
      ] },
      { id: 'bedrooms', type: 'number', label: 'Bedrooms', required: true, min: 0, max: 20 },
      { id: 'bathrooms', type: 'number', label: 'Bathrooms', required: true, min: 1, max: 10 },
      { id: 'approx_size', type: 'number', label: 'Approximate size (m²)', unit: 'm²', min: 10, max: 1000 },
      { id: 'focus', type: 'multi', label: 'Focus areas', options: [
        { value: 'kitchen', label: 'Inside kitchen appliances' }, { value: 'bathrooms', label: 'Bathrooms & tiles' },
        { value: 'windows', label: 'Inside windows' }, { value: 'walls', label: 'Walls & baseboards' },
      ] },
      qPhotos(),
    ],
  },
  {
    id: 'move-out-cleaning',
    categoryId: 'cleaning',
    name: 'Move-Out Cleaning',
    nameAm: 'የመውጫ ጽዳት',
    description: 'Empty-home cleaning for handover',
    fromPrice: 1500,
    priceUnit: 'visit',
    supportsUrgency: true,
    questions: [
      { id: 'home_type', type: 'single', label: 'Property type', required: true, options: [
        { value: 'apartment', label: 'Apartment' }, { value: 'house', label: 'House' },
      ] },
      { id: 'bedrooms', type: 'number', label: 'Bedrooms', required: true, min: 0, max: 20 },
      { id: 'bathrooms', type: 'number', label: 'Bathrooms', required: true, min: 1, max: 10 },
      { id: 'empty', type: 'boolean', label: 'Will the home be empty?' },
      qPhotos(),
    ],
  },
  {
    id: 'office-cleaning',
    categoryId: 'cleaning',
    name: 'Office Cleaning',
    nameAm: 'የቢሮ ጽዳት',
    description: 'Recurring or one-time office cleaning',
    fromPrice: 2000,
    priceUnit: 'visit',
    supportsUrgency: false,
    questions: [
      { id: 'approx_size', type: 'number', label: 'Office size (m²)', unit: 'm²', required: true, min: 10, max: 5000 },
      { id: 'staff', type: 'number', label: 'Approximate staff count', min: 1, max: 500 },
      { id: 'scope', type: 'text', label: 'What does the job include?', required: true, placeholder: 'e.g. 3 offices + meeting room + kitchen' },
      qPhotos(),
    ],
  },

  /* ── Plumbing ── */
  {
    id: 'plumbing-general',
    categoryId: 'plumbing',
    name: 'General Plumbing',
    nameAm: 'አጠቃላይ ቧንቧ',
    description: 'Repairs, installs and inspections',
    fromPrice: 400,
    priceUnit: 'visit',
    supportsUrgency: true,
    questions: [
      { id: 'problem', type: 'single', label: 'What is the problem?', required: true, options: [
        { value: 'leak', label: 'A leak' }, { value: 'clog', label: 'A clog / blockage' },
        { value: 'pressure', label: 'Low water pressure' }, { value: 'install', label: 'Install new fixture' },
        { value: 'other', label: 'Something else' },
      ] },
      { id: 'where', type: 'single', label: 'Where is it?', required: true, options: [
        { value: 'kitchen', label: 'Kitchen' }, { value: 'bathroom', label: 'Bathroom' },
        { value: 'laundry', label: 'Laundry area' }, { value: 'outdoor', label: 'Outdoor / yard' },
        { value: 'whole', label: 'Whole house' },
      ] },
      qEmergency(),
      qProperty(),
      { id: 'details', type: 'text', label: 'Anything else the plumber should know?', placeholder: 'e.g. The pipe under the sink started leaking yesterday' },
      qPhotos(),
    ],
  },
  {
    id: 'drain-cleaning',
    categoryId: 'plumbing',
    name: 'Drain Cleaning',
    nameAm: 'የባሮሽታ ጽዳት',
    description: 'Blocked drains and sewer lines',
    fromPrice: 500,
    priceUnit: 'visit',
    supportsUrgency: true,
    questions: [
      { id: 'where', type: 'single', label: 'Which drain is blocked?', required: true, options: [
        { value: 'kitchen', label: 'Kitchen sink' }, { value: 'bathroom', label: 'Bathroom / shower' },
        { value: 'toilet', label: 'Toilet' }, { value: 'outdoor', label: 'Outdoor sewer' },
      ] },
      { id: 'severity', type: 'single', label: 'How bad is it?', required: true, options: [
        { value: 'slow', label: 'Draining slowly' }, { value: 'full', label: 'Completely blocked' },
        { value: 'recurring', label: 'Happens again and again' },
      ] },
      qEmergency(),
      qPhotos(),
    ],
  },
  {
    id: 'faucet-leak',
    categoryId: 'plumbing',
    name: 'Faucet & Leak Repair',
    nameAm: 'የቧንቧ ግፊት ጥገና',
    description: 'Dripping taps and pipe leaks',
    fromPrice: 300,
    priceUnit: 'visit',
    supportsUrgency: true,
    questions: [
      { id: 'where', type: 'single', label: 'Where is the leak?', required: true, options: [
        { value: 'kitchen', label: 'Kitchen faucet' }, { value: 'bathroom', label: 'Bathroom faucet / shower' },
        { value: 'pipe', label: 'A pipe (wall / under sink)' }, { value: 'toilet', label: 'Toilet' },
      ] },
      { id: 'since', type: 'single', label: 'How long has it been leaking?', options: [
        { value: 'today', label: 'Started today' }, { value: 'days', label: 'A few days' },
        { value: 'weeks', label: 'Weeks or more' },
      ] },
      qPhotos(),
    ],
  },
  {
    id: 'water-heater',
    categoryId: 'plumbing',
    name: 'Water Heater',
    nameAm: 'የውሃ ሙቀት',
    description: 'Repair or install water heaters',
    fromPrice: 600,
    priceUnit: 'visit',
    supportsUrgency: true,
    questions: [
      { id: 'need', type: 'single', label: 'What do you need?', required: true, options: [
        { value: 'no_hot', label: 'No hot water' }, { value: 'leak', label: 'Heater is leaking' },
        { value: 'install', label: 'Install a new heater' }, { value: 'maintenance', label: 'Maintenance / check' },
      ] },
      { id: 'brand', type: 'text', label: 'Brand / type (if known)', placeholder: 'e.g. Ariston 80L' },
      qPhotos(),
    ],
  },
  {
    id: 'emergency-plumbing',
    categoryId: 'plumbing',
    name: 'Emergency Plumbing',
    nameAm: 'አስቸኳይ ቧንቧ',
    description: 'Burst pipes and urgent leaks — 24/7',
    fromPrice: 900,
    priceUnit: 'visit',
    supportsUrgency: true,
    questions: [
      { id: 'details', type: 'text', label: 'What happened?', required: true, placeholder: 'e.g. Pipe burst in the wall, water everywhere' },
      { id: 'where', type: 'single', label: 'Where?', required: true, options: [
        { value: 'kitchen', label: 'Kitchen' }, { value: 'bathroom', label: 'Bathroom' },
        { value: 'outdoor', label: 'Outdoor' }, { value: 'whole', label: 'Multiple places' },
      ] },
      qProperty(),
      qPhotos(),
    ],
  },

  /* ── Electrical ── */
  {
    id: 'electrical-repair',
    categoryId: 'electrical',
    name: 'Electrical Repair',
    nameAm: 'ኤሌክትሪክ ጥገና',
    description: 'Outlets, breakers, faults',
    fromPrice: 400,
    priceUnit: 'visit',
    supportsUrgency: true,
    questions: [
      { id: 'issue', type: 'single', label: 'What is the issue?', required: true, options: [
        { value: 'outlets', label: 'Outlets not working' }, { value: 'lighting', label: 'Lights not working' },
        { value: 'breaker', label: 'Breaker keeps tripping' }, { value: 'spark', label: 'Sparks / burning smell' },
        { value: 'other', label: 'Something else' },
      ] },
      qEmergency(),
      qProperty(),
      { id: 'details', type: 'text', label: 'More details', placeholder: 'e.g. Three sockets in the living room stopped working' },
      qPhotos(),
    ],
  },
  {
    id: 'lighting',
    categoryId: 'electrical',
    name: 'Lighting & Fixtures',
    nameAm: 'መብራቶች',
    description: 'Install or fix lights, chandeliers',
    fromPrice: 250,
    priceUnit: 'visit',
    supportsUrgency: false,
    questions: [
      { id: 'job', type: 'single', label: 'What is the job?', required: true, options: [
        { value: 'install', label: 'Install new fixtures' }, { value: 'repair', label: 'Repair existing lights' },
        { value: 'design', label: 'Lighting design & advice' },
      ] },
      { id: 'count', type: 'number', label: 'How many fixtures?', unit: 'fixtures', required: true, min: 1, max: 100 },
      { id: 'indoor', type: 'single', label: 'Indoor or outdoor?', options: [
        { value: 'indoor', label: 'Indoor' }, { value: 'outdoor', label: 'Outdoor' }, { value: 'both', label: 'Both' },
      ] },
      qPhotos(),
    ],
  },
  {
    id: 'wiring',
    categoryId: 'electrical',
    name: 'Wiring',
    nameAm: 'ሽቦ መዘርጋት',
    description: 'New wiring and rewiring',
    fromPrice: 1500,
    priceUnit: 'flat',
    supportsUrgency: false,
    questions: [
      { id: 'scope', type: 'single', label: 'Wiring scope', required: true, options: [
        { value: 'new_room', label: 'New room / extension' }, { value: 'rewire', label: 'Rewire whole house' },
        { value: 'partial', label: 'Partial rewire' }, { value: 'ethernet', label: 'Ethernet / network wiring' },
      ] },
      { id: 'rooms', type: 'number', label: 'Rooms affected', min: 1, max: 30 },
      qProperty(),
      { id: 'details', type: 'text', label: 'More details', placeholder: 'e.g. 3-bedroom new house, needs full wiring plan' },
      qPhotos(),
    ],
  },
  {
    id: 'panel-upgrade',
    categoryId: 'electrical',
    name: 'Panel / Meter Work',
    nameAm: 'የመቆጣጠሪያ ስራ',
    description: 'Panel upgrades and meter issues',
    fromPrice: 1200,
    priceUnit: 'flat',
    supportsUrgency: false,
    questions: genericQuestions('e.g. I need to upgrade from 10A to 30A panel for a new building'),
  },

  /* ── Home repair ── */
  {
    id: 'furniture-assembly',
    categoryId: 'home-repair',
    name: 'Furniture Assembly',
    nameAm: 'የቤት ዕቃዎች ጥምረት',
    description: 'Beds, wardrobes, shelves and more',
    fromPrice: 300,
    priceUnit: 'visit',
    supportsUrgency: true,
    questions: [
      { id: 'items', type: 'multi', label: 'What needs assembling?', required: true, options: [
        { value: 'bed', label: 'Bed' }, { value: 'wardrobe', label: 'Wardrobe' },
        { value: 'shelf', label: 'Shelves / bookcase' }, { value: 'table', label: 'Table / desk' },
        { value: 'other', label: 'Other' },
      ] },
      { id: 'count', type: 'number', label: 'How many items?', min: 1, max: 50 },
      { id: 'source', type: 'single', label: 'Where is it from?', options: [
        { value: 'boxed', label: 'Still in boxes (new)' }, { value: 'moved', label: 'Taken apart for moving' },
      ] },
      qPhotos(),
    ],
  },
  {
    id: 'carpentry',
    categoryId: 'home-repair',
    name: 'Carpentry',
    nameAm: 'የእንጨት ስራ',
    description: 'Repairs, custom builds, doors',
    fromPrice: 500,
    priceUnit: 'visit',
    supportsUrgency: false,
    questions: [
      { id: 'job', type: 'single', label: 'What is the job?', required: true, options: [
        { value: 'repair', label: 'Repair furniture / door' }, { value: 'custom', label: 'Custom build' },
        { value: 'cabinets', label: 'Kitchen cabinets' }, { value: 'floor', label: 'Flooring' },
      ] },
      { id: 'material', type: 'boolean', label: 'Do you have the materials?' },
      { id: 'details', type: 'text', label: 'Describe the job', required: true, placeholder: 'e.g. Custom wardrobe 3m wide with mirror' },
      qPhotos(),
    ],
  },
  {
    id: 'painting',
    categoryId: 'home-repair',
    name: 'Painting',
    nameAm: 'ቀለም ቅብ',
    description: 'Interior and exterior painting',
    fromPrice: 800,
    priceUnit: 'flat',
    supportsUrgency: false,
    questions: [
      { id: 'scope', type: 'single', label: 'What needs painting?', required: true, options: [
        { value: 'one_room', label: 'One room' }, { value: 'rooms', label: 'Several rooms' },
        { value: 'whole', label: 'Whole home' }, { value: 'exterior', label: 'Exterior' },
        { value: 'furniture', label: 'Furniture' },
      ] },
      { id: 'approx_size', type: 'number', label: 'Approximate area (m²)', unit: 'm²', min: 5, max: 2000 },
      { id: 'paint', type: 'single', label: 'Who provides the paint?', options: [
        { value: 'i_provide', label: 'I will provide' }, { value: 'pro_provides', label: 'Professional should provide' },
        { value: 'advise', label: 'Advise me first' },
      ] },
      { id: 'condition', type: 'single', label: 'Wall condition', options: [
        { value: 'good', label: 'Good — just repaint' }, { value: 'patching', label: 'Needs patching' },
        { value: 'cracks', label: 'Cracks / damp damage' },
      ] },
      qPhotos(),
    ],
  },
  {
    id: 'appliance-repair',
    categoryId: 'home-repair',
    name: 'Appliance Repair',
    nameAm: 'የቤት ኤሌክትሮኒክስ ጥገና',
    description: 'Fridges, washers, stoves, AC',
    fromPrice: 400,
    priceUnit: 'visit',
    supportsUrgency: true,
    questions: [
      { id: 'appliance', type: 'single', label: 'Which appliance?', required: true, options: [
        { value: 'fridge', label: 'Refrigerator' }, { value: 'washer', label: 'Washing machine' },
        { value: 'stove', label: 'Stove / Oven' }, { value: 'ac', label: 'Air conditioner' },
        { value: 'microwave', label: 'Microwave' }, { value: 'tv', label: 'TV' },
        { value: 'other', label: 'Other' },
      ] },
      { id: 'brand', type: 'text', label: 'Brand (if known)', placeholder: 'e.g. Samsung, LG' },
      { id: 'issue', type: 'text', label: 'What is wrong with it?', required: true, placeholder: 'e.g. Fridge cools but freezer has ice buildup' },
      qPhotos(),
    ],
  },
  {
    id: 'hvac',
    categoryId: 'home-repair',
    name: 'AC & HVAC',
    nameAm: 'ኤሲ እና ኤችቫቪ',
    description: 'AC repair, install, servicing',
    fromPrice: 700,
    priceUnit: 'visit',
    supportsUrgency: true,
    questions: [
      { id: 'need', type: 'single', label: 'What do you need?', required: true, options: [
        { value: 'repair', label: 'Repair — not cooling / heating' }, { value: 'install', label: 'Install new unit' },
        { value: 'service', label: 'Regular servicing' }, { value: 'gas', label: 'Gas refill' },
      ] },
      { id: 'units', type: 'number', label: 'How many units?', min: 1, max: 30 },
      qEmergency(),
      qPhotos(),
    ],
  },

  /* ── Moving & delivery ── */
  {
    id: 'moving-help',
    categoryId: 'moving',
    name: 'Moving Help',
    nameAm: 'ማጓጓዣ እገዛ',
    description: 'Movers with truck, loading and unloading',
    fromPrice: 2000,
    priceUnit: 'flat',
    supportsUrgency: true,
    questions: [
      { id: 'size', type: 'single', label: 'How much are you moving?', required: true, options: [
        { value: 'few', label: 'A few items' }, { value: 'studio', label: 'Studio / 1-bedroom' },
        { value: 'two_bed', label: '2–3 bedroom' }, { value: 'office', label: 'Office' },
      ] },
      { id: 'floors', type: 'single', label: 'Floors / elevator', options: [
        { value: 'ground', label: 'Ground floor' }, { value: 'low', label: '1–2 floors, no elevator' },
        { value: 'high', label: '3+ floors, no elevator' }, { value: 'elevator', label: 'Elevator available' },
      ] },
      { id: 'distance', type: 'single', label: 'How far?', required: true, options: [
        { value: 'same', label: 'Same sub-city' }, { value: 'addis', label: 'Within Addis Ababa' },
        { value: 'outside', label: 'Outside Addis Ababa' },
      ] },
      { id: 'packing', type: 'boolean', label: 'Need packing help too?' },
      qPhotos(),
    ],
  },
  {
    id: 'packing',
    categoryId: 'moving',
    name: 'Packing Services',
    nameAm: 'ማሸግ',
    description: 'Professional packing for a move',
    fromPrice: 800,
    priceUnit: 'visit',
    supportsUrgency: false,
    questions: genericQuestions('e.g. Packing a 2-bedroom apartment before Saturday move'),
  },
  {
    id: 'delivery',
    categoryId: 'moving',
    name: 'Delivery & Courier',
    nameAm: 'መላኪያ',
    description: 'Item pickup and delivery across the city',
    fromPrice: 150,
    priceUnit: 'flat',
    supportsUrgency: true,
    questions: [
      { id: 'item', type: 'text', label: 'What is being delivered?', required: true, placeholder: 'e.g. Cake from Kazanchis to Bole' },
      { id: 'size', type: 'single', label: 'Size', required: true, options: [
        { value: 'small', label: 'Small — fits on a bike' }, { value: 'medium', label: 'Medium — needs a car' },
        { value: 'large', label: 'Large — needs a pickup / truck' },
      ] },
      { id: 'express', type: 'boolean', label: 'Express (within 2 hours)?' },
    ],
  },

  /* ── Events ── */
  {
    id: 'event-planning',
    categoryId: 'events',
    name: 'Event Planning',
    nameAm: 'ዝግጅት አዘጋጅ',
    description: 'Full planning and coordination',
    fromPrice: 5000,
    priceUnit: 'flat',
    supportsUrgency: false,
    questions: [
      { id: 'event_type', type: 'single', label: 'What is the event?', required: true, options: [
        { value: 'wedding', label: 'Wedding' }, { value: 'birthday', label: 'Birthday' },
        { value: 'graduation', label: 'Graduation' }, { value: 'corporate', label: 'Corporate' },
        { value: 'other', label: 'Other celebration' },
      ] },
      { id: 'guests', type: 'number', label: 'Expected guests', unit: 'guests', required: true, min: 5, max: 2000 },
      { id: 'services_needed', type: 'multi', label: 'What do you need help with?', options: [
        { value: 'venue', label: 'Finding a venue' }, { value: 'decor', label: 'Decoration' },
        { value: 'sound', label: 'Sound & DJ' }, { value: 'photo', label: 'Photography' },
        { value: 'cake', label: 'Cake' }, { value: 'full', label: 'Full package — everything' },
      ] },
      { id: 'budget', type: 'number', label: 'Approximate budget (ETB)', unit: 'ETB', min: 1000, max: 2000000 },
    ],
  },
  {
    id: 'photography',
    categoryId: 'events',
    name: 'Photography',
    nameAm: 'ፎቶግራፊ',
    description: 'Events, portraits, products',
    fromPrice: 2500,
    priceUnit: 'flat',
    supportsUrgency: false,
    questions: [
      { id: 'event_type', type: 'single', label: 'What is the occasion?', required: true, options: [
        { value: 'wedding', label: 'Wedding' }, { value: 'birthday', label: 'Birthday / party' },
        { value: 'graduation', label: 'Graduation' }, { value: 'corporate', label: 'Corporate event' },
        { value: 'product', label: 'Product / food' }, { value: 'portrait', label: 'Portraits' },
      ] },
      { id: 'hours', type: 'number', label: 'Hours needed', unit: 'hours', min: 1, max: 24 },
      { id: 'people', type: 'number', label: 'Approximate people', min: 1, max: 1000 },
      { id: 'style', type: 'multi', label: 'Preferred style', options: [
        { value: 'traditional', label: 'Traditional / posed' }, { value: 'candid', label: 'Candid / documentary' },
        { value: 'outdoor', label: 'Outdoor locations' }, { value: 'studio', label: 'Studio' },
        { value: 'drone', label: 'Drone shots' },
      ] },
      { id: 'budget', type: 'number', label: 'Budget range (ETB)', unit: 'ETB', min: 500, max: 100000 },
      { id: 'notes', type: 'text', label: 'Anything specific you want?', placeholder: 'e.g. Must include family group photos' },
    ],
  },
  {
    id: 'catering',
    categoryId: 'events',
    name: 'Catering',
    nameAm: 'አበሻ/ኩኪን',
    description: 'Food and drink service for events',
    fromPrice: 3500,
    priceUnit: 'flat',
    supportsUrgency: false,
    questions: [
      { id: 'event_type', type: 'single', label: 'Event type', required: true, options: [
        { value: 'wedding', label: 'Wedding' }, { value: 'birthday', label: 'Birthday' },
        { value: 'corporate', label: 'Corporate' }, { value: 'other', label: 'Other' },
      ] },
      { id: 'guests', type: 'number', label: 'Guests', unit: 'guests', required: true, min: 5, max: 2000 },
      { id: 'cuisine', type: 'single', label: 'Cuisine', options: [
        { value: 'traditional', label: 'Traditional Ethiopian' }, { value: 'mixed', label: 'Mixed menu' },
        { value: 'international', label: 'International' },
      ] },
      { id: 'service_style', type: 'multi', label: 'Service style', options: [
        { value: 'buffet', label: 'Buffet' }, { value: 'plated', label: 'Plated' },
        { value: 'live', label: 'Live cooking station' }, { value: 'servers', label: 'Servers / waiters' },
      ] },
    ],
  },
  {
    id: 'tents-rentals',
    categoryId: 'events',
    name: 'Tents & Rentals',
    nameAm: 'ድንኳንና ኪራይ',
    description: 'Tents, chairs, tables, sound',
    fromPrice: 4000,
    priceUnit: 'flat',
    supportsUrgency: false,
    questions: [
      { id: 'guests', type: 'number', label: 'Guests to seat', unit: 'guests', required: true, min: 10, max: 2000 },
      { id: 'items', type: 'multi', label: 'What do you need?', required: true, options: [
        { value: 'tent', label: 'Tent' }, { value: 'chairs', label: 'Chairs' },
        { value: 'tables', label: 'Tables' }, { value: 'stage', label: 'Stage' },
        { value: 'sound', label: 'Sound system' }, { value: 'generator', label: 'Generator' },
      ] },
      { id: 'venue', type: 'text', label: 'Where is the venue?', required: true, placeholder: 'e.g. Home compound in Yeka' },
    ],
  },

  /* ── Beauty & wellness ── */
  {
    id: 'hair-barber',
    categoryId: 'beauty',
    name: 'Hair & Barber',
    nameAm: 'ጸጉር',
    description: 'Mobile haircuts, braids, treatments',
    fromPrice: 250,
    priceUnit: 'visit',
    supportsUrgency: true,
    questions: [
      { id: 'service_needed', type: 'single', label: 'What service?', required: true, options: [
        { value: 'haircut', label: 'Haircut' }, { value: 'braids', label: 'Braids / weaving' },
        { value: 'treatment', label: 'Treatment / coloring' }, { value: 'shave', label: 'Shave / beard trim' },
        { value: 'kids', label: 'Kids haircut' },
      ] },
      { id: 'who', type: 'number', label: 'How many people?', min: 1, max: 10 },
      { id: 'place', type: 'single', label: 'Where?', options: [
        { value: 'home', label: 'At my home' }, { value: 'salon', label: 'At the salon' },
      ] },
    ],
  },
  {
    id: 'makeup-nails',
    categoryId: 'beauty',
    name: 'Makeup & Nails',
    nameAm: 'ሜክአፕና እጥብ',
    description: 'Event makeup and nail care',
    fromPrice: 400,
    priceUnit: 'visit',
    supportsUrgency: true,
    questions: [
      { id: 'occasion', type: 'single', label: 'Occasion', required: true, options: [
        { value: 'wedding', label: 'Wedding' }, { value: 'party', label: 'Party / event' },
        { value: 'photoshoot', label: 'Photo shoot' }, { value: 'regular', label: 'Just because' },
      ] },
      { id: 'services_needed', type: 'multi', label: 'Services needed', required: true, options: [
        { value: 'makeup', label: 'Makeup' }, { value: 'hair', label: 'Hair styling' },
        { value: 'manicure', label: 'Manicure' }, { value: 'pedicure', label: 'Pedicure' },
      ] },
      { id: 'who', type: 'number', label: 'How many people?', min: 1, max: 10 },
    ],
  },
  {
    id: 'massage',
    categoryId: 'beauty',
    name: 'Massage & Spa',
    nameAm: 'ማሳጅ',
    description: 'Home-visit massage therapy',
    fromPrice: 700,
    priceUnit: 'visit',
    supportsUrgency: false,
    questions: [
      { id: 'type', type: 'single', label: 'Massage type', required: true, options: [
        { value: 'swedish', label: 'Swedish / relaxation' }, { value: 'deep', label: 'Deep tissue' },
        { value: 'sports', label: 'Sports recovery' }, { value: 'prenatal', label: 'Prenatal' },
      ] },
      { id: 'duration', type: 'single', label: 'Duration', required: true, options: [
        { value: '60', label: '60 minutes' }, { value: '90', label: '90 minutes' }, { value: '120', label: '120 minutes' },
      ] },
      { id: 'place', type: 'single', label: 'Where?', options: [
        { value: 'home', label: 'At my home' }, { value: 'studio', label: 'At a studio' },
      ] },
    ],
  },

  /* ── Lessons ── */
  {
    id: 'tutoring',
    categoryId: 'lessons',
    name: 'Tutoring',
    nameAm: 'ቲዩተር',
    description: 'Academic tutoring at home or online',
    fromPrice: 200,
    priceUnit: 'hour',
    supportsUrgency: false,
    questions: [
      { id: 'subject', type: 'text', label: 'Which subject(s)?', required: true, placeholder: 'e.g. Maths and Physics' },
      { id: 'level', type: 'single', label: 'Student level', required: true, options: [
        { value: 'primary', label: 'Primary school' }, { value: 'high', label: 'High school' },
        { value: 'university', label: 'University' }, { value: 'adult', label: 'Adult learner' },
      ] },
      { id: 'goal', type: 'single', label: 'What is the goal?', options: [
        { value: 'grades', label: 'Improve grades' }, { value: 'exam', label: 'National exam prep (Grade 8/12)' },
        { value: 'ongoing', label: 'Ongoing support' },
      ] },
      { id: 'mode', type: 'single', label: 'Preferred mode', options: [
        { value: 'home', label: 'Home visits' }, { value: 'online', label: 'Online' }, { value: 'either', label: 'Either' },
      ] },
    ],
  },
  {
    id: 'music-lessons',
    categoryId: 'lessons',
    name: 'Music Lessons',
    nameAm: 'ሙዚቃ ትምህርት',
    description: 'Piano, guitar, krar, vocals',
    fromPrice: 250,
    priceUnit: 'hour',
    supportsUrgency: false,
    questions: [
      { id: 'instrument', type: 'single', label: 'Instrument', required: true, options: [
        { value: 'piano', label: 'Piano / Keyboard' }, { value: 'guitar', label: 'Guitar' },
        { value: 'krar', label: 'Krar / Masinko' }, { value: 'drums', label: 'Drums' },
        { value: 'vocal', label: 'Vocals' },
      ] },
      { id: 'level', type: 'single', label: 'Current level', required: true, options: [
        { value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' },
      ] },
    ],
  },
  {
    id: 'language-lessons',
    categoryId: 'lessons',
    name: 'Language Lessons',
    nameAm: 'የቋንቋ ትምህርት',
    description: 'English, Amharic, French and more',
    fromPrice: 200,
    priceUnit: 'hour',
    supportsUrgency: false,
    questions: [
      { id: 'language', type: 'text', label: 'Which language?', required: true, placeholder: 'e.g. English' },
      { id: 'level', type: 'single', label: 'Level', required: true, options: [
        { value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' },
      ] },
      { id: 'goal', type: 'text', label: 'Your goal', placeholder: 'e.g. Business conversation, IELTS prep' },
    ],
  },

  /* ── Tech ── */
  {
    id: 'computer-repair',
    categoryId: 'tech',
    name: 'Computer Repair',
    nameAm: 'ኮምፒውተር ጥገና',
    description: 'Laptops and desktops, hardware & software',
    fromPrice: 400,
    priceUnit: 'visit',
    supportsUrgency: true,
    questions: [
      { id: 'device', type: 'single', label: 'Device type', required: true, options: [
        { value: 'laptop', label: 'Laptop' }, { value: 'desktop', label: 'Desktop' }, { value: 'printer', label: 'Printer' }, { value: 'other', label: 'Other' },
      ] },
      { id: 'issue', type: 'single', label: 'Main issue', required: true, options: [
        { value: 'wont_start', label: "Won't start" }, { value: 'slow', label: 'Very slow' },
        { value: 'virus', label: 'Virus / malware' }, { value: 'hardware', label: 'Broken screen / keyboard' },
        { value: 'software', label: 'Software / OS problem' },
      ] },
      { id: 'backup', type: 'boolean', label: 'Do you need data backup?' },
      { id: 'details', type: 'text', label: 'More details', placeholder: 'e.g. HP laptop, Windows 11, blue screen on start' },
    ],
  },
  {
    id: 'phone-repair',
    categoryId: 'tech',
    name: 'Phone Repair',
    nameAm: 'ስልክ ጥገና',
    description: 'Screens, batteries, charging ports',
    fromPrice: 500,
    priceUnit: 'flat',
    supportsUrgency: true,
    questions: [
      { id: 'brand', type: 'text', label: 'Phone brand & model', required: true, placeholder: 'e.g. Samsung A54' },
      { id: 'issue', type: 'single', label: 'Issue', required: true, options: [
        { value: 'screen', label: 'Broken screen' }, { value: 'battery', label: 'Battery' },
        { value: 'charging', label: 'Charging port' }, { value: 'water', label: 'Water damage' },
        { value: 'software', label: 'Software problem' },
      ] },
    ],
  },
  {
    id: 'it-network',
    categoryId: 'tech',
    name: 'IT & Network Setup',
    nameAm: 'አይቲና ኔትዎርክ',
    description: 'WiFi, office networks, troubleshooting',
    fromPrice: 600,
    priceUnit: 'visit',
    supportsUrgency: false,
    questions: [
      { id: 'need', type: 'multi', label: 'What do you need?', required: true, options: [
        { value: 'wifi', label: 'WiFi setup / dead zones' }, { value: 'office', label: 'Office network' },
        { value: 'printer', label: 'Shared printer setup' }, { value: 'troubleshoot', label: 'General troubleshooting' },
        { value: 'cctv', label: 'CCTV / cameras' },
      ] },
      { id: 'devices', type: 'number', label: 'Devices to connect', min: 1, max: 200 },
      qProperty(),
    ],
  },

  /* ── Gardening ── */
  {
    id: 'gardening',
    categoryId: 'gardening',
    name: 'Gardening',
    nameAm: 'አትክልት እንክብካቤ',
    description: 'Lawn care, planting, upkeep',
    fromPrice: 300,
    priceUnit: 'visit',
    supportsUrgency: false,
    questions: [
      { id: 'job', type: 'multi', label: 'What needs doing?', required: true, options: [
        { value: 'lawn', label: 'Lawn mowing' }, { value: 'hedge', label: 'Hedge trimming' },
        { value: 'planting', label: 'Planting / new beds' }, { value: 'cleanup', label: 'Garden clean-up' },
        { value: 'watering', label: 'Watering system' },
      ] },
      { id: 'approx_size', type: 'number', label: 'Garden size (m²)', unit: 'm²', min: 5, max: 5000 },
      { id: 'tools', type: 'boolean', label: 'Should the pro bring tools?' },
      qPhotos(),
    ],
  },
  {
    id: 'landscaping',
    categoryId: 'gardening',
    name: 'Landscaping Design',
    nameAm: 'አትክልት ንድፍ',
    description: 'Design and build gardens and outdoor spaces',
    fromPrice: 3000,
    priceUnit: 'flat',
    supportsUrgency: false,
    questions: genericQuestions('e.g. Design a small garden for a new house in Ayat, 120 m²'),
  },

  /* ── Pest control ── */
  {
    id: 'pest-general', categoryId: 'pest-control', name: 'General Pest Control', nameAm: 'አጠቃላይ ተባይ ቁጥጥር',
    description: 'Spraying and treatment for homes & offices', fromPrice: 800, priceUnit: 'visit', supportsUrgency: true,
    questions: [
      { id: 'pest_type', type: 'single', label: 'What kind of pest?', required: true, options: [
        { value: 'cockroach', label: 'Cockroaches' }, { value: 'ants', label: 'Ants' },
        { value: 'fleas', label: 'Fleas' }, { value: 'termites', label: 'Termites / wood damage' },
        { value: 'other', label: 'Something else' },
      ] },
      { id: 'severity', type: 'single', label: 'How bad is it?', required: true, options: [
        { value: 'few', label: 'Seen a few' }, { value: 'lots', label: 'A lot of them' }, { value: 'everywhere', label: 'Serious infestation' },
      ] },
      qProperty(), qEmergency(), qPhotos(),
    ],
  },
  {
    id: 'bed-bugs', categoryId: 'pest-control', name: 'Bed Bug Treatment', nameAm: 'የአልጋ ተባይ ሕክምና',
    description: 'Heat & chemical treatment for beds and rooms', fromPrice: 2000, priceUnit: 'visit', supportsUrgency: true,
    questions: [
      { id: 'rooms', type: 'number', label: 'How many rooms affected?', min: 1, max: 10, required: true },
      { id: 'tried', type: 'boolean', label: 'Have you tried treatment before?' },
      qPhotos(),
    ],
  },
  {
    id: 'rodent-removal', categoryId: 'pest-control', name: 'Rodent Removal', nameAm: 'አይጥ ቁጥጥር',
    description: 'Trapping, proofing and prevention', fromPrice: 900, priceUnit: 'visit', supportsUrgency: true,
    questions: genericQuestions('e.g. Rats in the kitchen ceiling — need them gone and holes sealed'),
  },

  /* ── Auto care ── */
  {
    id: 'auto-mechanic', categoryId: 'auto', name: 'Mobile Mechanic', nameAm: 'ሞባይል ሜካኒክ',
    description: 'Mechanic comes to your car — repair & diagnosis', fromPrice: 700, priceUnit: 'visit', supportsUrgency: true,
    questions: [
      { id: 'issue', type: 'single', label: 'What is wrong with the car?', required: true, options: [
        { value: 'wont_start', label: "Won't start" }, { value: 'brakes', label: 'Brakes' },
        { value: 'engine_noise', label: 'Engine noise / smoking' }, { value: 'overheating', label: 'Overheating' },
        { value: 'service', label: 'Routine service' }, { value: 'other', label: 'Something else' },
      ] },
      { id: 'brand', type: 'text', label: 'Car brand & model', placeholder: 'e.g. Toyota Corolla 2010' },
      { id: 'car_location', type: 'single', label: 'Where is the car?', options: [
        { value: 'home', label: 'At home' }, { value: 'road', label: 'Stuck on the road' }, { value: 'office', label: 'At work' },
      ] },
      qEmergency(), qPhotos(),
    ],
  },
  {
    id: 'auto-battery', categoryId: 'auto', name: 'Battery & Electrical', nameAm: 'ባትሪ እና ኤሌክትሪክ',
    description: 'Battery replacement, alternator, starter', fromPrice: 600, priceUnit: 'visit', supportsUrgency: true,
    questions: [
      { id: 'issue', type: 'single', label: 'What do you need?', required: true, options: [
        { value: 'jump', label: 'Jump start / battery check' }, { value: 'replace', label: 'Replace battery' },
        { value: 'charging', label: 'Charging problem' }, { value: 'lights', label: 'Lights / electrical fault' },
      ] },
      { id: 'brand', type: 'text', label: 'Car brand & model', placeholder: 'e.g. Suzuki Vitara' },
    ],
  },
  {
    id: 'auto-detailing', categoryId: 'auto', name: 'Car Wash & Detailing', nameAm: 'የመኪና እንክብካቤ',
    description: 'Mobile wash, interior cleaning, polishing', fromPrice: 500, priceUnit: 'visit', supportsUrgency: false,
    questions: [
      { id: 'package', type: 'single', label: 'What package?', required: true, options: [
        { value: 'wash', label: 'Outside wash' }, { value: 'full', label: 'Full inside + outside' },
        { value: 'detail', label: 'Deep detail + polish' }, { value: 'engine', label: 'Engine wash' },
      ] },
      { id: 'where', type: 'single', label: 'Where?', options: [
        { value: 'home', label: 'Come to my place' }, { value: 'shop', label: "I'll come to the shop" },
      ] },
    ],
  },
  {
    id: 'roadside', categoryId: 'auto', name: 'Roadside Assistance', nameAm: 'አስቸኳይ የመንገድ እርዳታ',
    description: 'Tire change, fuel, tow, jump start — fast', fromPrice: 400, priceUnit: 'visit', supportsUrgency: true,
    questions: [
      { id: 'need', type: 'single', label: 'What do you need?', required: true, options: [
        { value: 'tire', label: 'Flat tire change' }, { value: 'fuel', label: 'Out of fuel' },
        { value: 'jump', label: 'Jump start' }, { value: 'tow', label: 'Towing' }, { value: 'locked', label: 'Locked out' },
      ] },
      { id: 'location', type: 'text', label: 'Where are you stuck?', required: true, placeholder: 'e.g. Ring road near Megenagna' },
    ],
  },

  /* ── Tailoring & crafts ── */
  {
    id: 'alterations', categoryId: 'tailoring', name: 'Alterations & Repairs', nameAm: 'ልብስ ማስተካከል',
    description: 'Hemming, resizing, zippers, mending', fromPrice: 150, priceUnit: 'flat', supportsUrgency: true,
    questions: [
      { id: 'items', type: 'multi', label: 'What needs fixing?', required: true, options: [
        { value: 'hem', label: 'Hem / shorten' }, { value: 'resize', label: 'Take in / let out' },
        { value: 'zipper', label: 'Zipper' }, { value: 'tear', label: 'Tear / mending' }, { value: 'button', label: 'Buttons' },
      ] },
      { id: 'count', type: 'number', label: 'How many items?', min: 1, max: 50 },
      { id: 'deadline', type: 'single', label: 'When do you need it?', options: [
        { value: 'asap', label: 'As soon as possible' }, { value: 'week', label: 'Within a week' }, { value: 'flexible', label: 'Flexible' },
      ] },
    ],
  },
  {
    id: 'traditional-wear', categoryId: 'tailoring', name: 'Traditional Wear (Habesha Kemis)', nameAm: 'ሀበሻ ልብስ',
    description: 'Custom habesha kemis, shirts, netela', fromPrice: 2500, priceUnit: 'flat', supportsUrgency: false,
    questions: [
      { id: 'garment', type: 'single', label: 'What are we making?', required: true, options: [
        { value: 'kemis', label: 'Habesha kemis (dress)' }, { value: 'shirt', label: 'Men\'s traditional shirt' },
        { value: 'netela', label: 'Netela / shawl' }, { value: 'set', label: 'Full outfit set' },
      ] },
      { id: 'occasion', type: 'single', label: 'Occasion', options: [
        { value: 'wedding', label: 'Wedding' }, { value: 'holiday', label: 'Holiday (Timket/Meskel)' }, { value: 'daily', label: 'Everyday' },
      ] },
      { id: 'fabric', type: 'single', label: 'Who provides the fabric?', options: [
        { value: 'i_have', label: 'I have fabric' }, { value: 'tailor', label: 'Tailor should provide' },
      ] },
      { id: 'tilet', type: 'boolean', label: 'Include tilet (border) work?' },
      qPhotos(),
    ],
  },
  {
    id: 'embroidery', categoryId: 'tailoring', name: 'Embroidery & Custom Work', nameAm: 'የእጥፍ ስራ',
    description: 'Custom embroidery, logos on fabric', fromPrice: 400, priceUnit: 'flat', supportsUrgency: false,
    questions: genericQuestions('e.g. Embroider a small logo on 10 uniforms'),
  },

  /* ── Pets ── */
  {
    id: 'dog-walking', categoryId: 'pets', name: 'Dog Walking', nameAm: 'ውሻ ማሳወቅ',
    description: 'Regular or one-off walks', fromPrice: 150, priceUnit: 'hour', supportsUrgency: false,
    questions: [
      { id: 'dogs', type: 'number', label: 'How many dogs?', min: 1, max: 5, required: true },
      { id: 'size', type: 'single', label: 'Size', required: true, options: [
        { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large / strong' },
      ] },
      { id: 'frequency', type: 'single', label: 'How often?', options: [
        { value: 'once', label: 'One-time' }, { value: 'weekly', label: 'A few times a week' }, { value: 'daily', label: 'Daily' },
      ] },
    ],
  },
  {
    id: 'pet-grooming', categoryId: 'pets', name: 'Pet Grooming', nameAm: 'የእንስሳት እንክብካቤ',
    description: 'Wash, trim, nails — at home or clinic', fromPrice: 400, priceUnit: 'visit', supportsUrgency: false,
    questions: [
      { id: 'pet', type: 'single', label: 'What pet?', required: true, options: [
        { value: 'dog', label: 'Dog' }, { value: 'cat', label: 'Cat' }, { value: 'other', label: 'Other' },
      ] },
      { id: 'size', type: 'single', label: 'Size', options: [{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }] },
      { id: 'services_needed', type: 'multi', label: 'What is included?', options: [
        { value: 'wash', label: 'Wash' }, { value: 'trim', label: 'Hair trim' }, { value: 'nails', label: 'Nails' },
      ] },
    ],
  },
  {
    id: 'pet-sitting', categoryId: 'pets', name: 'Pet Sitting & Boarding', nameAm: 'የእንስሳት እንክብካቤ',
    description: 'Care while you travel', fromPrice: 300, priceUnit: 'day', supportsUrgency: false,
    questions: genericQuestions('e.g. Watch my 2 cats for 5 days while I travel — feeding + litter'),
  },

  /* ── Security & locks ── */
  {
    id: 'cctv-install', categoryId: 'security', name: 'CCTV & Alarm Installation', nameAm: 'ካሜራ እና ማንቂያ ተከላ',
    description: 'Cameras, alarms, smart doorbells', fromPrice: 3500, priceUnit: 'flat', supportsUrgency: false,
    questions: [
      { id: 'need', type: 'multi', label: 'What do you need?', required: true, options: [
        { value: 'cctv', label: 'CCTV cameras' }, { value: 'alarm', label: 'Alarm system' },
        { value: 'doorbell', label: 'Video doorbell' }, { value: 'repair', label: 'Fix existing system' },
      ] },
      { id: 'cameras', type: 'number', label: 'How many cameras?', unit: 'cameras', min: 1, max: 32 },
      qProperty(),
      { id: 'monitoring', type: 'single', label: 'Phone viewing?', options: [
        { value: 'yes', label: 'Yes — view on my phone' }, { value: 'no', label: 'Recording only' },
      ] },
    ],
  },
  {
    id: 'locksmith', categoryId: 'security', name: 'Locksmith', nameAm: 'ቁልፍ መቁረጥ',
    description: 'Locked out, lock change, key cutting', fromPrice: 300, priceUnit: 'visit', supportsUrgency: true,
    questions: [
      { id: 'need', type: 'single', label: 'What do you need?', required: true, options: [
        { value: 'locked_out', label: 'Locked out!' }, { value: 'change', label: 'Change locks' },
        { value: 'copy', label: 'Make spare keys' }, { value: 'repair', label: 'Repair a lock' },
      ] },
      { id: 'lock_type', type: 'single', label: 'Lock type', options: [
        { value: 'door', label: 'House / office door' }, { value: 'gate', label: 'Gate' }, { value: 'safe', label: 'Safe' }, { value: 'car', label: 'Car' },
      ] },
    ],
  },

  /* ── Business & admin ── */
  {
    id: 'translation', categoryId: 'business', name: 'Translation (EN ⇄ AM)', nameAm: 'ትርጉም',
    description: 'Documents, meetings, websites — English/Amharic', fromPrice: 250, priceUnit: 'hour', supportsUrgency: true,
    questions: [
      { id: 'work', type: 'single', label: 'What needs translating?', required: true, options: [
        { value: 'document', label: 'A document' }, { value: 'meeting', label: 'Interpret at a meeting' },
        { value: 'website', label: 'Website / app content' }, { value: 'certificate', label: 'Certificate / legal document' },
      ] },
      { id: 'pages', type: 'number', label: 'How many pages (if a document)?', min: 1, max: 500 },
      { id: 'certified', type: 'boolean', label: 'Do you need a certified/stamped translation?' },
      { id: 'deadline', type: 'single', label: 'Deadline?', options: [
        { value: 'asap', label: 'ASAP' }, { value: 'days', label: 'A few days' }, { value: 'flexible', label: 'Flexible' },
      ] },
    ],
  },
  {
    id: 'bookkeeping', categoryId: 'business', name: 'Bookkeeping & Accounting', nameAm: 'የሂሳብ አያያዝ',
    description: 'For small businesses — records, tax, payroll', fromPrice: 1500, priceUnit: 'month', supportsUrgency: false,
    questions: [
      { id: 'need', type: 'multi', label: 'What do you need help with?', required: true, options: [
        { value: 'records', label: 'Daily records' }, { value: 'tax', label: 'Tax filing' },
        { value: 'payroll', label: 'Payroll' }, { value: 'setup', label: 'System setup (software)' },
      ] },
      { id: 'size', type: 'single', label: 'Business size', options: [
        { value: 'small', label: 'Just me / a few people' }, { value: 'medium', label: '5–20 employees' }, { value: 'large', label: '20+ employees' },
      ] },
    ],
  },
  {
    id: 'design-printing', categoryId: 'business', name: 'Graphic Design & Printing', nameAm: 'ንድፍ እና ህትመት',
    description: 'Logos, banners, cards, wedding invitations', fromPrice: 500, priceUnit: 'flat', supportsUrgency: false,
    questions: genericQuestions('e.g. Design a logo + business cards for my new café in Bole'),
  },
  {
    id: 'cv-writing', categoryId: 'business', name: 'CV & Application Writing', nameAm: 'ሲቪ ጽሑፍ',
    description: 'CV, cover letters, application forms', fromPrice: 400, priceUnit: 'flat', supportsUrgency: false,
    questions: [
      { id: 'need', type: 'single', label: 'What do you need?', required: true, options: [
        { value: 'cv', label: 'Write / redo my CV' }, { value: 'cover', label: 'Cover letter' },
        { value: 'both', label: 'CV + cover letter' }, { value: 'form', label: 'Fill an application' },
      ] },
      { id: 'field', type: 'text', label: 'What kind of job are you applying for?', placeholder: 'e.g. NGO program officer' },
    ],
  },

  /* ── Wellness ── */
  {
    id: 'personal-training', categoryId: 'wellness', name: 'Personal Training', nameAm: 'የግል ስፖርት ትምህርት',
    description: '1-on-1 fitness training, at home or gym', fromPrice: 350, priceUnit: 'hour', supportsUrgency: false,
    questions: [
      { id: 'goal', type: 'single', label: 'What is your goal?', required: true, options: [
        { value: 'lose', label: 'Lose weight' }, { value: 'gain', label: 'Build muscle' },
        { value: 'fitness', label: 'General fitness' }, { value: 'sport', label: 'Train for a sport' },
      ] },
      { id: 'place', type: 'single', label: 'Where?', options: [
        { value: 'home', label: 'At my home' }, { value: 'gym', label: 'At a gym' }, { value: 'outdoor', label: 'Outdoors' },
      ] },
      { id: 'frequency', type: 'single', label: 'How often?', options: [
        { value: 'once', label: 'One session' }, { value: 'weekly', label: '2–3× a week' }, { value: 'daily', label: 'Daily' },
      ] },
    ],
  },
  {
    id: 'yoga-pilates', categoryId: 'wellness', name: 'Yoga & Pilates', nameAm: 'ዮጋ እና ፒላጤስ',
    description: 'Private or small-group sessions', fromPrice: 300, priceUnit: 'hour', supportsUrgency: false,
    questions: genericQuestions('e.g. Private yoga sessions at home twice a week, beginner level'),
  },
  {
    id: 'nutrition', categoryId: 'wellness', name: 'Nutrition & Diet', nameAm: 'ስነ ምግብ',
    description: 'Meal plans and dietary guidance', fromPrice: 500, priceUnit: 'flat', supportsUrgency: false,
    questions: genericQuestions('e.g. I need a meal plan for managing weight and blood sugar'),
  },

  /* ── Driving ── */
  {
    id: 'driving-lessons', categoryId: 'driving', name: 'Car Driving Lessons', nameAm: 'የመኪና እንቅስቃሴ ትምህርት',
    description: 'Learn to drive with a patient instructor', fromPrice: 600, priceUnit: 'hour', supportsUrgency: false,
    questions: [
      { id: 'level', type: 'single', label: 'Your experience?', required: true, options: [
        { value: 'never', label: 'Never driven' }, { value: 'some', label: 'A little practice' }, { value: 'refresher', label: 'Licensed — need a refresher' },
      ] },
      { id: 'transmission', type: 'single', label: 'Manual or automatic?', options: [
        { value: 'manual', label: 'Manual' }, { value: 'auto', label: 'Automatic' }, { value: 'either', label: 'Either' },
      ] },
      { id: 'package', type: 'single', label: 'How many lessons?', options: [
        { value: 'one', label: 'A single lesson' }, { value: 'package', label: 'A package (10+)' }, { value: 'test', label: 'Until my test' },
      ] },
    ],
  },
  {
    id: 'license-prep', categoryId: 'driving', name: 'License Test Prep', nameAm: 'የፈቃድ ፈተና ዝግጅት',
    description: 'Practice runs + paperwork guidance', fromPrice: 1500, priceUnit: 'flat', supportsUrgency: false,
    questions: genericQuestions('e.g. I have my test next month at Kality — need practice sessions'),
  },

  /* ── Laundry ── */
  {
    id: 'laundry-wash', categoryId: 'laundry', name: 'Wash & Fold', nameAm: 'ማጠብ እና ማዥረጥ',
    description: 'Pickup, wash, fold, deliver', fromPrice: 300, priceUnit: 'bag', supportsUrgency: false,
    questions: [
      { id: 'amount', type: 'single', label: 'Roughly how much laundry?', required: true, options: [
        { value: 'small', label: 'A small bag' }, { value: 'medium', label: 'A medium bag' }, { value: 'large', label: 'A large bag / basket' },
      ] },
      { id: 'frequency', type: 'single', label: 'How often?', options: [
        { value: 'once', label: 'One-time' }, { value: 'weekly', label: 'Every week' }, { value: 'biweekly', label: 'Every 2 weeks' },
      ] },
    ],
  },
  {
    id: 'dry-cleaning', categoryId: 'laundry', name: 'Dry Cleaning Pickup', nameAm: 'ደረቅ ጽዳት',
    description: 'Delicate items, suits, traditional wear', fromPrice: 500, priceUnit: 'flat', supportsUrgency: false,
    questions: genericQuestions('e.g. 2 suits and 3 habesha kemis — need them before Saturday'),
  },
  {
    id: 'ironing', categoryId: 'laundry', name: 'Ironing Service', nameAm: 'ማዥረጥ',
    description: 'Pressed and folded, with or without wash', fromPrice: 200, priceUnit: 'bag', supportsUrgency: true,
    questions: genericQuestions('e.g. Iron 2 baskets of clothes before Monday'),
  },
];

export const POPULAR_SERVICE_IDS = [
  'house-cleaning',
  'plumbing-general',
  'electrical-repair',
  'moving-help',
  'photography',
  'tutoring',
];

const serviceMap = new Map(SERVICES.map((s) => [s.id, s]));
const categoryMap = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getService(id: string): ServiceDefinition | undefined {
  return serviceMap.get(id);
}

export function getCategory(id: string): Category | undefined {
  return categoryMap.get(id);
}

/** categoryId for any service id. */
export function categoryOfService(serviceId: string): string | undefined {
  return getService(serviceId)?.categoryId;
}

export function servicesOfCategory(categoryId: string): ServiceDefinition[] {
  return SERVICES.filter((s) => s.categoryId === categoryId);
}

export function allServiceNames(): { id: string; name: string; categoryId: string }[] {
  return SERVICES.map((s) => ({ id: s.id, name: s.name, categoryId: s.categoryId }));
}
