import {ContactStatus} from "../src/entity/Contact";

export interface ISendRequestDto {
    contactId: number;
}

export interface IContactResponse {
    id: number;
    contactId: number;
    contact: {
        id: number;
        name: string;
        login: string;
        avatar?: string;
        email?: string;
    };
    userId: number;
    status: ContactStatus;
    createdAt: Date;
    updatedAt: Date;
}