/**
 * Rule-based natural-language intent parser (AI-ready seam).
 * Converts "My bathroom faucet is leaking and I need someone tomorrow"
 * into a structured ParsedIntent. Swap with an LLM-backed parser later —
 * the interface (parseIntent) stays identical.
 */
import type { Frequency, ParsedIntent, Urgency } from '../../models/types';
import { CATEGORIES, SERVICES, getService } from '../../config/seed/taxonomy';
import { SUBCITIES } from '../../constants/geo';

interface SynonymEntry {
  serviceId?: string;
  categoryId?: string;
  words: string[];
}

const SYNONYMS: SynonymEntry[] = [
  { serviceId: 'house-cleaning', words: ['clean', 'cleaning', 'cleaner', 'maid', 'housekeeper', 'ጽዳት', 'ማጽዳት', 'እንስጋቢ'] },
  { serviceId: 'deep-cleaning', words: ['deep clean', 'deep cleaning', 'ጥልቅ ጽዳት'] },
  { serviceId: 'move-out-cleaning', words: ['move out', 'move-out', 'moving out cleaning', 'handover cleaning'] },
  { serviceId: 'office-cleaning', words: ['office cleaning', 'የቢሮ ጽዳት'] },
  { serviceId: 'plumbing-general', words: ['plumber', 'plumbing', 'pipe', 'ቧንቧ', 'ባሮሽታ', 'pipe leak'] },
  { serviceId: 'emergency-plumbing', words: ['emergency plumber', 'burst pipe', 'pipe burst', 'flood'] },
  { serviceId: 'drain-cleaning', words: ['drain', 'clog', 'clogged', 'blocked drain', 'sewer'] },
  { serviceId: 'faucet-leak', words: ['faucet', 'tap', 'leak', 'leaking', 'dripping'] },
  { serviceId: 'water-heater', words: ['water heater', 'boiler', 'no hot water', 'የውሃ ሙቀት'] },
  { serviceId: 'electrical-repair', words: ['electrician', 'electrical', 'socket', 'outlet', 'switch', 'breaker', 'ኤሌክትሪክ', 'መብራት'] },
  { serviceId: 'lighting', words: ['light', 'lighting', 'chandelier', 'lamp install'] },
  { serviceId: 'wiring', words: ['wiring', 'rewire', 'ሽቦ'] },
  { serviceId: 'panel-upgrade', words: ['panel', 'meter', 'fuse box'] },
  { serviceId: 'furniture-assembly', words: ['assemble', 'assembly', 'ikea', 'put together furniture'] },
  { serviceId: 'carpentry', words: ['carpenter', 'carpentry', 'woodwork', 'custom furniture', 'wardrobe build', 'እንጨት'] },
  { serviceId: 'painting', words: ['paint', 'painting', 'painter', 'repaint', 'ቀለም'] },
  { serviceId: 'appliance-repair', words: ['fridge', 'refrigerator', 'freezer', 'washing machine', 'washer', 'stove', 'oven', 'microwave', 'appliance'] },
  { serviceId: 'hvac', words: ['ac', 'a/c', 'air conditioner', 'aircon', 'hvac', 'cooling', 'not cooling'] },
  { serviceId: 'moving-help', words: ['movers', 'moving', 'move house', 'relocate', 'relocation', 'ማጓጓዝ', 'ማዛወር'] },
  { serviceId: 'packing', words: ['packing', 'pack boxes'] },
  { serviceId: 'delivery', words: ['deliver', 'delivery', 'courier', 'pickup and deliver', 'መላኪያ', 'ላክልኝ'] },
  { serviceId: 'event-planning', words: ['event planner', 'plan my wedding', 'party planner', 'event planning', 'ዝግጅት'] },
  { serviceId: 'photography', words: ['photographer', 'photography', 'photo shoot', 'photoshoot', 'wedding photos', 'ፎቶ', 'ፎቶግራፍ'] },
  { serviceId: 'catering', words: ['catering', 'caterer', 'food for event', 'አበሻ', 'ምግብ አብራት'] },
  { serviceId: 'tents-rentals', words: ['tent', 'tents', 'chairs rental', 'stage rental', 'ድንኳን'] },
  { serviceId: 'hair-barber', words: ['haircut', 'barber', 'braids', 'hairdresser', 'salon', 'ጸጉር', 'ግርድራድ'] },
  { serviceId: 'makeup-nails', words: ['makeup', 'make-up', 'nails', 'manicure', 'pedicure', 'ሜክአፕ'] },
  { serviceId: 'massage', words: ['massage', 'spa', 'ማሳጅ'] },
  { serviceId: 'tutoring', words: ['tutor', 'tutoring', 'teacher for', 'maths help', 'math help', 'ቲዩተር', 'ትምህርት አስተርህ'] },
  { serviceId: 'music-lessons', words: ['guitar lessons', 'piano lessons', 'music teacher', 'ሙዚቃ'] },
  { serviceId: 'language-lessons', words: ['english lessons', 'language teacher', 'amharic lessons', 'french lessons'] },
  { serviceId: 'computer-repair', words: ['laptop', 'computer', 'pc repair', 'macbook', 'ኮምፒውተር'] },
  { serviceId: 'phone-repair', words: ['phone screen', 'phone repair', 'iphone', 'samsung repair', 'ስልክ ጥገና'] },
  { serviceId: 'it-network', words: ['wifi', 'wi-fi', 'internet setup', 'network', 'router', 'cctv'] },
  { serviceId: 'gardening', words: ['gardener', 'gardening', 'garden', 'lawn', 'hedge', 'አትክልት', 'ጎበዝ'] },
  { serviceId: 'landscaping', words: ['landscaping', 'landscape design', 'garden design'] },
  { serviceId: 'pest-general', words: ['pest', 'pest control', 'insect', 'cockroach', 'roach', 'ant', 'flea', 'ተባይ', 'አንበጣ'] },
  { serviceId: 'bed-bugs', words: ['bed bug', 'bedbug', 'bed bugs', 'የአልጋ ተባይ'] },
  { serviceId: 'rodent-removal', words: ['rat', 'rats', 'mouse', 'mice', 'rodent', 'አይጥ'] },
  { serviceId: 'auto-mechanic', words: ['mechanic', 'car repair', 'car problem', 'car service', 'car wont start', "car won't start", 'engine', 'ሜካንክ', 'የመኪና ጥገና', 'መኪና አልሰራም'] },
  { serviceId: 'auto-battery', words: ['car battery', 'battery', 'alternator', 'jump start', 'ባትሪ'] },
  { serviceId: 'auto-detailing', words: ['car wash', 'car detailing', 'wash my car', 'የመኪና እንክብካቤ', 'መኪና ማጠብ'] },
  { serviceId: 'roadside', words: ['roadside', 'flat tire', 'puncture', 'tow', 'towing', 'ran out of fuel', 'ተሰብሯል', 'ተርሚና'] },
  { serviceId: 'alterations', words: ['tailor', 'alteration', 'alterations', 'hem', 'sewing', 'mend clothes', 'zipper repair', 'ሻምበሎ', 'ልብስ ማስተካከል'] },
  { serviceId: 'traditional-wear', words: ['habesha kemis', 'kemis', 'traditional dress', 'traditional clothing', 'netela', 'ሀበሻ ልብስ', 'ሸማ', 'ነጠላ', 'ቀሚስ'] },
  { serviceId: 'embroidery', words: ['embroidery', 'tilet', 'ጥምጥም', 'እጥፍ'] },
  { serviceId: 'dog-walking', words: ['dog walk', 'dog walking', 'walk my dog', 'ውሻ ማሳወቅ'] },
  { serviceId: 'pet-grooming', words: ['dog grooming', 'pet grooming', 'grooming', 'pet wash', 'nail trim dog', 'የእንስሳት እንክብካቤ', 'ውሻ ማጠብ'] },
  { serviceId: 'pet-sitting', words: ['pet sitting', 'pet boarding', 'watch my pet', 'watch my dog', 'cat sit', 'እንስሳት እንክብካቤ'] },
  { serviceId: 'cctv-install', words: ['cctv', 'security camera', 'camera install', 'surveillance', 'alarm system', 'video doorbell', 'ካሜራ', 'የደህንነት ካሜራ'] },
  { serviceId: 'locksmith', words: ['locksmith', 'locked out', 'lock change', 'key copy', 'spare key', 'ቁልፍ', 'ቁልፍ መቁረጥ'] },
  { serviceId: 'translation', words: ['translation', 'translate', 'translator', 'interpret', 'interpreter', 'amharic translation', 'ትርጉም', 'ተርጓሚ'] },
  { serviceId: 'bookkeeping', words: ['accountant', 'accounting', 'bookkeeping', 'book keeper', 'tax filing', 'payroll', 'የሂሳብ አያያዝ', 'ላፒ'] },
  { serviceId: 'design-printing', words: ['logo design', 'graphic design', 'banner design', 'business card', 'wedding invitation', 'printing'] },
  { serviceId: 'cv-writing', words: ['cv', 'resume', 'cover letter', 'job application', 'ሲቪ'] },
  { serviceId: 'personal-training', words: ['personal trainer', 'personal training', 'fitness trainer', 'gym trainer', 'build muscle', 'lose weight', 'ጂም', 'ኮች'] },
  { serviceId: 'yoga-pilates', words: ['yoga', 'pilates', 'ዮጋ'] },
  { serviceId: 'nutrition', words: ['nutritionist', 'diet plan', 'meal plan', 'ስነ ምግብ'] },
  { serviceId: 'driving-lessons', words: ['driving lesson', 'driving school', 'learn to drive', 'driving instructor', 'ድራይቭንግ', 'መኪና ትምህርት', 'መኪና መንዳት ትምህርት'] },
  { serviceId: 'license-prep', words: ['driving test', 'driving license', 'driver license', 'የመኪና ፈቃድ'] },
  { serviceId: 'laundry-wash', words: ['laundry', 'wash clothes', 'wash and fold', 'ልብስ ማጠብ', 'ማጠብ'] },
  { serviceId: 'dry-cleaning', words: ['dry clean', 'dry cleaning', 'ደረቅ ጽዳት'] },
  { serviceId: 'ironing', words: ['ironing', 'iron clothes', 'pressing', 'ማዥረጥ'] },
];

