import { z } from "zod";

export const teamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  roleId: z.string().min(1, "Role is required"),
  description: z.string().optional(),
});

export const teamMemberSchema = z.object({
  userId: z.string().min(1, "User is required"),
  roleId: z.string().min(1, "Role is required"),
  teamId: z.string().min(1, "Team is required"),
});

