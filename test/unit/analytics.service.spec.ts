import type { Repository, SelectQueryBuilder } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import { AnalyticsService } from '../../src/analytics/analytics.service.ts';
import { Equipment } from '../../src/equipment/entities/equipment.entity.ts';
import { Instrument } from '../../src/instruments/entities/instrument.entity.ts';
import { MaintenanceRecord } from '../../src/maintenance/entities/maintenance-record.entity.ts';
import { SterilizationBatch } from '../../src/sterilization/entities/sterilization-batch.entity.ts';
import { SterilizationStatus } from '../../src/sterilization/enums/sterilization-status.enum.ts';

type StatusRow = { status: SterilizationStatus; count: string };
type DurationRow = { averageDurationSeconds: string | null };

function queryBuilder<T>(result: {
  count?: number;
  rows?: StatusRow[];
  duration?: DurationRow;
}) {
  const builder = {
    select: vi.fn(),
    addSelect: vi.fn(),
    andWhere: vi.fn(),
    groupBy: vi.fn(),
    orderBy: vi.fn(),
    getCount: vi.fn().mockResolvedValue(result.count ?? 0),
    getRawMany: vi.fn().mockResolvedValue(result.rows ?? []),
    getRawOne: vi.fn().mockResolvedValue(result.duration),
  };

  builder.select.mockReturnValue(builder);
  builder.addSelect.mockReturnValue(builder);
  builder.andWhere.mockReturnValue(builder);
  builder.groupBy.mockReturnValue(builder);
  builder.orderBy.mockReturnValue(builder);

  return builder as unknown as SelectQueryBuilder<T>;
}

function createService(rows: StatusRow[], averageDurationSeconds = '2700') {
  const totalBuilder = queryBuilder<SterilizationBatch>({ count: 12 });
  const statusBuilder = queryBuilder<SterilizationBatch>({ rows });
  const durationBuilder = queryBuilder<SterilizationBatch>({
    duration: { averageDurationSeconds },
  });
  const sterilizationRepository = {
    createQueryBuilder: vi
      .fn()
      .mockReturnValueOnce(totalBuilder)
      .mockReturnValueOnce(statusBuilder)
      .mockReturnValueOnce(durationBuilder),
  } as unknown as Repository<SterilizationBatch>;

  return new AnalyticsService(
    {} as Repository<Equipment>,
    {} as Repository<Instrument>,
    {} as Repository<MaintenanceRecord>,
    sterilizationRepository,
  );
}

describe('AnalyticsService sterilization calculations', () => {
  it('calculates success rate from passed and failed batches', async () => {
    const service = createService([
      { status: SterilizationStatus.PASSED, count: '8' },
      { status: SterilizationStatus.FAILED, count: '2' },
      { status: SterilizationStatus.DRAFT, count: '1' },
      { status: SterilizationStatus.IN_PROGRESS, count: '1' },
    ]);

    await expect(service.getSterilizationAnalytics({})).resolves.toMatchObject({
      total: 12,
      completed: 10,
      passed: 8,
      failed: 2,
      successRate: 80,
      averageDurationMinutes: 45,
    });
  });

  it('returns zero success rate when no batches are completed', async () => {
    const service = createService(
      [
        { status: SterilizationStatus.DRAFT, count: '6' },
        { status: SterilizationStatus.IN_PROGRESS, count: '6' },
      ],
      '0',
    );

    await expect(service.getSterilizationAnalytics({})).resolves.toMatchObject({
      completed: 0,
      passed: 0,
      failed: 0,
      successRate: 0,
    });
  });
});