const LANDMARK_TO_SUBCITY: Record<string, string> = {
  kazanchis: 'Kirkos', 'mexico': 'Kirkos', gotera: 'Nifas Silk', 'sar bet': 'Kirkos',
  piassa: 'Arada', arada: 'Arada', 'temonye': 'Gullele', 'shiro meda': 'Gullele',
  cmc: 'Yeka', ayat: 'Yeka', megenagna: 'Yeka', 'gerji': 'Bole', summit: 'Bole',
  lebu: 'Nifas Silk', 'makanisa': 'Nifas Silk', 'keranyo': 'Kolfe', 'ayer tena': 'Kolfe',
  'kality': 'Akaki', akaki: 'Akaki', 'saris': 'Nifas Silk', 'haya hulet': 'Yeka', 'lambert': 'Bole',
};

const URGENCY_RULES: { words: string[]; urgency: Urgency }[] = [
  { words: ['emergency', 'urgent', 'urgently', 'asap', 'right now', 'immediately', 'አስቸኳይ'], urgency: 'emergency' },
  { words: ['today', 'tonight', 'this morning', 'this afternoon', 'ዛሬ'], urgency: 'today' },
  { words: ['tomorrow', 'ነገ'], urgency: 'tomorrow' },
  { words: ['this week', 'weekend', 'በዚህ ሳምንት'], urgency: 'this_week' },
];

