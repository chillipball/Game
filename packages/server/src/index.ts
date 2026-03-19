import "dotenv/config";
import { createServer } from "http";
import { execSync } from "child_process";
import { mkdirSync } from "fs";
import { join } from "path";
import { createApp } from "./app.js";
import { createSocketServer } from "./socketServer.js";
import { SERVER_PORT } from "@jarvis/shared";

// Ensure logs directory exists
mkdirSync(join(process.cwd(), "logs"), { recursive: true });

// Warn early if neither auth method is available — saves a confusing runtime error.
if (!process.env.ANTHROPIC_API_KEY) {
  try {
    execSync("claude --version", { stdio: "ignore" });
  } catch {
    console.warn(
      "\n⚠  Claude CLI not found or not authenticated.\n" +
      "   Run: claude auth login\n" +
      "   Or set ANTHROPIC_API_KEY in your .env file.\n"
    );
  }
}

const port = Number(process.env.SERVER_PORT ?? SERVER_PORT);
const app = createApp();
const httpServer = createServer(app);
const { agentManager } = createSocketServer(httpServer);

agentManager.init().catch((err) => {
  console.error("Failed to start agent:", err);
  process.exit(1);
});

httpServer.listen(port, () => {
  console.log(`Jarvis server listening on http://localhost:${port}`);
});

process.on("SIGTERM", () => {
  agentManager.destroy();
  httpServer.close(() => process.exit(0));
});
