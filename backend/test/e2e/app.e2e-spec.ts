import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { addMonths } from 'date-fns';
import * as fs from 'fs-extra';
import { join } from 'path';
import request from 'supertest';
import { DataSource, In, type Repository } from 'typeorm';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module.ts';
import { Attachment } from '../../src/attachments/entities/attachment.entity.ts';
import { GlobalExceptionFilter } from '../../src/common/filters/global-exception.filter.ts';
import { Equipment } from '../../src/equipment/entities/equipment.entity.ts';
import { EquipmentStatus } from '../../src/equipment/enums/equipment-status.enum.ts';
import { EquipmentType } from '../../src/equipment/enums/equipment-type.enum.ts';
import { Instrument } from '../../src/instruments/entities/instrument.entity.ts';
import { InstrumentStatus } from '../../src/instruments/enums/instrument-status.enum.ts';
import { MaintenanceRecord } from '../../src/maintenance/entities/maintenance-record.entity.ts';
import { SterilizationBatch } from '../../src/sterilization/entities/sterilization-batch.entity.ts';
import { SterilizationResult } from '../../src/sterilization/enums/sterilization-result.enum.ts';
import { SterilizationStatus } from '../../src/sterilization/enums/sterilization-status.enum.ts';
import { User } from '../../src/users/entities/user.entity.ts';
import { UserRole } from '../../src/users/enums/user-role.enum.ts';
import { prepareTestDatabase, resetTestDatabase } from './test-database.ts';

type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
};

