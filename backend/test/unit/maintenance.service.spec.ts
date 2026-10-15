import type { Repository } from 'typeorm';
import { format } from 'date-fns';
import { describe, expect, it, vi } from 'vitest';
import { EquipmentService } from '../../src/equipment/equipment.service.ts';
import { Equipment } from '../../src/equipment/entities/equipment.entity.ts';
import { MaintenanceRecord } from '../../src/maintenance/entities/maintenance-record.entity.ts';
import { MaintenanceService } from '../../src/maintenance/maintenance.service.ts';

describe('MaintenanceService', () => {
  it('calculates nextMaintenanceAt from performedAt and intervalMonths', async () => {
    const equipment = {
      id: '268083c1-e4f5-4f8a-8b85-d52cd5dc1c79',
    } as Equipment;
    const create = vi.fn((values: Partial<MaintenanceRecord>) => values as MaintenanceRecord);
    const save = vi.fn((record: MaintenanceRecord) => Promise.resolve(record));
    const repository = {
      create,
      save,
    } as unknown as Repository<MaintenanceRecord>;
    const equipmentService = {
      findOne: vi.fn().mockResolvedValue(equipment),
    } as unknown as EquipmentService;
    const service = new MaintenanceService(repository, equipmentService);

    const record = await service.create({
      equipmentId: equipment.id,
      performedAt: '2026-01-15T10:00:00.000Z',
      intervalMonths: 6,
      notes: ' Preventive service ',
    });

    expect(format(record.nextMaintenanceAt, 'yyyy-MM-dd')).toBe('2026-07-15');
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        equipment,
        intervalMonths: 6,
        notes: 'Preventive service',
      }),
    );
    expect(save).toHaveBeenCalledOnce();
  });
});
