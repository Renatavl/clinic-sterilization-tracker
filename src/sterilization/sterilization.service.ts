import { HttpStatus, Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { DataSource, Repository } from 'typeorm';
import { SterilizationBatch } from './entities/sterilization-batch.entity.ts';
import { EquipmentService } from '../equipment/equipment.service.ts';
import { InstrumentsService } from '../instruments/instruments.service.ts';
import { Equipment } from '../equipment/entities/equipment.entity.ts';
import { EquipmentType } from '../equipment/enums/equipment-type.enum.ts';
import { AppException } from '../common/exceptions/app.exception.ts';
import { EquipmentStatus } from '../equipment/enums/equipment-status.enum.ts';
import { Instrument } from '../instruments/entities/instrument.entity.ts';
import { InstrumentStatus } from '../instruments/enums/instrument-status.enum.ts';
import { CreateSterilizationBatchDto } from './dto/create-sterilization-batch.dto.ts';
import { UpdateSterilizationBatchDto } from './dto/update-sterilization-batch.dto.ts';
import { SterilizationStatus } from './enums/sterilization-status.enum.ts';
import { CompleteSterilizationBatchDto } from './dto/complete-sterilization-batch.dto.ts';
import { SterilizationResult } from './enums/sterilization-result.enum.ts';

@Injectable()
export class SterilizationService {
  constructor(
    @InjectRepository(SterilizationBatch)
    private readonly batchesRepository: Repository<SterilizationBatch>,

    private readonly equipmentService: EquipmentService,

    private readonly instrumentsService: InstrumentsService,

    private readonly dataSource: DataSource,
  ) {}

  private async getInstruments(ids: string[]) {
    return Promise.all(ids.map((id) => this.instrumentsService.findOne(id)));
  }

  private validateEquipment(equipment: Equipment) {
    if (equipment.type !== EquipmentType.AUTOCLAVE) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'EQUIPMENT_NOT_AUTOCLAVE',
        'Selected equipment is not an autoclave',
      );
    }

    if (equipment.status !== EquipmentStatus.ACTIVE) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'EQUIPMENT_NOT_ACTIVE',
        'Selected equipment is not active',
      );
    }
  }

  private validateInstrumentsAvailable(instruments: Instrument[]) {
    const unavailableInstrument = instruments.find(
      (instrument) => instrument.status !== InstrumentStatus.AVAILABLE,
    );

    if (unavailableInstrument) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'INSTRUMENT_NOT_AVAILABLE',
        'One or more instruments are not available',
      );
    }
  }

  async create(dto: CreateSterilizationBatchDto) {
    const equipment = await this.equipmentService.findOne(dto.equipmentId);

    this.validateEquipment(equipment);

    const instruments = await this.getInstruments(dto.instrumentIds);

    this.validateInstrumentsAvailable(instruments);

    const batch = this.batchesRepository.create({
      equipment,
      instruments,
      notes: dto.notes?.trim() || null,
    });

    return this.batchesRepository.save(batch);
  }

  async findAll() {
    return this.batchesRepository.find({
      relations: {
        equipment: true,
        instruments: true,
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string) {
    const batch = await this.batchesRepository.findOne({
      where: {
        id,
      },

      relations: {
        equipment: true,
        instruments: true,
      },
    });

    if (!batch) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'STERILIZATION_BATCH_NOT_FOUND',
        'Sterilization batch was not found',
      );
    }

    return batch;
  }

  async update(id: string, dto: UpdateSterilizationBatchDto) {
    const batch = await this.findOne(id);

    if (batch.status !== SterilizationStatus.DRAFT) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'STERILIZATION_BATCH_NOT_DRAFT',
        'Only draft sterilization batches can be updated',
      );
    }

    if (dto.equipmentId !== undefined) {
      const equipment = await this.equipmentService.findOne(dto.equipmentId);

      this.validateEquipment(equipment);

      batch.equipment = equipment;
    }

    if (dto.instrumentIds !== undefined) {
      const instruments = await this.getInstruments(dto.instrumentIds);

      this.validateInstrumentsAvailable(instruments);

      batch.instruments = instruments;
    }

    if (dto.notes !== undefined) {
      batch.notes = dto.notes.trim() || null;
    }

    await this.batchesRepository.save(batch);

    return this.findOne(id);
  }

  async start(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batchRepository =
        queryRunner.manager.getRepository(SterilizationBatch);

      const instrumentRepository =
        queryRunner.manager.getRepository(Instrument);

      const batch = await batchRepository.findOne({
        where: {
          id,
        },

        relations: {
          equipment: true,
          instruments: true,
        },
      });

      if (!batch) {
        throw new AppException(
          HttpStatus.NOT_FOUND,
          'STERILIZATION_BATCH_NOT_FOUND',
          'Sterilization batch was not found',
        );
      }

      if (batch.status !== SterilizationStatus.DRAFT) {
        throw new AppException(
          HttpStatus.CONFLICT,
          'STERILIZATION_BATCH_NOT_DRAFT',
          'Only draft sterilization batches can be started',
        );
      }

      this.validateEquipment(batch.equipment);

      this.validateInstrumentsAvailable(batch.instruments);

      batch.status = SterilizationStatus.IN_PROGRESS;

      batch.startedAt = new Date();

      for (const instrument of batch.instruments) {
        instrument.status = InstrumentStatus.IN_STERILIZATION;
      }

      await instrumentRepository.save(batch.instruments);

      await batchRepository.save(batch);

      await queryRunner.commitTransaction();

      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async complete(id: string, dto: CompleteSterilizationBatchDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batchRepository =
        queryRunner.manager.getRepository(SterilizationBatch);

      const instrumentRepository =
        queryRunner.manager.getRepository(Instrument);

      const batch = await batchRepository.findOne({
        where: {
          id,
        },

        relations: {
          instruments: true,
        },
      });

      if (!batch) {
        throw new AppException(
          HttpStatus.NOT_FOUND,
          'STERILIZATION_BATCH_NOT_FOUND',
          'Sterilization batch was not found',
        );
      }

      if (batch.status !== SterilizationStatus.IN_PROGRESS) {
        throw new AppException(
          HttpStatus.CONFLICT,
          'STERILIZATION_BATCH_NOT_IN_PROGRESS',
          'Only sterilization batches in progress can be completed',
        );
      }

      const invalidInstrument = batch.instruments.find(
        (instrument) => instrument.status !== InstrumentStatus.IN_STERILIZATION,
      );

      if (invalidInstrument) {
        throw new AppException(
          HttpStatus.CONFLICT,
          'INSTRUMENT_NOT_IN_STERILIZATION',
          'One or more instruments are not in sterilization',
        );
      }

      if (dto.result === SterilizationResult.PASSED) {
        batch.status = SterilizationStatus.PASSED;

        for (const instrument of batch.instruments) {
          instrument.status = InstrumentStatus.STERILE;
        }
      } else {
        batch.status = SterilizationStatus.FAILED;

        for (const instrument of batch.instruments) {
          instrument.status = InstrumentStatus.AVAILABLE;
        }
      }

      batch.completedAt = new Date();

      await instrumentRepository.save(batch.instruments);

      await batchRepository.save(batch);

      await queryRunner.commitTransaction();

      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string) {
    const batch = await this.findOne(id);

    if (batch.status !== SterilizationStatus.DRAFT) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'STERILIZATION_BATCH_NOT_DRAFT',
        'Only draft sterilization batches can be deleted',
      );
    }

    await this.batchesRepository.softDelete(id);
  }
}
