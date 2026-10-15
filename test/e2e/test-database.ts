import { Client } from 'pg';
import { DataSource } from 'typeorm';
import { Attachment } from '../../src/attachments/entities/attachment.entity.ts';
import { CreateAttachments1792000889724 } from '../../src/database/migrations/1792000889724-CreateAttachments.ts';
import { CreateUsersTable1789554163265 } from '../../src/database/migrations/1789554163265-CreateUsersTable.ts';
import { CreateEquipmentTable1791030005902 } from '../../src/database/migrations/1791030005902-CreateEquipmentTable.ts';
import { CreateInstrumentsTable1791364780799 } from '../../src/database/migrations/1791364780799-CreateInstrumentsTable.ts';
import { CreateMaintenanceRecordsTable1791897413987 } from '../../src/database/migrations/1791897413987-CreateMaintenanceRecordsTable.ts';
import { CreateSterilizationBatches1791977110703 } from '../../src/database/migrations/1791977110703-CreateSterilizationBatches.ts';
import { Equipment } from '../../src/equipment/entities/equipment.entity.ts';
import { Instrument } from '../../src/instruments/entities/instrument.entity.ts';
import { MaintenanceRecord } from '../../src/maintenance/entities/maintenance-record.entity.ts';
import { SterilizationBatch } from '../../src/sterilization/entities/sterilization-batch.entity.ts';
import { User } from '../../src/users/entities/user.entity.ts';

const TEST_DATABASE = 'clinic_sterilization_test';

function connectionOptions(database: string) {
  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  };
}

export async function prepareTestDatabase() {
  if (process.env.DB_NAME !== TEST_DATABASE) {
    throw new Error(`Refusing to prepare non-test database: ${process.env.DB_NAME}`);
  }

  const adminClient = new Client(connectionOptions('postgres'));
  await adminClient.connect();

  try {
    const existing = await adminClient.query<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists',
      [TEST_DATABASE],
    );

    if (!existing.rows[0]?.exists) {
      await adminClient.query(`CREATE DATABASE "${TEST_DATABASE}"`);
    }
  } finally {
    await adminClient.end();
  }

  const migrationDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: TEST_DATABASE,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    synchronize: false,
    entities: [
      User,
      Equipment,
      Instrument,
      MaintenanceRecord,
      SterilizationBatch,
      Attachment,
    ],
    migrations: [
      CreateUsersTable1789554163265,
      CreateEquipmentTable1791030005902,
      CreateInstrumentsTable1791364780799,
      CreateMaintenanceRecordsTable1791897413987,
      CreateSterilizationBatches1791977110703,
      CreateAttachments1792000889724,
    ],
  });

  await migrationDataSource.initialize();
  try {
    await migrationDataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await migrationDataSource.runMigrations();
  } finally {
    await migrationDataSource.destroy();
  }
}

export async function resetTestDatabase(dataSource: DataSource) {
  if (dataSource.options.database !== TEST_DATABASE) {
    throw new Error(`Refusing to reset non-test database: ${String(dataSource.options.database)}`);
  }

  await dataSource.query(
    'TRUNCATE TABLE "attachments", "sterilization_batch_instruments", "sterilization_batches", "maintenance_records", "instruments", "equipment", "users" RESTART IDENTITY CASCADE',
  );
}
