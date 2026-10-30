import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('clubs')
export class Club {
  @PrimaryColumn({ type: 'varchar', length: 50, default: 'default-club' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'short_name' })
  shortName: string;

  @Column({ type: 'int', nullable: true, name: 'established_year' })
  establishedYear: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  coach: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  captain: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'home_stadium' })
  homeStadium: string;

  @Column({ type: 'text', nullable: true, name: 'logo_url' })
  logoUrl: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

