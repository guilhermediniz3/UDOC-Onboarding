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
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const PUBLIC_PATHS = ["/forgot-password", "/reset-password"];

interface AppContentProps {
  colorScheme: "light" | "dark";
  toggleTheme: () => void;
}

function AppContent({ colorScheme, toggleTheme }: AppContentProps) {

  const { isAuthenticated } = useAuth();
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

  const [
    collapsed,
    { toggle: toggleCollapsed },
  ] = useDisclosure(false);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (

    <AppShell
      header={{ height: 82 }}
      navbar={{
        width: collapsed
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
          collapsed={collapsed}
          onToggle={toggleCollapsed}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <AppRoutes />
      </AppShell.Main>

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
          <AppContent
            colorScheme={colorScheme}
            toggleTheme={toggleTheme}
          />
        </AuthProvider>
      </MantineProvider>
    </>
  );
}

export default App;
