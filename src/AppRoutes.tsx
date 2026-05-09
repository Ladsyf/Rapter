import { Route, Routes } from "react-router-dom";
import RepositoryList from "./features/repositories/repository-list";
import Repository from "./features/repositories/repository";
import NewScript from "./features/scripts/new-script";
import EditScript from "./features/scripts/edit-script";
import NewRepository from "./features/repositories/new-repository";
import FolderDetail from "./features/repositories/folder-detail";
import NewFolder from "./features/repositories/new-folder";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RepositoryList />} />
      <Route path="/repositories/create" element={<NewRepository />} />
      <Route path="/folders/create" element={<NewFolder />} />
      <Route path="/folders/:folderId" element={<FolderDetail />} />
      <Route path="/folders/:folderId/create" element={<NewFolder />} />
      <Route path="/folders/:folderId/repositories/create" element={<NewRepository />} />
      <Route path="/repositories/:id" element={<Repository />} />
      <Route path="/repositories/:id/scripts/create" element={<NewScript />} />
      <Route path="/repositories/:id/scripts/:scriptId/edit" element={<EditScript />} />
    </Routes>
  );
}