const FREQUENCY_RULES: { words: string[]; frequency: Frequency }[] = [
  { words: ['every two weeks', 'biweekly', 'bi-weekly', 'fortnightly'], frequency: 'biweekly' },
  { words: ['every week', 'weekly', 'each week', 'በየሳምንቱ'], frequency: 'weekly' },
  { words: ['every month', 'monthly', 'each month', 'በየወሩ'], frequency: 'monthly' },
];

const STOPWORDS = new Set([
  'i', 'need', 'a', 'an', 'the', 'for', 'in', 'my', 'me', 'is', 'are', 'to', 'and', 'someone',
  'please', 'can', 'you', 'find', 'get', 'want', 'with', 'on', 'at', 'of', 'it', 'some', 'help',
  'እንደምን', 'እፈልጋለሁ', 'በ', 'ለ', 'እና', 'የ',
]);

export function parseIntent(text: string): ParsedIntent {
  const input = text.toLowerCase().trim();
  const intent: ParsedIntent = { keywords: [], confidence: 0 };

  // 1) Service / category from synonyms (longest match wins)
  let best: { entry: SynonymEntry; len: number } | null = null;
  for (const entry of SYNONYMS) {
    for (const w of entry.words) {
      if (input.includes(w) && (!best || w.length > best.len)) best = { entry, len: w.length };
    }
  }
  if (best) {
    const svc = best.entry.serviceId ? getService(best.entry.serviceId) : undefined;
    if (svc) {
      intent.serviceId = svc.id;
      intent.categoryId = svc.categoryId;
      intent.confidence = 0.9;
    } else if (best.entry.categoryId) {
      intent.categoryId = best.entry.categoryId;
      intent.confidence = 0.6;
    }
  } else {
    // fall back to direct service/category name match
    const svc = SERVICES.find((s) => input.includes(s.name.toLowerCase()));
    if (svc) {
      intent.serviceId = svc.id;
      intent.categoryId = svc.categoryId;
      intent.confidence = 0.85;
    } else {
      const cat = CATEGORIES.find((c) => input.includes(c.name.toLowerCase()));
      if (cat) {
        intent.categoryId = cat.id;
        intent.confidence = 0.55;
      }
    }
  }

  // 2) Urgency
  for (const rule of URGENCY_RULES) {
    if (rule.words.some((w) => input.includes(w))) {
      intent.urgency = rule.urgency;
      break;
    }
  }

  // 3) Frequency
  for (const rule of FREQUENCY_RULES) {
    if (rule.words.some((w) => input.includes(w))) {
      intent.frequency = rule.frequency;
      break;
    }
  }

  // 4) Location: sub-city names then landmarks
  for (const s of SUBCITIES) {
    if (input.includes(s.name.toLowerCase())) {
      intent.locationHint = s.name;
      break;
    }
  }
  if (!intent.locationHint) {
    for (const [landmark, subcity] of Object.entries(LANDMARK_TO_SUBCITY)) {
      if (input.includes(landmark)) {
        intent.locationHint = subcity;
        break;
      }
    }
  }

  // 5) Keywords (for search & display)
  intent.keywords = input
    .replace(/[.,!?;:"'()]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w))
    .slice(0, 8);

  if (intent.urgency === 'today' || intent.urgency === 'tomorrow') intent.dateHint = intent.urgency;
  return intent;
}

/** Suggest a full search phrase set for the given query (used by search screen). */
export function searchServices(query: string): { id: string; name: string; categoryId: string }[] {
  const intent = parseIntent(query);
  if (intent.serviceId) {
    const svc = getService(intent.serviceId);
    if (svc) return [{ id: svc.id, name: svc.name, categoryId: svc.categoryId }];
  }
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return SERVICES.filter(
    (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q),
  ).map((s) => ({ id: s.id, name: s.name, categoryId: s.categoryId }));
}
