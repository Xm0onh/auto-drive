'use client'

import { useEffect, useState } from "react";
import { ApiService } from "../services/api";
import FileCard from "../components/common/FileCard";
import { useLocalStorage } from "usehooks-ts";
import { UploadedObjectMetadata } from "../models/UploadedObjectMetadata";


export default function Page() {
  const [localObjectCIDs,] = useLocalStorage<string[]>("root-objects-cid-v2", []);

  const [rootObjectMetadata, setRootObjectMetadata] = useState<UploadedObjectMetadata[]>();

  useEffect(() => {
    Promise.all(localObjectCIDs.map(e => ApiService.fetchUploadedObjectMetadata(e))).then(setRootObjectMetadata);
  }, []);

  useEffect(() => {
    console.log(rootObjectMetadata);
  }, [rootObjectMetadata]);

  return (
    <div className="grid grid-cols-4 gap-4">
      {
        rootObjectMetadata ? rootObjectMetadata.length > 0 ? rootObjectMetadata.map(({ metadata, uploadStatus }) => {
          switch (metadata.type) {
            case "folder":
              return <a key={metadata.dataCid} href={`/fs/${metadata.dataCid}`} className="contents">
                <FileCard uploadStatus={uploadStatus} metadata={metadata} />
              </a>
            case "file":
              return <FileCard uploadStatus={uploadStatus} metadata={metadata} />
          }
        }) : <div className="text-center text-gray-500 flex flex-col items-center justify-center h-[50%] w-full text-xl">
          No root objects, upload some!
        </div> : <></>
      }
    </div>
  );
}
