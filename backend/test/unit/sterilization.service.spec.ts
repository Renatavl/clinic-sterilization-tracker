import { HttpStatus } from '@nestjs/common';
import type { DataSource, QueryRunner, Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppException } from '../../src/common/exceptions/app.exception.ts';
import { EquipmentService } from '../../src/equipment/equipment.service.ts';
import { Equipment } from '../../src/equipment/entities/equipment.entity.ts';
import { EquipmentStatus } from '../../src/equipment/enums/equipment-status.enum.ts';
import { EquipmentType } from '../../src/equipment/enums/equipment-type.enum.ts';
import { InstrumentsService } from '../../src/instruments/instruments.service.ts';
import { Instrument } from '../../src/instruments/entities/instrument.entity.ts';
import { InstrumentStatus } from '../../src/instruments/enums/instrument-status.enum.ts';
import { SterilizationBatch } from '../../src/sterilization/entities/sterilization-batch.entity.ts';
import { SterilizationResult } from '../../src/sterilization/enums/sterilization-result.enum.ts';
import { SterilizationStatus } from '../../src/sterilization/enums/sterilization-status.enum.ts';
import { SterilizationService } from '../../src/sterilization/sterilization.service.ts';

const batchId = 'cdfbd9b8-9ac7-414f-ae1a-786e91af10df';

function makeEquipment() {
  return {
    id: '3ded906d-facd-41e8-9d54-116650532117',
    type: EquipmentType.AUTOCLAVE,
    status: EquipmentStatus.ACTIVE,
  } as Equipment;
}

function makeInstruments(status: InstrumentStatus) {
  return [
    { id: '55a0bf29-39cd-491c-b19c-e1b40b11673c', status } as Instrument,
    { id: '16e7cb2b-0080-4b49-94ee-e4fe1f9fdf29', status } as Instrument,
  ];
}

function createHarness(batch: SterilizationBatch) {
  const transactionBatchRepository = {
    findOne: vi.fn().mockResolvedValue(batch),
    save: vi.fn((value: SterilizationBatch) => Promise.resolve(value)),
  } as unknown as Repository<SterilizationBatch>;
  const instrumentRepository = {
    save: vi.fn((value: Instrument[]) => Promise.resolve(value)),
  } as unknown as Repository<Instrument>;
  const queryRunner = {
    connect: vi.fn().mockResolvedValue(undefined),
    startTransaction: vi.fn().mockResolvedValue(undefined),
    commitTransaction: vi.fn().mockResolvedValue(undefined),
    rollbackTransaction: vi.fn().mockResolvedValue(undefined),
    release: vi.fn().mockResolvedValue(undefined),
    manager: {
      getRepository: vi.fn((entity: typeof SterilizationBatch | typeof Instrument) =>
        entity === SterilizationBatch
          ? transactionBatchRepository
          : instrumentRepository,
      ),
    },
  } as unknown as QueryRunner;
  const batchesRepository = {
    findOne: vi.fn().mockImplementation(() => Promise.resolve(batch)),
  } as unknown as Repository<SterilizationBatch>;
  const dataSource = {
    createQueryRunner: vi.fn().mockReturnValue(queryRunner),
  } as unknown as DataSource;
  const service = new SterilizationService(
    batchesRepository,
    {} as EquipmentService,
    {} as InstrumentsService,
    dataSource,
  );

  return {
    service,
    queryRunner,
    transactionBatchRepository,
    instrumentRepository,
  };
}

function makeBatch(status: SterilizationStatus, instrumentStatus: InstrumentStatus) {
  return {
    id: batchId,
    status,
    equipment: makeEquipment(),
    instruments: makeInstruments(instrumentStatus),
    startedAt: status === SterilizationStatus.DRAFT ? null : new Date('2026-01-01T10:00:00Z'),
    completedAt: null,
  } as SterilizationBatch;
}

function expectConflict(errorCode: string) {
  return (error: AppException) => {
    expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(error.getResponse()).toMatchObject({ code: errorCode });
    return true;
  };
}

describe('SterilizationService workflow', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('starts a DRAFT batch and marks its instruments IN_STERILIZATION', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-10T09:30:00Z'));
    const batch = makeBatch(SterilizationStatus.DRAFT, InstrumentStatus.AVAILABLE);
    const { service, queryRunner, instrumentRepository } = createHarness(batch);

    const result = await service.start(batchId);

    expect(result.status).toBe(SterilizationStatus.IN_PROGRESS);
    expect(result.startedAt).toEqual(new Date('2026-02-10T09:30:00Z'));
    expect(result.instruments.every((item) => item.status === InstrumentStatus.IN_STERILIZATION)).toBe(true);
    expect(instrumentRepository.save).toHaveBeenCalledWith(batch.instruments);
    expect(queryRunner.commitTransaction).toHaveBeenCalledOnce();
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalledOnce();
  });

  it('does not start a non-DRAFT batch', async () => {
    const batch = makeBatch(SterilizationStatus.IN_PROGRESS, InstrumentStatus.IN_STERILIZATION);
    const { service, queryRunner } = createHarness(batch);

    await expect(service.start(batchId)).rejects.toSatisfy(
      expectConflict('STERILIZATION_BATCH_NOT_DRAFT'),
    );
    expect(queryRunner.rollbackTransaction).toHaveBeenCalledOnce();
    expect(queryRunner.release).toHaveBeenCalledOnce();
  });

  it('completes an IN_PROGRESS batch as PASSED and marks instruments STERILE', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-10T10:15:00Z'));
    const batch = makeBatch(SterilizationStatus.IN_PROGRESS, InstrumentStatus.IN_STERILIZATION);
    const { service, queryRunner } = createHarness(batch);

    const result = await service.complete(batchId, { result: SterilizationResult.PASSED });

    expect(result.status).toBe(SterilizationStatus.PASSED);
    expect(result.completedAt).toEqual(new Date('2026-02-10T10:15:00Z'));
    expect(result.instruments.every((item) => item.status === InstrumentStatus.STERILE)).toBe(true);
    expect(queryRunner.commitTransaction).toHaveBeenCalledOnce();
  });

  it('completes an IN_PROGRESS batch as FAILED and returns instruments to AVAILABLE', async () => {
    const batch = makeBatch(SterilizationStatus.IN_PROGRESS, InstrumentStatus.IN_STERILIZATION);
    const { service } = createHarness(batch);

    const result = await service.complete(batchId, { result: SterilizationResult.FAILED });

    expect(result.status).toBe(SterilizationStatus.FAILED);
    expect(result.completedAt).toBeInstanceOf(Date);
    expect(result.instruments.every((item) => item.status === InstrumentStatus.AVAILABLE)).toBe(true);
  });

  it('does not complete a batch that is not IN_PROGRESS', async () => {
    const batch = makeBatch(SterilizationStatus.DRAFT, InstrumentStatus.AVAILABLE);
    const { service, queryRunner } = createHarness(batch);

    await expect(
      service.complete(batchId, { result: SterilizationResult.PASSED }),
    ).rejects.toSatisfy(expectConflict('STERILIZATION_BATCH_NOT_IN_PROGRESS'));
    expect(queryRunner.rollbackTransaction).toHaveBeenCalledOnce();
    expect(queryRunner.release).toHaveBeenCalledOnce();
  });
});
