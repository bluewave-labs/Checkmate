import { IUsersRepository } from "@/domain/users/user.repository.interface.js";
import { UserModel, type UserDocument } from "@/domain/users/user.model.js";
import type { User, UserProfileImage } from "@/domain/users/user.type.js";
import { GenerateAvatarImage } from "@/utils/imageProcessing.js";
import { ParseBoolean } from "@/utils/utils.js";
import { AppError } from "@/utils/AppError.js";
import { toStringId, toDateString } from "@/utils/mongoMappers.js";
const SERVICE_NAME = "MongoUsersRepository";

class MongoUsersRepository implements IUsersRepository {
	static SERVICE_NAME = SERVICE_NAME;

	private mapProfileImage = (image?: (UserProfileImage & { data?: Buffer }) | null) => {
		if (!image) {
			return undefined;
		}
		return {
			data: image.data,
			contentType: image.contentType,
		};
	};

	private toEntity = (doc: UserDocument): User => {
		return {
			id: toStringId(doc._id),
			firstName: doc.firstName,
			lastName: doc.lastName,
			email: doc.email,
			password: doc.password,
			avatarImage: doc.avatarImage ?? undefined,
			profileImage: this.mapProfileImage(doc.profileImage),
			isActive: doc.isActive ?? false,
			isVerified: doc.isVerified ?? false,
			role: doc.role ?? [],
			teamId: toStringId(doc.teamId),
			checkTTL: doc.checkTTL ?? undefined,
			createdAt: toDateString(doc.createdAt),
			updatedAt: toDateString(doc.updatedAt),
		};
	};

	create = async (user: Partial<User>, imageFile: Express.Multer.File | null) => {
		if (imageFile) {
			// 1.  Save the full size image
			user.profileImage = {
				data: imageFile.buffer,
				contentType: imageFile.mimetype,
			};

			// 2.  Get the avatar sized image
			const avatar = await GenerateAvatarImage(imageFile);
			user.avatarImage = avatar;
		}

		const newUser = new UserModel(user);
		await newUser.save();
		const sanitizedUser = await UserModel.findOne({ _id: newUser._id }).select("-password").select("-profileImage");
		if (!sanitizedUser) {
			throw new AppError({ message: "Failed to create user", service: SERVICE_NAME, status: 500 });
		}
		return this.toEntity(sanitizedUser);
	};

	findByEmail = async (email: string) => {
		const user = await UserModel.findOne({ email: email }).select("-profileImage");
		if (!user) {
			throw new AppError({ message: "User not found", service: SERVICE_NAME, status: 404 });
		}
		return this.toEntity(user);
	};

	findById = async (id: string) => {
		const user = await UserModel.findById(id).select("-password").select("-profileImage");
		if (!user) {
			throw new Error("User not found");
		}

		return this.toEntity(user);
	};

	findAll = async () => {
		const users = await UserModel.find().select("-password").select("-profileImage");
		return this.mapDocuments(users);
	};

	updateById = async (id: string, patch: Partial<User & { deleteProfileImage?: boolean }>, file?: Express.Multer.File | null): Promise<User> => {
		const candidateUser = { ...patch };
		let unsetFields: Record<string, 1> | undefined;

		if (ParseBoolean(candidateUser.deleteProfileImage) === true) {
			unsetFields = { profileImage: 1, avatarImage: 1 };
			delete candidateUser.deleteProfileImage;
		} else if (file) {
			// 1.  Save the full size image
			candidateUser.profileImage = {
				data: file.buffer,
				contentType: file.mimetype,
			};

			// 2.  Get the avatar sized image
			const avatar = await GenerateAvatarImage(file);
			candidateUser.avatarImage = avatar;
		}

		delete candidateUser.deleteProfileImage;

		const updateQuery: Record<string, unknown> = { $set: candidateUser };
		if (unsetFields) {
			updateQuery.$unset = unsetFields;
		}

		const updatedUser = await UserModel.findOneAndUpdate({ _id: id }, updateQuery, { new: true }).select("-password").select("-profileImage");
		if (!updatedUser) {
			throw new AppError({ message: "User not found", service: SERVICE_NAME, status: 404 });
		}
		return this.toEntity(updatedUser);
	};

	deleteById = async (id: string) => {
		const deletedUser = await UserModel.findByIdAndDelete(id);
		if (!deletedUser) {
			throw new AppError({ message: "User not found", service: SERVICE_NAME, status: 404 });
		}
		return this.toEntity(deletedUser);
	};

	findSuperAdmin = async () => {
		const superAdmin = await UserModel.findOne({ role: "superadmin" });
		if (superAdmin !== null) {
			return true;
		}
		return false;
	};

	private mapDocuments = (documents: UserDocument[]): User[] => {
		if (!documents?.length) {
			return [];
		}
		return documents.map((doc) => this.toEntity(doc));
	};
}

export default MongoUsersRepository;
