import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Equipment } from '../../equipment/entities/equipment.entity.ts';

@Entity('maintenance_records')
export class MaintenanceRecord {
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

  @Column({
    type: 'timestamptz',
  })
  performedAt: Date;

  @Column({
    type: 'integer',
  })
  intervalMonths: number;

  @Column({
    type: 'timestamptz',
  })
  nextMaintenanceAt: Date;

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
