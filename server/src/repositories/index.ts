export type {
  IMonitorRepository,
  TeamQueryConfig,
} from "@/repositories/monitors/IMonitorRepoistory.js";
export { default as MongoMonitorRepository } from "@/repositories/monitors/MongoMonitorRepository.js";

export type { IChecksRepository } from "@/repositories/checks/IChecksRepository.js";
export { default as MongoChecksRepository } from "@/repositories/checks/MongoCheckRepository.js";
