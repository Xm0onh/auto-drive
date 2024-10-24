import { v4 } from "uuid";
import {
  UploadEntry,
  uploadsRepository,
} from "../../repositories/uploads/uploads.js";
import {
  FileUpload,
  fileUploadSchema,
  FolderUpload,
  folderUploadSchema,
  mapModelToTable,
  Upload,
  UploadStatus,
  UploadType,
} from "../../models/uploads/upload.js";
import { FolderTreeFolder } from "../../models/objects/folderTree.js";
import { User } from "../../models/users/user.js";
import { filePartsRepository } from "../../repositories/uploads/fileParts.js";
import { FileProcessingUseCase } from "./fileProcessing.js";
import { fileProcessingInfoRepository } from "../../repositories/uploads/fileProcessingInfo.js";

const mapTableToModel = (upload: UploadEntry): Upload => {
  return {
    id: upload.id,
    parentId: upload.parent_id,
    relativeId: upload.relative_id,
    type: upload.type,
    status: upload.status,
    fileTree: upload.file_tree,
    name: upload.name,
    mimeType: upload.mime_type,
    oauthProvider: upload.oauth_provider,
    oauthUserId: upload.oauth_user_id,
  } as Upload;
};

const checkPermissions = async (upload: UploadEntry, user: User) => {
  if (
    upload.oauth_provider !== user.oauthProvider ||
    upload.oauth_user_id !== user.oauthUserId
  ) {
    throw new Error("User does not have permission to upload");
  }
};

const initFileProcessing = async (upload: UploadEntry): Promise<void> => {
  await fileProcessingInfoRepository.addFileProcessingInfo({
    upload_id: upload.id,
    last_processed_part_index: null,
    last_processed_part_offset: null,
    created_at: new Date(),
    updated_at: new Date(),
  });
};

const createFileUpload = async (
  user: User,
  name: string,
  mimeType: string,
  parentId?: string | null,
  relativeId?: string | null
): Promise<FileUpload> => {
  parentId = parentId ?? null;
  relativeId = relativeId ?? null;

  const upload = await uploadsRepository.createUploadEntry(
    v4(),
    UploadType.FILE,
    UploadStatus.PENDING,
    name,
    null,
    mimeType,
    parentId,
    relativeId,
    user.oauthProvider,
    user.oauthUserId
  );

  await initFileProcessing(upload);

  return mapTableToModel(upload) as FileUpload;
};

export const createFolderUpload = async (
  user: User,
  name: string,
  folderTree: FolderTreeFolder
): Promise<FolderUpload> => {
  const result = await uploadsRepository.createUploadEntry(
    v4(),
    UploadType.FOLDER,
    UploadStatus.PENDING,
    name,
    folderTree,
    null,
    null,
    null,
    user.oauthProvider,
    user.oauthUserId
  );

  return mapTableToModel(result) as FolderUpload;
};

const createFileInFolder = async (
  user: User,
  uploadId: string,
  relativeId: string,
  name: string,
  mimeType: string
): Promise<FileUpload> => {
  const upload = await uploadsRepository.getUploadEntryById(uploadId);
  if (!upload) {
    throw new Error("Upload not found");
  }

  if (upload.type !== UploadType.FOLDER) {
    throw new Error("Upload is not a folder");
  }

  const file = await createFileUpload(
    user,
    name,
    mimeType,
    uploadId,
    relativeId
  );

  await initFileProcessing(mapModelToTable(file));

  return file;
};

const uploadChunk = async (
  user: User,
  uploadId: string,
  index: number,
  chunkData: Buffer
): Promise<void> => {
  const upload = await uploadsRepository.getUploadEntryById(uploadId);
  if (!upload) {
    throw new Error("Upload not found");
  }
  await checkPermissions(upload, user);

  await FileProcessingUseCase.processChunk(uploadId, chunkData, index);

  await filePartsRepository.addChunk({
    upload_id: uploadId,
    part_index: index,
    data: chunkData,
    created_at: new Date(),
    updated_at: new Date(),
  });
};

export const UploadsUseCases = {
  createFileUpload,
  createFolderUpload,
  createFileInFolder,
  uploadChunk,
};
