export function isGameFullError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const details = 'details' in error ? error.details : undefined;
  return Boolean(details && typeof details === 'object' && 'reason' in details && details.reason === 'GAME_FULL');
}

export function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String(error.code);
    if (code === 'functions/internal' || code === 'functions/unavailable' || code === 'functions/unknown') {
      return 'The game service could not be reached. For local play, start the Firebase Auth, Database, and Functions emulators and set VITE_USE_FIREBASE_EMULATORS=true. For the configured Firebase project, the game Functions must be deployed and their CORS response must allow this origin.';
    }
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
