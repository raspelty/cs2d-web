import { createRoot } from "react-dom/client";
import '@fontsource/roboto-mono/400.css';
import '@fontsource/roboto-mono/700.css';
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
