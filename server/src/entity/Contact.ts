import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    JoinColumn
} from 'typeorm';
import { User } from './User';

export enum ContactStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    BLOCKED = 'blocked'
}

@Entity('contacts')
@Index(['user', 'contact'], { unique: true })
@Index(['user', 'status'])
@Index(['contact', 'status'])
export class Contact {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, user => user.contacts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({ name: 'user_id' })
    userId!: number;

    @ManyToOne(() => User, user => user.addedBy, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'contact_id' })
    contact!: User;

    @Column({ name: 'contact_id' })
    contactId!: number;

    @Column({
        type: 'enum',
        enum: ContactStatus,
        default: ContactStatus.PENDING
    })
    status!: ContactStatus;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

}