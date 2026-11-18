/**
 * MongoDB persistence for the Central Compliance Database (CCD).
 *
 * The CCD store keeps working on in-memory arrays. This module:
 *   - loads every array from MongoDB before a request is handled (so all
 *     server instances, including Vercel serverless ones, see the same data),
 *   - after the request, diffs the arrays against what was loaded and writes
 *     only the inserted / changed / deleted documents back.
 *
 * Each array maps to one collection; a document's `_id` is the entity `id`
 * and `_pos` keeps the array order (newest-first lists use unshift).
 */

import { MongoClient, Db, AnyBulkWriteOperation } from 'mongodb';

// Store property name -> MongoDB collection name
export const COLLECTIONS = {
  organisations: 'organisations',
  entitlements: 'tool_entitlements',
  users: 'users',
  memberships: 'memberships',
  regulatoryRules: 'regulatory_rules',
  deadlineOverrides: 'deadline_overrides',
  purposes: 'processing_purposes',
  principals: 'data_principals',
  assets: 'assets',
  legacyDataItems: 'legacy_data_items',
  ropaRecords: 'ropa_records',
  dataFlows: 'data_flows',
  vendors: 'vendors',
  notices: 'privacy_notices',
  consentRecords: 'consent_records',
  parentalVerifications: 'parental_verifications',
  rightsRequests: 'rights_requests',
  dpiaRecords: 'dpia_records',
  risks: 'risks',
  complianceTasks: 'compliance_tasks',
  retentionSchedules: 'retention_schedules',
  breaches: 'breaches',
  auditLogs: 'audit_logs',
  complianceEvents: 'compliance_events',
} as const;

export type StoreKey = keyof typeof COLLECTIONS;
type Snapshot = Map<StoreKey, Map<string, { json: string; pos: number }>>;

let clientPromise: Promise<MongoClient> | null = null;

export function isMongoEnabled(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

export async function getDb(): Promise<Db> {
  if (!clientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI as string, {
      serverSelectionTimeoutMS: 10000,
    });
    // Cached across requests (and across warm Vercel invocations)
    clientPromise = client.connect().catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME || 'DPDPA');
}

type StoreLike = Record<StoreKey, any[]>;

let snapshot: Snapshot = new Map();

function takeSnapshot(store: StoreLike): Snapshot {
  const snap: Snapshot = new Map();
  for (const key of Object.keys(COLLECTIONS) as StoreKey[]) {
    const m = new Map<string, { json: string; pos: number }>();
    store[key].forEach((item, pos) => m.set(String(item.id), { json: JSON.stringify(item), pos }));
    snap.set(key, m);
  }
  return snap;
}

/**
 * Load all collections into the store. On an empty database, the in-memory
 * seed data is written to MongoDB first.
 */
export async function loadStore(store: StoreLike): Promise<void> {
  const db = await getDb();
  const orgCount = await db.collection(COLLECTIONS.organisations).estimatedDocumentCount();

  if (orgCount === 0) {
    // First run: persist the current (seed) state as-is
    snapshot = new Map();
    await saveStore(store);
    return;
  }

  const keys = Object.keys(COLLECTIONS) as StoreKey[];
  const results = await Promise.all(
    keys.map((key) => db.collection(COLLECTIONS[key]).find({}).sort({ _pos: 1 }).toArray())
  );
  keys.forEach((key, i) => {
    store[key] = results[i].map(({ _id, _pos, ...rest }) => rest);
  });
  snapshot = takeSnapshot(store);
}

/** Write inserted/changed/deleted entities since the last load or save. */
export async function saveStore(store: StoreLike): Promise<void> {
  const db = await getDb();
  const keys = Object.keys(COLLECTIONS) as StoreKey[];

  await Promise.all(
    keys.map(async (key) => {
      const before = snapshot.get(key) || new Map();
      const ops: AnyBulkWriteOperation[] = [];
      const seen = new Set<string>();

      store[key].forEach((item, pos) => {
        const id = String(item.id);
        if (seen.has(id)) return; // duplicate id: keep the first occurrence
        seen.add(id);
        const json = JSON.stringify(item);
        const prev = before.get(id);
        if (!prev || prev.json !== json || prev.pos !== pos) {
          ops.push({
            replaceOne: {
              filter: { _id: id as any },
              replacement: { ...JSON.parse(json), _pos: pos },
              upsert: true,
            },
          });
        }
      });
      for (const id of before.keys()) {
        if (!seen.has(id)) ops.push({ deleteOne: { filter: { _id: id as any } } });
      }
      if (ops.length) await db.collection(COLLECTIONS[key]).bulkWrite(ops, { ordered: false });
    })
  );

  snapshot = takeSnapshot(store);
}
