import {Repository} from "typeorm";
import {User} from "../entity/User";
import {AppDataSource} from "../../data-source";

class AuthService {
    private userRepository: Repository<User>;
    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
    }

    async register(user: User): Promise<User> {
        const newUser = this.userRepository.create(user);
        return await this.userRepository.save(newUser);
    }

    async login(login: string, password: string): Promise<User | null> {
        return await this.userRepository.findOneBy({login, password});
    }

}