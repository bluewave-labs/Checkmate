import type { IMonitor } from "@/types/monitor";

export interface IStatusPage {
  _id: string;
  name: string;
  description: string;
  url: string;
  isPublished: boolean;
  monitors: IMonitor[];
}

export interface IStatusPageWithChecksMap {
  statusPage: {
    _id: string;
    name: string;
    description: string;
    url: string;
    isPublished: boolean;
    monitors: IMonitor[];
  };
  checksMap: Record<string, any[]>;
}
