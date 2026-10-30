import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('fields')
export class Field {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'field_type' })
  fieldType: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'surface_type' })
  surfaceType: string;

  @Column({ type: 'varchar', length: 50, default: 'Khả dụng' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

