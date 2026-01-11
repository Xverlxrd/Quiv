import { Repository } from "typeorm";
import { Contact, ContactStatus } from "../entity/Contact";
import { User } from "../entity/User";
import { AppDataSource } from "../../data-source";
import {IContactResponse, ISendRequestDto} from "../../types/contacts";



export class ContactService {
    private contactRepository: Repository<Contact>;
    private userRepository: Repository<User>;

    constructor() {
        this.contactRepository = AppDataSource.getRepository(Contact);
        this.userRepository = AppDataSource.getRepository(User);
    }

    async sendRequest(userId: number, sendRequestDto: ISendRequestDto): Promise<IContactResponse> {
        if (userId === sendRequestDto.contactId) {
            throw new Error('Нельзя добавить самого себя');
        }

        const targetUser = await this.userRepository.findOne({
            where: { id: sendRequestDto.contactId, isActive: true }
        });

        if (!targetUser) {
            throw new Error('Пользователь не найден');
        }

        const existingContact = await this.contactRepository.findOne({
            where: [
                { userId, contactId: sendRequestDto.contactId },
                { userId: sendRequestDto.contactId, contactId: userId }
            ]
        });

        if (existingContact) {
            if (existingContact.status === ContactStatus.PENDING) {
                if (existingContact.userId === userId) {
                    throw new Error('Запрос уже отправлен');
                } else {
                    throw new Error('У вас есть входящий запрос от этого пользователя');
                }
            }
            if (existingContact.status === ContactStatus.ACCEPTED) {
                throw new Error('Пользователь уже в контактах');
            }
            if (existingContact.status === ContactStatus.BLOCKED) {
                throw new Error('Пользователь заблокирован');
            }
        }

        const contact = this.contactRepository.create({
            userId,
            contactId: sendRequestDto.contactId,
            status: ContactStatus.PENDING
        });

        const savedContact = await this.contactRepository.save(contact);
        return this.mapToResponse(savedContact);
    }

    async acceptRequest(userId: number, contactId: number): Promise<IContactResponse> {
        const contact = await this.contactRepository.findOne({
            where: {
                id: contactId,
                contactId: userId,
                status: ContactStatus.PENDING
            },
            relations: ['user']
        });

        if (!contact) {
            throw new Error('Запрос не найден');
        }

        contact.status = ContactStatus.ACCEPTED;
        const updatedContact = await this.contactRepository.save(contact);
        return this.mapToResponse(updatedContact);
    }

    async rejectRequest(userId: number, contactId: number): Promise<IContactResponse> {
        const contact = await this.contactRepository.findOne({
            where: {
                id: contactId,
                contactId: userId,
                status: ContactStatus.PENDING
            },
            relations: ['user']
        });

        if (!contact) {
            throw new Error('Запрос не найден');
        }

        contact.status = ContactStatus.REJECTED;
        const updatedContact = await this.contactRepository.save(contact);
        return this.mapToResponse(updatedContact);
    }

    async blockUser(userId: number, targetUserId: number): Promise<IContactResponse> {
        if (userId === targetUserId) {
            throw new Error('Нельзя заблокировать самого себя');
        }

        const targetUser = await this.userRepository.findOne({
            where: { id: targetUserId, isActive: true }
        });

        if (!targetUser) {
            throw new Error('Пользователь не найден');
        }

        let contact = await this.contactRepository.findOne({
            where: [
                { userId, contactId: targetUserId },
                { userId: targetUserId, contactId: userId }
            ]
        });

        if (contact) {
            contact.status = ContactStatus.BLOCKED;
        } else {
            contact = this.contactRepository.create({
                userId,
                contactId: targetUserId,
                status: ContactStatus.BLOCKED
            });
        }

        const savedContact = await this.contactRepository.save(contact);
        return this.mapToResponse(savedContact);
    }

    async unblockUser(userId: number, targetUserId: number): Promise<void> {
        const contact = await this.contactRepository.findOne({
            where: {
                userId,
                contactId: targetUserId,
                status: ContactStatus.BLOCKED
            }
        });

        if (!contact) {
            throw new Error('Пользователь не заблокирован');
        }

        await this.contactRepository.remove(contact);
    }

    async removeContact(userId: number, contactId: number): Promise<void> {
        const contact = await this.contactRepository.findOne({
            where: [
                { userId, id: contactId },
                { contactId: userId, id: contactId }
            ]
        });

        if (!contact) {
            throw new Error('Контакт не найден');
        }

        await this.contactRepository.remove(contact);
    }

    async getContacts(userId: number, status?: ContactStatus): Promise<IContactResponse[]> {
        const where: any = { userId };
        if (status) {
            where.status = status;
        }

        const contacts = await this.contactRepository.find({
            where,
            relations: ['contact'],
            order: { updatedAt: 'DESC' }
        });

        return contacts.map(contact => this.mapToResponse(contact));
    }

    async getIncomingRequests(userId: number): Promise<IContactResponse[]> {
        const contacts = await this.contactRepository.find({
            where: {
                contactId: userId,
                status: ContactStatus.PENDING
            },
            relations: ['user'],
            order: { createdAt: 'DESC' }
        });

        return contacts.map(contact => this.mapToResponse(contact));
    }

    async getOutgoingRequests(userId: number): Promise<IContactResponse[]> {
        const contacts = await this.contactRepository.find({
            where: {
                userId,
                status: ContactStatus.PENDING
            },
            relations: ['contact'],
            order: { createdAt: 'DESC' }
        });

        return contacts.map(contact => this.mapToResponse(contact));
    }

    async getContactStatus(userId: number, targetUserId: number): Promise<IContactResponse | null> {
        const contact = await this.contactRepository.findOne({
            where: [
                { userId, contactId: targetUserId },
                { userId: targetUserId, contactId: userId }
            ],
            relations: ['user', 'contact']
        });

        if (!contact) {
            return null;
        }

        return this.mapToResponse(contact);
    }

    async searchUsers(userId: number, search: string): Promise<any[]> {
        const subQuery = this.contactRepository
            .createQueryBuilder('c')
            .select('c.contactId')
            .where('c.userId = :userId')
            .getQuery();

        const users = await this.userRepository
            .createQueryBuilder('user')
            .where('user.id != :userId', { userId })
            .andWhere('user.isActive = true')
            .andWhere(`user.id NOT IN (${subQuery})`)
            .andWhere('(user.name ILIKE :search OR user.login ILIKE :search)')
            .setParameter('search', `%${search}%`)
            .select(['user.id', 'user.name', 'user.login', 'user.avatar', 'user.email'])
            .limit(10)
            .getMany();

        return users;
    }

    private mapToResponse(contact: Contact): IContactResponse {
        const contactUser = contact.contactId === contact.contact?.id ? contact.contact : contact.user;

        return {
            id: contact.id,
            contactId: contact.contactId,
            contact: {
                id: contactUser.id,
                name: contactUser.name,
                login: contactUser.login,
                avatar: contactUser.avatar,
                email: contactUser.email
            },
            userId: contact.userId,
            status: contact.status,
            createdAt: contact.createdAt,
            updatedAt: contact.updatedAt
        };
    }
}