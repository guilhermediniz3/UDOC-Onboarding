import {
  Container,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Group,
  Loader,
  Center,
  useMantineColorScheme,
} from "@mantine/core";

import { useNavigate } from "react-router-dom";
import { IconLayoutGrid } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import type { Card as CardType } from "../../types/Card";
import { getPublicCards } from "../../services/cardService";
import Card from "../../components/Card/Card";
import Search from "../../components/Search/Search";
import PaginationComponent from "../../components/Pagination/Pagination";
import { useAuth } from "../../contexts/AuthContext";

export default function Home() {
  const { colorScheme } = useMantineColorScheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDark = colorScheme === "dark";

  // Funcionários externos não veem cards internos
  const hideInterno = user?.role === "FUNCIONARIO_EXTERNO";

  const [cards, setCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  async function loadCards() {
    try {
      setLoading(true);
      const response = await getPublicCards({ page: page - 1, size: pageSize, search, hideInterno });
      setCards(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Erro ao carregar cards:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCards();
  }, [page, pageSize, search]);

  function handleSizeChange(newSize: number) {
    setPageSize(newSize);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setPage(1);
    setSearch(value);
  }

  return (
    <Container size="xl" py="xl">
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 24,
          padding: 32,
          marginBottom: 32,
          background: isDark ? "rgba(15, 23, 42, 0.35)" : "rgba(255,255,255,0.75)",
          backdropFilter: "blur(18px)",
          border: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(0,0,0,0.06)",
          boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.16)" : "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, rgba(124,58,237,0) 72%)",
            pointerEvents: "none",
          }}
        />

        <Group justify="space-between" align="center" gap="xl">
          <Stack gap={6}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                  boxShadow: "0 10px 25px rgba(124,58,237,0.20)",
                }}
              >
                <IconLayoutGrid size={28} color="#fff" />
              </div>
              <div>
                <Title order={1} style={{ color: "var(--mantine-color-text)" }}>
                  Dashboard
                </Title>
                <Text style={{ color: "var(--mantine-color-dimmed)" }}>
                  Gerencie documentos, conteúdos e cards do sistema.
                </Text>
              </div>
            </div>
          </Stack>

          <div style={{ width: 340 }}>
            <Search value={search} onChange={handleSearchChange} />
          </div>
        </Group>
      </div>

      {loading ? (
        <Center py={100}>
          <Loader size="lg" />
        </Center>
      ) : (
        <Stack gap="xl">
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="xl">
            {cards.map((card) => (
              <div
                key={card.id}
                onClick={() => navigate(`/view/card/${card.id}`)}
                style={{ cursor: "pointer" }}
              >
                <Card title={card.title} description={card.description} icon={card.icon} />
              </div>
            ))}
          </SimpleGrid>

          <PaginationComponent
            page={page}
            total={totalPages}
            size={pageSize}
            onChange={setPage}
            onSizeChange={handleSizeChange}
          />
        </Stack>
      )}
    </Container>
  );
}
