import { useEffect, useRef, useState } from "react";
import { useAppDispatch } from "../../hooks";
import { scriptsActions } from "./slice";
import { IScript, ScriptCategory } from "../repositories/models";

export const useScriptOutput = (
    scriptId: number,
) => {
    const dispatch = useAppDispatch();
    const timeoutRef = useRef<number | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState("");

    useEffect(() => {
        let isActive = true;
        let inFlight = false;

        const clearPoll = () => {
            if (timeoutRef.current !== null)
            {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };

        const loadRuntimeState = async () => {
            if (!isActive || inFlight)
            {
                return;
            }

            inFlight = true;

            try
            {
                const [runningAction, outputAction] = await Promise.all([
                    dispatch(scriptsActions.isRunning(scriptId)),
                    dispatch(scriptsActions.getOutput(scriptId)),
                ]);

                if (!isActive)
                {
                    return;
                }

                if (scriptsActions.isRunning.fulfilled.match(runningAction))
                {
                    setIsRunning(runningAction.payload);
                }

                if (scriptsActions.getOutput.fulfilled.match(outputAction))
                {
                    setOutput(outputAction.payload);
                }
            } finally
            {
                inFlight = false;

                if (isActive)
                {
                    timeoutRef.current = window.setTimeout(() => {
                        void loadRuntimeState();
                    }, 1000);
                }
            }
        };

        void loadRuntimeState();

        return () => {
            isActive = false;
            clearPoll();
        };
    }, [dispatch, scriptId]);

    return {
        isRunning,
        output,
        setIsRunning,
        setOutput,
    };
};

export const useScript = (scriptId: number, repositoryId: number) => {
    const dispatch = useAppDispatch();
    const [script, setScript] = useState<IScript>({
        id: 0,
        category: ScriptCategory.Setup,
        command: "",
        description: "",
        name: "",
        repositoryId,
    });

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadScript = async () => {
            const action = await dispatch(scriptsActions.load(scriptId));

            if (!isMounted)
            {
                return;
            }

            if (!scriptsActions.load.fulfilled.match(action))
            {
                setIsLoading(false);
                return;
            }

            if (action.payload == null)
            {
                setIsLoading(false);
                return;
            }

            setScript(action.payload);
            setIsLoading(false);
        };

        if (Number.isNaN(scriptId))
        {
            setIsLoading(false);
            return;
        }

        void loadScript();

        return () => {
            isMounted = false;
        };
    }, [dispatch, scriptId]);

    return {
        script,
        isLoading,
        setScript
    };
}