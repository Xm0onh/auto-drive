import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ApiService } from "../../services/api";
import { OffchainMetadata } from "@autonomys/auto-drive";
import { handleFileDownload, InvalidDecryptKey } from "../../utils/file";
import { Button } from "../common/Button";
import { shortenString } from "../../utils/misc";
import { useEncryptionStore } from "../../states/encryption";

export const ObjectDownloadModal = ({
  cid,
  onClose,
}: {
  cid: string | null;
  onClose: () => void;
}) => {
  const [metadata, setMetadata] = useState<OffchainMetadata>();
  const [password, setPassword] = useState<string>();
  const [passwordConfirmed, setPasswordConfirmed] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [wrongPassword, setWrongPassword] = useState<boolean>(false);
  const defaultPassword = useEncryptionStore((store) => store.password);

  useEffect(() => {
    if (!cid) {
      setMetadata(undefined);
      setPassword(undefined);
      setPasswordConfirmed(false);
      setIsDownloading(false);
    } else {
      ApiService.fetchUploadedObjectMetadata(cid).then(({ metadata }) => {
        setMetadata(metadata);
        setPassword(undefined);
        setPasswordConfirmed(false);
        setIsDownloading(false);
        if (defaultPassword && !wrongPassword) {
          setPassword(defaultPassword);
          setPasswordConfirmed(true);
        }
      });
    }
  }, [cid, defaultPassword, wrongPassword]);

  const onDownload = useCallback(async () => {
    if (!metadata) return;
    const download = await ApiService.downloadObject(metadata.dataCid);
    const passwordToUse = password ?? undefined;
    if (metadata.type === "file") {
      handleFileDownload(download, metadata?.type, metadata.name!, {
        password: passwordToUse,
        compress: !!metadata?.uploadOptions?.compression,
      })
        .then(() => {
          onClose();
        })
        .catch((e) => {
          if (e instanceof InvalidDecryptKey) {
            setPassword(undefined);
            setPasswordConfirmed(false);
            setWrongPassword(true);
          }
        });
    } else {
      handleFileDownload(download, metadata?.type, metadata.name!).then(() => {
        onClose();
      });
    }
  }, [cid, metadata, password, onClose]);

  const passwordOrNotEncrypted =
    (metadata && !metadata.uploadOptions?.encryption?.algorithm) ||
    passwordConfirmed;

  useEffect(() => {
    if (passwordOrNotEncrypted && !isDownloading) {
      setIsDownloading(true);
      onDownload();
    }
  }, [passwordOrNotEncrypted, onDownload, isDownloading]);

  const view = useMemo(() => {
    if (!metadata) return <></>;

    if (!metadata.uploadOptions?.encryption) {
      <DialogTitle>Download starting...</DialogTitle>;
    }

    if (passwordConfirmed) {
      return <DialogTitle>Downloading {metadata.name}...</DialogTitle>;
    }

    if (metadata.type === "file" && !passwordConfirmed) {
      return (
        <div>
          <div className="flex flex-col items-center gap-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Enter Decrypting Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Password"
            />
            <Button
              variant="primary"
              className="text-xs w-[50%]"
              onClick={() => setPasswordConfirmed(true)}
            >
              Confirm Password
            </Button>
            {wrongPassword && (
              <div className="flex justify-center text-sm text-red-500">
                Wrong password
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <span className="text-sm text-gray-500">
          Folder "{shortenString(metadata.name ?? "", 20)}" includes encrypted
          files. This will download a zip file with files encrypted.{" "}
        </span>
        <span className="text-sm text-gray-500 font-bold">
          For downloading the plain files, download individual files, providing
          their password.
        </span>
        <Button onClick={() => setPasswordConfirmed(true)}>Download ZIP</Button>
      </div>
    );
  }, [metadata, wrongPassword, defaultPassword]);

  return (
    <Transition appear show={!!cid} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {view}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
