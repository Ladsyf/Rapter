import { Toaster } from "sileo";
import { AppRoutes } from "./AppRoutes";

function App() {
  return (
    <main className="min-h-screen w-full bg-[radial-gradient(1100px_700px_at_95%_-18%,rgba(15,84,202,0.22),transparent_54%),radial-gradient(900px_550px_at_-10%_15%,rgba(16,185,129,0.15),transparent_50%),linear-gradient(155deg,#030303_0%,#090b10_55%,#0b1220_100%)] px-4 py-8 text-[#e5e7eb] [font-family:'Space_Grotesk','Segoe_UI',sans-serif]">
      <Toaster position="top-center" theme="dark" />
      <AppRoutes />
    </main>
  );
}

export default App;
