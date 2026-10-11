interface InstructionsProps {
  onClose: () => void;
}

export function Instructions({ onClose }: InstructionsProps) {
  return (
    <div className="modal modal-sheet p-5 instructions-overlay" role="dialog" aria-modal="true" aria-labelledby="instructions-title">
      <div className="modal-dialog">
        <div className="modal-content rounded shadow bg-pal-secondary">
          <div className="modal-header border-bottom-0">
            <h2 id="instructions-title" className="modal-title h5">How To Play Pallanguzhi?</h2>
            <button type="button" className="btn btn-lg bg-pal-tertiary" onClick={onClose}>Back</button>
          </div>
          <div className="modal-body text-start">
            <p>To start a new game, click Create Game and share the six-digit code or game link.</p>
            <p>If you already have a game code, enter it and click Join Game.</p>
            <p>Begin by clicking the play button or pressing Space. Player 1 starts the game.</p>
            <p>The upper half belongs to Player 1 and the lower half to Player 2. Initially, each player has 35 shells, distributed five to each kuzhi.</p>
            <p>Choose a kuzhi on your side. Its shells are distributed one by one into the following kuzhis.</p>
            <p>After distributing all shells, continue distributing from adjacent kuzhis by pressing Play or Space. When the next kuzhi is empty, the shells in the following kuzhi go to the player whose turn it is.</p>
            <p>The turn then passes to the other player. If a kuzhi contains four shells at the end of a turn, those shells are collected by the player to whom that kuzhi belongs. This is called Pasu.</p>
            <p>If either half of the board becomes empty, the round ends. Shells are redistributed, leaving pits blocked when a player has fewer than 35 shells.</p>
            <p>When a player has fewer than five shells at the end of a round, the game ends and the player with more shells wins.</p>
            <p>Game created by <a href="https://www.linkedin.com/in/solaiyappan-shanmuganathan-67513016b/">Solaiyappan Shanmuganathan</a>. Happy Playing :)</p>
          </div>
          <div className="modal-footer flex-column border-top-0">
            <button type="button" className="btn btn-lg bg-pal-tertiary w-50 mx-0 mb-2" onClick={onClose}>Back</button>
          </div>
        </div>
      </div>
    </div>
  );
}
