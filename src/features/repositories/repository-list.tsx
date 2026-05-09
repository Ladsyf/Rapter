import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sileo } from "sileo";
import ActionMenuButton from "../../components/action-menu-button";
import Breadcrumbs from "../../components/breadcrumbs";
import PageShell from "../../components/page-shell";
import StateMessage from "../../components/state-message";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { ExplorerDragData } from "./drag-drop";
import FolderListItem from "./folder-list-item";
import RepositoryListItem from "./repository-list-item";
import {
  repositoriesActions,
  selectCurrentContents,
  selectLoading,
} from "./slice";

export default function RepositoryList() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const contents = useAppSelector(selectCurrentContents);
  const loading = useAppSelector(selectLoading);

  useEffect(() => {
    dispatch(repositoriesActions.loadRootContents());
  }, [dispatch]);

  const handleCreateRepository = () => {
    navigate("/repositories/create");
  };

  const handleCreateFolder = () => {
    navigate("/folders/create");
  };

  const handleDeleteFolder = async (folderId: number) => {
    const action = await dispatch(repositoriesActions.deleteFolder(folderId));
    if (repositoriesActions.deleteFolder.fulfilled.match(action)) {
      dispatch(repositoriesActions.loadRootContents());
    }
  };

  const refreshRoot = () => {
    dispatch(repositoriesActions.loadRootContents());
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

    refreshRoot();
  };

  return (
    <PageShell
      title="Project Explorer"
      subtitle="Navigate to your projects cleanly"
      actions={
        <ActionMenuButton
          caption="New"
          options={[
            { label: "New Repository", onClick: handleCreateRepository },
            {
              label: "New Folder",
              onClick: handleCreateFolder,
              variant: "secondary",
            },
          ]}
        />
      }
    >
      <Breadcrumbs items={[{ label: "Home", path: "/" }]} />

      {loading ? <StateMessage text="Loading explorer..." /> : null}

      {!loading &&
      (contents?.folders.length ?? 0) === 0 &&
      (contents?.repositories.length ?? 0) === 0 ? (
        <StateMessage text="No folders or repositories yet. Create your first item." />
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {contents?.folders.map((folder) => (
          <FolderListItem
            key={folder.id}
            folder={folder}
            onDelete={handleDeleteFolder}
            onDropItem={handleDropToFolder}
          />
        ))}
        {contents?.repositories.map((repo) => (
          <RepositoryListItem key={repo.id} repository={repo} />
        ))}
      </div>
    </PageShell>
  );
}
