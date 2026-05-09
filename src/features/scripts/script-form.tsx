import Dropdown from "../../components/dropdown";
import TextAreaInput from "../../components/text-area-input";
import TextInput from "../../components/text-input";
import { IScript, ScriptCategory } from "../repositories/models";

export default function ScriptForm({
  script,
  setScript,
}: {
  script: IScript;
  setScript: React.Dispatch<React.SetStateAction<IScript>>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <TextInput
        value={script.name ?? ""}
        onChange={(event) =>
          setScript((current) => ({
            ...current,
            name: event.target.value,
          }))
        }
        placeholder="Script name"
      />
      <TextInput
        value={script.description ?? ""}
        onChange={(event) =>
          setScript((current) => ({
            ...current,
            description: event.target.value,
          }))
        }
        placeholder="Script description"
      />
      <TextAreaInput
        value={script.command ?? ""}
        onChange={(event) =>
          setScript((current) => ({
            ...current,
            command: event.target.value,
          }))
        }
        placeholder="npm run dev"
      />
      <Dropdown
        value={script.category ?? ScriptCategory.Setup}
        onChange={(event) =>
          setScript((current) => ({
            ...current,
            category: event.target.value as ScriptCategory,
          }))
        }
        options={Object.values(ScriptCategory).map((category) => ({
          label: category,
          value: category,
        }))}
      />
    </div>
  );
}