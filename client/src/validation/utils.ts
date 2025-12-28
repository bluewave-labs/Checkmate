import { z } from "zod";
import humanInterval from "human-interval";
import ms from "ms";

export const urlRegex =
  /^(https?:\/\/)?(localhost|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|[a-zA-Z0-9-]+|(\d{1,3}\.){3}\d{1,3})(:\d{1,5})?(\/.*)?$/;

export const durationSchema = (minInterval: number) =>
  z.string().superRefine((val, ctx) => {
    const milis = humanInterval(val);

    if (!milis || isNaN(milis)) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid duration format",
      });
    } else if (milis < minInterval) {
      ctx.addIssue({
        code: "custom",
        message: `Minimum duration is ${ms(minInterval, { long: true })}`,
      });
    }
  });

export const optionalString = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined ? undefined : val,
    schema.optional()
  );
