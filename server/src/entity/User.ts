import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
    OneToMany
} from 'typeorm';
import { Contact } from "./Contact";
import { Project } from "./Project";
import { ProjectMember } from "./ProjectMember";

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

    @OneToMany(() => Contact, contact => contact.user)
    contacts!: Contact[];

    @OneToMany(() => Contact, contact => contact.contact)
    addedBy!: Contact[];

    @OneToMany(() => Project, project => project.owner)
    ownedProjects!: Project[];

    @OneToMany(() => ProjectMember, projectMember => projectMember.user)
    projectMemberships!: ProjectMember[];
}