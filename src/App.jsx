import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import Home from "./pages/Home.jsx";
import Detail from "./pages/Detail.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import NewInvestigation from "./pages/NewInvestigation.jsx";
import NotFound from "./pages/NotFound.jsx";
import { AuthAPI } from "./api.js";

function Protected({ children }) {
  const user = AuthAPI.current();
  if (!user) return <Navigate to="/login" replace />;
  const roles = String(user.roles || "").toLowerCase();
  if (!roles.includes("investigador")) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = React.useState(AuthAPI.current());

  function handleLogout() {
    AuthAPI.signout().finally(() => setUser(null));
  }

  return (
    <>
      <div className="nav">
        <div className="container nav-inner">
          <NavBar user={user} onLogout={handleLogout} />
        </div>
      </div>

      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/investigacion/:id" element={<Detail user={user} />} />
          <Route path="/login" element={<Login onLogin={setUser} />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/nueva"
            element={
              <Protected>
                <NewInvestigation />
              </Protected>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
}
