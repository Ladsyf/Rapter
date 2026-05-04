import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { IRepositoriesState, IRepository } from "./models";
import { invoke } from "@tauri-apps/api/core";

export type ICreateRepositoryInput = Omit<IRepository, "id">;

export interface IUpdateRepositoryInput {
    id: number;
    data: Omit<IRepository, "id">;
}

const initialState: IRepositoriesState =
{
    loading: false,
    repositories: []
};

export const repositoriesActions =
{
    loadAll: createAsyncThunk<IRepository[]>(
        "repositories/loadAll",
        async () =>
        {
            return await invoke<IRepository[]>("get_repositories");
        }),

    loadById: createAsyncThunk<IRepository | null, number>(
        "repositories/loadById",
        async (id) =>
        {
            return await invoke<IRepository | null>("get_repository_by_id", { id });
        }),

    create: createAsyncThunk<IRepository, ICreateRepositoryInput>(
        "repositories/create",
        async (payload) =>
        {
            return await invoke<IRepository>("create_repository", { payload });
        }),

    update: createAsyncThunk<IRepository, IUpdateRepositoryInput>(
        "repositories/update",
        async ({ id, data }) =>
        {
            return await invoke<IRepository>("update_repository", { id, payload: data });
        }),

    remove: createAsyncThunk<number, number>(
        "repositories/remove",
        async (id) =>
        {
            return await invoke<number>("delete_repository", { id });
        })
};

export const repositoriesSlice = createSlice({
    name: "repositories",
    initialState,
    reducers: {},
    extraReducers: (builder) => 
    {
        builder.addCase(repositoriesActions.loadAll.pending, (state) => { state.loading = true; });
        builder.addCase(repositoriesActions.loadAll.fulfilled, (state, action) =>
        {
            state.loading = false;
            state.repositories = action.payload;
        });

        builder.addCase(repositoriesActions.loadById.pending, (state) => { state.loading = true; });
        builder.addCase(repositoriesActions.loadById.fulfilled, (state, action) =>
        {
            state.loading = false;
            if (!action.payload)
            {
                return;
            }

            const index = state.repositories.findIndex((repo) => repo.id === action.payload!.id);
            if (index >= 0)
            {
                state.repositories[index] = action.payload;
            }
            else
            {
                state.repositories.push(action.payload);
            }
        });

        builder.addCase(repositoriesActions.create.pending, (state) => { state.loading = true; });
        builder.addCase(repositoriesActions.create.fulfilled, (state, action) =>
        {
            state.loading = false;
            state.repositories.push(action.payload);
        });

        builder.addCase(repositoriesActions.update.pending, (state) => { state.loading = true; });
        builder.addCase(repositoriesActions.update.fulfilled, (state, action) =>
        {
            state.loading = false;
            const index = state.repositories.findIndex((repo) => repo.id === action.payload.id);
            if (index >= 0)
            {
                state.repositories[index] = action.payload;
            }
        });

        builder.addCase(repositoriesActions.remove.pending, (state) => { state.loading = true; });
        builder.addCase(repositoriesActions.remove.fulfilled, (state, action) =>
        {
            state.loading = false;
            state.repositories = state.repositories.filter((repo) => repo.id !== action.payload);
        });

        builder.addMatcher(
            (action) => action.type.startsWith("repositories/") && action.type.endsWith("/rejected"),
            (state) =>
            {
                state.loading = false;
            }
        );
    }
});
