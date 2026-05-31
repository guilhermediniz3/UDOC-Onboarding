import { Group, Pagination, Select } from "@mantine/core";

// ✅ Nome da interface diferente de PaginationProps (que é do Mantine)
interface CardPaginationProps {
  page: number;
  total: number;
  size: number;
  onChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}

export default function PaginationComponent({
  page,
  total,
  size,
  onChange,
  onSizeChange,
}: CardPaginationProps) {
  return (
    <Group justify="space-between" align="center" mt="30px">
      <Pagination
        value={page}
        onChange={onChange}
        total={total}
        radius="xl"
      />

      <Select
        value={String(size)}
        onChange={(value) => onSizeChange(Number(value || "10"))}
        data={["10", "20", "50", "100"]}
        w={120}
        radius="xl"
        allowDeselect={false}
        styles={{
          input: {
            background: "var(--input-bg)",
            border: "1px solid var(--border-color)",
            color: "var(--text-primary)",
          },
        }}
      />
    </Group>
  );
}
