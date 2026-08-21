import { IProxiesRepository } from "@/domain/proxies/proxy.repository.interface.js";
import { Proxy } from "@/domain/proxies/proxy.type.js";
import { ProxyDocument, ProxyModel } from "@/domain/proxies/proxy.model.js";
import { AppError } from "@/utils/AppError.js";
import { toStringId, toDateString } from "@/utils/mongoMappers.js";
import { Error as MongooseError, UpdateQuery } from "mongoose";

const SERVICE_NAME = "ProxiesRepository";

class MongoProxiesRepository implements IProxiesRepository {
	static SERVICE_NAME = SERVICE_NAME;

	private toEntity = (doc: ProxyDocument): Proxy => {
		return {
			id: toStringId(doc._id),
			teamId: toStringId(doc.teamId),
			name: doc.name,
			protocol: doc.protocol,
			host: doc.host,
			port: doc.port,
			username: doc.username,
			password: doc.password,
			createdAt: toDateString(doc.createdAt),
			updatedAt: toDateString(doc.updatedAt),
		};
	};

	async create(proxyData: Partial<Proxy>): Promise<Proxy> {
		try {
			const proxy = await ProxyModel.create({ ...proxyData });
			return this.toEntity(proxy);
		} catch (error) {
			if (error && typeof error === "object" && (error as { code?: number }).code === 11000) {
				throw new AppError({ message: `A proxy named "${proxyData.name}" already exists`, service: SERVICE_NAME, status: 409 });
			}
			throw error;
		}
	}

	async findById(proxyId: string, teamId: string): Promise<Proxy> {
		const proxy = await ProxyModel.findOne({ _id: proxyId, teamId });
		if (!proxy) {
			throw new AppError({ message: "Proxy not found", service: SERVICE_NAME, status: 404 });
		}
		return this.toEntity(proxy);
	}

	async findByIdOrNull(proxyId: string, teamId?: string): Promise<Proxy | null> {
		try {
			const proxy = await ProxyModel.findOne(teamId ? { _id: proxyId, teamId } : { _id: proxyId });
			return proxy ? this.toEntity(proxy) : null;
		} catch (error) {
			if (error instanceof MongooseError.CastError) {
				return null;
			}
			throw error;
		}
	}

	async findByTeamId(teamId: string): Promise<Proxy[]> {
		const proxies = await ProxyModel.find({ teamId });
		return proxies.map(this.toEntity);
	}

	async updateById(
		proxyId: string,
		teamId: string,
		patch: Partial<Proxy>,
		options?: { unsetPassword?: boolean; unsetUsername?: boolean }
	): Promise<Proxy> {
		try {
			const update: UpdateQuery<ProxyDocument> = {
				$set: {
					...patch,
				},
			};
			if (options?.unsetPassword) {
				delete update.$set?.password;
				update.$unset = { ...update.$unset, password: 1 };
			}
			if (options?.unsetUsername) {
				delete update.$set?.username;
				update.$unset = { ...update.$unset, username: 1 };
			}
			const updatedProxy = await ProxyModel.findOneAndUpdate({ _id: proxyId, teamId }, update, { new: true, runValidators: true });
			if (!updatedProxy) {
				throw new AppError({ message: "Proxy not found or could not be updated", service: SERVICE_NAME, status: 404 });
			}
			return this.toEntity(updatedProxy);
		} catch (error) {
			if (error && typeof error === "object" && (error as { code?: number }).code === 11000) {
				throw new AppError({ message: `A proxy named "${patch.name}" already exists`, service: SERVICE_NAME, status: 409 });
			}
			throw error;
		}
	}

	async deleteById(proxyId: string, teamId: string): Promise<Proxy> {
		const deletedProxy = await ProxyModel.findOneAndDelete({ _id: proxyId, teamId });
		if (!deletedProxy) {
			throw new AppError({ message: "Proxy not found or could not be deleted", service: SERVICE_NAME, status: 404 });
		}
		return this.toEntity(deletedProxy);
	}
}

export default MongoProxiesRepository;
