import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout/Layout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import InstitutionDetail from "@/pages/InstitutionDetail";
import PublicRegistry from "@/pages/PublicRegistry";
import AdminPanel from "@/pages/AdminPanel";
import InstitutionPortal from "@/pages/InstitutionPortal";
import Uputstvo from "@/pages/Uputstvo";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<PublicRegistry />} />
          <Route path="registar" element={<PublicRegistry />} />
          <Route path="uputstvo" element={<Uputstvo />} />
          <Route path="ustanova/:id" element={<InstitutionDetail />} />
          <Route path="admin" element={<AdminPanel />} />
          <Route path="portal" element={<InstitutionPortal />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}
