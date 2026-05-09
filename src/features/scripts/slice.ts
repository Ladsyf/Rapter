import { createAsyncThunk } from "@reduxjs/toolkit";
import { invoke } from "@tauri-apps/api/core";
import { IScript } from "../repositories/models";

export type ICreateScriptInput = Omit<IScript, "id">;

export interface IUpdateScriptInput {
  id: number;
  data: Omit<IScript, "id">;
}

export interface IRunScriptInput {
  id: number;
  repositoryPath: string;
}

export const scriptsActions = {
  loadAll: createAsyncThunk<IScript[], number>(
    "scripts/loadAll",
    async (repositoryId) => {
      return await invoke<IScript[]>("get_scripts", { repositoryId });
    },
  ),

  load: createAsyncThunk<IScript | null, number>("scripts/loadById", async (id) => {
    return await invoke<IScript | null>("get_script_by_id", { id });
  }),

  create: createAsyncThunk<IScript, ICreateScriptInput>(
    "scripts/create",
    async (payload) => {
      return await invoke<IScript>("create_script", { payload });
    },
  ),

  update: createAsyncThunk<IScript, IUpdateScriptInput>(
    "scripts/update",
    async ({ id, data }) => {
      return await invoke<IScript>("update_script", { id, payload: data });
    },
  ),

  delete: createAsyncThunk<number, number>("scripts/delete", async (id) => {
    return await invoke<number>("delete_script", { id });
  }),

  isRunning: createAsyncThunk<boolean, number>("scripts/isRunning", async (id) => {
    return await invoke<boolean>("is_script_running", { id });
  }),

  getOutput: createAsyncThunk<string, number>("scripts/getOutput", async (id) => {
    return await invoke<string>("get_script_output", { id });
  }),

  run: createAsyncThunk<boolean, IRunScriptInput>("scripts/run", async (payload) => {
    return await invoke<boolean>("run_script", { payload });
  }),

  stop: createAsyncThunk<boolean, number>("scripts/stop", async (id) => {
    return await invoke<boolean>("stop_script", { id });
  }),
};