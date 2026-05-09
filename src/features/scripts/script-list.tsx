import { useMemo } from "react";
import Button from "../../components/button";
import Card from "../../components/card";
import { useAppDispatch } from "../../hooks";
import { IRepository, IScript, ScriptCategory } from "../repositories/models";
import { repositoriesActions } from "../repositories/slice";
import ScriptListItem from "./script-list-item";
import { scriptsActions } from "./slice";
import { useNavigate } from "react-router-dom";

const scriptCategoryOrder = [
  ScriptCategory.Setup,
  ScriptCategory.Development,
  ScriptCategory.Utility,
] as const;

const scriptCategoryLabels: Record<ScriptCategory, string> = {
  [ScriptCategory.Setup]: "Setup",
  [ScriptCategory.Development]: "Development",
  [ScriptCategory.Utility]: "Utilities",
};

export default function ScriptList({
  repository,
}: {
  repository: IRepository;
}) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const scripts = repository?.scripts || [];
  const defaultScript = useMemo(
    () => ({
      repositoryId: repository.id,
      name: "",
      description: "",
      command: "",
      category: ScriptCategory.Utility,
    }),
    [repository.id],
  );

  const scriptsByCategory = scripts.reduce(
    (acc, script) => {
      if (!acc[script.category]) {
        acc[script.category] = [];
      }
      acc[script.category].push(script);
      return acc;
    },
    {} as Record<ScriptCategory, IScript[]>,
  );

  const refreshRepository = async () => {
    await dispatch(repositoriesActions.load(repository.id));
  };

  const handleCreateScript = async () => {
    navigate(`/repositories/${repository.id}/scripts/create`, {
      state: { script: defaultScript },
    });
  };

  const handleDeleteScript = async (id: number) => {
    await dispatch(scriptsActions.delete(id));
    await refreshRepository();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Scripts</h2>
        <Button caption="Add Script" onClick={handleCreateScript} />
      </div>
      {scriptCategoryOrder
        .map((category) => scriptsByCategory[category])
        .filter(Boolean)
        .map((scripts) => {
          const category = scripts[0].category;

          return (
          <ScriptListInternal
              key={category}
              category={category}
              scripts={scripts}
            repositoryPath={repository.path}
            onDelete={handleDeleteScript}
          />
          );
        })}
    </div>
  );
}

const ScriptListInternal = ({
  category,
  scripts,
  repositoryPath,
  onDelete,
}: {
  category: ScriptCategory;
  scripts: IScript[];
  repositoryPath: string;
  onDelete: (id: number) => Promise<void>;
}) => {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[#94a3b8]">{scriptCategoryLabels[category]}</h3>
        <span className="text-xs font-mono text-[#94a3b8]">{scripts.length} script(s)</span>
      </div>
      {scripts.map((script) => (
        <ScriptListItem
          key={script.id}
          script={script}
          repositoryPath={repositoryPath}
          onDelete={onDelete}
        />
      ))}
    </Card>
  );
};
