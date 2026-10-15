import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EquipmentType } from '../enums/equipment-type.enum.ts';
import { EquipmentStatus } from '../enums/equipment-status.enum.ts';


@Entity('equipment')
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 150,
  })
  name: string;

   @Column({
    type: 'varchar',
    length: 100,
    unique: true,
  })
  serialNumber: string;

  @Column({
    type: 'enum',
    enum: EquipmentType,
  })
  type: EquipmentType;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  manufacturer: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  model: string | null;

  @Column({
    type: 'enum',
    enum: EquipmentStatus,
    default: EquipmentStatus.ACTIVE,
  })
  status: EquipmentStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({
    nullable: true,
  })
  deletedAt: Date | null;
}