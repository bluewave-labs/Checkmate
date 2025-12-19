import ApiError from "@/utils/ApiError.js";

export const getStartDate = (range: string): Date => {
  const now = new Date();
  switch (range) {
    case "all":
      return new Date(0);
    case "1h":
      return new Date(now.getTime() - 1 * 60 * 60 * 1000);
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      throw new ApiError("Invalid range parameter", 400);
  }
};
