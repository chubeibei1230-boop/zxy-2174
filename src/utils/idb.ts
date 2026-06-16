import { openDB, type IDBPDatabase } from 'idb'
import type { Activity, PlantRecord, PrintBatch } from '@/types'

const DB_NAME = 'plant_proofreading'
const DB_VERSION = 2

let dbInstance: IDBPDatabase | null = null

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains('activities')) {
        db.createObjectStore('activities', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('plant_records')) {
        const store = db.createObjectStore('plant_records', { keyPath: 'id' })
        store.createIndex('activityId', 'activityId', { unique: false })
        store.createIndex('displayOrder', 'displayOrder', { unique: false })
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('print_batches')) {
          const store = db.createObjectStore('print_batches', { keyPath: 'id' })
          store.createIndex('activityId', 'activityId', { unique: false })
          store.createIndex('confirmedAt', 'confirmedAt', { unique: false })
        }
      }
    },
  })

  return dbInstance
}

export async function dbGetActivity(id: string): Promise<Activity | undefined> {
  const db = await getDB()
  return db.get('activities', id)
}

export async function dbGetAllActivities(): Promise<Activity[]> {
  const db = await getDB()
  return db.getAll('activities')
}

export async function dbSaveActivity(activity: Activity): Promise<void> {
  const db = await getDB()
  await db.put('activities', { ...activity, updatedAt: Date.now() })
}

export async function dbGetRecordsByActivity(activityId: string): Promise<PlantRecord[]> {
  const db = await getDB()
  const records = await db.getAllFromIndex('plant_records', 'activityId', activityId)
  return records.sort((a, b) => a.displayOrder - b.displayOrder)
}

export async function dbSaveRecord(record: PlantRecord): Promise<void> {
  const db = await getDB()
  await db.put('plant_records', { ...record, updatedAt: Date.now() })
}

export async function dbSaveRecords(records: PlantRecord[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('plant_records', 'readwrite')
  const now = Date.now()
  for (const record of records) {
    await tx.store.put({ ...record, updatedAt: now })
  }
  await tx.done
}

export async function dbDeleteRecord(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('plant_records', id)
}

export async function dbDeleteRecordsByActivity(activityId: string): Promise<void> {
  const db = await getDB()
  const records = await db.getAllFromIndex('plant_records', 'activityId', activityId)
  const tx = db.transaction('plant_records', 'readwrite')
  for (const record of records) {
    await tx.store.delete(record.id)
  }
  await tx.done
}

export async function dbSavePrintBatch(batch: PrintBatch): Promise<void> {
  const db = await getDB()
  await db.put('print_batches', batch)
}

export async function dbGetPrintBatchesByActivity(activityId: string): Promise<PrintBatch[]> {
  const db = await getDB()
  const batches = await db.getAllFromIndex('print_batches', 'activityId', activityId)
  return batches.sort((a, b) => b.confirmedAt - a.confirmedAt)
}

export async function dbGetLatestPrintBatch(activityId: string): Promise<PrintBatch | undefined> {
  const db = await getDB()
  const batches = await db.getAllFromIndex('print_batches', 'activityId', activityId)
  if (batches.length === 0) return undefined
  return batches.sort((a, b) => b.confirmedAt - a.confirmedAt)[0]
}

export async function dbGetAllPrintBatches(): Promise<PrintBatch[]> {
  const db = await getDB()
  return db.getAll('print_batches')
}
