// src/services/ProjectService.ts
import { Repository } from "typeorm";
import { Project, ProjectPrivacy, ProjectStatus } from "../entity/Project";
import { ProjectMember } from "../entity/ProjectMember";
import { User } from "../entity/User";
import { Contact, ContactStatus } from "../entity/Contact";
import { AppDataSource } from "../../data-source";

interface ICreateProjectDto {
    name: string;
    description?: string;
    image?: string;
    privacy?: ProjectPrivacy;
    memberIds?: number[];
    dueDate?: Date;
}

interface IUpdateProjectDto {
    name?: string;
    description?: string;
    image?: string;
    privacy?: ProjectPrivacy;
    status?: ProjectStatus;
    dueDate?: Date;
}

interface IAddMembersDto {
    userIds: number[];
    role?: string;
}

interface IProjectResponse {
    id: number;
    name: string;
    description?: string;
    image?: string;
    privacy: ProjectPrivacy;
    status: ProjectStatus;
    ownerId: number;
    owner: {
        id: number;
        name: string;
        login: string;
        avatar?: string;
    };
    members: Array<{
        id: number;
        name: string;
        login: string;
        avatar?: string;
        role: string;
        joinedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
    dueDate?: Date;
}

export class ProjectService {
    private projectRepository: Repository<Project>;
    private userRepository: Repository<User>;
    private projectMemberRepository: Repository<ProjectMember>;
    private contactRepository: Repository<Contact>;

    constructor() {
        this.projectRepository = AppDataSource.getRepository(Project);
        this.userRepository = AppDataSource.getRepository(User);
        this.projectMemberRepository = AppDataSource.getRepository(ProjectMember);
        this.contactRepository = AppDataSource.getRepository(Contact);
    }

    async createProject(userId: number, createDto: ICreateProjectDto): Promise<IProjectResponse> {
        const owner = await this.userRepository.findOneBy({ id: userId });
        if (!owner) {
            throw new Error('Пользователь не найден');
        }

        const project = this.projectRepository.create({
            name: createDto.name,
            description: createDto.description,
            image: createDto.image,
            privacy: createDto.privacy || ProjectPrivacy.PRIVATE,
            ownerId: userId,
            dueDate: createDto.dueDate
        });

        const savedProject = await this.projectRepository.save(project);

        await this.projectMemberRepository.save({
            projectId: savedProject.id,
            userId: userId,
            role: 'owner',
            invitedBy: userId
        });

        if (createDto.memberIds && createDto.memberIds.length > 0) {
            await this.addMembers(userId, savedProject.id, {
                userIds: createDto.memberIds,
                role: 'member'
            });
        }

        const projectWithDetails = await this.getProjectWithDetails(savedProject.id);
        if (!projectWithDetails) {
            throw new Error('Ошибка при создании проекта');
        }

        return projectWithDetails;
    }

    async updateProject(userId: number, projectId: number, updateDto: IUpdateProjectDto): Promise<IProjectResponse> {
        const project = await this.projectRepository.findOneBy({ id: projectId });
        if (!project) {
            throw new Error('Проект не найден');
        }

        const member = await this.projectMemberRepository.findOne({
            where: { projectId, userId }
        });

        if (!member) {
            throw new Error('Вы не участник проекта');
        }

        if (member.role !== 'owner' && member.role !== 'admin') {
            throw new Error('Нет прав для редактирования проекта');
        }

        Object.assign(project, updateDto);
        await this.projectRepository.save(project);

        const updatedProject = await this.getProjectWithDetails(projectId);
        if (!updatedProject) {
            throw new Error('Ошибка при получении обновленного проекта');
        }

        return updatedProject;
    }

    async deleteProject(userId: number, projectId: number): Promise<void> {
        const member = await this.projectMemberRepository.findOne({
            where: { projectId, userId, role: 'owner' }
        });

        if (!member) {
            throw new Error('Только владелец может удалить проект');
        }

        await this.projectRepository.delete(projectId);
    }

    async getProject(userId: number, projectId: number): Promise<IProjectResponse> {
        const project = await this.getProjectWithDetails(projectId);
        if (!project) {
            throw new Error('Проект не найден');
        }

        if (!await this.hasAccessToProject(userId, project)) {
            throw new Error('Нет доступа к проекту');
        }

        return project;
    }

    async getUserProjects(userId: number): Promise<IProjectResponse[]> {
        const projectMembers = await this.projectMemberRepository.find({
            where: { userId },
            relations: ['project', 'project.owner']
        });

        const projects = projectMembers.map(pm => pm.project);

        return Promise.all(projects.map(async project => {
            const members = await this.getProjectMembers(project.id);
            return {
                id: project.id,
                name: project.name,
                description: project.description,
                image: project.image,
                privacy: project.privacy,
                status: project.status,
                ownerId: project.ownerId,
                owner: {
                    id: project.owner.id,
                    name: project.owner.name,
                    login: project.owner.login,
                    avatar: project.owner.avatar
                },
                members: members,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                dueDate: project.dueDate
            };
        }));
    }

