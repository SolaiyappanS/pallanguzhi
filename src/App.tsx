import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import favicon from '../favicon.ico';
import { useIdentity } from './auth/IdentityProvider';
import { GamePage } from './pages/GamePage';
import { HomePage } from './pages/HomePage';

export function App() {
  const { loading, error } = useIdentity();
  const navigate = useNavigate();

  return (
    <>
      <nav className="navbar navbar-dark">
        <div className="container m-3">
          <Link className="navbar-brand d-inline-block" to="/" onClick={() => navigate('/')}>
            <img src={favicon} alt="" />
            <span className="h1" style={{ verticalAlign: 'middle' }}>Pallanguzhi</span>
          </Link>
        </div>
      </nav>
      {loading ? (
        <main className="text-center p-5" role="status">Connecting to the game service…</main>
      ) : error ? (
        <main className="text-center p-5 text-warning" role="alert">Sign-in failed: {error}</main>
      ) : (
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game/:code" element={<GamePage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      )}
    </>
  );
}
