import { HttpStatus } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import { AppException } from '../../src/common/exceptions/app.exception.ts';
import { EquipmentService } from '../../src/equipment/equipment.service.ts';
import { Equipment } from '../../src/equipment/entities/equipment.entity.ts';
import { EquipmentStatus } from '../../src/equipment/enums/equipment-status.enum.ts';
import { EquipmentType } from '../../src/equipment/enums/equipment-type.enum.ts';

describe('EquipmentService', () => {
  it('rejects a duplicate serial number', async () => {
    const existing = {
      id: 'a39f1df7-442e-4196-a1ec-2c741262e62b',
      serialNumber: 'AUTO-001',
    } as Equipment;
    const repository = {
      findOne: vi.fn().mockResolvedValue(existing),
      create: vi.fn(),
      save: vi.fn(),
    } as unknown as Repository<Equipment>;
    const service = new EquipmentService(repository);

    const result = service.create({
      name: 'Main Autoclave',
      serialNumber: ' AUTO-001 ',
      type: EquipmentType.AUTOCLAVE,
      status: EquipmentStatus.ACTIVE,
    });

    await expect(result).rejects.toMatchObject<AppException>({
      status: HttpStatus.CONFLICT,
    });
    await expect(result).rejects.toSatisfy((error: AppException) =>
      expect(error.getResponse()).toEqual({
        code: 'EQUIPMENT_SERIAL_NUMBER_ALREADY_EXISTS',
        message: 'Equipment with this serial number already exists',
      }),
    );
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { serialNumber: 'AUTO-001' },
    });
    expect(repository.save).not.toHaveBeenCalled();
  });
});
