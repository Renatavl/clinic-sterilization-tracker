import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { addDays, endOfDay, parseISO, startOfDay } from 'date-fns';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Equipment } from '../equipment/entities/equipment.entity.ts';
import { Instrument } from '../instruments/entities/instrument.entity.ts';
import { MaintenanceRecord } from '../maintenance/entities/maintenance-record.entity.ts';
import { SterilizationBatch } from '../sterilization/entities/sterilization-batch.entity.ts';
import { SterilizationStatus } from '../sterilization/enums/sterilization-status.enum.ts';
import { AnalyticsDateRangeQueryDto } from './dto/analytics-date-range-query.dto.ts';

type StatusCountRow = {
  status: string;
  count: string;
};

type TypeCountRow = {
  type: string;
  count: string;
};

type EquipmentMaintenanceCountRow = {
  equipmentId: string;
  equipmentName: string;
  count: string;
};

type AverageDurationRow = {
  averageDurationSeconds: string | null;
};

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,

    @InjectRepository(Instrument)
    private readonly instrumentsRepository: Repository<Instrument>,

    @InjectRepository(MaintenanceRecord)
    private readonly maintenanceRepository: Repository<MaintenanceRecord>,

    @InjectRepository(SterilizationBatch)
    private readonly sterilizationRepository: Repository<SterilizationBatch>,
  ) {}

  async getOverview() {
    const [equipment, instruments, maintenanceRecords, sterilizationBatches] =
      await Promise.all([
        this.equipmentRepository.count(),
        this.instrumentsRepository.count(),
        this.maintenanceRepository.count(),
        this.sterilizationRepository.count(),
      ]);

    return {
      equipment,
      instruments,
      maintenanceRecords,
      sterilizationBatches,
    };
  }

  async getEquipmentAnalytics() {
    const [total, statusRows, typeRows] = await Promise.all([
      this.equipmentRepository.count(),
      this.equipmentRepository
        .createQueryBuilder('equipment')
        .select('equipment.status', 'status')
        .addSelect('COUNT(equipment.id)', 'count')
        .andWhere('equipment.deletedAt IS NULL')
        .groupBy('equipment.status')
        .orderBy('COUNT(equipment.id)', 'DESC')
        .getRawMany<StatusCountRow>(),
      this.equipmentRepository
        .createQueryBuilder('equipment')
        .select('equipment.type', 'type')
        .addSelect('COUNT(equipment.id)', 'count')
        .andWhere('equipment.deletedAt IS NULL')
        .groupBy('equipment.type')
        .orderBy('COUNT(equipment.id)', 'DESC')
        .getRawMany<TypeCountRow>(),
    ]);

    return {
      total,
      byStatus: statusRows.map((row) => ({
        status: row.status,
        count: Number(row.count),
      })),
      byType: typeRows.map((row) => ({
        type: row.type,
        count: Number(row.count),
      })),
    };
  }

  async getInstrumentAnalytics() {
    const [total, statusRows] = await Promise.all([
      this.instrumentsRepository.count(),
      this.instrumentsRepository
        .createQueryBuilder('instrument')
        .select('instrument.status', 'status')
        .addSelect('COUNT(instrument.id)', 'count')
        .andWhere('instrument.deletedAt IS NULL')
        .groupBy('instrument.status')
        .orderBy('COUNT(instrument.id)', 'DESC')
        .getRawMany<StatusCountRow>(),
    ]);

    return {
      total,
      byStatus: statusRows.map((row) => ({
        status: row.status,
        count: Number(row.count),
      })),
    };
  }

  async getSterilizationAnalytics(query: AnalyticsDateRangeQueryDto) {
    const totalQuery = this.sterilizationRepository
      .createQueryBuilder('batch')
      .andWhere('batch.deletedAt IS NULL');

    const statusQuery = this.sterilizationRepository
      .createQueryBuilder('batch')
      .select('batch.status', 'status')
      .addSelect('COUNT(batch.id)', 'count')
      .andWhere('batch.deletedAt IS NULL')
      .groupBy('batch.status')
      .orderBy('COUNT(batch.id)', 'DESC');

    const durationQuery = this.sterilizationRepository
      .createQueryBuilder('batch')
      .select(
        'AVG(EXTRACT(EPOCH FROM (batch.completedAt - batch.startedAt)))',
        'averageDurationSeconds',
      )
      .andWhere('batch.deletedAt IS NULL')
      .andWhere('batch.startedAt IS NOT NULL')
      .andWhere('batch.completedAt IS NOT NULL')
      .andWhere('batch.status IN (:...completedStatuses)', {
        completedStatuses: [
          SterilizationStatus.PASSED,
          SterilizationStatus.FAILED,
        ],
      });

    this.applySterilizationDateRange(totalQuery, query);
    this.applySterilizationDateRange(statusQuery, query);
    this.applySterilizationDateRange(durationQuery, query);

    const [total, statusRows, durationRow] = await Promise.all([
      totalQuery.getCount(),
      statusQuery.getRawMany<StatusCountRow>(),
      durationQuery.getRawOne<AverageDurationRow>(),
    ]);

    const byStatus = statusRows.map((row) => ({
      status: row.status,
      count: Number(row.count),
    }));
    const passed =
      byStatus.find((row) => row.status === SterilizationStatus.PASSED)
        ?.count ?? 0;
    const failed =
      byStatus.find((row) => row.status === SterilizationStatus.FAILED)
        ?.count ?? 0;
    const completed = passed + failed;
    const averageDurationSeconds = Number(
      durationRow?.averageDurationSeconds ?? 0,
    );

    return {
      total,
      byStatus,
      completed,
      passed,
      failed,
      successRate:
        completed === 0 ? 0 : Number(((passed / completed) * 100).toFixed(2)),
      averageDurationMinutes: Number(
        (averageDurationSeconds / 60).toFixed(2),
      ),
    };
  }

  async getMaintenanceAnalytics() {
    const now = new Date();
    const dueSoonDate = addDays(now, 30);

    const [totalRecords, overdue, dueSoon, equipmentRows] = await Promise.all([
      this.maintenanceRepository.count(),
      this.maintenanceRepository
        .createQueryBuilder('maintenance')
        .andWhere('maintenance.deletedAt IS NULL')
        .andWhere('maintenance.nextMaintenanceAt < :now', { now })
        .getCount(),
      this.maintenanceRepository
        .createQueryBuilder('maintenance')
        .andWhere('maintenance.deletedAt IS NULL')
        .andWhere('maintenance.nextMaintenanceAt >= :now', { now })
        .andWhere('maintenance.nextMaintenanceAt <= :dueSoonDate', {
          dueSoonDate,
        })
        .getCount(),
      this.maintenanceRepository
        .createQueryBuilder('maintenance')
        .innerJoin('maintenance.equipment', 'equipment')
        .select('equipment.id', 'equipmentId')
        .addSelect('equipment.name', 'equipmentName')
        .addSelect('COUNT(maintenance.id)', 'count')
        .andWhere('maintenance.deletedAt IS NULL')
        .andWhere('equipment.deletedAt IS NULL')
        .groupBy('equipment.id')
        .addGroupBy('equipment.name')
        .orderBy('COUNT(maintenance.id)', 'DESC')
        .getRawMany<EquipmentMaintenanceCountRow>(),
    ]);

    return {
      totalRecords,
      overdue,
      dueSoon,
      byEquipment: equipmentRows.map((row) => ({
        equipmentId: row.equipmentId,
        equipmentName: row.equipmentName,
        count: Number(row.count),
      })),
    };
  }

  private applySterilizationDateRange(
    queryBuilder: SelectQueryBuilder<SterilizationBatch>,
    query: AnalyticsDateRangeQueryDto,
  ) {
    if (query.from !== undefined) {
      queryBuilder.andWhere('batch.createdAt >= :from', {
        from: startOfDay(parseISO(query.from)),
      });
    }

    if (query.to !== undefined) {
      queryBuilder.andWhere('batch.createdAt <= :to', {
        to: endOfDay(parseISO(query.to)),
      });
    }
  }
}