    async addMembers(userId: number, projectId: number, addMembersDto: IAddMembersDto): Promise<IProjectResponse> {
        const member = await this.projectMemberRepository.findOne({
            where: { projectId, userId }
        });

        if (!member) {
            throw new Error('Вы не участник проекта');
        }

        if (member.role !== 'owner' && member.role !== 'admin') {
            throw new Error('Нет прав для добавления участников');
        }

        const users = await this.userRepository.findByIds(addMembersDto.userIds);
        const existingMembers = await this.projectMemberRepository.find({
            where: { projectId }
        });

        const existingUserIds = existingMembers.map(m => m.userId);
        const newUsers = users.filter(u => !existingUserIds.includes(u.id));

        const membersToAdd = newUsers.map(user =>
            this.projectMemberRepository.create({
                projectId,
                userId: user.id,
                role: addMembersDto.role || 'member',
                invitedBy: userId
            })
        );

        await this.projectMemberRepository.save(membersToAdd);

        const updatedProject = await this.getProjectWithDetails(projectId);

        if (!updatedProject) {
            throw new Error('Ошибка при получении обновленного проекта');
        }

        return updatedProject;
    }

    async removeMember(userId: number, projectId: number, memberId: number): Promise<void> {
        const member = await this.projectMemberRepository.findOne({
            where: { projectId, userId }
        });

        if (!member) {
            throw new Error('Вы не участник проекта');
        }

        if (member.role !== 'owner' && userId !== memberId) {
            throw new Error('Нет прав для удаления участников');
        }

        const targetMember = await this.projectMemberRepository.findOne({
            where: { projectId, userId: memberId }
        });

        if (!targetMember) {
            throw new Error('Участник не найден');
        }

        if (targetMember.role === 'owner') {
            throw new Error('Нельзя удалить владельца проекта');
        }

        await this.projectMemberRepository.delete({ projectId, userId: memberId });
    }

    async updateMemberRole(userId: number, projectId: number, memberId: number, role: string): Promise<void> {
        const member = await this.projectMemberRepository.findOne({
            where: { projectId, userId, role: 'owner' }
        });

        if (!member) {
            throw new Error('Только владелец может менять роли');
        }

        const targetMember = await this.projectMemberRepository.findOne({
            where: { projectId, userId: memberId }
        });

        if (!targetMember) {
            throw new Error('Участник не найден');
        }

        targetMember.role = role;
        await this.projectMemberRepository.save(targetMember);
    }

    async getProjectMembers(projectId: number) {
        const members = await this.projectMemberRepository.find({
            where: { projectId },
            relations: ['user'],
            order: { joinedAt: 'ASC' }
        });

        return members.map(member => ({
            id: member.user.id,
            name: member.user.name,
            login: member.user.login,
            avatar: member.user.avatar,
            role: member.role,
            joinedAt: member.joinedAt
        }));
    }

    async searchContactsForProject(userId: number, projectId: number, search: string) {
        const contacts = await this.contactRepository.find({
            where: [
                { userId, status: ContactStatus.ACCEPTED },
                { contactId: userId, status: ContactStatus.ACCEPTED }
            ],
            relations: ['user', 'contact']
        });

        const contactIds = contacts.map(c =>
            c.userId === userId ? c.contactId : c.userId
        );

        const existingMembers = await this.projectMemberRepository.find({
            where: { projectId }
        });

        const existingUserIds = existingMembers.map(m => m.userId);
        const availableUserIds = contactIds.filter(id => !existingUserIds.includes(id));

        if (availableUserIds.length === 0) {
            return [];
        }

        const users = await this.userRepository
            .createQueryBuilder('user')
            .where('user.id IN (:...ids)', { ids: availableUserIds })
            .andWhere('user.isActive = true')
            .andWhere('(user.name ILIKE :search OR user.login ILIKE :search)')
            .setParameter('search', `%${search}%`)
            .select(['user.id', 'user.name', 'user.login', 'user.avatar', 'user.email'])
            .limit(10)
            .getMany();

        return users;
    }

    private async getProjectWithDetails(projectId: number): Promise<IProjectResponse | null> {
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
            relations: ['owner']
        });

        if (!project) return null;

        const members = await this.getProjectMembers(projectId);

        return {
            id: project.id,
            name: project.name,
            description: project.description,
            image: project.image,
            privacy: project.privacy,
            status: project.status,
            ownerId: project.ownerId,
            owner: {
                id: project.owner.id,
                name: project.owner.name,
                login: project.owner.login,
                avatar: project.owner.avatar
            },
            members: members,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            dueDate: project.dueDate
        };
    }

    private async hasAccessToProject(userId: number, project: IProjectResponse): Promise<boolean> {
        const member = await this.projectMemberRepository.findOne({
            where: { projectId: project.id, userId }
        });

        if (member) {
            return true;
        }

        if (project.privacy === ProjectPrivacy.PUBLIC) {
            return true;
        }

        if (project.privacy === ProjectPrivacy.CONTACTS_ONLY) {
            const isContact = await this.contactRepository.findOne({
                where: [
                    { userId: project.ownerId, contactId: userId, status: ContactStatus.ACCEPTED },
                    { userId: userId, contactId: project.ownerId, status: ContactStatus.ACCEPTED }
                ]
            });
            return !!isContact;
        }

        return false;
    }
}