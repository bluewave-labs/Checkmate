import type { User, UserResponse } from "@/domain/users/user.type.js";
export interface IUsersRepository {
	// create
	create(user: Partial<User>, imageFile?: Express.Multer.File | null): Promise<UserResponse>;
	// fetch
	findByEmail(email: string): Promise<User>;
	findByEmailOrNull(email: string): Promise<User | null>;
	findBySsoSubject(issuer: string, subject: string): Promise<User | null>;
	findById(id: string): Promise<UserResponse>;
	findAll(): Promise<UserResponse[]>;
	// update
	updateById(id: string, patch: Partial<User>, file?: Express.Multer.File | null): Promise<UserResponse>;
	// delete
	deleteById(id: string): Promise<User>;
	// other
	findSuperAdmin(): Promise<boolean>;
}
