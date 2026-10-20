import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.js";
import { SalaProvider } from "./context/SalaContext.js";
import "./styles/reset.css";
import "./styles/variables.css";
import "./styles/global.css";
import "./styles/responsive.css";
import "./index.css";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<BrowserRouter>
			<AuthProvider>
				<SalaProvider>
					<App />
				</SalaProvider>
			</AuthProvider>
		</BrowserRouter>
	</StrictMode>,
);
