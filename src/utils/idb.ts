import { openDB, type IDBPDatabase } from 'idb'
import type { Activity, PlantRecord } from '@/types'

const DB_NAME = 'plant_proofreading'
const DB_VERSION = 1

let dbInstance: IDBPDatabase | null = null

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('activities')) {
        db.createObjectStore('activities', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('plant_records')) {
        const store = db.createObjectStore('plant_records', { keyPath: 'id' })
        store.createIndex('activityId', 'activityId', { unique: false })
        store.createIndex('displayOrder', 'displayOrder', { unique: false })
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
