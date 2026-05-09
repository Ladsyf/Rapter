import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { sileo } from "sileo";
import Breadcrumbs from "../../components/breadcrumbs";
import Button from "../../components/button";
import Card from "../../components/card";
import PageShell from "../../components/page-shell";
import StateMessage from "../../components/state-message";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { IRepository } from "./models";
import { repositoriesActions, selectCurrentAncestors, selectRepository } from "./slice";
import TextInput from "../../components/text-input";
import TextAreaInput from "../../components/text-area-input";
import ScriptList from "../scripts/script-list";

export default function Repository() {
  const dispatch = useAppDispatch();
  const { id } = useParams();

  useEffect(() => {
    dispatch(repositoriesActions.load(Number(id)));
  }, [dispatch, id]);

  const repository = useAppSelector((state) =>
    selectRepository(state, Number(id)),
  );

  if (repository == null) return <PageShell title="Repository" subtitle="Loading repository..."><StateMessage text="Loading..." /></PageShell>;

  return (
    <div>
      <RepositoryDetails repository={repository} />
    </div>
  );
}

const RepositoryDetails = ({ repository }: { repository: IRepository }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const ancestors = useAppSelector(selectCurrentAncestors);

  const [currentRepository, setCurrentRepository] =
    useState<IRepository>(repository);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    setCurrentRepository(repository);
  }, [repository]);

  useEffect(() => {
    if (!repository.parentFolderId) {
      return;
    }

    dispatch(repositoriesActions.loadFolderAncestors(repository.parentFolderId));
  }, [dispatch, repository.parentFolderId]);

  const handleInputChange = (key: keyof IRepository, value: string) => {
    setCurrentRepository((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    const updateInput = {
      id: currentRepository.id,
      data: currentRepository,
    };
    dispatch(repositoriesActions.update(updateInput));
    setIsEditMode(false);
  };

  const handleEditOrSave = () => {
    if (isEditMode) handleSave();
    else setIsEditMode((prev) => !prev);
  };

  const handleDelete = async () => {
    const action = await dispatch(repositoriesActions.delete(currentRepository.id));

    if (!repositoriesActions.delete.fulfilled.match(action)) {
      sileo.error({
        title: "Delete failed",
        description: "Could not delete repository.",
      });
      return;
    }

    if (repository.parentFolderId) {
      navigate(`/folders/${repository.parentFolderId}`);
      return;
    }

    navigate("/");
  };

  const breadcrumbItems = [{ label: "Home", path: "/" }];
  for (const ancestor of ancestors) {
    breadcrumbItems.push({ label: ancestor.name, path: `/folders/${ancestor.id}` });
  }
  breadcrumbItems.push({ label: currentRepository.name || "Repository", path: `/repositories/${currentRepository.id}` });

  return (
    <PageShell
      title={currentRepository.name || "Repository"}
      subtitle={currentRepository.description || "Manage repository details and scripts"}
      actions={
        <>
          <Button onClick={handleEditOrSave} caption={isEditMode ? "Save" : "Edit"} variant={isEditMode ? "success" : "primary"} />
          <Button onClick={() => void handleDelete()} caption="Delete" variant="danger" />
        </>
      }
    >
      <Breadcrumbs items={breadcrumbItems} />
      <Card className="flex flex-col gap-3">
        <TextInput
          value={currentRepository.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder="Repository Name"
          disabled={!isEditMode}
        />
        <TextAreaInput
          value={currentRepository.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Description"
          disabled={!isEditMode}
        />
        <TextInput
          value={currentRepository.path || ""}
          onChange={(e) => handleInputChange("path", e.target.value)}
          placeholder="Repository Path"
          disabled={!isEditMode}
        />
      </Card>
      <ScriptList repository={currentRepository} />
    </PageShell>
  );
};