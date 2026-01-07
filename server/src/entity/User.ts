import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    @Index()
    login!: string;

    @Column()
    password!: string;

    @Column()
    name!: string;

    @Column({ default: 'user' })
    role!: string;

    @Column({ default: true })
    isActive!: boolean;

    @Column({ nullable: true })
    avatar!: string;

    @Column({ nullable: true })
    email!: string;

    @CreateDateColumn()
    createdAt!: Date;
}