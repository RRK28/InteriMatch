import { NavLink, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Missions from './pages/Missions';
import MissionDetail from './pages/MissionDetail';
import Dashboard from './pages/Dashboard';
import Profil from './pages/Profil';
import Tendances from './pages/Tendances';
import Mentions from './pages/Mentions';
import NouvelleMission from './pages/NouvelleMission';

function Nav() {
  const { user, logout } = useAuth();
  return (
    <header className="nav">
      <NavLink to="/" className="brand">
        Interi<span>Match</span>
      </NavLink>
      <nav className="nav-links" aria-label="Navigation principale">
        <NavLink to="/missions">Missions</NavLink>
        <NavLink to="/tendances">Tendances</NavLink>
        {user && <NavLink to="/dashboard">Dashboard</NavLink>}
        {user && <NavLink to="/profil">Profil</NavLink>}
        {!user && <NavLink to="/login">Connexion</NavLink>}
        {!user && <NavLink to="/register">Inscription</NavLink>}
        {user && (
          <button type="button" className="btn ghost" onClick={logout} style={{ padding: '0.35rem 0.7rem' }}>
            Déco
          </button>
        )}
      </nav>
    </header>
  );
}

export default function App() {
  return (
    <div className="layout">
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/missions" element={<Missions />} />
          <Route path="/missions/nouvelle" element={<NouvelleMission />} />
          <Route path="/missions/:id" element={<MissionDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/tendances" element={<Tendances />} />
          <Route path="/mentions-legales" element={<Mentions />} />
        </Routes>
      </main>
      <footer className="footer">
        <span>InteriMatch · intérim BTP</span>
        <a href="/mentions-legales">Mentions & RGPD</a>
        <span>Données marché : France Travail (offres MIS)</span>
      </footer>
    </div>
  );
}
