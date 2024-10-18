"use client";

import {
  Transition,
  Dialog,
  TransitionChild,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { Fragment, useCallback, useEffect, useState } from "react";
import { ApiService } from "../../services/api";
import { ApiKey } from "../../models/ApiKey";
import toast from "react-hot-toast";

export const ApiKeyCreationModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const [hasBeenCopied, setHasBeenCopied] = useState(false);

  const createApiKey = useCallback(() => {
    ApiService.generateApiKey().then(setApiKey);
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }, []);

  const copyApiKey = useCallback(() => {
    if (apiKey) {
      copyToClipboard(apiKey.secret);
      setHasBeenCopied(true);
    }
  }, [apiKey, copyToClipboard]);

  useEffect(() => {
    if (isOpen === false) {
      setHasBeenCopied(false);
      setApiKey(null);
    }
  }, [isOpen]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black/25" />
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
                <DialogTitle
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Create API Key
                </DialogTitle>
                <div className="mt-2">
                  {apiKey ? (
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">API Key:</p>
                        <p
                          className="text-sm font-mono bg-gray-100 px-2 py-1 rounded cursor-pointer flex items-center"
                          onClick={copyApiKey}
                          title="Click to copy"
                        >
                          {apiKey.secret}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 mt-2 w-full justify-center">
                        <button
                          className="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 bg-blue-100 text-blue-900 hover:bg-blue-200"
                          onClick={copyApiKey}
                        >
                          {hasBeenCopied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Fragment>
                      <p className="text-sm text-gray-500">
                        You are about to create a new API key. This key will
                        allow you to access the API programmatically. Please
                        keep this key secure and do not share it with anyone.
                        <br />
                        <br />
                        <strong>This key won't be shown again.</strong>
                      </p>
                      <button
                        type="button"
                        className="mt-4 inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        onClick={createApiKey}
                      >
                        Generate
                      </button>
                    </Fragment>
                  )}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
