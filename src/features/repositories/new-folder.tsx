import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { sileo } from "sileo";
import Button from "../../components/button";
import Card from "../../components/card";
import PageShell from "../../components/page-shell";
import TextAreaInput from "../../components/text-area-input";
import TextInput from "../../components/text-input";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { repositoriesActions, selectLoading } from "./slice";

export default function NewFolder() {
  const { folderId } = useParams();
  const parentId = folderId ? Number(folderId) : null;

  return <CreateFolderInternal parentId={parentId} />;
}

function CreateFolderInternal({ parentId }: { parentId: number | null }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const loading = useAppSelector(selectLoading);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const backPath = parentId ? `/folders/${parentId}` : "/";

  const handleCreateFolder = async () => {
    if (!name.trim()) {
      sileo.error({
        title: "Missing folder name",
        description: "Folder name is required.",
      });
      return;
    }

    const action = await dispatch(
      repositoriesActions.createFolder({
        name: name.trim(),
        description: description.trim(),
        parentId,
      }),
    );

    if (!repositoriesActions.createFolder.fulfilled.match(action)) {
      sileo.error({
        title: "Create failed",
        description: "Could not create folder. Please try again.",
      });
      return;
    }

    sileo.success({
      title: "Folder Created",
      description: `The folder "${action.payload.name}" has been created successfully.`,
    });

    navigate(`/folders/${action.payload.id}`);
  };

  return (
    <PageShell
      title="Create Folder"
      subtitle="Organize repositories with a file explorer style hierarchy"
      actions={<Button caption="Back" variant="secondary" onClick={() => navigate(backPath)} />}
    >
      <Card className="flex flex-col gap-3">
        <TextInput
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Folder name"
          disabled={loading}
        />
        <TextAreaInput
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Folder description"
          disabled={loading}
        />
        <Button
          caption={loading ? "Creating..." : "Create Folder"}
          onClick={handleCreateFolder}
          disabled={loading}
          variant="success"
        />
      </Card>
    </PageShell>
  );
}
