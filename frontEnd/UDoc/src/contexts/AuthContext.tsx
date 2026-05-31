import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  photo?: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("udoc-token")
  );

  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("udoc-user");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    // Compatibilidade: campo antigo "nome" → "name", "foto" → "photo"
    if (!parsed.name && parsed.nome) parsed.name = parsed.nome;
    if (!parsed.photo && parsed.foto) parsed.photo = parsed.foto;
    if (!parsed.name) return null; // token inválido, força novo login
    return parsed;
  });

  useEffect(() => {
    if (token && isTokenExpired(token)) {
      logout();
    }
  }, []);

  function login(newToken: string, newUser: AuthUser) {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("udoc-token", newToken);
    localStorage.setItem("udoc-user", JSON.stringify(newUser));
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("udoc-token");
    localStorage.removeItem("udoc-user");
  }

  function updateUser(updated: AuthUser) {
    setUser(updated);
    localStorage.setItem("udoc-user", JSON.stringify(updated));
  }

  const isAuthenticated = !!token && !!user && !isTokenExpired(token);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
