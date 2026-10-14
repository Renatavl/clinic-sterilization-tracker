import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Equipment } from '../../equipment/entities/equipment.entity.ts';
import { Instrument } from '../../instruments/entities/instrument.entity.ts';
import { SterilizationStatus } from '../enums/sterilization-status.enum.ts';

@Entity('sterilization_batches')
export class SterilizationBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Equipment, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'equipmentId',
  })
  equipment: Equipment;

  @ManyToMany(() => Instrument)
  @JoinTable({
    name: 'sterilization_batch_instruments',

    joinColumn: {
      name: 'batchId',
      referencedColumnName: 'id',
    },

    inverseJoinColumn: {
      name: 'instrumentId',
      referencedColumnName: 'id',
    },
  })
  instruments: Instrument[];

  @Column({
    type: 'enum',
    enum: SterilizationStatus,
    default: SterilizationStatus.DRAFT,
  })
  status: SterilizationStatus;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  startedAt: Date | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  completedAt: Date | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({
    nullable: true,
  })
  deletedAt: Date | null;
}
