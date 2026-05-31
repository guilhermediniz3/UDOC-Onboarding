import React from "react";
import "./theme.css";
import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
} from "react-router-dom";

import App from "./App";

import {
  MantineProvider,
} from "@mantine/core";

import {
  Notifications,
} from "@mantine/notifications";

import "@mantine/core/styles.css";

import "@mantine/notifications/styles.css";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <BrowserRouter>
      <MantineProvider
        defaultColorScheme="dark"
        theme={{
          primaryColor: "violet",
          defaultRadius: "md",
        }}
      >
        <Notifications />

        <App />
      </MantineProvider>
    </BrowserRouter>
  </React.StrictMode>
);