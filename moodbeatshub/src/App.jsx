import { Sidebar } from "./components/organisms/Sidebar";
import "./globals.css";

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <h1>MoodBeatsHub</h1>
        <p>Bienvenid@ a tu aplicación de música y estados de ánimo</p>
      </main>
    </div>
  );
}

export default App;
