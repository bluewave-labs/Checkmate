import { z } from "zod";

export const urlRegex =
  /^(https?:\/\/)?(localhost|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|[a-zA-Z0-9-]+|(\d{1,3}\.){3}\d{1,3})(:\d{1,5})?(\/.*)?$/;

export const booleanString = () =>
  z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => (typeof val === "string" ? val === "true" : val));

