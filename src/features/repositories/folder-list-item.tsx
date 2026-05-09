import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/card";
import {
  ExplorerDragData,
  hasExplorerDragData,
  readExplorerDragData,
  writeExplorerDragData,
} from "./drag-drop";
import { IFolder } from "./models";

interface FolderListItemProps {
  folder: IFolder;
  onDelete?: (id: number) => void;
  onDropItem?: (
    data: ExplorerDragData,
    targetFolderId: number,
  ) => Promise<void>;
}

export default function FolderListItem({
  folder,
  onDropItem,
}: FolderListItemProps) {
  const navigate = useNavigate();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleOpen = () => {
    if (isDragging) {
      return;
    }

    navigate(`/folders/${folder.id}`);
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    writeExplorerDragData(event, { kind: "folder", id: folder.id });
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!hasExplorerDragData(event) || !onDropItem) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDragEnd = () => {
    setIsDragOver(false);
    window.setTimeout(() => {
      setIsDragging(false);
    }, 0);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    setIsDragOver(false);
    if (!onDropItem) {
      return;
    }

    const data = readExplorerDragData(event);
    if (!data) {
      return;
    }

    event.preventDefault();
    await onDropItem(data, folder.id);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(event) => {
        void handleDrop(event);
      }}
    >
      <Card
        interactive
        className={`flex items-center justify-between gap-3 h-full ${isDragOver ? "border-[rgba(59,130,246,0.8)]" : ""}`}
      >
        <button
          type="button"
          className="flex min-w-0 flex-1 cursor-pointer flex-col items-start gap-1 bg-transparent text-left"
          onClick={handleOpen}
        >
          <div className="mb-1 flex w-full items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#a16207]/40 bg-linear-to-br from-[#1f1303] via-[#2b1d06] to-[#3f2f0a] text-[#facc15] shadow-[0_6px_16px_rgba(234,179,8,0.25)]"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M2.5 5.5h5l1.6 1.8h8.4v7.2c0 .8-.7 1.5-1.5 1.5H4c-.8 0-1.5-.7-1.5-1.5V5.5Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <p className="truncate text-base font-semibold tracking-tight text-[#f8fafc]">
              {folder.name}
            </p>
            <span className="ml-auto rounded-full border border-[#a16207]/60 bg-[#1f1303]/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#facc15]">
              Folder
            </span>
          </div>
          <p className="text-sm text-[#94a3b8]">
            {folder.description || "No description yet"}
          </p>
          <p className="text-xs font-mono text-[#64748b]">
            Created: {folder.dateCreated}
          </p>
        </button>
      </Card>
    </div>
  );
}
