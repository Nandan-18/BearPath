import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "maplibre-gl/dist/maplibre-gl.css";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
