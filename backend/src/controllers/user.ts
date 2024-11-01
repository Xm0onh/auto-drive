import { Router } from "express";
import { handleAuth } from "../services/authManager/express.js";
import { UsersUseCases } from "../useCases/index.js";
import { ApiKeysUseCases } from "../useCases/users/apikeys.js";
import { UserRole } from "../models/users/index.js";
import { SubscriptionsUseCases } from "../useCases/users/subscriptions.js";

const userController = Router();

userController.post("/@me/onboard", async (req, res) => {
  const user = await handleAuth(req, res);
  if (!user) {
    return;
  }

  try {
    const onboardedUser = await UsersUseCases.onboardUser(user);
    res.json(onboardedUser);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to onboard user" });
  }
});

userController.get("/@me", async (req, res) => {
  const user = await handleAuth(req, res);
  if (!user) {
    return;
  }

  try {
    const userInfo = await UsersUseCases.getUserInfo(user);

    res.json(userInfo);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to get user info" });
  }
});

userController.get("/@me/apiKeys", async (req, res) => {
  const user = await handleAuth(req, res);
  if (!user) {
    return;
  }

  try {
    const apiKeys = await ApiKeysUseCases.getApiKeysByUser(user);

    res.json(apiKeys);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to get API keys" });
  }
});

userController.post("/@me/apiKeys/create", async (req, res) => {
  const user = await handleAuth(req, res);
  if (!user) {
    return;
  }

  try {
    const apiKey = await ApiKeysUseCases.createApiKey(user);

    res.json(apiKey);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create API key" });
  }
});

userController.delete("/@me/apiKeys/:id", async (req, res) => {
  const user = await handleAuth(req, res);
  if (!user) {
    return;
  }

  const { id } = req.params;

  try {
    await ApiKeysUseCases.deleteApiKey(user, id);

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete API key" });
  }
});

userController.get("/search", async (req, res) => {
  const { publicId } = req.query;

  if (typeof publicId !== "string") {
    return res
      .status(400)
      .json({ error: "Missing or invalid attribute `publicId` in query" });
  }

  const users = await UsersUseCases.searchUsersByPublicId(publicId);

  res.json(users);
});

userController.get("/checkHandleAvailability", async (req, res) => {
  const { publicId } = req.query;

  if (typeof publicId !== "string") {
    return res
      .status(400)
      .json({ error: "Missing or invalid attribute `publicId` in query" });
  }

  const user = await UsersUseCases.getUserByPublicId(publicId);

  res.json({ isAvailable: !user });
});

userController.post("/admin/add", async (req, res) => {
  const user = await handleAuth(req, res);
  if (!user) {
    return;
  }

  const { publicId } = req.body;

  if (typeof publicId !== "string") {
    return res
      .status(400)
      .json({ error: "Missing or invalid attribute `publicId` in body" });
  }

  try {
    await UsersUseCases.updateRole(user, publicId, UserRole.Admin);

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to add user to admins" });
  }
});

userController.post("/admin/remove", async (req, res) => {
  const user = await handleAuth(req, res);
  if (!user) {
    return;
  }

  const { publicId } = req.body;

  if (typeof publicId !== "string") {
    return res
      .status(400)
      .json({ error: "Missing or invalid attribute `publicId` in body" });
  }

  try {
    await UsersUseCases.updateRole(user, publicId, UserRole.User);

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to remove user from admins" });
  }
});

userController.post("/subscriptions/update", async (req, res) => {
  const user = await handleAuth(req, res);
  if (!user) {
    return;
  }

  const { publicId, uploadLimit, downloadLimit, granularity } = req.body;

  if (typeof publicId !== "string") {
    return res
      .status(400)
      .json({ error: "Missing or invalid attribute `publicId` in body" });
  }

  if (typeof uploadLimit !== "number") {
    return res
      .status(400)
      .json({ error: "Missing or invalid attribute `uploadLimit` in body" });
  }

  if (typeof downloadLimit !== "number") {
    return res
      .status(400)
      .json({ error: "Missing or invalid attribute `downloadLimit` in body" });
  }

  if (granularity !== "monthly") {
    // TODO: support other granularities
    return res.status(400).json({ error: "Invalid granularity" });
  }

  try {
    await SubscriptionsUseCases.updateSubscription(
      user,
      publicId,
      granularity,
      uploadLimit,
      downloadLimit
    );

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update subscription" });
  }
});

userController.get("/subscriptions/list", async (req, res) => {
  const user = await handleAuth(req, res);
  if (!user) {
    return;
  }

  try {
    const users = await UsersUseCases.getUserList(user);

    res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to get user list" });
  }
});

export { userController };
