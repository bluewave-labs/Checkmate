import { IEncryptionService } from "@/service/encryption/encryptionService.js";
import { ITeamsRepository } from "@/domain/teams/team.repository.interface.js";
import { HeartbeatKeyResult, HeartbeatKeyStatusResult } from "@/domain/teams/team.schema.js";
import { ILogger } from "@/utils/logger/logger.js";

const SERVICE_NAME = "TeamService";
const HEARTBEAT_KEY_BYTES = 24;

export interface ITeamService {
	getHeartbeatKeyStatus(teamId: string): Promise<HeartbeatKeyStatusResult>;
	rotateHeartbeatKey(teamId: string, userId: string): Promise<HeartbeatKeyResult>;
}

export interface TeamServiceDependencies {
	logger: ILogger;
	teamsRepository: ITeamsRepository;
	encryptionService: IEncryptionService;
}

export class TeamService implements ITeamService {
	static SERVICE_NAME = SERVICE_NAME;
	private logger: ILogger;

	constructor(private deps: TeamServiceDependencies) {
		this.logger = deps.logger.child({ service: SERVICE_NAME });
	}

	getHeartbeatKeyStatus = async (teamId: string): Promise<HeartbeatKeyStatusResult> => {
		const hasKey = await this.deps.teamsRepository.hasHeartbeatKey(teamId);
		return { hasKey };
	};

	rotateHeartbeatKey = async (teamId: string, userId: string): Promise<HeartbeatKeyResult> => {
		const heartbeatKey = this.deps.encryptionService.getRandomToken(HEARTBEAT_KEY_BYTES);
		await this.deps.teamsRepository.setHeartbeatKey(teamId, this.deps.encryptionService.hash(heartbeatKey), userId);
		this.logger.info({ teamId, userId }, "Heartbeat key rotated");
		return { heartbeatKey };
	};
}
