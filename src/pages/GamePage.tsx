import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Instructions } from '../components/Instructions';
import { useIdentity } from '../auth/IdentityProvider';
import { applyAction, joinGame, subscribeToGame } from '../firebase/gameService';
import { errorMessage, isGameFullError } from '../firebase/errors';
import { normalizeGame, type GameAction } from '../../shared/gameEngine';
import type { GameRole, LegacyGameState } from '../types/game';

interface GameRecord extends LegacyGameState {
  players?: { player1Uid?: string | null; player2Uid?: string | null };
}

const playerOneTop = [1, 2, 3, 4, 5];
const playerOneBottom = [0, 6];
const playerTwoBottom = [12, 11, 10, 9, 8];

function getFriendlyError(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  if (code.includes('not-found')) return 'This game does not exist. Check the code or create a new game.';
  if (code.includes('permission-denied')) return 'You are viewing this game and cannot change it.';
  return errorMessage(error);
}

export function GamePage() {
  const { code: rawCode = '' } = useParams();
  const code = rawCode.toUpperCase();
  const navigate = useNavigate();
  const { user } = useIdentity();
  const [game, setGame] = useState<GameRecord | null>(null);
  const [role, setRole] = useState<GameRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const joinAttempt = useRef<string | null>(null);

  useEffect(() => {
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      setError('Invalid game code. Game codes must contain six letters or numbers.');
      setLoading(false);
      setJoining(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToGame(
      code,
      (value) => {
        setGame(value ? { ...normalizeGame(value), ...(value as GameRecord).players ? { players: (value as GameRecord).players } : {} } : null);
        setLoading(false);
      },
      (listenerError) => {
        setError(`Unable to load this game: ${listenerError.message}`);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [code]);

  useEffect(() => {
    if (!user || !/^[A-Z0-9]{6}$/.test(code) || joinAttempt.current === code) return;
    joinAttempt.current = code;
    let active = true;
    const viewerConsentKey = `pallanguzhi-viewer:${code}:${user.uid}`;
    setJoining(true);
    void (async () => {
      try {
        const allowViewer = sessionStorage.getItem(viewerConsentKey) === 'true';
        const membership = await joinGame(code, allowViewer);
        if (membership.role !== 'viewer') sessionStorage.removeItem(viewerConsentKey);
        if (active) setRole(membership.role);
      } catch (joinError) {
        if (!isGameFullError(joinError)) {
          if (active) setError(getFriendlyError(joinError));
          return;
        }
        const joinAsViewer = window.confirm('This game already has 2 players. Would you like to join as a viewer?');
        if (!joinAsViewer) {
          if (active) setError('This game already has 2 players.');
          return;
        }
        sessionStorage.setItem(viewerConsentKey, 'true');
        try {
          const membership = await joinGame(code, true);
          if (active) setRole(membership.role);
        } catch (viewerError) {
          if (active) setError(getFriendlyError(viewerError));
        }
      } finally {
        if (active) setJoining(false);
      }
    })();
    return () => { active = false; };
  }, [code, user]);

  const dispatch = useCallback(async (action: GameAction) => {
    if (!role || role === 'viewer' || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await applyAction(code, action);
    } catch (actionFailure) {
      setActionError(getFriendlyError(actionFailure));
    } finally {
      setBusy(false);
    }
  }, [busy, code, role]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== 'Space' || event.repeat || role === 'viewer' || !role) return;
      const target = event.target;
      if (target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)) return;
      event.preventDefault();
      void dispatch({ type: 'start' });
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dispatch, role]);

  async function shareGame() {
    const url = window.location.href;
    setCopied(false);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join my Pallanguzhi game', text: `Game code: ${code}`, url });
        return;
      } catch (shareError) {
        if (shareError instanceof Error && shareError.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setActionError('Could not copy the link. Copy this URL from your browser address bar.');
    }
  }

  if (loading || joining) {
    return <main id="gamePage" className="p-3 mx-auto text-center" role="status">Loading game {code}…</main>;
  }
  if (error || !game) {
    return (
      <main id="gamePage" className="p-3 mx-auto text-center" role="alert">
        <p className="text-warning">{error ?? 'This game does not exist.'}</p>
        <Link className="btn bg-pal-tertiary" to="/">Back to Lobby</Link>
      </main>
    );
  }

  const canPlay = role === (game.isP1Turn ? 'player1' : 'player2');
  const board = normalizeGame(game);
  const playerLabel = role === 'player1' ? "You're Player 1" : role === 'player2' ? "You're Player 2" : 'You are viewing this game';

  function renderPit(index: number) {
    return (
      <span
        key={index}
        className={board.classes[index] ?? 'kuli'}
        role="button"
        tabIndex={role !== 'viewer' && board.canPress && canPlay ? 0 : -1}
        aria-label={`Kuzhi ${index + 1}, ${board.kuli[index]} shells`}
        aria-disabled={role === 'viewer' || !board.canPress || !canPlay}
        onClick={() => { if (role !== 'viewer') void dispatch({ type: 'select', pit: index }); }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (role !== 'viewer') void dispatch({ type: 'select', pit: index });
          }
        }}
      >
        {board.kuli[index]}
      </span>
    );
  }

  return (
    <main id="gamePage" className="p-3 mx-auto">
      <div className="m-3 game-actions">
        <button className="fs-5 btn bg-pal-tertiary my-1" onClick={() => navigate('/')}>Lobby</button>
        <button className="fs-5 btn bg-pal-tertiary my-1" onClick={() => void shareGame()}>{copied ? 'Link Copied!' : 'Copy Game Link'}</button>
        {role !== 'viewer' && <button className="fs-5 btn bg-pal-tertiary my-1" onClick={() => {
          if (window.confirm('Restart this game?')) void dispatch({ type: 'reset' });
        }} disabled={busy}>Restart Game</button>}
        <button className="fs-5 btn bg-pal-tertiary my-1" onClick={() => setInstructionsOpen(true)}>Instructions</button>
      </div>
      <div className="text-center">
        <div id="board" className="mx-5">
          <h3>GAME CODE: {code}</h3>
          <div className="bg-pal-secondary pb-3 px-3 mt-4 rounded">
            <div className="fw-bold fs-6 text-start pt-2">Player 1 <span className="text-pal-tertiary" style={{ display: board.isP1Turn ? 'contents' : 'none' }}>●</span></div>
            {playerOneTop.map(renderPit)}
            <br />
            {renderPit(playerOneBottom[0])}
            <span className="kuli long" aria-label={`Player 1 shells: ${board.p1Amount}`}>{board.p1Amount}</span>
            {renderPit(playerOneBottom[1])}
          </div>
          <hr className="m-0 p-0" style={{ opacity: 0 }} />
          <div className="bg-pal-secondary pt-3 px-3 rounded">
            {renderPit(13)}
            <span className="kuli long" aria-label={`Player 2 shells: ${board.p2Amount}`}>{board.p2Amount}</span>
            {renderPit(7)}
            <br />
            {playerTwoBottom.map(renderPit)}
            <div className="fw-bold fs-6 text-end pb-2"><span className="text-pal-tertiary" style={{ display: board.isP1Turn ? 'none' : 'contents' }}>●</span> Player 2</div>
          </div>
        </div>
        <section id="msgboard" aria-label="Game controls and status">
          <p className="fs-4 mt-5">{playerLabel}</p>
          {role !== 'viewer' ? (
            <button type="button" className="play-control" aria-label="Play or continue" onClick={() => void dispatch({ type: 'start' })} disabled={busy}>
              <i className={board.playButton} aria-hidden="true" />
            </button>
          ) : <p className="text-pal-tertiary">Viewer mode — moves and seat changes are disabled.</p>}
          <div>{board.msgTextBox}</div>
          <div className="pasu-message">{board.pasuTextBox}</div>
          <div role="status">{board.gameOverTextBox}</div>
          {actionError && <p className="text-warning" role="alert">{actionError}</p>}
          {game.players && <p className="small mt-3">{Number(Boolean(game.players.player1Uid)) + Number(Boolean(game.players.player2Uid))} of 2 player seats occupied</p>}
        </section>
      </div>
      {instructionsOpen && <Instructions onClose={() => setInstructionsOpen(false)} />}
    </main>
  );
}
