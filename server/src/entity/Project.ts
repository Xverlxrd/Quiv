import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn
} from 'typeorm';
import { User } from './User';
import { ProjectMember } from './ProjectMember';

export enum ProjectPrivacy {
    PUBLIC = 'public',
    PRIVATE = 'private',
    CONTACTS_ONLY = 'contacts_only'
}

export enum ProjectStatus {
    ACTIVE = 'active',
    ARCHIVED = 'archived',
    COMPLETED = 'completed'
}

@Entity('projects')
export class Project {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ type: 'text', nullable: true })
    description!: string;

    @Column({ nullable: true })
    image!: string;

    @Column({
        type: 'enum',
        enum: ProjectPrivacy,
        default: ProjectPrivacy.PRIVATE
    })
    privacy!: ProjectPrivacy;

    @Column({
        type: 'enum',
        enum: ProjectStatus,
        default: ProjectStatus.ACTIVE
    })
    status!: ProjectStatus;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'owner_id' })
    owner!: User;

    @Column({ name: 'owner_id' })
    ownerId!: number;

    @OneToMany(() => ProjectMember, projectMember => projectMember.project)
    projectMembers!: ProjectMember[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @Column({ nullable: true, name: 'due_date' })
    dueDate!: Date;
}