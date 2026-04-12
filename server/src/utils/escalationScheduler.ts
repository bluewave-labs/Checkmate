export type EscalationStep = {
  delayMinutes: number;
  email: string;
};

export function scheduleEscalationNotifications(
  monitorId: string,
  monitorName: string,
  steps: EscalationStep[],
  isMonitorDown: (monitorId: string) => Promise<boolean> | boolean,
  sendEmail: (email: string, subject: string, body: string) => Promise<void> | void
) {
  const timers: NodeJS.Timeout[] = [];

  for (const step of steps) {
    const delayMs = step.delayMinutes * 60_000;

    const timer = setTimeout(async () => {
      const stillDown = await Promise.resolve(isMonitorDown(monitorId));
      if (!stillDown) return;

      const subject = `[Checkmate] Monitor "${monitorName}" still down`;
      const body = `
Monitor: ${monitorName}
Status: Still down
Time elapsed: ${step.delayMinutes} minute(s)

Please investigate the issue.
`;

      await Promise.resolve(sendEmail(step.email, subject, body));
    }, delayMs);

    timers.push(timer);
  }

  return {
    cancel: () => timers.forEach(clearTimeout),
  };
}