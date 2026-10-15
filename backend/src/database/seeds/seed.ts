import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import {
  addDays,
  addMinutes,
  addMonths,
  subDays,
  subMonths,
} from 'date-fns';
import type { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import dataSource from '../data-source.ts';
import { Equipment } from '../../equipment/entities/equipment.entity.ts';
import { EquipmentStatus } from '../../equipment/enums/equipment-status.enum.ts';
import { EquipmentType } from '../../equipment/enums/equipment-type.enum.ts';
import { Instrument } from '../../instruments/entities/instrument.entity.ts';
import { InstrumentStatus } from '../../instruments/enums/instrument-status.enum.ts';
import { MaintenanceRecord } from '../../maintenance/entities/maintenance-record.entity.ts';
import { SterilizationBatch } from '../../sterilization/entities/sterilization-batch.entity.ts';
import { SterilizationStatus } from '../../sterilization/enums/sterilization-status.enum.ts';
import { User } from '../../users/entities/user.entity.ts';
import { UserRole } from '../../users/enums/user-role.enum.ts';

const SEED_NAMESPACE = '10000000-0000-4000-8000-';

function seedId(group: number, index: number) {
  return `${SEED_NAMESPACE}${group.toString().padStart(4, '0')}${index
    .toString()
    .padStart(8, '0')}`;
}

async function saveByNaturalKey<T extends { deletedAt: Date | null }>(
  repository: Repository<T>,
  where: FindOptionsWhere<T>,
  values: DeepPartial<T>,
) {
  const existing = await repository.findOne({
    where,
    withDeleted: true,
  });
  const entity = repository.create({
    ...existing,
    ...values,
    deletedAt: null,
  });

  return repository.save(entity);
}

async function seedUsers(repository: Repository<User>) {
  const users = [
    {
      email: 'admin@clinic.test',
      password: 'Admin123!',
      firstName: 'Amelia',
      lastName: 'Morgan',
      role: UserRole.ADMIN,
    },
    {
      email: 'staff@clinic.test',
      password: 'Staff123!',
      firstName: 'Daniel',
      lastName: 'Reyes',
      role: UserRole.STAFF,
    },
  ];

  for (const user of users) {
    await saveByNaturalKey(
      repository,
      { email: user.email },
      {
        email: user.email,
        passwordHash: await bcrypt.hash(user.password, 10),
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: true,
      },
    );
  }
}

async function seedEquipment(repository: Repository<Equipment>) {
  faker.seed(1601);
  const equipmentData: Array<
    Pick<
      Equipment,
      'name' | 'serialNumber' | 'type' | 'manufacturer' | 'model' | 'status'
    >
  > = [
    {
      name: 'Central Sterilization Autoclave',
      serialNumber: 'AUTO-001',
      type: EquipmentType.AUTOCLAVE,
      manufacturer: 'Tuttnauer',
      model: '3870EA',
      status: EquipmentStatus.ACTIVE,
    },
    {
      name: 'Surgical Suite Autoclave',
      serialNumber: 'AUTO-002',
      type: EquipmentType.AUTOCLAVE,
      manufacturer: 'Midmark',
      model: 'M11',
      status: EquipmentStatus.ACTIVE,
    },
    {
      name: 'Backup Autoclave',
      serialNumber: 'AUTO-003',
      type: EquipmentType.AUTOCLAVE,
      manufacturer: 'SciCan',
      model: 'STATIM 5000',
      status: EquipmentStatus.MAINTENANCE,
    },
    {
      name: 'Legacy Autoclave',
      serialNumber: 'AUTO-004',
      type: EquipmentType.AUTOCLAVE,
      manufacturer: 'Pelton & Crane',
      model: 'Delta XL',
      status: EquipmentStatus.INACTIVE,
    },
    {
      name: 'Instrument Ultrasonic Cleaner',
      serialNumber: 'ULTRA-001',
      type: EquipmentType.ULTRASONIC_CLEANER,
      manufacturer: 'Crest',
      model: 'P500H',
      status: EquipmentStatus.ACTIVE,
    },
    {
      name: 'Operatory Ultrasonic Cleaner',
      serialNumber: 'ULTRA-002',
      type: EquipmentType.ULTRASONIC_CLEANER,
      manufacturer: 'L&R',
      model: 'Quantrex 90',
      status: EquipmentStatus.ACTIVE,
    },
    {
      name: 'Backup Ultrasonic Cleaner',
      serialNumber: 'ULTRA-003',
      type: EquipmentType.ULTRASONIC_CLEANER,
      manufacturer: 'Branson',
      model: 'M1800H',
      status: EquipmentStatus.MAINTENANCE,
    },
    {
      name: 'Instrument Washer',
      serialNumber: 'OTHER-001',
      type: EquipmentType.OTHER,
      manufacturer: 'Miele',
      model: 'PG 8581',
      status: EquipmentStatus.ACTIVE,
    },
    {
      name: 'Heat Sealer',
      serialNumber: 'OTHER-002',
      type: EquipmentType.OTHER,
      manufacturer: 'W&H',
      model: 'Seal 2',
      status: EquipmentStatus.ACTIVE,
    },
    {
      name: 'Water Treatment Unit',
      serialNumber: 'OTHER-003',
      type: EquipmentType.OTHER,
      manufacturer: faker.company.name().slice(0, 100),
      model: 'AquaPro 200',
      status: EquipmentStatus.INACTIVE,
    },
  ];

  const equipment: Equipment[] = [];
  for (const [index, values] of equipmentData.entries()) {
    equipment.push(
      await saveByNaturalKey(
        repository,
        { serialNumber: values.serialNumber },
        { id: seedId(1, index + 1), ...values },
      ),
    );
  }

  return equipment;
}

async function seedInstruments(repository: Repository<Instrument>) {
  const names = [
    'Dental Mirror',
    'Extraction Forceps',
    'Periodontal Scaler',
    'Explorer Probe',
    'Surgical Curette',
    'Root Elevator',
    'Hemostat',
    'College Tweezers',
    'Bone Rongeur',
    'Needle Holder',
  ];
  const instruments: Instrument[] = [];

  for (let index = 0; index < 50; index += 1) {
    const instrumentCode = `INS-${(index + 1).toString().padStart(4, '0')}`;
    const status =
      index < 6
        ? InstrumentStatus.IN_STERILIZATION
        : index < 26
          ? InstrumentStatus.STERILE
          : InstrumentStatus.AVAILABLE;

    instruments.push(
      await saveByNaturalKey(
        repository,
        { instrumentCode },
        {
          id: seedId(2, index + 1),
          instrumentCode,
          name: `${names[index % names.length]} ${Math.floor(index / names.length) + 1}`,
          status,
        },
      ),
    );
  }

  return instruments;
}

async function seedMaintenance(
  repository: Repository<MaintenanceRecord>,
  equipment: Equipment[],
) {
  const now = new Date();

  for (let index = 0; index < 20; index += 1) {
    const intervalMonths = [3, 6, 12][index % 3];
    const nextMaintenanceAt =
      index < 7
        ? subDays(now, 10 + index * 8)
        : index < 13
          ? addDays(now, 5 + (index - 7) * 4)
          : addDays(now, 45 + (index - 13) * 20);
    const performedAt = subMonths(nextMaintenanceAt, intervalMonths);
    const id = seedId(3, index + 1);
    const existing = await repository.findOne({ where: { id }, withDeleted: true });

    await repository.save(
      repository.create({
        ...existing,
        id,
        equipment: equipment[index % equipment.length],
        performedAt,
        intervalMonths,
        nextMaintenanceAt: addMonths(performedAt, intervalMonths),
        notes: `Scheduled preventive maintenance cycle ${index + 1}`,
        deletedAt: null,
      }),
    );
  }
}

async function seedSterilization(
  repository: Repository<SterilizationBatch>,
  autoclaves: Equipment[],
  instruments: Instrument[],
) {
  const now = new Date();
  const statuses = [
    ...Array<SterilizationStatus>(4).fill(SterilizationStatus.DRAFT),
    ...Array<SterilizationStatus>(3).fill(SterilizationStatus.IN_PROGRESS),
    ...Array<SterilizationStatus>(18).fill(SterilizationStatus.PASSED),
    ...Array<SterilizationStatus>(5).fill(SterilizationStatus.FAILED),
  ];

  for (const [index, status] of statuses.entries()) {
    const id = seedId(4, index + 1);
    const existing = await repository.findOne({
      where: { id },
      relations: { instruments: true },
      withDeleted: true,
    });
    const eventDate = subDays(now, 2 + index * 3);
    const startedAt = status === SterilizationStatus.DRAFT ? null : eventDate;
    const completedAt =
      status === SterilizationStatus.PASSED || status === SterilizationStatus.FAILED
        ? addMinutes(eventDate, 35 + (index % 6) * 7)
        : null;
    let relatedInstruments: Instrument[];

    if (status === SterilizationStatus.IN_PROGRESS) {
      const progressIndex = index - 4;
      relatedInstruments = instruments.slice(progressIndex * 2, progressIndex * 2 + 2);
    } else if (status === SterilizationStatus.PASSED) {
      const passedIndex = index - 7;
      relatedInstruments = [
        instruments[6 + (passedIndex % 20)],
        instruments[6 + ((passedIndex + 7) % 20)],
      ];
    } else {
      const availableIndex = index % 24;
      relatedInstruments = [
        instruments[26 + availableIndex],
        instruments[26 + ((availableIndex + 9) % 24)],
      ];
    }

    await repository.save(
      repository.create({
        ...existing,
        id,
        equipment: autoclaves[index % autoclaves.length],
        instruments: relatedInstruments,
        status,
        startedAt,
        completedAt,
        notes: `Seeded ${status.toLowerCase().replace('_', ' ')} cycle ${index + 1}`,
        createdAt: eventDate,
        deletedAt: null,
      }),
    );
  }
}

async function runSeed() {
  console.log('Seeding database...');
  await dataSource.initialize();

  try {
    await seedUsers(dataSource.getRepository(User));
    console.log('✓ Admin user ready');
    console.log('✓ Staff user ready');

    const equipment = await seedEquipment(dataSource.getRepository(Equipment));
    console.log(`✓ Equipment ready: ${equipment.length}`);

    const instruments = await seedInstruments(dataSource.getRepository(Instrument));
    console.log(`✓ Instruments ready: ${instruments.length}`);

    await seedMaintenance(dataSource.getRepository(MaintenanceRecord), equipment);
    console.log('✓ Maintenance records ready: 20');

    const autoclaves = equipment.filter(
      (item) =>
        item.type === EquipmentType.AUTOCLAVE &&
        item.status === EquipmentStatus.ACTIVE,
    );
    await seedSterilization(
      dataSource.getRepository(SterilizationBatch),
      autoclaves,
      instruments,
    );
    console.log('✓ Sterilization batches ready: 30');
    console.log('Seed completed successfully.');
  } finally {
    await dataSource.destroy();
  }
}

runSeed().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
