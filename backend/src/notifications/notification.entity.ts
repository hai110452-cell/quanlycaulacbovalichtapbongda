import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'varchar', length: 50, default: 'new' })
  type: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  timestamp: string;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'schedule_id' })
  scheduleId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

