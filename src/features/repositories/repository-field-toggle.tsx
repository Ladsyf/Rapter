import { open } from "@tauri-apps/plugin-dialog";
import Button from "../../components/button";
import TextAreaInput from "../../components/text-area-input";
import TextInput from "../../components/text-input";
import { IRepository } from "./models";

type RepositoryEditableKey = "name" | "description" | "path";

const TextWithInputToggleInternal = ({
  repository,
  isEditMode,
  repositoryKey,
  children,
}: {
  repository: IRepository;
  isEditMode: boolean;
  repositoryKey: RepositoryEditableKey;
  children: React.ReactNode;
}) => {
  const value = String(repository[repositoryKey] ?? "");

  return (
    <div className="w-full flex justify-between">
      {isEditMode ? (
        children
      ) : (
        <span className="w-full rounded-xl border border-transparent px-1 py-2 text-sm">{value}</span>
      )}
    </div>
  );
};

export const TextWithInputToggle = ({
  repository,
  isEditMode,
  placeholder,
  repositoryKey,
  onChange,
}: {
  repository: IRepository;
  isEditMode: boolean;
  placeholder: string;
  repositoryKey: RepositoryEditableKey;
  onChange: (key: RepositoryEditableKey, value: string) => void;
}) => {
  const value = String(repository[repositoryKey] ?? "");

  return (
    <TextWithInputToggleInternal
      repository={repository}
      isEditMode={isEditMode}
      repositoryKey={repositoryKey}
    >
      <TextInput
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(repositoryKey, e.target.value)}
      />
    </TextWithInputToggleInternal>
  );
};

export const PathWithBrowseToggle = ({
  repository,
  isEditMode,
  onChange,
}: {
  repository: IRepository;
  isEditMode: boolean;
  onChange: (key: RepositoryEditableKey, value: string) => void;
}) => {
  const handlePathSelection = async () => {
    const selectedPath = await open({ directory: true });
    if (selectedPath) {
      onChange("path", selectedPath as string);
    }
  };

  return isEditMode ? (
    <div className="w-full flex items-center gap-2">
      <TextInput
        value={repository.path}
        placeholder="Select folder path"
        onChange={() => {}}
        disabled
      />
      <Button onClick={handlePathSelection} caption="Browse" variant="secondary" />
    </div>
  ) : (
    <span className="w-full rounded-xl border border-transparent px-1 py-2 text-sm font-mono">{repository.path}</span>
  );
};

export const TextAreaWithInputToggle = ({
  repository,
  isEditMode,
  placeholder,
  repositoryKey,
  onChange,
}: {
  repository: IRepository;
  isEditMode: boolean;
  placeholder: string;
  repositoryKey: RepositoryEditableKey;
  onChange: (key: RepositoryEditableKey, value: string) => void;
}) => {
  const value = String(repository[repositoryKey] ?? "");

  return (
    <TextWithInputToggleInternal
      repository={repository}
      isEditMode={isEditMode}
      repositoryKey={repositoryKey}
    >
      <TextAreaInput
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(repositoryKey, e.target.value)}
      />
    </TextWithInputToggleInternal>
  );
};
