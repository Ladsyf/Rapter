import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { sileo } from "sileo";
import Button from "../../components/button";
import Card from "../../components/card";
import PageShell from "../../components/page-shell";
import TextAreaInput from "../../components/text-area-input";
import TextInput from "../../components/text-input";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { ICreateRepositoryInput, repositoriesActions, selectLoading } from "./slice";

function getCreateRepositoryErrorMessage(rawMessage?: string): string {
	if (!rawMessage || rawMessage.trim() === "") {
		return "Could not create repository. Please try again.";
	}

	if (rawMessage.includes("UNIQUE constraint failed: repositories.path")) {
		return "A repository with this path already exists.";
	}

	if (rawMessage.includes("UNIQUE constraint failed: repositories.name")) {
		return "A repository with this name already exists. This can happen with older database schemas.";
	}

	if (rawMessage.includes("UNIQUE constraint failed: repositories.name, repositories.parent_folder_id")) {
		return "A repository with this name already exists in the selected folder.";
	}

	return rawMessage;
}

export default function NewRepository() {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { folderId } = useParams();
	const [searchParams] = useSearchParams();
	const loading = useAppSelector(selectLoading);

	const parsedFromRoute = folderId ? Number(folderId) : null;
	const parsedFromQuery = searchParams.get("parentFolderId");
	const parentFolderId = Number.isFinite(parsedFromRoute)
		? parsedFromRoute
		: (parsedFromQuery ? Number(parsedFromQuery) : null);
	const backPath = parentFolderId ? `/folders/${parentFolderId}` : "/";

	const [repository, setRepository] = useState<ICreateRepositoryInput>({
		name: "",
		description: "",
		path: "",
		parentFolderId,
	});

	const handleBrowseFolder = async () => {
		const selectedPath = await open({ directory: true });

		if (!selectedPath) {
			return;
		}

		setRepository((current) => ({
			...current,
			path: selectedPath as string,
		}));
	};

	const handleCreateRepository = async () => {
		if (repository.name.trim() === "" || repository.path.trim() === "") {
			sileo.error({
				title: "Missing required fields",
				description: "Repository name and path are required.",
			});
			return;
		}

		const action = await dispatch(
			repositoriesActions.create({
				name: repository.name.trim(),
				description: repository.description.trim(),
				path: repository.path.trim(),
				parentFolderId,
			}),
		);

		if (!repositoriesActions.create.fulfilled.match(action)) {
			const description = getCreateRepositoryErrorMessage(action.error.message);

			sileo.error({
				title: "Create failed",
				description,
			});
			return;
		}

		sileo.success({
			title: "Repository Created",
			description: `The repository "${action.payload.name}" has been created successfully.`,
		});

		navigate(`/repositories/${action.payload.id}`);
	};

	return (
		<PageShell
			title="Create Repository"
			subtitle="Add a local folder to manage scripts and commands"
			actions={<Button caption="Back" variant="secondary" onClick={() => navigate(backPath)} />}
		>
			<Card className="flex flex-col gap-3">
				<div className="flex flex-col gap-3">
					<TextInput
						value={repository.name}
						onChange={(event) =>
							setRepository((current) => ({
								...current,
								name: event.target.value,
							}))
						}
						placeholder="Repository name"
						disabled={loading}
					/>
					<TextAreaInput
						value={repository.description}
						onChange={(event) =>
							setRepository((current) => ({
								...current,
								description: event.target.value,
							}))
						}
						placeholder="Repository description"
						disabled={loading}
					/>
					<div className="flex items-center gap-2">
						<TextInput
							value={repository.path}
							onChange={(event) =>
								setRepository((current) => ({
									...current,
									path: event.target.value,
								}))
							}
							placeholder="C:/Projects/my-repository"
							disabled={loading}
						/>
						<Button caption="Browse" variant="secondary" onClick={handleBrowseFolder} disabled={loading} />
					</div>
					<Button
						caption={loading ? "Creating..." : "Create Repository"}
						onClick={handleCreateRepository}
						disabled={loading}
						variant="success"
					/>
				</div>
			</Card>
		</PageShell>
	);
}