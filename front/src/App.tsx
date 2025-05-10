import { Routes, Route } from "react-router-dom";
import PaginaInicio from "./paginas/PaginaInicio";

function App() {
  return (
    <Routes>
      <Route path="/" element={<PaginaInicio />} />
    </Routes>
  );
}

export default App;
