import {
  Tabs as MantineTabs,

  useMantineColorScheme,
} from "@mantine/core";

import type { Tab }
from "../../types/Tab";

interface TabsProps {
  tabs: Tab[];
}

export default function Tabs({
  tabs,
}: TabsProps) {

  const {
    colorScheme,
  } =
    useMantineColorScheme();

  const dark =
    colorScheme ===
    "dark";

  return (
    <MantineTabs
      defaultValue={
        tabs[0]?.id
      }
      variant="outline"
      radius="lg"
      keepMounted={false}
      styles={{
        root: {
          width: "100%",
        },

        list: {

          display: "flex",

          flexWrap: "wrap",

          alignItems:
            "center",

          background:
            dark
              ? "linear-gradient(180deg, #111827 0%, #0f172a 100%)"
              : "#ffffff",

          border:
            dark
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid #d1d5db",

          borderRadius:
            "18px",

          padding: "8px",

          gap: "8px",

          marginBottom:
            "20px",

          boxShadow:
            dark
              ? "0 10px 40px rgba(0,0,0,0.25)"
              : "0 10px 30px rgba(0,0,0,0.08)",
        },

        tab: {

          flex: "0 0 auto",

          color: dark
            ? "#94a3b8"
            : "#374151",

          fontWeight: 600,

          borderRadius:
            "12px",

          transition:
            "all 0.2s ease",

          paddingInline:
            "18px",

          height: "42px",

          whiteSpace:
            "nowrap",

          background:
            "transparent",
        },

        tabLabel: {
          fontSize: "14px",
        },

        panel: {
          paddingTop:
            "12px",

          width: "100%",
        },
      }}
    >
      <MantineTabs.List>

        {tabs.map(
          (tab) => (

            <MantineTabs.Tab
              key={tab.id}
              value={tab.id}
            >
              {tab.label}
            </MantineTabs.Tab>
          )
        )}

      </MantineTabs.List>

      {tabs.map(
        (tab) => (

          <MantineTabs.Panel
            key={tab.id}
            value={tab.id}
          >
            {tab.content}
          </MantineTabs.Panel>
        )
      )}

    </MantineTabs>
  );
}