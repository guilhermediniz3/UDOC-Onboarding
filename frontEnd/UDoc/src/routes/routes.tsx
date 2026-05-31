import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home/Home";
import Admin from "../pages/Home/Admin/Admin";
import AdminListCards from "../pages/AdminListCards/AdminListCards";
import AdminKanbanTrails from "../pages/AdminKanbanTrails/AdminKanbanTrails";
import AdminListTrails from "../pages/AdminListTrails/AdminListTrails";
import AdminListTrainingRooms from "../pages/AdminListTrainingRooms/AdminListTrainingRooms";
import AdminTrail from "../pages/AdminTrail/AdminTrail";
import AdminTrainingRoom from "../pages/AdminTrainingRoom/AdminTrainingRoom";
import AdminListEmpresas from "../pages/AdminListEmpresas/AdminListEmpresas";
import AdminEmpresa from "../pages/AdminEmpresa/AdminEmpresa";
import AdminListFuncionarios from "../pages/AdminListFuncionarios/AdminListFuncionarios";
import AdminFuncionario from "../pages/AdminFuncionario/AdminFuncionario";
import AdminListISM from "../pages/AdminListISM/AdminListISM";
import AdminISM from "../pages/AdminISM/AdminISM";
import AdminListUsuarios from "../pages/AdminListUsuarios/AdminListUsuarios";
import AdminUsuario from "../pages/AdminUsuario/AdminUsuario";
import AdminEmailConfig from "../pages/AdminEmailConfig/AdminEmailConfig";
import UserCardView from "../pages/UserCardView/UserCardView";

function AppRoutes() {
  return (
    <Routes>

      {/* PUBLIC */}
      <Route path="/" element={<Home />} />
      <Route path="/view/card/:id" element={<UserCardView />} />

      {/* CARDS */}
      <Route path="/admin/cards" element={<AdminListCards />} />
      <Route path="/admin/card" element={<Admin />} />
      <Route path="/admin/card/:id" element={<Admin />} />

      {/* TRAILS */}
      <Route path="/admin/trails" element={<AdminListTrails />} />
      <Route path="/admin/trails/kanban" element={<AdminKanbanTrails />} />
      <Route path="/admin/trail" element={<AdminTrail />} />
      <Route path="/admin/trail/:id" element={<AdminTrail />} />

      {/* TRAINING ROOMS */}
      <Route path="/admin/training-rooms" element={<AdminListTrainingRooms />} />
      <Route path="/admin/training-room" element={<AdminTrainingRoom />} />
      <Route path="/admin/training-room/:id" element={<AdminTrainingRoom />} />

      {/* EMPRESAS */}
      <Route path="/admin/empresas" element={<AdminListEmpresas />} />
      <Route path="/admin/empresa" element={<AdminEmpresa />} />
      <Route path="/admin/empresa/:id" element={<AdminEmpresa />} />

      {/* FUNCIONÁRIOS EXTERNOS */}
      <Route path="/admin/funcionarios" element={<AdminListFuncionarios />} />
      <Route path="/admin/funcionario" element={<AdminFuncionario />} />
      <Route path="/admin/funcionario/:id" element={<AdminFuncionario />} />

      {/* ISM */}
      <Route path="/admin/ismsAdmin" element={<AdminListISM />} />
      <Route path="/admin/ism" element={<AdminISM />} />
      <Route path="/admin/ism/:id" element={<AdminISM />} />

      {/* USUÁRIOS */}
      <Route path="/admin/usuarios" element={<AdminListUsuarios />} />
      <Route path="/admin/usuario" element={<AdminUsuario />} />
      <Route path="/admin/usuario/:id" element={<AdminUsuario />} />

      {/* EMAIL CONFIG */}
      <Route path="/admin/email-config" element={<AdminEmailConfig />} />

    </Routes>
  );
}

export default AppRoutes;
