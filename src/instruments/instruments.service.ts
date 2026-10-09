import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Instrument } from './entities/instrument.entity.ts';
import { Repository } from 'typeorm';
import { CreateInstrumentDto } from './dto/create-instrument.dto.ts';
import { AppException } from '../common/exceptions/app.exception.ts';
import { UpdateInstrumentDto } from './dto/update-instrument.dto.ts';

@Injectable()
export class InstrumentsService {
  constructor(
    @InjectRepository(Instrument)
    private readonly instrumentsRepository: Repository<Instrument>,
  ) {}

  async create(dto: CreateInstrumentDto) {
    const instrumentCode = dto.instrumentCode.trim();

    const existingInstrument = await this.instrumentsRepository.findOne({
      where: {
        instrumentCode,
      },
    });

    if (existingInstrument) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'INSTRUMENT_CODE_ALREADY_EXISTS',
        'Instrument with this code already exists',
      );
    }

    const instrument = this.instrumentsRepository.create({
      name: dto.name.trim(),
      instrumentCode,
    });

    return this.instrumentsRepository.save(instrument);
  }

  async findAll() {
    return this.instrumentsRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string) {
    const instrument = await this.instrumentsRepository.findOne({
      where: {
        id,
      },
    });

    if (!instrument) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'INSTRUMENT_NOT_FOUND',
        'Instrument was not found',
      );
    }

    return instrument;
  }

  async update(id: string, dto: UpdateInstrumentDto) {
    const instrument = await this.findOne(id);

    if (
      dto.instrumentCode !== undefined &&
      dto.instrumentCode.trim() !== instrument.instrumentCode
    ) {
      const instrumentCode = dto.instrumentCode.trim();

      const existingInstrument = await this.instrumentsRepository.findOne({
        where: {
          instrumentCode,
        },
      });

      if (existingInstrument && existingInstrument.id !== id) {
        throw new AppException(
          HttpStatus.CONFLICT,
          'INSTRUMENT_CODE_ALREADY_EXISTS',
          'Instrument with this code already exists',
        );
      }

      instrument.instrumentCode = instrumentCode;
    }

    if (dto.name !== undefined) {
      instrument.name = dto.name.trim();
    }

    await this.instrumentsRepository.save(instrument);

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.instrumentsRepository.softDelete(id);
  }
}
