import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { sileo } from "sileo";
import ActionMenuButton from "../../components/action-menu-button";
import Breadcrumbs from "../../components/breadcrumbs";
import Button from "../../components/button";
import Card from "../../components/card";
import PageShell from "../../components/page-shell";
import StateMessage from "../../components/state-message";
import TextAreaInput from "../../components/text-area-input";
import TextInput from "../../components/text-input";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { ExplorerDragData } from "./drag-drop";
import FolderListItem from "./folder-list-item";
import RepositoryListItem from "./repository-list-item";
import {
  repositoriesActions,
  selectCurrentAncestors,
  selectCurrentContents,
  selectFolder,
  selectLoading,
} from "./slice";

export default function FolderDetail() {
  const { folderId } = useParams();
  const parsedFolderId = Number(folderId);

  return <FolderDetailInternal folderId={parsedFolderId} />;
}

function FolderDetailInternal({ folderId }: { folderId: number }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const loading = useAppSelector(selectLoading);
  const folder = useAppSelector((state) => selectFolder(state, folderId));
  const contents = useAppSelector(selectCurrentContents);
  const ancestors = useAppSelector(selectCurrentAncestors);

  const [isEditMode, setIsEditMode] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!Number.isFinite(folderId)) {
      navigate("/");
      return;
    }

    dispatch(repositoriesActions.loadFolder(folderId));
    dispatch(repositoriesActions.loadFolderContents(folderId));
    dispatch(repositoriesActions.loadFolderAncestors(folderId));
  }, [dispatch, folderId, navigate]);

  useEffect(() => {
    if (!folder) {
      return;
    }

    setName(folder.name);
    setDescription(folder.description);
  }, [folder]);

  const breadcrumbItems = useMemo(() => {
    const items = [{ label: "Home", path: "/" }];

    for (const ancestor of ancestors) {
      items.push({ label: ancestor.name, path: `/folders/${ancestor.id}` });
    }

    return items;
  }, [ancestors]);

  const handleSave = async () => {
    const action = await dispatch(
      repositoriesActions.updateFolder({
        id: folderId,
        data: {
          name: name.trim(),
          description: description.trim(),
        },
      }),
    );

    if (!repositoriesActions.updateFolder.fulfilled.match(action)) {
      sileo.error({
        title: "Update failed",
        description: "Could not update folder.",
      });
      return;
    }

    setIsEditMode(false);
  };

  const handleDeleteFolder = async (id: number) => {
    const action = await dispatch(repositoriesActions.deleteFolder(id));

    if (!repositoriesActions.deleteFolder.fulfilled.match(action)) {
      sileo.error({
        title: "Delete failed",
        description: "Could not delete folder.",
      });
      return;
    }

    if (id === folderId) {
      navigate("/");
      return;
    }

    dispatch(repositoriesActions.loadFolderContents(folderId));
  };

  const refreshCurrent = () => {
    dispatch(repositoriesActions.loadFolderContents(folderId));
    dispatch(repositoriesActions.loadFolderAncestors(folderId));
  };

  const handleDropToFolder = async (
    data: ExplorerDragData,
    targetFolderId: number,
  ) => {
    const action =
      data.kind === "folder"
        ? await dispatch(
            repositoriesActions.moveFolder({
              folderId: data.id,
              targetParentId: targetFolderId,
            }),
          )
        : await dispatch(
            repositoriesActions.moveRepository({
              repositoryId: data.id,
              targetParentId: targetFolderId,
            }),
          );

    const success =
      data.kind === "folder"
        ? repositoriesActions.moveFolder.fulfilled.match(action)
        : repositoriesActions.moveRepository.fulfilled.match(action);

    if (!success) {
      sileo.error({
        title: "Move failed",
        description: "Could not move item into the selected folder.",
      });
      return;
    }

    refreshCurrent();
  };

  if (!folder && loading) {
    return (
      <PageShell title="Folder" subtitle="Loading folder...">
        <StateMessage text="Loading folder..." />
      </PageShell>
    );
  }

  if (!folder) {
    return (
      <PageShell
        title="Folder Not Found"
        subtitle="This folder does not exist anymore."
      >
        <StateMessage text="Folder not found" />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={folder.name}
      subtitle={folder.description || "No description"}
      actions={
        <>
          <Button
            caption="Home"
            variant="secondary"
            onClick={() => navigate("/")}
          />
          <ActionMenuButton
            caption="New"
            options={[
              {
                label: "New Repository",
                onClick: () => navigate(`/folders/${folderId}/repositories/create`),
              },
              {
                label: "New Folder",
                onClick: () => navigate(`/folders/${folderId}/create`),
                variant: "secondary",
              },
            ]}
          />
          <Button
            caption={isEditMode ? "Save" : "Edit"}
            variant={isEditMode ? "success" : "primary"}
            onClick={() => {
              if (isEditMode) {
                void handleSave();
                return;
              }

              setIsEditMode(true);
            }}
          />
          <Button
            caption="Delete"
            variant="danger"
            onClick={() => void handleDeleteFolder(folderId)}
          />
        </>
      }
    >
      <Breadcrumbs items={breadcrumbItems} />

      {isEditMode && (
        <Card className="flex flex-col gap-3">
          <TextInput
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextAreaInput
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Card>
      )}

      {loading ? <StateMessage text="Loading folder contents..." /> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {contents?.folders.map((childFolder) => (
          <FolderListItem
            key={childFolder.id}
            folder={childFolder}
            onDelete={handleDeleteFolder}
            onDropItem={handleDropToFolder}
          />
        ))}
        {contents?.repositories.map((repo) => (
          <RepositoryListItem key={repo.id} repository={repo} />
        ))}
      </div>

      {!loading &&
      (contents?.folders.length ?? 0) === 0 &&
      (contents?.repositories.length ?? 0) === 0 ? (
        <StateMessage text="This folder is empty. Add a folder or repository to get started." />
      ) : null}
    </PageShell>
  );
}
