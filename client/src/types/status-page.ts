import type { IMonitor } from "@/types/monitor";

export interface IStatusPage {
  _id: string;
  name: string;
  description: string;
  url: string;
  isPublished: boolean;
  monitors: string[];
}

export interface IStatusPageWithMonitors {
  _id: string;
  name: string;
  description: string;
  url: string;
  isPublished: boolean;
  monitors: IMonitor[];
}
