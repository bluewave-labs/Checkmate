import type { User } from "@/types/index.js";
export interface IUsersRepository {
	// create
	create(user: Partial<User>, imageFile?: Express.Multer.File | null): Promise<User>;
	// fetch
	findByEmail(email: string): Promise<User>;
	findById(id: string): Promise<User>;
	findAll(): Promise<User[]>;
	// update
	updateById(id: string, patch: Partial<User>, file?: Express.Multer.File | null): Promise<User>;
	// delete
	deleteById(id: string): Promise<User>;
	// other
	findSuperAdmin(): Promise<boolean>;
}
