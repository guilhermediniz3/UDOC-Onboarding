import {
  AppShell,
  MantineProvider,
  ColorSchemeScript,
} from "@mantine/core";

import {
  useLocalStorage,
  useDisclosure,
} from "@mantine/hooks";

import "@mantine/core/styles.css";

import { useLocation } from "react-router-dom";

import Header from "./components/Header/Header";
import Sidebar from "./components/Sidebar/Sidebar";
import AppRoutes from "./routes/routes";
import Login from "./pages/Login/Login";
import ChatBubble from "./components/Chat/ChatBubble";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import ForceChangePassword from "./pages/ForceChangePassword/ForceChangePassword";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { PermissionProvider } from "./contexts/PermissionContext";

const PUBLIC_PATHS = ["/forgot-password", "/reset-password"];

interface AppContentProps {
  colorScheme: "light" | "dark";
  toggleTheme: () => void;
}

function AppContent({ colorScheme, toggleTheme }: AppContentProps) {

  const { isAuthenticated, user } = useAuth();
  const { pathname } = useLocation();

  // Páginas públicas que não precisam de login nem AppShell
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (pathname.startsWith("/forgot-password")) return <ForgotPassword />;
    if (pathname.startsWith("/reset-password"))  return <ResetPassword />;
  }

  const [
    mobileOpened,
    { toggle: toggleMobile },
  ] = useDisclosure(false);

  const [collapsed, setCollapsed] = useLocalStorage<boolean>({
    key: "sidebar-collapsed",
    defaultValue: true,
  });
  const toggleCollapsed = () => setCollapsed((prev) => !prev);

  if (!isAuthenticated) {
    return <Login />;
  }

  // Guard: troca de senha obrigatória no primeiro acesso
  if (user?.forcePasswordChange) {
    return <ForceChangePassword />;
  }

  return (

    <AppShell
      header={{ height: 82 }}
      navbar={{
        width: (collapsed ?? true)
          ? { base: 240, sm: 70 }
          : 240,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened },
      }}
      padding={0}
      styles={{
        navbar: { transition: "width 200ms ease" },
        main:   { transition: "padding-left 200ms ease" },
      }}
    >

      <AppShell.Header>
        <Header
          colorScheme={colorScheme}
          toggleTheme={toggleTheme}
          opened={mobileOpened}
          toggle={toggleMobile}
        />
      </AppShell.Header>

      <AppShell.Navbar
        style={{
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--border-color)",
          overflow: "hidden",
        }}
      >
        <Sidebar
          collapsed={collapsed ?? true}
          onToggle={toggleCollapsed}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <AppRoutes />
      </AppShell.Main>

      {/* Balão de chat global — aparece para todos os usuários logados */}
      <ChatBubble />

    </AppShell>
  );
}

function App() {

  const [colorScheme, setColorScheme] =
    useLocalStorage<"light" | "dark">({
      key: "udoc-theme",
      defaultValue: "dark",
    });

  function toggleTheme() {
    setColorScheme(colorScheme === "dark" ? "light" : "dark");
  }

  return (
    <>
      <ColorSchemeScript defaultColorScheme={colorScheme} />

      <MantineProvider
        forceColorScheme={colorScheme}
        theme={{
          primaryColor: "violet",
          defaultRadius: "md",
        }}
      >
        <AuthProvider>
          <PermissionProvider>
            <AppContent
              colorScheme={colorScheme}
              toggleTheme={toggleTheme}
            />
          </PermissionProvider>
        </AuthProvider>
      </MantineProvider>
    </>
  );
}

export default App;
