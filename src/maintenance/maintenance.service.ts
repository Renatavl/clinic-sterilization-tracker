import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MaintenanceRecord } from './entities/maintenance-record.entity.ts';
import { Repository } from 'typeorm';
import { EquipmentService } from '../equipment/equipment.service.ts';
import { CreateMaintenanceRecordDto } from './dto/create-maintenance-record.dto.ts';
import { addMonths, parseISO } from 'date-fns';
import { AppException } from '../common/exceptions/app.exception.ts';
import { UpdateMaintenanceRecordDto } from './dto/update-maintenance-record.dto.ts';
import { MaintenanceQueryDto } from './dto/maintenance-query.dto.ts';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceRecord)
    private readonly maintenanceRepository: Repository<MaintenanceRecord>,

    private readonly equipmentService: EquipmentService,
  ) {}

  async create(dto: CreateMaintenanceRecordDto) {
    const equipment = await this.equipmentService.findOne(dto.equipmentId);

    const performedAt = parseISO(dto.performedAt);

    const nextMaintenanceAt = addMonths(performedAt, dto.intervalMonths);

    const maintenance = this.maintenanceRepository.create({
      equipment,
      performedAt,
      intervalMonths: dto.intervalMonths,
      nextMaintenanceAt,
      notes: dto.notes?.trim() || null,
    });

    return this.maintenanceRepository.save(maintenance);
  }

  async findAll(query: MaintenanceQueryDto) {
    const { page, limit, search, equipmentId } = query;

    const queryBuilder = this.maintenanceRepository
      .createQueryBuilder('maintenance')
      .leftJoinAndSelect('maintenance.equipment', 'equipment');

    if (search?.trim()) {
      queryBuilder.andWhere(
        `(
        equipment.name ILIKE :search
        OR equipment.serialNumber ILIKE :search
        OR maintenance.notes ILIKE :search
      )`,
        {
          search: `%${search.trim()}%`,
        },
      );
    }

    if (equipmentId !== undefined) {
      queryBuilder.andWhere('equipment.id = :equipmentId', {
        equipmentId,
      });
    }

    const skip = (page - 1) * limit;

    queryBuilder
      .orderBy('maintenance.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [maintenanceRecords, totalItems] =
      await queryBuilder.getManyAndCount();

    return {
      items: maintenanceRecords,

      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async findOne(id: string) {
    const maintenance = await this.maintenanceRepository.findOne({
      where: {
        id,
      },

      relations: {
        equipment: true,
      },
    });

    if (!maintenance) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'MAINTENANCE_RECORD_NOT_FOUND',
        'Maintenance record was not found',
      );
    }

    return maintenance;
  }

  async update(id: string, dto: UpdateMaintenanceRecordDto) {
    const maintenance = await this.findOne(id);

    let shouldRecalculateNextDate = false;

    if (dto.performedAt !== undefined) {
      maintenance.performedAt = parseISO(dto.performedAt);

      shouldRecalculateNextDate = true;
    }

    if (dto.intervalMonths !== undefined) {
      maintenance.intervalMonths = dto.intervalMonths;

      shouldRecalculateNextDate = true;
    }

    if (shouldRecalculateNextDate) {
      maintenance.nextMaintenanceAt = addMonths(
        maintenance.performedAt,
        maintenance.intervalMonths,
      );
    }

    if (dto.notes !== undefined) {
      maintenance.notes = dto.notes.trim() || null;
    }

    await this.maintenanceRepository.save(maintenance);

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.maintenanceRepository.softDelete(id);
  }
}
