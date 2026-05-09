import { useNavigate, useParams } from "react-router-dom";
import { sileo } from "sileo";
import Button from "../../components/button";
import Card from "../../components/card";
import PageShell from "../../components/page-shell";
import { useAppDispatch } from "../../hooks";
import { useScript } from "./hooks";
import ScriptForm from "./script-form";
import { scriptsActions } from "./slice";

export default function EditScript() {
  const { id, scriptId } = useParams();

  return (
    <EditScriptInternal repositoryId={Number(id)} scriptId={Number(scriptId)} />
  );
}

const EditScriptInternal = ({
  repositoryId,
  scriptId,
}: {
  repositoryId: number;
  scriptId: number;
}) => {
  const navigate = useNavigate();

  const dispatch = useAppDispatch();

  const { isLoading, script, setScript } = useScript(scriptId, repositoryId);

  const handleUpdateScript = async () => {
    await dispatch(
      scriptsActions.update({
        id: script.id,
        data: {
          repositoryId: script.repositoryId,
          name: script.name,
          description: script.description,
          command: script.command,
          category: script.category,
        },
      }),
    );

    navigate(`/repositories/${repositoryId}`);

    sileo.success({
      title: "Script Updated",
      description: `The script "${script.name}" has been updated successfully.`,
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <PageShell
      title="Edit Script"
      subtitle="Update command details and category"
      actions={
        <Button
          caption="Back to Scripts"
          variant="secondary"
          onClick={() => navigate(`/repositories/${repositoryId}`)}
        />
      }
    >
      <Card className="flex flex-col gap-3">
        <ScriptForm script={script} setScript={setScript} />
        <Button onClick={handleUpdateScript} caption="Save Script" variant="success" />
      </Card>
    </PageShell>
  );
};
