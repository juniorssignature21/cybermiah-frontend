// Tracks which attempt id belongs to which quiz for the current student session.
// The API has no "list my attempts" endpoint, so we remember attempt ids the
// moment we create them (via POST /attempts/start) and use that to look up
// each attempt's real status/score (GET /attempts/{id}) for the dashboard.
// Stored in sessionStorage (not localStorage) to match the rest of the app's
// policy of not leaking data across sessions on a shared exam-room computer.

const STORAGE_KEY = 'quiz_attempt_map';

type AttemptMap = Record<string, string>; // quizId -> attemptId

function readMap(): AttemptMap {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeMap(map: AttemptMap) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function recordAttempt(quizId: string, attemptId: string) {
  const map = readMap();
  map[quizId] = attemptId;
  writeMap(map);
}

export function getAttemptId(quizId: string): string | undefined {
  return readMap()[quizId];
}

export function getAllAttemptIds(): AttemptMap {
  return readMap();
}

export function clearAttempts() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
