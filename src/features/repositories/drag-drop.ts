export const EXPLORER_DRAG_MIME = "application/x-rapter-explorer-item";

export type ExplorerDragData =
  | { kind: "folder"; id: number }
  | { kind: "repository"; id: number };

export function writeExplorerDragData(event: React.DragEvent, data: ExplorerDragData) {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(EXPLORER_DRAG_MIME, JSON.stringify(data));
  event.dataTransfer.setData("text/plain", `${data.kind}:${data.id}`);
}

export function readExplorerDragData(event: React.DragEvent): ExplorerDragData | null {
  const raw = event.dataTransfer.getData(EXPLORER_DRAG_MIME);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ExplorerDragData;
    if (!parsed || (parsed.kind !== "folder" && parsed.kind !== "repository")) {
      return null;
    }

    if (typeof parsed.id !== "number" || Number.isNaN(parsed.id)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function hasExplorerDragData(event: React.DragEvent): boolean {
  const types = Array.from(event.dataTransfer.types || []);
  return types.includes(EXPLORER_DRAG_MIME);
}
