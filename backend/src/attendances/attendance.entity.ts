import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('attendances')
export class Attendance {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id: string;

  @Column({ type: 'varchar', length: 50, name: 'schedule_id' })
  scheduleId: string;

  @Column({ type: 'varchar', length: 50, name: 'player_id' })
  playerId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'player_name' })
  playerName: string;

  @Column({ type: 'varchar', length: 50, default: 'Có mặt' })
  status: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'check_in_time' })
  checkInTime: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

