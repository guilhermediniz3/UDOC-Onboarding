import { Routes, Route } from "react-router-dom";

import Dashboard from "../pages/Dashboard/Dashboard";
import MinhasTrihas from "../pages/MinhasTrihas/MinhasTrihas";
import MinhaTrihaViewer from "../pages/MinhasTrihas/MinhaTrihaViewer";
import AdminCertificateTemplate from "../pages/AdminCertificateTemplate/AdminCertificateTemplate";
import Home from "../pages/Home/Home";
import Admin from "../pages/Home/Admin/Admin";
import AdminListCards from "../pages/AdminListCards/AdminListCards";
import AdminKanbanTrails from "../pages/AdminKanbanTrails/AdminKanbanTrails";
import AdminListTrails from "../pages/AdminListTrails/AdminListTrails";
import AdminListTrainingRooms from "../pages/AdminListTrainingRooms/AdminListTrainingRooms";
import AdminTrail from "../pages/AdminTrail/AdminTrail";
import AdminTrainingRoom from "../pages/AdminTrainingRoom/AdminTrainingRoom";
import TrainingCalendar from "../pages/TrainingCalendar/TrainingCalendar";
import AdminListCompanies from "../pages/AdminListCompanies/AdminListCompanies";
import AdminCompany from "../pages/AdminCompany/AdminCompany";
import AdminListEmployees from "../pages/AdminListEmployees/AdminListEmployees";
import AdminEmployee from "../pages/AdminEmployee/AdminEmployee";
import AdminListISM from "../pages/AdminListISM/AdminListISM";
import AdminISM from "../pages/AdminISM/AdminISM";
import AdminListUsers from "../pages/AdminListUsers/AdminListUsers";
import AdminUser from "../pages/AdminUser/AdminUser";
import AdminEmailConfig from "../pages/AdminEmailConfig/AdminEmailConfig";
import UserCardView from "../pages/UserCardView/UserCardView";
import MeusCertificados from "../pages/MeusCertificados/MeusCertificados";
import AdminSettings from "../pages/AdminSettings/AdminSettings";
import ForceChangePassword from "../pages/ForceChangePassword/ForceChangePassword";
import Auditoria from "../pages/Auditoria/Auditoria";
import Forbidden from "../pages/Forbidden/Forbidden";

function AppRoutes() {
  return (
    <Routes>

      {/* PUBLIC */}
      <Route path="/" element={<Home />} />
      <Route path="/view/card/:id" element={<UserCardView />} />

      {/* DASHBOARD */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* MY TRAILS */}
      <Route path="/minhas-trilhas" element={<MinhasTrihas />} />
      <Route path="/minhas-trilhas/:trailId" element={<MinhaTrihaViewer />} />

      {/* MY CERTIFICATES */}
      <Route path="/meus-certificados" element={<MeusCertificados />} />

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
      <Route path="/admin/training-calendar" element={<TrainingCalendar />} />

      {/* COMPANIES */}
      <Route path="/admin/companies" element={<AdminListCompanies />} />
      <Route path="/admin/company" element={<AdminCompany />} />
      <Route path="/admin/company/:id" element={<AdminCompany />} />

      {/* EMPLOYEES */}
      <Route path="/admin/employees" element={<AdminListEmployees />} />
      <Route path="/admin/employee" element={<AdminEmployee />} />
      <Route path="/admin/employee/:id" element={<AdminEmployee />} />

      {/* ISM */}
      <Route path="/admin/ismsAdmin" element={<AdminListISM />} />
      <Route path="/admin/ism" element={<AdminISM />} />
      <Route path="/admin/ism/:id" element={<AdminISM />} />

      {/* USERS */}
      <Route path="/admin/users" element={<AdminListUsers />} />
      <Route path="/admin/user" element={<AdminUser />} />
      <Route path="/admin/user/:id" element={<AdminUser />} />

      {/* EMAIL CONFIG */}
      <Route path="/admin/email-config" element={<AdminEmailConfig />} />

      {/* CERTIFICATE TEMPLATE */}
      <Route path="/admin/certificate-template" element={<AdminCertificateTemplate />} />

      {/* GLOBAL SETTINGS */}
      <Route path="/admin/settings" element={<AdminSettings />} />

      {/* FORCED PASSWORD CHANGE (first access) */}
      <Route path="/force-change-password" element={<ForceChangePassword />} />

      {/* AUDITORIA — admin only (guard client-side + @PreAuthorize backend) */}
      <Route path="/admin/auditoria" element={<Auditoria />} />

      {/* 403 — Acesso negado */}
      <Route path="/403" element={<Forbidden />} />

    </Routes>
  );
}

export default AppRoutes;
