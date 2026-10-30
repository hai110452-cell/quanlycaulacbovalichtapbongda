import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('players')
export class Player {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int', name: 'jersey_number' })
  jerseyNumber: number;

  @Column({ type: 'varchar', length: 100 })
  position: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'date_of_birth' })
  dateOfBirth: string;

  @Column({ type: 'varchar', length: 50, nullable: true, default: '' })
  phone: string;

  @Column({ type: 'varchar', length: 50, default: 'Đang thi đấu' })
  status: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'joined_date' })
  joinedDate: string;

  @Column({ type: 'text', nullable: true, name: 'avatar_url' })
  avatarUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

