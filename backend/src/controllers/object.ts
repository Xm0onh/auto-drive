import { Router } from "express";
import { pipeline } from "stream";
import { handleAuth } from "../services/authManager/express.js";
import {
  FilesUseCases,
  ObjectUseCases,
  UploadStatusUseCases,
} from "../useCases/index.js";

const objectController = Router();

objectController.get("/roots", async (req, res) => {
  const user = await handleAuth(req, res);
  const { scope, limit, offset } = req.query;
  if (!user) {
    return;
  }

  const limitNumber = limit ? parseInt(limit as string) : undefined;
  const offsetNumber = offset ? parseInt(offset as string) : undefined;

  const roots = await ObjectUseCases.getRootObjects(
    user && scope === "user" ? { user, scope } : { scope: "global" },
    limitNumber,
    offsetNumber
  );
  res.json(roots);
});

objectController.get("/roots/shared", async (req, res) => {
  const user = await handleAuth(req, res);
  if (!user) {
    return;
  }

  const { limit, offset } = req.query;
  const limitNumber = limit ? parseInt(limit as string) : undefined;
  const offsetNumber = offset ? parseInt(offset as string) : undefined;

  const sharedRoots = await ObjectUseCases.getSharedRoots(
    user,
    limitNumber,
    offsetNumber
  );

  res.json(sharedRoots);
});

objectController.get("/roots/deleted", async (req, res) => {
  const user = await handleAuth(req, res);
  if (!user) {
    return;
  }

  const { limit, offset } = req.query;
  const limitNumber = limit ? parseInt(limit as string) : undefined;
  const offsetNumber = offset ? parseInt(offset as string) : undefined;

  const deletedRoots = await ObjectUseCases.getMarkedAsDeletedRoots(
    user,
    limitNumber,
    offsetNumber
  );

  res.json(deletedRoots);
});

objectController.get("/search", async (req, res) => {
  try {
    const { scope, cid } = req.query;

    const user = await handleAuth(req, res);
    if (!user) {
      return;
    }

    if (typeof cid !== "string") {
      return res.status(400).json({ error: "Missing or invalid cid value" });
    }

    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : undefined;
    const results = await ObjectUseCases.searchByCIDOrName(
      cid,
      limit,
      user && scope === "user" ? { user, scope } : { scope: "global" }
    );
    res.json(results);
  } catch (error: any) {
    console.error("Error searching metadata:", error);
    res
      .status(500)
      .json({ error: "Failed to search metadata", details: error.message });
  }
});

objectController.get("/:cid/metadata", async (req, res) => {
  try {
    const { cid } = req.params;
    const metadata = await ObjectUseCases.getMetadata(cid);
    if (!metadata) {
      return res.status(404).json({ error: "Metadata not found" });
    }

    res.json(metadata);
  } catch (error: any) {
    console.error("Error retrieving metadata:", error);
    res
      .status(500)
      .json({ error: "Failed to retrieve metadata", details: error.message });
  }
});

objectController.get("/:cid/status", async (req, res) => {
  const { cid } = req.params;

  const objectInformation = await UploadStatusUseCases.getUploadStatus(cid);
  res.json(objectInformation);
});

objectController.post("/:cid/share", async (req, res) => {
  const { publicId } = req.body;
  const { cid } = req.params;

  if (!publicId) {
    return res
      .status(400)
      .json({ error: "Missing `publicId` in request body" });
  }

  const user = await handleAuth(req, res);
  if (!user) {
    return;
  }

  try {
    await ObjectUseCases.shareObject(user, cid, publicId);
    res.sendStatus(200);
  } catch (error: any) {
    console.error("Error sharing object:", error);
    res
      .status(500)
      .json({ error: "Failed to share object", details: error.message });
  }
});

objectController.get("/:cid/download", async (req, res) => {
  try {
    const { cid } = req.params;

    const user = await handleAuth(req, res);
    if (!user) {
      return;
    }

    const metadata = await ObjectUseCases.getMetadata(cid);
    if (!metadata) {
      return res.status(404).json({ error: "Metadata not found" });
    }

    console.log(`Attempting to retrieve data for metadataCid: ${cid}`);
    const data = await FilesUseCases.downloadObject(user, cid);

    const safeName = encodeURIComponent(metadata.name || "download");

    if (metadata.type === "file") {
      res.set("Content-Type", metadata.mimeType || "application/octet-stream");
      res.set("Content-Disposition", `attachment; filename="${safeName}"`);
      res.set("Content-Length", metadata.totalSize.toString());
    } else {
      res.set("Content-Type", "application/zip");
      res.set("Content-Disposition", `attachment; filename="${safeName}.zip"`);
    }

    pipeline(data, res, (err) => {
      if (err) {
        if (res.headersSent) return;
        console.error("Error streaming data:", err);
        res
          .status(500)
          .json({ error: "Failed to stream data", details: err.message });
      }
    });
  } catch (error: any) {
    console.error("Error retrieving data:", error);
    res
      .status(500)
      .json({ error: "Failed to retrieve data", details: error.message });
  }
});

objectController.post("/:cid/delete", async (req, res) => {
  try {
    const user = await handleAuth(req, res);
    if (!user) {
      return;
    }

    const { cid } = req.params;

    await ObjectUseCases.markAsDeleted(user, cid);

    res.sendStatus(200);
  } catch (error: any) {
    console.error("Error deleting object:", error);
    res
      .status(500)
      .json({ error: "Failed to delete object", details: error.message });
  }
});

objectController.post("/:cid/restore", async (req, res) => {
  try {
    const user = await handleAuth(req, res);
    if (!user) {
      return;
    }

    const { cid } = req.params;

    await ObjectUseCases.restoreObject(user, cid);

    res.sendStatus(200);
  } catch (error: any) {
    console.error("Error deleting object:", error);
    res
      .status(500)
      .json({ error: "Failed to delete object", details: error.message });
  }
});

objectController.get("/:cid", async (req, res) => {
  const { cid } = req.params;

  const objectInformation = await ObjectUseCases.getObjectInformation(cid);

  if (!objectInformation) {
    return res.status(404).json({ error: "Object not found" });
  }

  res.json(objectInformation);
});

export { objectController };
