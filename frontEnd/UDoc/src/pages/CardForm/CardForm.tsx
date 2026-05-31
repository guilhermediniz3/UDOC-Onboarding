import { Tabs as MantineTabs } from "@mantine/core";

import type { Tab } from "../../types/Tab";

interface TabsProps {
  tabs: Tab[];
}

export default function Tabs({
  tabs,
}: TabsProps) {
  return (
    <MantineTabs
      defaultValue={tabs[0]?.id || ""}
      keepMounted={false}
      variant="unstyled"
      styles={{
        root: {
          width: "100%",
        },

        list: {
          display: "flex",

          alignItems: "center",

          gap: "10px",

          padding: "10px",

          borderRadius: "20px",

          background:
            "linear-gradient(180deg, #111827 0%, #0f172a 100%)",

          border:
            "1px solid rgba(255,255,255,0.08)",

          boxShadow:
            "0 12px 40px rgba(0,0,0,0.30)",

          backdropFilter: "blur(12px)",

          overflowX: "auto",

          marginBottom: "20px",
        },

        tab: {
          position: "relative",

          height: "44px",

          paddingInline: "20px",

          borderRadius: "14px",

          fontWeight: 700,

          fontSize: "14px",

          color: "#94a3b8",

          transition: "all 0.2s ease",

          whiteSpace: "nowrap",

          display: "flex",

          alignItems: "center",

          justifyContent: "center",
        },

        tabLabel: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },

        panel: {
          width: "100%",
        },
      }}
    >
      <MantineTabs.List>
        {tabs.map((tab) => (
          <MantineTabs.Tab
            key={tab.id}
            value={tab.id}
            styles={{
              tab: {
                "&[data-active]": {
                  background:
                    "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",

                  color: "#ffffff",

                  boxShadow:
                    "0 8px 24px rgba(124,58,237,0.35)",

                  transform: "translateY(-1px)",
                },

                "&:hover": {
                  background:
                    "rgba(255,255,255,0.06)",

                  color: "#ffffff",
                },
              },
            }}
          >
            {tab.label}
          </MantineTabs.Tab>
        ))}
      </MantineTabs.List>

      {tabs.map((tab) => (
        <MantineTabs.Panel
          key={tab.id}
          value={tab.id}
        >
          {tab.content}
        </MantineTabs.Panel>
      ))}
    </MantineTabs>
  );
}