import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    JoinColumn
} from 'typeorm';
import { Project } from './Project';
import { User } from './User';

@Entity('project_members')
export class ProjectMember {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'project_id' })
    projectId!: number;

    @Column({ name: 'user_id' })
    userId!: number;

    @ManyToOne(() => Project, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    project!: Project;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({
        type: 'enum',
        enum: ['owner', 'admin', 'member', 'viewer'],
        default: 'member'
    })
    role!: string;

    @CreateDateColumn({ name: 'joined_at' })
    joinedAt!: Date;

    @Column({ nullable: true, name: 'invited_by' })
    invitedBy!: number;
}