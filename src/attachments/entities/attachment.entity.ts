import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MaintenanceRecord } from '../../maintenance/entities/maintenance-record.entity.ts';
import { SterilizationBatch } from '../../sterilization/entities/sterilization-batch.entity.ts';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  originalName: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
  })
  storedName: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  mimeType: string;

  @Column({
    type: 'integer',
  })
  size: number;

  @ManyToOne(() => MaintenanceRecord, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'maintenanceRecordId',
  })
  maintenanceRecord: MaintenanceRecord | null;

  @ManyToOne(() => SterilizationBatch, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'sterilizationBatchId',
  })
  sterilizationBatch: SterilizationBatch | null;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn({
    nullable: true,
  })
  deletedAt: Date | null;
}
