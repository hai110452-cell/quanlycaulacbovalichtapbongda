import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('field_bookings')
export class FieldBooking {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id: string;

  @Column({ type: 'varchar', length: 100, name: 'field_id' })
  fieldId: string;

  @Column({ type: 'varchar', length: 255, name: 'field_name' })
  fieldName: string;

  @Column({ type: 'varchar', length: 50, name: 'booking_date' })
  bookingDate: string;

  @Column({ type: 'varchar', length: 50, name: 'slot_id' })
  slotId: string;

  @Column({ type: 'varchar', length: 100, name: 'slot_time' })
  slotTime: string;

  @Column({ type: 'varchar', length: 100, name: 'slot_label' })
  slotLabel: string;

  @Column({ type: 'numeric', default: 400000 })
  price: number;

  @Column({ type: 'boolean', default: false, name: 'is_booked' })
  isBooked: boolean;

  @Column({ type: 'varchar', length: 50, default: 'approved' })
  status: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'receipt_code' })
  receiptCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'customer_name' })
  customerName: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'customer_phone' })
  customerPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'team_name' })
  teamName: string;

  @Column({ type: 'text', nullable: true })
  services: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

