export interface IRepositoriesState
{
    repositories: IRepository[];
    loading: boolean;
    repositoriesById: Record<number, IRepository>;
    folders: IFolder[];
    foldersById: Record<number, IFolder>;
    currentContents: IExplorerContents | null;
    currentAncestors: IFolder[];
}

export interface IRepository
{
    id: number;
    name: string;
    description: string;
    path: string;
    scripts: IScript[];
    dateCreated: string;
    parentFolderId: number | null;
}

export interface IFolder
{
    id: number;
    name: string;
    description: string;
    parentId: number | null;
    dateCreated: string;
}

export interface IExplorerContents
{
    folderId: number | null;
    folders: IFolder[];
    repositories: IRepository[];
}

export interface IScript
{
    id: number;
    repositoryId: number;
    name: string;
    description: string;
    command: string;
    category: ScriptCategory;
}

export enum ScriptCategory
{
    Setup = "Setup",
    Development = "Development",
    Utility = "Utility"
}