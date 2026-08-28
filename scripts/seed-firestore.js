#!/usr/bin/env node
/**
 * Seed Firestore with the Betegna taxonomy (categories + services) and —
 * optionally — starter professional profiles.
 *
 * Usage:
 *   1. Firebase console → Project settings → Service accounts →
 *      "Generate new private key" → save as ./serviceAccount.json (NEVER commit)
 *   2. GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json \
 *      PROJECT_ID=<your-project-id> node scripts/seed-firestore.js [--with-pros]
 *
 * The taxonomy documents mirror src/config/seed/taxonomy.ts 1:1, so admins can
 * later edit categories/services in Firestore without an app release.
 */
const fs = require('fs');
const path = require('path');

let admin;
try {
  admin = require('firebase-admin');
} catch {
  console.error('Missing firebase-admin. Install it first:  npm i -D firebase-admin');
  process.exit(1);
}

const PROJECT_ID = process.env.PROJECT_ID;
if (!PROJECT_ID) {
  console.error('Set PROJECT_ID=<your-project-id>');
  process.exit(1);
}

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccount.json';
if (!fs.existsSync(keyPath)) {
  console.error(`Service account key not found at ${keyPath}`);
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(require(path.resolve(keyPath))) });
const db = admin.firestore();

const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'taxonomy-seed.json'), 'utf8'));

async function seedTaxonomy() {
  let batch = db.batch();
  let ops = 0;
  for (const c of seed.categories) {
    batch.set(db.collection('categories').doc(c.id), { ...c, updatedAt: Date.now() }, { merge: true });
    ops++;
  }
  for (const s of seed.services) {
    batch.set(db.collection('services').doc(s.id), { ...s, updatedAt: Date.now() }, { merge: true });
    ops++;
  }
  await batch.commit();
  console.log(`✔ taxonomy: ${seed.categories.length} categories, ${seed.services.length} services`);
  void ops;
}

/** Optional: create professionals from the demo seed as real (unverified) profiles. */
async function seedPros() {
  const { DEMO_PROFESSIONALS } = require('../src/config/seed/professionals.ts');
  const batch = db.batch();
  DEMO_PROFESSIONALS.forEach((p) => {
    const { uid, ...rest } = p;
    batch.set(db.collection('professionals').doc(uid), { ...rest, uid, seedPro: true, updatedAt: Date.now() }, { merge: true });
  });
  await batch.commit();
  console.log(`✔ professionals: ${DEMO_PROFESSIONALS.length} seeded (flagged seedPro)`);
}

(async () => {
  await seedTaxonomy();
  if (process.argv.includes('--with-pros')) {
    try {
      await seedPros();
    } catch (e) {
      console.warn('pros seeding skipped (needs the TS import path):', e.message);
    }
  }
  console.log('Done.');
  process.exit(0);
})();
