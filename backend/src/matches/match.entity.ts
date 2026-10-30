import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('matches')
export class Match {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  opponent: string;

  @Column({ type: 'text', nullable: true, name: 'opponent_logo' })
  opponentLogo: string;

  @Column({ type: 'varchar', length: 50, name: 'match_type' })
  matchType: string;

  @Column({ type: 'varchar', length: 50 })
  date: string;

  @Column({ type: 'varchar', length: 20 })
  time: string;

  @Column({ type: 'varchar', length: 255, name: 'field_name' })
  fieldName: string;

  @Column({ type: 'int', default: 0, name: 'home_score' })
  homeScore: number;

  @Column({ type: 'int', default: 0, name: 'away_score' })
  awayScore: number;

  @Column({ type: 'varchar', length: 50, default: 'Đã kết thúc' })
  status: string;

  @Column({ type: 'jsonb', default: [] , name: 'goal_scorers' })
  goalScorers: any[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  mvp: string;

  @Column({ type: 'int', default: 0, name: 'yellow_cards' })
  yellowCards: number;

  @Column({ type: 'int', default: 0, name: 'red_cards' })
  redCards: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

