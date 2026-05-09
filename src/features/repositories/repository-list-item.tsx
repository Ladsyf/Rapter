import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Card from "../../components/card";
import { IRepository } from "./models";
import { writeExplorerDragData } from "./drag-drop";

export default function RepositoryListItem({
  repository: repo,
}: {
  repository: IRepository;
}) {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);

  const onClick = () => {
    if (isDragging) {
      return;
    }

    navigate(`/repositories/${repo.id}`);
  };

  const onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    writeExplorerDragData(event, { kind: "repository", id: repo.id });
  };

  const onDragEnd = () => {
    window.setTimeout(() => {
      setIsDragging(false);
    }, 0);
  };

  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <Card interactive className="flex flex-col gap-2" onClick={onClick}>
        <div className="overflow-hidden">
          <div className="mb-1 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#1d4ed8]/40 bg-linear-to-br from-[#0b1220] via-[#0f172a] to-[#172554] text-[#93c5fd] shadow-[0_6px_16px_rgba(37,99,235,0.25)]"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M4 3.5h8.5L16 7v9.5H4V3.5Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path d="M12.5 3.5V7H16" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            </span>
            <p className="truncate text-base font-semibold tracking-tight text-[#f8fafc]">{repo.name}</p>
            <span className="ml-auto rounded-full border border-[#1e3a8a]/60 bg-[#0b1220]/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#93c5fd]">
              Repository
            </span>
          </div>
          <p className="text-sm text-[#94a3b8]">{repo.description || "No description yet"}</p>
          <p className="overflow-hidden text-ellipsis text-xs font-mono text-[#94a3b8]">{repo.path}</p>
        </div>
        <div>
          <p className="text-xs font-mono text-[#94a3b8]">Created: {repo.dateCreated}</p>
        </div>
      </Card>
    </div>
  );
}