import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { IExplorerContents, IFolder, IRepositoriesState, IRepository } from "./models";
import { invoke } from "@tauri-apps/api/core";

export interface ICreateRepositoryInput {
    name: string;
    description: string;
    path: string;
    parentFolderId?: number | null;
}

export interface IUpdateRepositoryData {
    name: string;
    description: string;
    path: string;
    parentFolderId?: number | null;
}

export interface IUpdateRepositoryInput {
    id: number;
    data: IUpdateRepositoryData;
}

export interface ICreateFolderInput {
    name: string;
    description: string;
    parentId?: number | null;
}

export interface IUpdateFolderInput {
    id: number;
    data: {
        name: string;
        description: string;
    };
}

export interface IMoveFolderInput {
    folderId: number;
    targetParentId: number | null;
}

export interface IMoveRepositoryInput {
    repositoryId: number;
    targetParentId: number | null;
}

const initialState: IRepositoriesState =
{
    loading: false,
    repositories: [],
    repositoriesById: {},
    folders: [],
    foldersById: {},
    currentContents: null,
    currentAncestors: [],
};

export const repositoriesActions =
{
    loadAll: createAsyncThunk<IRepository[]>(
        "repositories/loadAll",
        async () =>
        {
            return await invoke<IRepository[]>("get_repositories");
        }),

    load: createAsyncThunk<IRepository | null, number>(
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

    delete: createAsyncThunk<number, number>(
        "repositories/delete",
        async (id) =>
        {
            return await invoke<number>("delete_repository", { id });
        }),

    loadRootContents: createAsyncThunk<IExplorerContents>(
        "repositories/loadRootContents",
        async () =>
        {
            return await invoke<IExplorerContents>("get_root_contents");
        }),

    loadFolderContents: createAsyncThunk<IExplorerContents, number>(
        "repositories/loadFolderContents",
        async (folderId) =>
        {
            return await invoke<IExplorerContents>("get_folder_contents", { folderId });
        }),

    loadFolder: createAsyncThunk<IFolder | null, number>(
        "repositories/loadFolder",
        async (id) =>
        {
            return await invoke<IFolder | null>("get_folder_by_id", { id });
        }),

    loadFolderAncestors: createAsyncThunk<IFolder[], number>(
        "repositories/loadFolderAncestors",
        async (folderId) =>
        {
            return await invoke<IFolder[]>("get_folder_ancestors", { folderId });
        }),

    createFolder: createAsyncThunk<IFolder, ICreateFolderInput>(
        "repositories/createFolder",
        async (payload) =>
        {
            return await invoke<IFolder>("create_folder", { payload });
        }),

    updateFolder: createAsyncThunk<IFolder, IUpdateFolderInput>(
        "repositories/updateFolder",
        async ({ id, data }) =>
        {
            return await invoke<IFolder>("update_folder", { id, payload: data });
        }),

    deleteFolder: createAsyncThunk<number, number>(
        "repositories/deleteFolder",
        async (id) =>
        {
            return await invoke<number>("delete_folder", { id });
        }),

    moveFolder: createAsyncThunk<IFolder, IMoveFolderInput>(
        "repositories/moveFolder",
        async ({ folderId, targetParentId }) =>
        {
            return await invoke<IFolder>("move_folder", {
                folderId,
                targetParentId,
            });
        }),

    moveRepository: createAsyncThunk<IRepository, IMoveRepositoryInput>(
        "repositories/moveRepository",
        async ({ repositoryId, targetParentId }) =>
        {
            return await invoke<IRepository>("move_repository", {
                repositoryId,
                targetParentId,
            });
        }),
};

export const selectRepositories = (state: { repositories: IRepositoriesState }) => state.repositories.repositories;
export const selectLoading = (state: { repositories: IRepositoriesState }) => state.repositories.loading;
export const selectCurrentContents = (state: { repositories: IRepositoriesState }) => state.repositories.currentContents;
export const selectCurrentAncestors = (state: { repositories: IRepositoriesState }) => state.repositories.currentAncestors;
export const selectFolder = createSelector(
    (state: { repositories: IRepositoriesState }) => state.repositories.foldersById,
    (_: any, id: number) => id,
    (foldersById, id) => foldersById[id]
);
export const selectRepository = createSelector(
    (state: { repositories: IRepositoriesState }) => state.repositories.repositoriesById,
    (_: any, id: number) => id,
    (repositoriesById, id) => repositoriesById[id]
);

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
            state.repositoriesById = action.payload.reduce((acc, repository) => {
                acc[repository.id] = repository;
                return acc;
            }, {} as Record<number, IRepository>);
        });

        builder.addCase(repositoriesActions.load.pending, (state) => { state.loading = true; });
        builder.addCase(repositoriesActions.load.fulfilled, (state, action) =>
        {
            state.loading = false;
            if (!action.payload)
            {
                return;
            }

            state.repositoriesById = { ...state.repositoriesById, [action.payload.id]: action.payload };
        });

        builder.addCase(repositoriesActions.create.pending, (state) => { state.loading = true; });
        builder.addCase(repositoriesActions.create.fulfilled, (state, action) =>
        {
            state.loading = false;
            state.repositories = [ ...state.repositories, action.payload];
            state.repositoriesById = { ...state.repositoriesById, [action.payload.id]: action.payload };
        });

        builder.addCase(repositoriesActions.delete.pending, (state) => { state.loading = true; });
        builder.addCase(repositoriesActions.delete.fulfilled, (state, action) =>
        {
            state.loading = false;
            state.repositories = state.repositories.filter((repo) => repo.id !== action.payload);
            delete state.repositoriesById[action.payload];
        });

        builder.addCase(repositoriesActions.update.pending, (state) => { state.loading = true; });
        builder.addCase(repositoriesActions.update.fulfilled, (state, action) =>
        {
            state.loading = false;
            const updatedRepo = action.payload;
            state.repositoriesById = { ...state.repositoriesById, [updatedRepo.id]: updatedRepo };
            state.repositories = state.repositories.map((repo) => repo.id === updatedRepo.id ? updatedRepo : repo);
        });

        builder.addCase(repositoriesActions.loadRootContents.pending, (state) => { state.loading = true; });
        builder.addCase(repositoriesActions.loadRootContents.fulfilled, (state, action) =>
        {
            state.loading = false;
            state.currentContents = action.payload;
            state.currentAncestors = [];
            state.folders = action.payload.folders;

            for (const folder of action.payload.folders)
            {
                state.foldersById[folder.id] = folder;
            }

            for (const repository of action.payload.repositories)
            {
                state.repositoriesById[repository.id] = repository;
            }
        });

        builder.addCase(repositoriesActions.loadFolderContents.pending, (state) => { state.loading = true; });
        builder.addCase(repositoriesActions.loadFolderContents.fulfilled, (state, action) =>
        {
            state.loading = false;
            state.currentContents = action.payload;

            for (const folder of action.payload.folders)
            {
                state.foldersById[folder.id] = folder;
            }

            for (const repository of action.payload.repositories)
            {
                state.repositoriesById[repository.id] = repository;
            }
        });

        builder.addCase(repositoriesActions.loadFolder.pending, (state) => { state.loading = true; });
        builder.addCase(repositoriesActions.loadFolder.fulfilled, (state, action) =>
        {
            state.loading = false;
            if (!action.payload)
            {
                return;
            }

            state.foldersById = { ...state.foldersById, [action.payload.id]: action.payload };
            const existingIndex = state.folders.findIndex((folder) => folder.id === action.payload!.id);
            if (existingIndex >= 0)
            {
                state.folders[existingIndex] = action.payload;
            } else
            {
                state.folders = [...state.folders, action.payload];
            }
        });

        builder.addCase(repositoriesActions.loadFolderAncestors.pending, (state) => { state.loading = true; });
        builder.addCase(repositoriesActions.loadFolderAncestors.fulfilled, (state, action) =>
        {
            state.loading = false;
            state.currentAncestors = action.payload;

            for (const folder of action.payload)
            {
                state.foldersById[folder.id] = folder;
            }
        });

        builder.addCase(repositoriesActions.createFolder.pending, (state) => { state.loading = true; });
        builder.addCase(repositoriesActions.createFolder.fulfilled, (state, action) =>
        {
            state.loading = false;
            state.foldersById = { ...state.foldersById, [action.payload.id]: action.payload };
            state.folders = [...state.folders, action.payload];
        });

        builder.addCase(repositoriesActions.updateFolder.pending, (state) => { state.loading = true; });
        builder.addCase(repositoriesActions.updateFolder.fulfilled, (state, action) =>
        {
            state.loading = false;
            state.foldersById = { ...state.foldersById, [action.payload.id]: action.payload };
            state.folders = state.folders.map((folder) => folder.id === action.payload.id ? action.payload : folder);
            state.currentAncestors = state.currentAncestors.map((folder) => folder.id === action.payload.id ? action.payload : folder);
            if (state.currentContents)
            {
                state.currentContents.folders = state.currentContents.folders.map((folder) =>
                    folder.id === action.payload.id ? action.payload : folder,
                );
            }
        });

        builder.addCase(repositoriesActions.deleteFolder.pending, (state) => { state.loading = true; });
        builder.addCase(repositoriesActions.deleteFolder.fulfilled, (state, action) =>
        {
            state.loading = false;
            const deletedId = action.payload;
            state.folders = state.folders.filter((folder) => folder.id !== deletedId);
            delete state.foldersById[deletedId];
            state.currentAncestors = state.currentAncestors.filter((folder) => folder.id !== deletedId);
            if (state.currentContents)
            {
                state.currentContents.folders = state.currentContents.folders.filter((folder) => folder.id !== deletedId);
            }
        });

        builder.addCase(repositoriesActions.moveFolder.pending, (state) => { state.loading = true; });
        builder.addCase(repositoriesActions.moveFolder.fulfilled, (state, action) =>
        {
            state.loading = false;
            const movedFolder = action.payload;
            state.foldersById[movedFolder.id] = movedFolder;
            state.folders = state.folders.map((folder) => folder.id === movedFolder.id ? movedFolder : folder);
            if (state.currentContents)
            {
                state.currentContents.folders = state.currentContents.folders.filter((folder) => folder.id !== movedFolder.id);
            }
            state.currentAncestors = state.currentAncestors.map((folder) => folder.id === movedFolder.id ? movedFolder : folder);
        });

        builder.addCase(repositoriesActions.moveRepository.pending, (state) => { state.loading = true; });
        builder.addCase(repositoriesActions.moveRepository.fulfilled, (state, action) =>
        {
            state.loading = false;
            const movedRepository = action.payload;
            state.repositoriesById[movedRepository.id] = movedRepository;
            state.repositories = state.repositories.map((repository) =>
                repository.id === movedRepository.id ? movedRepository : repository,
            );
            if (state.currentContents)
            {
                state.currentContents.repositories = state.currentContents.repositories.filter(
                    (repository) => repository.id !== movedRepository.id,
                );
            }
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