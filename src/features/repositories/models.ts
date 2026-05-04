export interface IRepositoriesState
{
    repositories: IRepository[];
    loading: boolean;
}

export interface IRepository
{
    id: number;
    name: string;
    description: string;
    path: string;
    scripts: IScript[];
}

export interface IScript
{
    id: number;
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