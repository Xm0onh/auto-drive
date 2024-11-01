import { ObjectSummary } from "../../models/UploadedObjectMetadata";
import bytes from "bytes";
import { getTypeFromMetadata } from "../../utils/file";
import { InternalLink } from "../common/InternalLink";

export const Metadata = ({ object }: { object: ObjectSummary }) => {
  return (
    <div className="bg-white p-4 rounded-lg border-[#202124] border border-opacity-20 text-xs">
      <div className="flex flex-col mb-4">
        <h4 className="font-medium text-sm text-black text-wrap">
          {object.name}
        </h4>
        <p className="text-gray-500">Size: {bytes(object.size)}</p>
        <p>
          CID: <span className="text-blue-500">{object.headCid}</span>
        </p>
      </div>
      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-black font-light">
        <div className="flex">
          <span>Type:</span>
          <span className="ml-[4px]">{getTypeFromMetadata(object)}</span>
        </div>
        <div className="flex">
          <span>{"Owner: "}</span>
          <span className="ml-[4px]">You</span>
        </div>
        <div className="flex">
          <span>Total Nodes: </span>
          <span className="ml-[4px]">{object.uploadStatus.totalNodes}</span>
        </div>
        <div className="flex">
          <span>Uploaded Nodes: </span>
          <span className="ml-[4px]">{object.uploadStatus.uploadedNodes}</span>
        </div>
        <div className="flex">
          <span>Minimum block depth:</span>
          <span className="ml-[4px]">
            {object.uploadStatus.minimumBlockDepth ?? "N/A"}
          </span>
        </div>
        <div className="flex">
          <span>Maximum block depth:</span>
          <span className="ml-[4px]">
            {object.uploadStatus.maximumBlockDepth ?? "N/A"}
          </span>
        </div>
        <div className="flex">
          <span>Archive blocks count:</span>
          <span className="ml-[4px]">0</span>
        </div>
      </div>
      <div className="flex justify-end">
        <InternalLink href={`/drive/metadata/${object.headCid}`}>
          <span className="text-primary font-semibold hover:cursor-pointer mt-4">
            See more
          </span>
        </InternalLink>
      </div>
    </div>
  );
};
