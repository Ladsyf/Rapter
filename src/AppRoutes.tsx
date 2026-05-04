import { Route, Routes } from "react-router-dom";
import RepositoryList from "./features/repositories/repository-list";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RepositoryList />} />
    </Routes>
  );
}