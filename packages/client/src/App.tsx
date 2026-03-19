import { useSocket } from "./hooks/useSocket.js";
import { Layout } from "./components/layout/Layout.js";

export default function App() {
  // Initialise socket connection for the lifetime of the app
  useSocket();
  return <Layout />;
}
