import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LobbyEntry } from '../types/game';
import { createGame, subscribeToLobby } from '../firebase/gameService';
import { errorMessage } from '../firebase/errors';
import { Instructions } from '../components/Instructions';

export function HomePage() {
  const navigate = useNavigate();
  const [games, setGames] = useState<LobbyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lobbyError, setLobbyError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  useEffect(() => subscribeToLobby(
    (entries) => {
      setGames(entries);
      setLoading(false);
      setLobbyError(null);
    },
    (error) => {
      setLobbyError(error.message);
      setLoading(false);
    },
  ), []);

  const matchingGames = useMemo(() => {
    const query = code.trim().toUpperCase();
    return query ? games.filter((game) => game.code.includes(query)) : games;
  }, [code, games]);

  async function handleCreateGame() {
    setCreating(true);
    setActionError(null);
    try {
      const newCode = await createGame();
      navigate(`/game/${newCode}`);
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setCreating(false);
    }
  }

  function joinByCode(value: string) {
    const normalized = value.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(normalized)) {
      setActionError('Enter a valid six-character game code.');
      return;
    }
    setActionError(null);
    navigate(`/game/${normalized}`);
  }

  return (
    <main className="d-flex text-center">
      <section id="homePage" className="p-3 mx-auto">
        <div className="w-100 m-auto">
          <h1 className="h3 mb-3">Pallanguzhi - A Tamil Board Game</h1>
          <button className="w-100 btn btn-lg bg-pal-tertiary my-2" onClick={handleCreateGame} disabled={creating}>
            {creating ? 'Creating game…' : 'Create Game'}
          </button>
          <form className="d-flex gap-2 my-2" onSubmit={(event) => { event.preventDefault(); joinByCode(code); }}>
            <input
              id="oldGameCode"
              className="w-100 form-control"
              value={code}
              maxLength={6}
              autoComplete="off"
              placeholder="Search by six-digit game code"
              aria-label="Search games by game code"
              onChange={(event) => setCode(event.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
            />
            <button className="btn bg-pal-tertiary" type="submit" disabled={code.length !== 6}>Join</button>
          </form>
          <button className="w-100 btn btn-lg bg-pal-tertiary my-2" onClick={() => setInstructionsOpen(true)}>
            How To Play?
          </button>
          {actionError && <div className="w-100 text-warning my-2" role="alert">{actionError}</div>}

          <section className="mt-4 text-start" aria-labelledby="lobby-heading">
            <h2 id="lobby-heading" className="h4 text-center">Live Game Lobby</h2>
            {loading ? (
              <p className="text-center" role="status">Loading available games…</p>
            ) : lobbyError ? (
              <p className="text-warning text-center" role="alert">Could not load games: {lobbyError}</p>
            ) : games.length === 0 ? (
              <p className="text-center">No games are available yet. Create a game to get started.</p>
            ) : matchingGames.length === 0 ? (
              <p className="text-center">No games match that code.</p>
            ) : (
              <div className="lobby-list bg-pal-secondary rounded">
                {matchingGames.map((game) => (
                  <article className="lobby-entry p-3" key={game.code}>
                    <div className="lobby-entry-details">
                      <strong>Game {game.code}</strong>
                      <div className="small">
                        {game.occupiedSeats} of 2 player seats occupied · {game.status === 'in-progress' ? 'In progress' : game.status === 'completed' ? 'Completed' : 'Waiting for players'}
                      </div>
                    </div>
                    <button className="btn bg-pal-tertiary" onClick={() => joinByCode(game.code)}>
                      Join Game
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
      {instructionsOpen && <Instructions onClose={() => setInstructionsOpen(false)} />}
    </main>
  );
}
