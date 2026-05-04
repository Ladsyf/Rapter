import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { IRepository } from "./models";
import { ICreateRepositoryInput, repositoriesActions } from "./slice";

const emptyForm = (): ICreateRepositoryInput => ({
    name: "",
    description: "",
    path: "",
    scripts: [],
});

export default function RepositoryList()
{
    const dispatch = useAppDispatch();
    const { repositories, loading } = useAppSelector((state) => state.repositories);

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<IRepository | null>(null);
    const [form, setForm] = useState<ICreateRepositoryInput>(emptyForm());

    useEffect(() =>
    {
        dispatch(repositoriesActions.loadAll());
    }, [dispatch]);

    function openCreate()
    {
        setEditing(null);
        setForm(emptyForm());
        setShowForm(true);
    }

    function openEdit(repository: IRepository)
    {
        setEditing(repository);
        setForm({
            name: repository.name,
            description: repository.description,
            path: repository.path,
            scripts: repository.scripts,
        });
        setShowForm(true);
    }

    function cancelForm()
    {
        setShowForm(false);
        setEditing(null);
        setForm(emptyForm());
    }

    async function handleSubmit(event: React.FormEvent)
    {
        event.preventDefault();

        if (editing)
        {
            await dispatch(repositoriesActions.update({ id: editing.id, data: form }));
        }
        else
        {
            await dispatch(repositoriesActions.create(form));
        }

        cancelForm();
    }

    async function handleDelete(id: number)
    {
        if (!confirm("Delete this repository?")) return;
        dispatch(repositoriesActions.remove(id));
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Repositories</h2>
                <button
                    onClick={openCreate}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Add Repository
                </button>
            </div>

            {loading && <p className="text-sm text-gray-500">Loading…</p>}

            {!loading && repositories.length === 0 && (
                <p className="text-sm text-gray-400">No repositories yet.</p>
            )}

            <ul className="space-y-2">
                {repositories.map((repo) => (
                    <li key={repo.id} className="border rounded p-4 flex items-start justify-between gap-4">
                        <div>
                            <p className="font-medium">{repo.name}</p>
                            {repo.description && (
                                <p className="text-sm text-gray-500">{repo.description}</p>
                            )}
                            <p className="text-xs text-gray-400 font-mono">{repo.path}</p>
                            {repo.scripts.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                    {repo.scripts.map((script) => (
                                        <li key={script.id} className="text-xs text-gray-600">
                                            <span className="font-medium">{script.name}</span>
                                            {" — "}
                                            <code>{script.command}</code>
                                            <span className="ml-1 text-gray-400">({script.category})</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={() => openEdit(repo)}
                                className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(repo.id)}
                                className="text-sm px-3 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50"
                            >
                                Delete
                            </button>
                        </div>
                    </li>
                ))}
            </ul>

            {showForm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <form
                        onSubmit={handleSubmit}
                        className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md space-y-4"
                    >
                        <h3 className="text-lg font-semibold">
                            {editing ? "Edit Repository" : "New Repository"}
                        </h3>

                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input
                                required
                                className="w-full border rounded px-3 py-2 text-sm"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <input
                                className="w-full border rounded px-3 py-2 text-sm"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Path</label>
                            <input
                                required
                                className="w-full border rounded px-3 py-2 text-sm font-mono"
                                value={form.path}
                                onChange={(e) => setForm({ ...form, path: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={cancelForm}
                                className="px-4 py-2 text-sm border rounded hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                {editing ? "Save" : "Create"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