type PaginatedEquipmentResponse = {
  items: Equipment[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};

type SterilizationResponse = {
  id: string;
  status: SterilizationStatus;
  startedAt: string | null;
  completedAt: string | null;
};

type SterilizationAnalyticsResponse = {
  total: number;
  completed: number;
  passed: number;
  failed: number;
  successRate: number;
};

const adminCredentials = {
  email: 'admin@clinic.test',
  password: 'Admin123!',
};
const staffCredentials = {
  email: 'staff@clinic.test',
  password: 'Staff123!',
};
const generatedFiles = new Set<string>();

function bearer(token: string) {
  return `Bearer ${token}`;
}

describe('Clinic API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let usersRepository: Repository<User>;
  let equipmentRepository: Repository<Equipment>;
  let instrumentsRepository: Repository<Instrument>;
  let maintenanceRepository: Repository<MaintenanceRecord>;
  let batchesRepository: Repository<SterilizationBatch>;
  let attachmentsRepository: Repository<Attachment>;
  let adminPasswordHash: string;
  let staffPasswordHash: string;

  beforeAll(async () => {
    await prepareTestDatabase();
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();

    dataSource = app.get(DataSource);
    usersRepository = dataSource.getRepository(User);
    equipmentRepository = dataSource.getRepository(Equipment);
    instrumentsRepository = dataSource.getRepository(Instrument);
    maintenanceRepository = dataSource.getRepository(MaintenanceRecord);
    batchesRepository = dataSource.getRepository(SterilizationBatch);
    attachmentsRepository = dataSource.getRepository(Attachment);
    [adminPasswordHash, staffPasswordHash] = await Promise.all([
      bcrypt.hash(adminCredentials.password, 10),
      bcrypt.hash(staffCredentials.password, 10),
    ]);
  });

  beforeEach(async () => {
    await resetTestDatabase(dataSource);
    await usersRepository.save([
      usersRepository.create({
        email: adminCredentials.email,
        passwordHash: adminPasswordHash,
        firstName: 'Test',
        lastName: 'Administrator',
        role: UserRole.ADMIN,
        isActive: true,
      }),
      usersRepository.create({
        email: staffCredentials.email,
        passwordHash: staffPasswordHash,
        firstName: 'Test',
        lastName: 'Staff',
        role: UserRole.STAFF,
        isActive: true,
      }),
    ]);
  });

  afterEach(async () => {
    await Promise.all([...generatedFiles].map((filePath) => fs.remove(filePath)));
    generatedFiles.clear();
    await resetTestDatabase(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  async function login(credentials = adminCredentials) {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials)
      .expect(201);

    return (response.body as LoginResponse).accessToken;
  }

  async function createEquipment(serialNumber: string) {
    return equipmentRepository.save(
      equipmentRepository.create({
        name: `Autoclave ${serialNumber}`,
        serialNumber,
        type: EquipmentType.AUTOCLAVE,
        status: EquipmentStatus.ACTIVE,
        manufacturer: 'Test Manufacturer',
        model: 'Test Model',
      }),
    );
  }

  async function createInstruments(count: number, prefix: string) {
    return instrumentsRepository.save(
      Array.from({ length: count }, (_, index) =>
        instrumentsRepository.create({
          name: `Dental Mirror ${index + 1}`,
          instrumentCode: `${prefix}-${index + 1}`,
          status: InstrumentStatus.AVAILABLE,
        }),
      ),
    );
  }

  it('logs in with valid credentials and rejects an invalid password', async () => {
    const valid = await request(app.getHttpServer())
      .post('/auth/login')
      .send(adminCredentials)
      .expect(201);
    const body = valid.body as LoginResponse;

    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.user).toMatchObject({
      email: adminCredentials.email,
      role: UserRole.ADMIN,
    });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ ...adminCredentials, password: 'WrongPassword123!' })
      .expect(401);
  });

  it('returns the authenticated user and rejects a missing token', async () => {
    const token = await login();
    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', bearer(token))
      .expect(200);

    expect(response.body).toMatchObject({
      email: adminCredentials.email,
      role: UserRole.ADMIN,
    });
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('enforces ADMIN-only equipment deletion', async () => {
    const equipment = await createEquipment('ROLE-AUTO-001');
    const staffToken = await login(staffCredentials);
    const adminToken = await login();

    await request(app.getHttpServer())
      .delete(`/equipment/${equipment.id}`)
      .set('Authorization', bearer(staffToken))
      .expect(403);
    await request(app.getHttpServer())
      .delete(`/equipment/${equipment.id}`)
      .set('Authorization', bearer(adminToken))
      .expect(204);

    expect(await equipmentRepository.findOneBy({ id: equipment.id })).toBeNull();
  });

  it('applies body and pagination validation', async () => {
    const token = await login();

    await request(app.getHttpServer())
      .post('/equipment')
      .set('Authorization', bearer(token))
      .send({ name: '', serialNumber: 'A', type: 'INVALID' })
      .expect(400);
    await request(app.getHttpServer())
      .get('/equipment?page=0')
      .set('Authorization', bearer(token))
      .expect(400);
  });

  it('returns controlled equipment pagination metadata', async () => {
    const token = await login();
    await Promise.all(
      Array.from({ length: 7 }, (_, index) =>
        createEquipment(`PAGE-AUTO-${(index + 1).toString().padStart(3, '0')}`),
      ),
    );

    const response = await request(app.getHttpServer())
      .get('/equipment?page=1&limit=5')
      .set('Authorization', bearer(token))
      .expect(200);
    const body = response.body as PaginatedEquipmentResponse;

    expect(body.items).toHaveLength(5);
    expect(body.meta).toEqual({
      page: 1,
      limit: 5,
      totalItems: 7,
      totalPages: 2,
    });
  });

  it('runs the DRAFT to IN_PROGRESS to PASSED workflow and sterilizes instruments', async () => {
    const token = await login();
    const equipment = await createEquipment('FLOW-PASS-AUTO');
    const instruments = await createInstruments(2, 'FLOW-PASS-INS');

    const created = await request(app.getHttpServer())
      .post('/sterilization-batches')
      .set('Authorization', bearer(token))
      .send({
        equipmentId: equipment.id,
        instrumentIds: instruments.map((instrument) => instrument.id),
        notes: 'E2E passed cycle',
      })
      .expect(201);
    const draft = created.body as SterilizationResponse;
    expect(draft.status).toBe(SterilizationStatus.DRAFT);

    const started = await request(app.getHttpServer())
      .post(`/sterilization-batches/${draft.id}/start`)
      .set('Authorization', bearer(token))
      .expect(200);
    expect(started.body).toMatchObject({ status: SterilizationStatus.IN_PROGRESS });
    expect((started.body as SterilizationResponse).startedAt).toEqual(expect.any(String));

    const completed = await request(app.getHttpServer())
      .post(`/sterilization-batches/${draft.id}/complete`)
      .set('Authorization', bearer(token))
      .send({ result: SterilizationResult.PASSED })
      .expect(200);
    expect(completed.body).toMatchObject({ status: SterilizationStatus.PASSED });
    expect((completed.body as SterilizationResponse).completedAt).toEqual(expect.any(String));

    const savedInstruments = await instrumentsRepository.findBy({
      id: In(instruments.map((instrument) => instrument.id)),
    });
    expect(savedInstruments.every((instrument) => instrument.status === InstrumentStatus.STERILE)).toBe(true);
  });

  it('returns instruments to AVAILABLE after a FAILED cycle', async () => {
    const token = await login();
    const equipment = await createEquipment('FLOW-FAIL-AUTO');
    const instruments = await createInstruments(2, 'FLOW-FAIL-INS');
    const created = await request(app.getHttpServer())
      .post('/sterilization-batches')
      .set('Authorization', bearer(token))
      .send({
        equipmentId: equipment.id,
        instrumentIds: instruments.map((instrument) => instrument.id),
      })
      .expect(201);
    const batch = created.body as SterilizationResponse;

    await request(app.getHttpServer())
      .post(`/sterilization-batches/${batch.id}/start`)
      .set('Authorization', bearer(token))
      .expect(200);
    await request(app.getHttpServer())
      .post(`/sterilization-batches/${batch.id}/complete`)
      .set('Authorization', bearer(token))
      .send({ result: SterilizationResult.FAILED })
      .expect(200);

    const savedInstruments = await instrumentsRepository.findBy({
      id: In(instruments.map((instrument) => instrument.id)),
    });
    expect(savedInstruments.every((instrument) => instrument.status === InstrumentStatus.AVAILABLE)).toBe(true);
  });

  it('returns numeric sterilization analytics from controlled data', async () => {
    const token = await login();
    const equipment = await createEquipment('ANALYTICS-AUTO');
    const now = new Date();
    const statuses = [
      ...Array<SterilizationStatus>(8).fill(SterilizationStatus.PASSED),
      ...Array<SterilizationStatus>(2).fill(SterilizationStatus.FAILED),
      SterilizationStatus.DRAFT,
      SterilizationStatus.IN_PROGRESS,
    ];

    await batchesRepository.save(
      statuses.map((status, index) => {
        const completed =
          status === SterilizationStatus.PASSED || status === SterilizationStatus.FAILED;
        return batchesRepository.create({
          equipment,
          instruments: [],
          status,
          startedAt: status === SterilizationStatus.DRAFT ? null : new Date(now.getTime() - 3_600_000),
          completedAt: completed ? now : null,
          notes: `Analytics batch ${index + 1}`,
        });
      }),
    );

    const response = await request(app.getHttpServer())
      .get('/analytics/sterilization')
      .set('Authorization', bearer(token))
      .expect(200);
    const body = response.body as SterilizationAnalyticsResponse;

    expect(body).toMatchObject({
      total: 12,
      completed: 10,
      passed: 8,
      failed: 2,
      successRate: 80,
    });
    expect(typeof body.total).toBe('number');
    expect(typeof body.successRate).toBe('number');
  });

  it('uploads a valid attachment and creates metadata', async () => {
    const token = await login();
    const equipment = await createEquipment('UPLOAD-AUTO');
    const performedAt = new Date('2026-01-15T10:00:00Z');
    const maintenance = await maintenanceRepository.save(
      maintenanceRepository.create({
        equipment,
        performedAt,
        intervalMonths: 6,
        nextMaintenanceAt: addMonths(performedAt, 6),
        notes: 'Upload test record',
      }),
    );
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );

    const response = await request(app.getHttpServer())
      .post(`/attachments/maintenance/${maintenance.id}`)
      .set('Authorization', bearer(token))
      .attach('file', png, { filename: 'evidence.png', contentType: 'image/png' })
      .expect(201);
    const attachment = response.body as Attachment;
    generatedFiles.add(join(process.cwd(), 'uploads', 'attachments', attachment.storedName));

    expect(attachment).toMatchObject({
      originalName: 'evidence.png',
      mimeType: 'image/png',
      size: png.length,
    });
    expect(await attachmentsRepository.count()).toBe(1);
  });

  it('generates a basic HTML report for a completed batch', async () => {
    const token = await login();
    const equipment = await createEquipment('REPORT-AUTO');
    const [instrument] = await createInstruments(1, 'REPORT-INS');
    const startedAt = new Date('2026-01-15T10:00:00Z');
    const batch = await batchesRepository.save(
      batchesRepository.create({
        equipment,
        instruments: [instrument],
        status: SterilizationStatus.PASSED,
        startedAt,
        completedAt: new Date('2026-01-15T10:45:00Z'),
        notes: 'Report smoke test',
      }),
    );
    generatedFiles.add(
      join(process.cwd(), 'reports', 'sterilization', `sterilization-${batch.id}.html`),
    );

    const response = await request(app.getHttpServer())
      .post(`/reports/sterilization/${batch.id}`)
      .set('Authorization', bearer(token))
      .expect(200)
      .expect('Content-Type', /text\/html/);

    expect(response.text).toContain('Sterilization Report');
    expect(response.text).toContain(batch.id);
  });
});
