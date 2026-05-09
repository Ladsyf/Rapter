import { useState } from "react";
import { IScript, ScriptCategory } from "../repositories/models";
import ScriptForm from "./script-form";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/button";
import { useAppDispatch } from "../../hooks";
import { scriptsActions } from "./slice";
import { sileo } from "sileo";
import Card from "../../components/card";
import PageShell from "../../components/page-shell";

export default function NewScript() {
  const { id } = useParams();

  return <CreateScriptInternal repositoryId={Number(id)} />;
}

const CreateScriptInternal = ({ repositoryId }: { repositoryId: number }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const defaultScript: IScript = {
    id: 0,
    category: ScriptCategory.Setup,
    command: "",
    description: "",
    name: "",
    repositoryId,
  };

  const [script, setScript] = useState<IScript>(defaultScript);

  const handleCreateScript = async () => {
    await dispatch(scriptsActions.create(script));
    navigate(`/repositories/${script.repositoryId}`);
    sileo.success({
      title: "Script Created",
      description: `The script "${script.name}" has been created successfully.`,
    });
  };

  return (
    <PageShell
      title="Create Script"
      subtitle="Define a command to run for this repository"
      actions={<Button caption="Back to Scripts" variant="secondary" onClick={() => navigate(`/repositories/${repositoryId}`)} />}
    >
      <Card className="flex flex-col gap-3">
        <ScriptForm script={script} setScript={setScript} />
        <Button onClick={handleCreateScript} caption="Create Script" variant="success" />
      </Card>
    </PageShell>
  );
};
