import { useMemo } from "react";
import type { Check } from "@/types/check";
import { HeatmapResponseTime } from "@/components/common/HeatmapResponseTime";
import { HistogramResponseTime } from "@/components/common/HistogramResponseTime";
import type { ChartType } from "@/features/uiSlice";

const buildDummyChecks = (): Check[] => {
  const now = Date.now();
  const arr: Check[] = [] as any;
  for (let i = 0; i < 25; i++) {
    const ms = Math.floor(50 + Math.random() * 800);
    arr.push({
      id: `chk-${i}`,
      monitorId: "m1",
      type: "http",
      teamId: "t1",
      status: Math.random() > 0.3 ? "up" : "down",
      message: "",
      responseTime: ms,
      httpStatusCode: 200,
      expiry: new Date(now - i * 60000).toISOString(),
      createdAt: new Date(now - i * 60000).toISOString(),
      updatedAt: new Date(now - i * 60000).toISOString(),
      timings: {
        start: "",
        socket: "",
        lookup: "",
        connect: "",
        secureConnect: "",
        response: "",
        end: "",
        phases: {
          wait: 0,
          dns: 0,
          tcp: 0,
          tls: 0,
          request: 0,
          firstByte: 0,
          download: 0,
          total: ms,
        },
      },
    });
  }
  return arr;
};

const DummyChart = ({ type }: { type: ChartType }) => {
  const checks = useMemo(() => buildDummyChecks(), []);

  return type === "heatmap" ? (
    <HeatmapResponseTime checks={checks} />
  ) : (
    <HistogramResponseTime checks={checks} />
  );
};

export default DummyChart;
