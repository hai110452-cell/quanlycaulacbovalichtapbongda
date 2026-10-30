import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('schedules')
export class Schedule {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 100 })
  type: string;

  @Column({ type: 'varchar', length: 50 })
  date: string;

  @Column({ type: 'varchar', length: 20, name: 'start_time' })
  startTime: string;

  @Column({ type: 'varchar', length: 20, name: 'end_time' })
  endTime: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'field_id' })
  fieldId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'field_name' })
  fieldName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  coach: string;

  @Column({ type: 'varchar', length: 50, default: 'Sắp diễn ra' })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

