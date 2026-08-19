import { useEffect, useMemo, useState } from "react";
import { getToken } from "./firebase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const pitOrder = [1, 2, 3, 4, 5, 6, 0, 13, 12, 11, 10, 9, 8, 7];

function App() {
  const [screen, setScreen] = useState("home");
  const [code, setCode] = useState("");
  const [game, setGame] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  async function request(path, options = {}) {
    const token = await getToken();
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  }

  async function createGame() {
    setBusy(true); setError("");
    try { const data = await request("/api/games", { method: "POST" }); setGame(data); setCode(data.code); setScreen("game"); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function joinGame() {
    if (!/^[a-z0-9]{6}$/i.test(code.trim())) return setError("Enter a six-character game code.");
    setBusy(true); setError("");
    try { const data = await request(`/api/games/${code.trim().toUpperCase()}/join`, { method: "POST" }); setGame(data); setCode(data.code); setScreen("game"); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function refresh() {
    if (!code) return;
    try { setGame(await request(`/api/games/${code}`)); } catch (err) { setError(err.message); }
  }

  async function action(payload) {
    setBusy(true); setError("");
    try { setGame(await request(`/api/games/${code}/actions`, { method: "POST", body: JSON.stringify(payload) })); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function reset() {
    setBusy(true); setError("");
    try { setGame(await request(`/api/games/${code}/reset`, { method: "POST" })); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    if (screen !== "game") return undefined;
    const timer = setInterval(refresh, 1500);
    return () => clearInterval(timer);
  }, [screen, code]);

  useEffect(() => {
    const handleKey = (event) => { if (event.code === "Space" && screen === "game") { event.preventDefault(); action({ type: "play" }); } };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [screen, code]);

  if (screen === "home") return <Home code={code} setCode={setCode} onCreate={createGame} onJoin={joinGame} onHelp={() => setShowHelp(true)} busy={busy} error={error} help={showHelp} closeHelp={() => setShowHelp(false)} />;
  return <Game game={game} code={code} busy={busy} error={error} onAction={action} onReset={reset} onHome={() => setScreen("home")} onHelp={() => setShowHelp(true)} help={showHelp} closeHelp={() => setShowHelp(false)} />;
}

function Home({ code, setCode, onCreate, onJoin, onHelp, busy, error, help, closeHelp }) {
  return <main className="shell home-shell"><Header /><section className="home-content"><p className="eyebrow">A Tamil board game</p><h1>Pallanguzhi</h1><p className="lede">Count shells, read the board, and leave your opponent with nowhere to play.</p><button className="primary wide" onClick={onCreate} disabled={busy}>Create new game</button><div className="join-line"><input aria-label="Game code" value={code} maxLength={6} onChange={(event) => setCode(event.target.value.toUpperCase())} onKeyDown={(event) => event.key === "Enter" && onJoin()} placeholder="GAME CODE" /><button className="secondary" onClick={onJoin} disabled={busy || code.length !== 6}>Join</button></div><button className="text-button" onClick={onHelp}>How to play</button>{error && <p className="error">{error}</p>}</section>{help && <Help close={closeHelp} />}</main>;
}

function Header() { return <header className="header"><span className="mark">P</span><span>Pallanguzhi</span></header>; }

function Game({ game, code, busy, error, onAction, onReset, onHome, onHelp, help, closeHelp }) {
  const state = game.state;
  const myTurn = state.isP1Turn === (game.player === 1);
  const canSelect = state.canPress && myTurn && !busy;
  const rows = useMemo(() => [pitOrder.slice(0, 7), pitOrder.slice(7)], []);
  return <main className="shell game-shell"><Header /><div className="toolbar"><button onClick={onHome}>Home</button><button onClick={onReset}>Restart</button><button onClick={onHelp}>Instructions</button><span className="code-chip">{code}</span></div><div className="game-layout"><section className="board-wrap"><div className="board-heading"><span>Player 1 {state.isP1Turn && <b className="turn-dot" />}</span><span className="round">Round {state.roundCount + 1}</span></div><div className="board"><PitRow indexes={rows[0]} state={state} canSelect={canSelect} onSelect={(index) => onAction({ type: "select", index })} /><div className="score-row"><Score value={state.p1Amount} label="P1 shells" /><span className="divider" /><Score value={state.p2Amount} label="P2 shells" /></div><PitRow indexes={rows[1]} state={state} canSelect={canSelect} onSelect={(index) => onAction({ type: "select", index })} /></div><div className="board-heading bottom"><span>Player 2 {(!state.isP1Turn) && <b className="turn-dot" />}</span><span className="online">Live game</span></div></section><aside className="status"><p className="player-label">You are Player {game.player}</p><button className="play" onClick={() => onAction({ type: "play" })} disabled={busy || (state.canPress && !myTurn)} aria-label="Play next move">{state.canPress ? "▶" : "›"}</button><p className="message">{state.msgTextBox}</p>{state.pasuTextBox && <p className="pasu">{state.pasuTextBox}</p>}{state.gameOverTextBox && <p className="game-over">{state.gameOverTextBox}</p>}{error && <p className="error">{error}</p>}<p className="hint">Press Space to play</p></aside></div>{help && <Help close={closeHelp} />}</main>;
}

function PitRow({ indexes, state, canSelect, onSelect }) { return <div className="pit-row">{indexes.map((index) => <button key={index} className={`pit ${state.classes[index]}`} disabled={!canSelect} onClick={() => onSelect(index)}>{state.kuli[index]}</button>)}</div>; }
function Score({ value, label }) { return <div className="score"><strong>{value}</strong><small>{label}</small></div>; }
function Help({ close }) { return <div className="modal-backdrop" role="dialog"><section className="help"><button className="close" onClick={close} aria-label="Close">×</button><p className="eyebrow">The rhythm of the game</p><h2>How to play</h2><p>Create a game and share its six-character code. Player 1 starts with 35 shells in seven pits, and each round distributes five shells into every available pit.</p><p>Choose a non-empty pit on your side. Shells travel clockwise, then continue from each newly filled pit. When the next pit is empty, those shells are collected and the turn changes.</p><p>A pit containing exactly four shells is a Pasu and is collected. When a side runs out of shells, its empty pits become blocked for the next round. The player with more shells wins.</p><button className="primary" onClick={close}>Back to game</button></section></div>; }

export default App;
