import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/button";
import Card from "../../components/card";
import { useAppDispatch } from "../../hooks";
import { IScript } from "../repositories/models";
import { useScriptOutput } from "./hooks";
import { scriptsActions } from "./slice";
import TerminalOutputView from "./terminal-output-view";

export default function ScriptListItem({
  script,
  repositoryPath,
  onDelete,
}: {
  script: IScript;
  repositoryPath: string;
  onDelete: (id: number) => Promise<void>;
}) {
  const dispatch = useAppDispatch();
  const [isPending, setIsPending] = useState(false);
  const [isOutputVisible, setIsOutputVisible] = useState(false);
  const navigate = useNavigate();

  const { isRunning, output, setIsRunning, setOutput } = useScriptOutput(
    script.id,
  );

  const handleRun = async () => {
    setIsPending(true);
    setOutput("");
    const action = await dispatch(
      scriptsActions.run({ id: script.id, repositoryPath }),
    );
    if (scriptsActions.run.fulfilled.match(action)) {
      setIsRunning(action.payload);
    }
    setIsPending(false);
  };

  const handleStop = async () => {
    setIsPending(true);
    const action = await dispatch(scriptsActions.stop(script.id));
    if (scriptsActions.stop.fulfilled.match(action)) {
      setIsRunning(action.payload);
    }
    setIsPending(false);
  };

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <h2 className="text-base font-semibold tracking-tight">
          {script.name}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              void (isRunning ? handleStop() : handleRun());
            }}
            disabled={isPending}
            className={`rounded-full border border-transparent p-2 disabled:cursor-not-allowed disabled:opacity-55 cursor-pointer ${
              isRunning
                ? "text-[#e5e7eb] border-white/20 bg-[rgba(15,23,42,0.72)]"
                : "text-white bg-linear-to-br from-[#14895f] to-[#20b17d]"
            }`}
            title={isRunning ? "Stop" : "Run"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              {isRunning ? (
                <rect x="6" y="6" width="12" height="12" />
              ) : (
                <polygon points="5 3 19 12 5 21 5 3" />
              )}
            </svg>
          </button>
          <Button
            caption="Edit"
            onClick={() => {
              navigate(
                `/repositories/${script.repositoryId}/scripts/${script.id}/edit`,
              );
            }}
            variant="secondary"
          />
          <Button
            caption="Delete"
            onClick={() => {
              void onDelete(script.id);
            }}
            variant="danger"
          />
        </div>
      </div>
      <p className="text-sm text-[#94a3b8]">
        {script.description || "No description"}
      </p>
      <p className="text-xs font-mono text-[#94a3b8]">{script.command}</p>
      <button
        type="button"
        onClick={() => {
          setIsOutputVisible((value) => !value);
        }}
        className="self-start text-xs text-[#94a3b8] hover:text-[#e5e7eb] transition-colors cursor-pointer"
      >
        {isOutputVisible ? "Hide output" : "Show output"}
      </button>
      {isOutputVisible ? <TerminalOutputView output={output} /> : null}
    </Card>
  );
}
