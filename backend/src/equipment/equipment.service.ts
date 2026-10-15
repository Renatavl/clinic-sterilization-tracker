import { HttpStatus, Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment } from './entities/equipment.entity.ts';
import { CreateEquipmentDto } from './dto/create-equipment.dto.ts';
import { AppException } from '../common/exceptions/app.exception.ts';
import { UpdateEquipmentDto } from './dto/update-equipment.dto.ts';
import { EquipmentQueryDto } from './dto/equipment-query.dto.ts';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
  ) {}

  async create(dto: CreateEquipmentDto) {
    const serialNumber = dto.serialNumber.trim();

    const existingEquipment = await this.equipmentRepository.findOne({
      where: {
        serialNumber,
      },
    });

    if (existingEquipment) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'EQUIPMENT_SERIAL_NUMBER_ALREADY_EXISTS',
        'Equipment with this serial number already exists',
      );
    }

    const equipment = this.equipmentRepository.create({
      name: dto.name.trim(),
      serialNumber,
      type: dto.type,
      manufacturer: dto.manufacturer?.trim() ?? null,
      model: dto.model?.trim() ?? null,
      status: dto.status,
    });

    return this.equipmentRepository.save(equipment);
  }

  async findAll(query: EquipmentQueryDto) {
    const { page, limit, search, type, status } = query;

    const queryBuilder =
      this.equipmentRepository.createQueryBuilder('equipment');

    if (search?.trim()) {
      queryBuilder.andWhere(
        `(
        equipment.name ILIKE :search
        OR equipment.serialNumber ILIKE :search
        OR equipment.manufacturer ILIKE :search
        OR equipment.model ILIKE :search
      )`,
        {
          search: `%${search.trim()}%`,
        },
      );
    }

    if (type !== undefined) {
      queryBuilder.andWhere('equipment.type = :type', {
        type,
      });
    }

    if (status !== undefined) {
      queryBuilder.andWhere('equipment.status = :status', {
        status,
      });
    }

    const skip = (page - 1) * limit;

    queryBuilder.orderBy('equipment.createdAt', 'DESC').skip(skip).take(limit);

    const [equipment, totalItems] = await queryBuilder.getManyAndCount();

    return {
      items: equipment,

      meta: {
        page,
        limit,
        totalItems,

        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async findOne(id: string) {
    const equipment = await this.equipmentRepository.findOne({
      where: {
        id,
      },
    });

    if (!equipment) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'EQUIPMENT_NOT_FOUND',
        'Equipment was not found',
      );
    }

    return equipment;
  }

  async update(id: string, dto: UpdateEquipmentDto) {
    const equipment = await this.findOne(id);

    if (
      dto.serialNumber !== undefined &&
      dto.serialNumber.trim() !== equipment.serialNumber
    ) {
      const serialNumber = dto.serialNumber.trim();

      const existingEquipment = await this.equipmentRepository.findOne({
        where: {
          serialNumber,
        },
      });

      if (existingEquipment && existingEquipment.id !== id) {
        throw new AppException(
          HttpStatus.CONFLICT,
          'EQUIPMENT_SERIAL_NUMBER_ALREADY_EXISTS',
          'Equipment with this serial number already exists',
        );
      }

      equipment.serialNumber = serialNumber;
    }

    if (dto.name !== undefined) {
      equipment.name = dto.name.trim();
    }

    if (dto.type !== undefined) {
      equipment.type = dto.type;
    }

    if (dto.manufacturer !== undefined) {
      equipment.manufacturer = dto.manufacturer.trim();
    }

    if (dto.model !== undefined) {
      equipment.model = dto.model.trim();
    }

    if (dto.status !== undefined) {
      equipment.status = dto.status;
    }

    await this.equipmentRepository.save(equipment);

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.equipmentRepository.softDelete(id);
  }
}
