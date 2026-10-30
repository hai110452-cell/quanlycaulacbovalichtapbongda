import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('teams')
export class Team {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  level: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'head_coach' })
  headCoach: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  captain: string;

  @Column({ type: 'int', default: 0, name: 'member_count' })
  memberCount: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'home_pitch' })
  homePitch: string;

  @Column({ type: 'int', default: 2024, name: 'established_year' })
  establishedYear: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: 'Hoạt động' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
