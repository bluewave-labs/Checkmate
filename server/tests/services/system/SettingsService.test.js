import SettingsService from "@/services/system/SettingsService.js";
import ApiError from "@/utils/ApiError.js";

// Mock models and mongoose db
jest.mock("@/db/models/index.js", () => ({
  SystemSettings: {
    findById: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));
import { SystemSettings } from "@/db/models/index.js";

jest.mock("mongoose", () => ({
  connection: { db: null },
}));
import mongoose from "mongoose";

// Mock EmailService used via setEmailService
class MockEmailService {
  rebuildTransport = jest.fn();
}

describe("SettingsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("get", () => {
    it("creates default settings when missing and returns settings", async () => {
      const select = (v) => ({ select: jest.fn().mockResolvedValue(v) });
      SystemSettings.findById
        .mockReturnValueOnce(select(null)) // initial check
        .mockReturnValueOnce(select({ _id: "global", systemEmailHost: "" })); // after create
      SystemSettings.create.mockResolvedValue({ _id: "global" });

      const svc = new SettingsService();
      const res = await svc.get();
      expect(SystemSettings.create).toHaveBeenCalledWith({ _id: "global" });
      expect(res).toEqual({ _id: "global", systemEmailHost: "" });
    });

    it("throws when settings cannot be loaded after create", async () => {
      const select = (v) => ({ select: jest.fn().mockResolvedValue(v) });
      SystemSettings.findById
        .mockReturnValueOnce(select(null))
        .mockReturnValueOnce(select(null));
      SystemSettings.create.mockResolvedValue({ _id: "global" });

      const svc = new SettingsService();
      await expect(svc.get()).rejects.toMatchObject({
        message: "Unable to load system settings",
        status: 500,
      });
    });
  });

  describe("updateEmailSettings", () => {
    it("sets provided fields, unsets others, rebuilds transport and returns settings", async () => {
      const incoming = {
        systemEmailHost: "smtp.example.com",
        systemEmailPort: 587,
        systemEmailSecure: false,
      };
      const updated = { _id: "global", ...incoming };
      SystemSettings.findOneAndUpdate.mockResolvedValue(updated);

      const svc = new SettingsService();
      const email = new MockEmailService();
      svc.setEmailService(email);
      const res = await svc.updateEmailSettings(incoming);

      expect(SystemSettings.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "global" },
        expect.objectContaining({ $set: expect.any(Object), $unset: expect.any(Object) }),
        expect.objectContaining({ new: true, upsert: true, setDefaultsOnInsert: true })
      );
      expect(email.rebuildTransport).toHaveBeenCalledWith(updated);
      expect(res).toBe(updated);
    });

    it("throws when update returns no settings", async () => {
      SystemSettings.findOneAndUpdate.mockResolvedValue(null);
      const svc = new SettingsService();
      const email = new MockEmailService();
      svc.setEmailService(email);
      await expect(svc.updateEmailSettings({})).rejects.toMatchObject({
        message: "Unable to update system settings",
        status: 500,
      });
    });
  });

  describe("updateRetentionPolicy", () => {
    it("updates TTL via db.command and verifies expireAfterSeconds", async () => {
      SystemSettings.findOneAndUpdate.mockResolvedValue({ _id: "global" });
      const mockDb = {
        command: jest
          .fn()
          // collMod
          .mockResolvedValueOnce({ ok: 1 })
          // listCollections
          .mockResolvedValueOnce({ cursor: { firstBatch: [{ options: { expireAfterSeconds: 86400 } }] }, ok: 1 }),
      };
      mongoose.connection.db = mockDb;

      const svc = new SettingsService();
      const result = await svc.updateRetentionPolicy(1); // 1 day
      expect(mockDb.command).toHaveBeenCalledWith({ collMod: "checks", expireAfterSeconds: 86400 });
      expect(result).toBe(1);
    });

    it("throws when db not initialized", async () => {
      SystemSettings.findOneAndUpdate.mockResolvedValue({ _id: "global" });
      mongoose.connection.db = null;
      const svc = new SettingsService();
      await expect(svc.updateRetentionPolicy(1)).rejects.toMatchObject({
        message: "Database not initialized",
        status: 500,
      });
    });

    it("throws when collMod fails", async () => {
      SystemSettings.findOneAndUpdate.mockResolvedValue({ _id: "global" });
      const mockDb = { command: jest.fn().mockResolvedValueOnce({ ok: 0 }) };
      mongoose.connection.db = mockDb;
      const svc = new SettingsService();
      await expect(svc.updateRetentionPolicy(1)).rejects.toMatchObject({
        message: "Failed to apply TTL to checks collection",
        status: 500,
      });
    });

    it("throws when TTL verification fails", async () => {
      SystemSettings.findOneAndUpdate.mockResolvedValue({ _id: "global" });
      const mockDb = {
        command: jest
          .fn()
          .mockResolvedValueOnce({ ok: 1 })
          .mockResolvedValueOnce({ cursor: { firstBatch: [{ options: { expireAfterSeconds: 30 } }] }, ok: 1 }),
      };
      mongoose.connection.db = mockDb;
      const svc = new SettingsService();
      await expect(svc.updateRetentionPolicy(1)).rejects.toMatchObject({
        message: "TTL verification failed: expireAfterSeconds not applied",
        status: 500,
      });
    });
  });
});
