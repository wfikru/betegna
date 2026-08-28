/** Emits taxonomy-seed.json (categories + services) for the Firestore seeder. */
import { writeFileSync } from 'fs';
import { CATEGORIES, SERVICES } from '../src/config/seed/taxonomy';

writeFileSync(
  `${__dirname}/../scripts/taxonomy-seed.json`,
  JSON.stringify({ categories: CATEGORIES, services: SERVICES }, null, 2),
);
console.log(`wrote ${CATEGORIES.length} categories, ${SERVICES.length} services`);
