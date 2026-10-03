import {
  actionPreview,
  passBlockContests,
  type ActionKind,
} from "./interaction";
import { Football } from "./Football";
import React, { useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Maximize2,
  Minimize2,
  Unlock,
  Play,
  Plus,
  RotateCcw,
  Shield,
  Tags,
  Target,
  TriangleAlert,
  Zap,
  X,
} from "lucide-react";
import {
  actionResult,
  actionScore,
  applyCommand,
  availableActions,
  ballPosition,
  canAct,
  canMove,
  canMovePlayer,
  canReposition,
  canRepositionPlayer,
  canCommitFoul,
  canTackle,
  canTakeSetPiece,
  createMatch,
  distance,
  disciplineFor,
  goalTargetName,
  goalTargetPoint,
  goalTargetReachDifficulty,
  goalTargetThreshold,
  HEIGHT,
  isLegalGoalTarget,
  penaltySetupIsLegal,
  isSentOff,
  isOpponentSide,
  kickoffPosition,
  other,
  passKind,
  possessor,
  previewD6,
  previewD100,
  TEAM_NAMES,
  TEAM_SQUADS,
  TACTICAL_FORMATIONS,
  WINNING_CONDITIONS,
  WIDTH,
  type Command,
  type ContestResolution,
  type GoalTarget,
  remainingMovement,
  movementBlocker,
  type Match,
  type Player,
  type PassKind,
  type Point,
  type Team,
  type TacticalFormation,
  type WinningCondition,
} from "@footroll/engine";

const CARD_SKILLS = [
  [
    "Attack",
    [
      "Scissors-kick",
      "Lob",
      "Finish",
      "Offensive-header",
      "Penalty",
      "Shoot",
      "Free-kick",
      "Effect",
    ],
  ],
  [
    "Midfield",
    [
      "Slip",
      "Dribble",
      "Feint",
      "Low-pass",
      "High-pass",
      "Corner-kick",
      "Throw-in",
    ],
  ],
  ["Defense", ["Defensive-header", "Intercept", "Tackle", "Mark"]],
  ["Goalkeeper", ["Reach", "Catch", "Hand-tackle", "Goal-kick", "Hand-pass"]],
  ["Physical", ["Strength", "Shot-power", "Header-power", "Velocity"]],
] as const;
const SKILL_KEYS: Record<string, string> = {
  "Scissors-kick": "Scissor kick",
  "Offensive-header": "Offensive header",
  "Free-kick": "Free kick",
  "Low-pass": "Short pass",
  "High-pass": "Long pass",
  "Corner-kick": "Corner kick",
  "Throw-in": "Throw in",
  "Defensive-header": "Defensive header",
  "Hand-tackle": "Hand tackle",
  "Goal-kick": "Goalkeeper kick",
  "Hand-pass": "Hand pass",
  "Shot-power": "Shoot power",
  "Header-power": "Header power",
  Velocity: "Pace",
};
const ACTION_TURN_STATES = [
  "Ball carrier",
  "One-touch",
  "Other attackers",
  "Defenders",
] as const;
const MOVEMENT_TURN_STATES = [
  "Attackers",
  "Defenders",
  "Attackers (own side)",
] as const;
import { Capacitor } from "@capacitor/core";
import { localMatchStorage, restoreMatch } from "./storage";
import { Pitch, type LiveBallVisual, type PitchReplay } from "./Pitch";
import "./styles.css";
const restored = restoreMatch();
function restoreShowNames() {
  try {
    return localStorage.getItem("footroll.show-player-names") === "true";
  } catch {
    return false;
  }
}
const isLocalPreview = ["127.0.0.1", "localhost"].includes(location.hostname);
if ("serviceWorker" in navigator && isLocalPreview) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        Promise.all(
          registrations.map((registration) => registration.unregister()),
        ),
      )
      .catch(() => {});
  });
} else if (
  import.meta.env.PROD &&
  !Capacitor.isNativePlatform() &&
  ["https:", "http:"].includes(location.protocol) &&
  "serviceWorker" in navigator
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {});
  });
}
const crest = (team: Team) =>
  `${import.meta.env.BASE_URL}${team === "home" ? "barcelona" : "madrid"}-crest.png`;
function DicePair({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`d10-pair ${compact ? "compact" : ""}`} aria-hidden="true">
      <img className="d10-die d10-red" src="./d10.png" alt="" />
      <img className="d10-die d10-blue" src="./d10.png" alt="" />
    </span>
  );
}
function WhistleIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      className="whistle-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8.5 9A6.5 6.5 0 0 0 2 15.5 6.5 6.5 0 0 0 8.5 22a6.5 6.5 0 0 0 6.5-6.5v-1.59L22 12V9H11v2H9V9h-.5M11 2v5H9V2h2M6.35 7.28c-.67.16-1.31.4-1.92.72L2.14 4.88 3.76 3.7l2.59 3.58M17.86 4.88 16.32 7h-2.47l2.39-3.3 1.62 1.18Z" />
    </svg>
  );
}
function CardIcon({
  color = "pending",
}: {
  color?: "pending" | "yellow" | "red";
}) {
  return (
    <span
      className={`referee-card-icon ${color}`}
      role="img"
      aria-label={
        color === "pending" ? "Card decision pending" : `${color} card`
      }
    />
  );
}
function GoalTargetSelector({
  match,
  onSelect,
}: {
  match: Match;
  onSelect: (target: GoalTarget) => void;
}) {
  const pending = match.pendingShotTarget;
  if (!pending) return null;
  const shooter = match.players.find(
      (player) => player.id === pending.shooterId,
    )!,
    goalkeeper = match.players.find(
      (player) =>
        player.team !== shooter.team &&
        player.role === "Goalkeeper" &&
        !isSentOff(match, player),
    ),
    goalkeeperTarget = goalkeeper
      ? {
          row: 0 as const,
          column: Math.max(
            0,
            Math.min(7, Math.round(goalkeeper.y - (HEIGHT / 2 - 4))),
          ),
        }
      : null,
    rows: GoalTarget["row"][] = [2, 1, 0],
    columns =
      shooter.team === "home"
        ? Array.from({ length: 8 }, (_, column) => column)
        : Array.from({ length: 8 }, (_, index) => 7 - index),
    legalTargets = rows.flatMap((row) =>
      Array.from({ length: 8 }, (_, column) => ({ row, column })).filter(
        (target) => isLegalGoalTarget(pending, target),
      ),
    );
  return (
    <section className="goal-target-view" aria-labelledby="goal-target-title">
      <header>
        <span>Shot placement · Success (+{pending.attempt.result})</span>
        <h2 id="goal-target-title">Choose the target</h2>
        <p>
          Select one of {legalTargets.length} available cells. Values show the
          goalkeeper’s Reach difficulty; availability uses 5 placement points
          per step from the closest target.
        </p>
      </header>
      <div className="goal-target-frame">
        <div className="goal-target-net" role="grid" aria-label="Goal targets">
          {rows.flatMap((row) =>
            columns.map((column) => {
              const target: GoalTarget = { row, column },
                legal = isLegalGoalTarget(pending, target),
                closest =
                  target.row === pending.closest.row &&
                  target.column === pending.closest.column,
                keeper =
                  goalkeeperTarget?.row === target.row &&
                  goalkeeperTarget.column === target.column,
                threshold = goalTargetThreshold(pending.closest, target),
                reachDifficulty = goalkeeper
                  ? goalTargetReachDifficulty(goalkeeper, target)
                  : null;
              return (
                <button
                  type="button"
                  role="gridcell"
                  className={`goal-target-cell ${legal ? "allowed" : "prohibited"} ${closest ? "closest" : ""}`}
                  disabled={!legal}
                  aria-label={`${goalTargetName(target)}, ${reachDifficulty === null ? "no goalkeeper" : `goalkeeper Reach difficulty ${reachDifficulty}`}, ${threshold} placement points, ${legal ? "available" : "prohibited"}${keeper && goalkeeper ? `, defended by ${goalkeeper.name}` : ""}`}
                  onClick={() => onSelect(target)}
                  key={`${row}-${column}`}
                >
                  <span className="goal-target-value">
                    {reachDifficulty ?? "—"}
                  </span>
                  {keeper && goalkeeper && (
                    <span
                      className="goalkeeper-target"
                      title={`${goalkeeper.name} position`}
                    >
                      <Shield size={20} aria-hidden="true" />
                      <span>{goalkeeper.number}</span>
                    </span>
                  )}
                </button>
              );
            }),
          )}
        </div>
      </div>
      <footer className="goal-target-legend">
        <span className="allowed">Available</span>
        <span className="prohibited">Prohibited</span>
        <span className="closest">Closest target</span>
        {goalkeeper && <span className="keeper">{goalkeeper.name}</span>}
      </footer>
    </section>
  );
}
function teamForStage(match: Match): Team {
  if (match.setup && match.foulRestart)
    return match.foulRestart.setupStage === "attackers"
      ? match.foulRestart.team
      : other(match.foulRestart.team);
  if (match.setup && match.setPieceRestart)
    return match.setPieceRestart.setupStage === "attackers"
      ? match.setPieceRestart.team
      : other(match.setPieceRestart.team);
  if (match.oneTouch)
    return (
      match.players.find((p) => p.id === match.oneTouch?.playerId)?.team ??
      match.active
    );
  if (
    (match.phase === "action" && match.actionStage === "defenders") ||
    (match.phase === "movement" && match.movementStage === "defense")
  )
    return other(match.active);
  return match.active;
}
function initialSelection(match: Match): Record<Team, string> {
  const ballPlayer = possessor(match),
    selections: Record<Team, string> = {
      home: ballPlayer?.team === "home" ? ballPlayer.id : "home-9",
      away: ballPlayer?.team === "away" ? ballPlayer.id : "away-11",
    },
    team = teamForStage(match),
    eligible = match.players.find(
      (player) =>
        player.team === team &&
        (match.setup || match.phase !== "action" || canAct(match, player)),
    );
  if (eligible) selections[team] = eligible.id;
  return selections;
}
type ReplayStep = PitchReplay & {
  label: string;
  turn: number;
  resolution?: NonNullable<Match["log"][number]["resolution"]>;
};
type ReplaySequence = { steps: ReplayStep[]; goal: boolean };
function replayBallMotion(label: string | undefined): PassKind | undefined {
  if (!label) return undefined;
  if (/throw-in|goal-kick/i.test(label)) return "high-pass";
  if (/high-pass/i.test(label)) return "high-pass";
  if (/low-pass/i.test(label)) return "low-pass";
  return undefined;
}
function App() {
  const [match, setMatch] = useState(restored.match);
  const [showNames, setShowNames] = useState(restoreShowNames);
  const [pitchMaximized, setPitchMaximized] = useState(false);
  const [formationPreset, setFormationPreset] = useState<
    Record<Team, TacticalFormation | "custom">
  >({ home: "custom", away: "custom" });
  const [selected, setSelected] = useState<Record<Team, string>>(
    initialSelection(restored.match),
  );
  const [mode, setMode] = useState<"select" | "pass">("select");
  const [focusedTeam, setFocusedTeam] = useState<Team>(
    teamForStage(restored.match),
  );
  const [action, setAction] = useState<ActionKind | null>(null);
  const [hoveredSkill, setHoveredSkill] = useState<{
    team: Team;
    key: string;
    label: string;
  } | null>(null);
  const [passTarget, setPassTarget] = useState<Point | null>(null);
  const [resolution, setResolution] = useState<{
    difficulty: number;
    skill: number;
    dice: number | null;
    score: number | null;
    result: number | null;
    outcome: string;
    label: string;
    contest?: ContestResolution;
  } | null>(null);
  const [contestRolls, setContestRolls] = useState<Record<string, number>>({});
  const [contestRound, setContestRound] = useState(0);
  const [notice, setNotice] = useState(restored.warning),
    [result, setResult] = useState("");
  const [history, setHistory] = useState<Match[]>([]),
    [possessionReplay, setPossessionReplay] = useState<ReplayStep[]>([]),
    [lastReplay, setLastReplay] = useState<ReplaySequence | null>(null),
    [goalPause, setGoalPause] = useState(false),
    [outPause, setOutPause] = useState<
      NonNullable<Match["setPieceRestart"]>["kind"] | null
    >(restored.match.setPieceRestart?.kind ?? null),
    [completedGoalkeeperShot, setCompletedGoalkeeperShot] = useState<{
      shot: NonNullable<Match["pendingGoalkeeperShot"]>;
      turn: number;
    } | null>(null),
    [replaySession, setReplaySession] = useState<{
      steps: ReplayStep[];
      index: number;
    } | null>(null),
    [modal, setModal] = useState<"help" | "new" | null>(null),
    [saved, setSaved] = useState(true);
  const [cursor, setCursor] = useState<Point>({ x: 49, y: 32 });
  function clearContestRolls() {
    setContestRolls({});
    setContestRound(0);
  }
  const ballPlayer = possessor(match),
    ball = ballPosition(match),
    kickoffCenter = kickoffPosition(match.active),
    kickoffReady =
      !!ballPlayer &&
      ballPlayer.team === match.active &&
      ballPlayer.x === kickoffCenter.x &&
      ballPlayer.y === kickoffCenter.y &&
      match.ball.x === kickoffCenter.x &&
      match.ball.y === kickoffCenter.y,
    stageTeam = teamForStage(match),
    current =
      match.players.find(
        (player) =>
          player.id === selected[focusedTeam] && player.team === focusedTeam,
      ) ??
      match.players.find(
        (player) => player.team === focusedTeam && !isSentOff(match, player),
      )!,
    canTakeRestart =
      canTakeSetPiece(match, current) &&
      current.id !==
        (match.foulRestart?.takerId ?? match.setPieceRestart?.takerId),
    freeKickDefendersTooClose =
      match.setup &&
      match.foulRestart?.kind === "free-kick" &&
      match.foulRestart.setupStage === "defenders" &&
      match.players.some(
        (player) =>
          player.team !== match.foulRestart!.team &&
          !isSentOff(match, player) &&
          distance(player, match.foulRestart!.position) < 10,
      ),
    penaltySetupInvalid =
      match.setup &&
      match.foulRestart?.kind === "penalty" &&
      !penaltySetupIsLegal(match),
    turnStateIndex = match.setup
      ? 0
      : match.phase === "action"
        ? match.oneTouch || match.challengedBall
          ? 1
          : match.actionStage === "ball-carrier"
            ? 0
            : match.actionStage === "attackers"
              ? 2
              : 3
        : match.movementStage === "attack-opponent"
          ? 4
          : match.movementStage === "defense"
            ? 5
            : 6,
    ballActions = ballPlayer ? availableActions(match, ballPlayer) : [],
    ballPassAction: ActionKind = ballActions.includes("throw-in")
      ? "throw-in"
      : "pass",
    winnerMessage =
      match.winner === "draw"
        ? "Draw!"
        : match.winner
          ? `${TEAM_NAMES[match.winner]} wins!`
          : "GOOOL!";
  useEffect(() => {
    try {
      localMatchStorage.save(match);
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [match]);
  useEffect(() => {
    try {
      localStorage.setItem("footroll.show-player-names", String(showNames));
    } catch {
      // The option remains available for this session when storage is blocked.
    }
  }, [showNames]);
  const replay = replaySession?.steps[replaySession.index] ?? null;
  useEffect(() => {
    if (!replaySession || !replay) return;
    const timer = window.setTimeout(
      () =>
        setReplaySession((session) =>
          !session || session.index + 1 >= session.steps.length
            ? null
            : { ...session, index: session.index + 1 },
        ),
      replay.goal ? 1500 : 1200,
    );
    return () => window.clearTimeout(timer);
  }, [replaySession, replay]);
  const [passVisual, setPassVisual] = useState<LiveBallVisual | null>(null);
  const preview = actionPreview(match, action, current, passTarget);
  const replayResolution = replay?.resolution,
    pausedOutResolution = outPause
      ? [...match.log]
          .reverse()
          .find(
            (event) =>
              event.turn === match.turn - 1 && event.resolution !== undefined,
          )?.resolution
      : undefined,
    displayedResolution = replaySession
      ? replayResolution
        ? {
            difficulty: replayResolution.difficulty,
            skill: replayResolution.skill,
            dice: replayResolution.dice ?? null,
            score: replayResolution.score ?? null,
            result:
              replayResolution.result ??
              (replayResolution.score === undefined
                ? null
                : actionResult(
                    replayResolution.score,
                    replayResolution.difficulty,
                  )),
            outcome: replayResolution.outcome,
            label: replayResolution.label,
            contest: replayResolution.contest,
          }
        : null
      : (resolution ??
        (pausedOutResolution
          ? {
              difficulty: pausedOutResolution.difficulty,
              skill: pausedOutResolution.skill,
              dice: pausedOutResolution.dice ?? null,
              score: pausedOutResolution.score ?? null,
              result:
                pausedOutResolution.result ??
                (pausedOutResolution.score === undefined
                  ? null
                  : actionResult(
                      pausedOutResolution.score,
                      pausedOutResolution.difficulty,
                    )),
              outcome: pausedOutResolution.outcome,
              label: pausedOutResolution.label,
              contest: pausedOutResolution.contest,
            }
          : null)),
    displayedPreview = replaySession ? null : preview,
    blockContests =
      !replaySession &&
      (action === "pass" || action === "shoot" || action === "lob")
        ? passBlockContests(match)
        : [],
    previewContest: ContestResolution | undefined =
      displayedPreview && "contest" in displayedPreview
        ? displayedPreview.contest
        : undefined,
    contest: ContestResolution | undefined =
      previewContest ?? blockContests[0] ?? displayedResolution?.contest,
    contestOpponents =
      blockContests.length && !contest?.winnerId
        ? blockContests.map((item) => item.opponent)
        : contest
          ? [contest.opponent]
          : [],
    contestWinner = contest?.winnerId
      ? contest.winnerId === contest.actor.playerId
        ? contest.actor.name
        : contest.opponent.name
      : null,
    goalkeeperShot =
      match.pendingGoalkeeperShot ?? completedGoalkeeperShot?.shot ?? null,
    goalkeeperShotTurn = match.pendingGoalkeeperShot
      ? match.turn
      : completedGoalkeeperShot?.turn,
    pendingFoul = match.pendingFoul,
    foulOffender = pendingFoul
      ? match.players.find((player) => player.id === pendingFoul.offenderId)
      : undefined,
    foulVictim = pendingFoul
      ? match.players.find((player) => player.id === pendingFoul.victimId)
      : undefined,
    goalkeeperShooter = goalkeeperShot
      ? match.players.find((player) => player.id === goalkeeperShot.shooterId)
      : undefined,
    goalkeeper = goalkeeperShot
      ? match.players.find(
          (player) => player.id === goalkeeperShot.goalkeeperId,
        )
      : undefined,
    reachResolution = goalkeeperShot
      ? [...match.log]
          .reverse()
          .find(
            (event) =>
              event.turn === goalkeeperShotTurn &&
              event.resolution?.label === "Reach",
          )?.resolution
      : undefined,
    shotPowerResolution = goalkeeperShot
      ? [...match.log]
          .reverse()
          .find(
            (event) =>
              event.turn === goalkeeperShotTurn &&
              (event.resolution?.label === "Shot power" ||
                event.resolution?.label === "Header power"),
          )?.resolution
      : undefined,
    catchResolution = goalkeeperShot
      ? [...match.log]
          .reverse()
          .find(
            (event) =>
              event.turn === goalkeeperShotTurn &&
              event.resolution?.label === "Catch",
          )?.resolution
      : undefined,
    displayedCardColor = result.toLowerCase().includes("yellow card")
      ? ("yellow" as const)
      : result.toLowerCase().includes("red card")
        ? ("red" as const)
        : null,
    displayedFoulCardColor =
      displayedCardColor ??
      (displayedResolution?.label === "Foul" &&
      displayedResolution.outcome.includes("Sent off")
        ? ("red" as const)
        : null),
    displayedFoulMessage =
      displayedResolution?.label === "Foul"
        ? displayedFoulCardColor === "red"
          ? "Foul · Red card · Sent off"
          : displayedFoulCardColor === "yellow"
            ? displayedResolution.outcome.includes("Sent off")
              ? "Foul · Second yellow · Sent off"
              : "Foul · Yellow card"
            : "Foul · No card"
        : null,
    blockedActionMessage =
      !replaySession && previewContest
        ? action === "challenge"
          ? `Challenged ball · ${previewContest.actor.name} and ${previewContest.opponent.name} must resolve control`
          : action === "dribble" || action === "slip"
            ? `${previewContest.actor.name} is blocked by ${previewContest.opponent.name} · Resolve the contest below`
            : (action === "pass" ||
                  action === "throw-in" ||
                  action === "low-pass" ||
                  action === "defensive-header") &&
                passTarget
              ? `Pass contested by ${previewContest.opponent.name} · Resolve the contest below`
              : null
        : null;
  function plan(kind: ActionKind) {
    setAction(kind);
    setPassTarget(null);
    setResolution(null);
    clearContestRolls();
    setResult("");
    setNotice("");
    setMode(
      kind === "pass" ||
        kind === "throw-in" ||
        kind === "low-pass" ||
        kind === "defensive-header"
        ? "pass"
        : "select",
    );
    if (kind !== "tackle" && ballPlayer) {
      setFocusedTeam(ballPlayer.team);
      setSelected((ids) => ({ ...ids, [ballPlayer.team]: ballPlayer.id }));
      setCursor({ x: ball.x, y: ball.y });
    }
  }
  function dispatch(
    command: Command,
    commandPreview: ReturnType<typeof actionPreview> = preview,
  ) {
    try {
      const next = applyCommand(match, command),
        newEvents = next.log.filter(
          (entry) =>
            entry.id > (match.log.at(-1)?.id ?? 0) && entry.turn === match.turn,
        ),
        event = [...next.log]
          .reverse()
          .find((e) => e.id > (match.log.at(-1)?.id ?? 0) && e.kind !== "info");
      setReplaySession(null);
      const goal = event?.resolution?.outcome === "Goal" && !!ballPlayer,
        replayTo: Match = goal
          ? {
              ...match,
              score: { ...next.score },
              winner: next.winner,
              possession: null,
              ball: {
                x: ballPlayer.team === "home" ? 99 : 0,
                y: 32,
              },
              log: next.log,
            }
          : next,
        replayEvents = newEvents.length
          ? newEvents
          : [
              {
                text: event?.resolution?.label || "Match state updated",
              },
            ],
        commandSteps: ReplayStep[] = replayEvents.map((entry, index) => ({
          from: index === 0 ? match : replayTo,
          to: replayTo,
          id: Date.now() + index,
          turn: match.turn,
          label: entry.text,
          ...(entry && "resolution" in entry && entry.resolution
            ? {
                resolution: entry.resolution,
                ballMotion: replayBallMotion(entry.resolution.label),
              }
            : {}),
          ...(goal && index === 0 ? { goal: true } : {}),
        }));
      const setupCommand =
        command.type === "unlock-positions" ||
        command.type === "apply-formation" ||
        command.type === "reposition" ||
        command.type === "start" ||
        command.type === "set-winning-condition";
      if (goal) {
        setLastReplay({
          steps: [...possessionReplay, ...commandSteps],
          goal: true,
        });
        setPossessionReplay([]);
      } else if (!setupCommand) {
        if (command.type !== "advance")
          setLastReplay({ steps: commandSteps, goal: false });
        setPossessionReplay((steps) =>
          next.possession !== match.possession
            ? commandSteps
            : [...steps, ...commandSteps],
        );
      }
      const nextBallPosition = ballPosition(next),
        outKind =
          next.setPieceRestart &&
          (!match.setPieceRestart || next.turn !== match.turn)
            ? next.setPieceRestart.kind
            : null,
        loggedPassMotion = replayBallMotion(
          event?.resolution?.label ?? event?.text,
        ),
        directPassMotion: PassKind | undefined =
          command.type === "one-touch-pass"
            ? command.kind === "defensive-header"
              ? "high-pass"
              : "low-pass"
            : command.type === "throw-in"
              ? "high-pass"
              : command.type === "pass"
                ? match.setPieceRestart?.kind === "throw-in" ||
                  match.setPieceRestart?.kind === "goal-kick"
                  ? "high-pass"
                  : passKind(distance(ball, command.to))
                : undefined,
        passMotion = loggedPassMotion ?? directPassMotion,
        ballMoved =
          ball.x !== nextBallPosition.x || ball.y !== nextBallPosition.y;
      const pendingGoalShot =
          command.type === "resolve-goalkeeper-shot"
            ? match.pendingGoalkeeperShot
            : command.type === "select-shot-target"
              ? match.pendingShotTarget
              : null,
        goalShooterId = pendingGoalShot?.shooterId ?? ballPlayer?.id,
        goalShooter = match.players.find(
          (player) => player.id === goalShooterId,
        ),
        selectedGoalTarget =
          command.type === "select-shot-target"
            ? command.target
            : command.type === "resolve-goalkeeper-shot"
              ? match.pendingGoalkeeperShot?.target
              : null;
      if (goal && goalShooter) {
        setPassVisual({
          from: { x: goalShooter.x, y: goalShooter.y },
          to: selectedGoalTarget
            ? goalTargetPoint(goalShooter, selectedGoalTarget)
            : {
                x: goalShooter.team === "home" ? WIDTH - 1 : 0,
                y: Math.max(28, Math.min(35, Math.round(goalShooter.y))),
              },
          difficulty: event?.resolution?.difficulty ?? 0,
          kind:
            pendingGoalShot?.attempt.lob ||
            (command.type === "shoot" && command.kind === "lob")
              ? "high-pass"
              : "linear",
          id: Date.now(),
          goal: true,
          hideLabel: true,
          displayMatch: match,
        });
      } else if (passMotion && ballMoved) {
        setPassVisual({
          from: { ...ball },
          to: { ...nextBallPosition },
          difficulty: commandPreview?.difficulty ?? 0,
          kind: passMotion,
          id: Date.now(),
          ...(outKind ? { out: outKind } : {}),
        });
      } else setPassVisual(null);
      if (
        command.type === "resolve-goalkeeper-shot" &&
        match.pendingGoalkeeperShot?.stage === "catch" &&
        !next.pendingGoalkeeperShot
      ) {
        setCompletedGoalkeeperShot({
          shot: match.pendingGoalkeeperShot,
          turn: match.turn,
        });
      } else if (!next.pendingGoalkeeperShot) {
        setCompletedGoalkeeperShot(null);
      }
      if (!goal && next.winner && !match.winner) setGoalPause(true);
      if (outKind) {
        if (passMotion && ballMoved) setOutPause(null);
        else setOutPause(outKind);
      }
      setHistory((h) => [...h.slice(-19), match]);
      setMatch(next);
      if (command.type === "apply-formation")
        setFormationPreset((current) => ({
          ...current,
          [command.team]: command.formation,
        }));
      else if (command.type === "reposition") {
        const repositioned = match.players.find(
          (player) => player.id === command.playerId,
        );
        if (repositioned)
          setFormationPreset((current) => ({
            ...current,
            [repositioned.team]: "custom",
          }));
      } else if (command.type === "unlock-positions")
        setFormationPreset({ home: "custom", away: "custom" });
      clearContestRolls();
      const nextBallPlayer = possessor(next),
        nextStageTeam = teamForStage(next),
        setupPlayer = next.setup
          ? (next.players.find(
              (player) =>
                player.team === nextStageTeam &&
                canRepositionPlayer(next, player),
            ) ??
            next.players.find(
              (player) =>
                player.team === nextStageTeam && !isSentOff(next, player),
            ))
          : undefined;
      if (
        next.active !== match.active ||
        next.setup !== match.setup ||
        next.actionStage !== match.actionStage ||
        next.phase !== match.phase ||
        next.setPieceRestart?.setupStage !==
          match.setPieceRestart?.setupStage ||
        next.foulRestart?.setupStage !== match.foulRestart?.setupStage ||
        !!next.oneTouch !== !!match.oneTouch
      ) {
        const eligible = next.players.find((p) =>
          next.phase === "action" ? canAct(next, p) : false,
        );
        const p = next.setup
          ? setupPlayer
          : ((next.oneTouch
              ? next.players.find((p) => p.id === next.oneTouch?.playerId)
              : next.actionStage === "ball-carrier"
                ? nextBallPlayer
                : eligible) ??
            next.players.find(
              (player) =>
                player.id === selected[nextStageTeam] &&
                player.team === nextStageTeam,
            ));
        if (p) {
          setFocusedTeam(nextStageTeam);
          setSelected((ids) => ({ ...ids, [nextStageTeam]: p.id }));
          setCursor({ x: p.x, y: p.y });
        }
      }
      setAction(null);
      setPassTarget(null);
      setMode("select");
      if (command.type === "reposition") {
        setCursor({ ...command.to });
      } else if (
        command.type === "apply-formation" &&
        focusedTeam === command.team
      ) {
        const focused = next.players.find(
          (player) => player.id === selected[command.team],
        );
        if (focused) setCursor({ x: focused.x, y: focused.y });
      }
      if (next.pendingShotTarget) {
        const shooter = next.players.find(
          (player) => player.id === next.pendingShotTarget?.shooterId,
        )!;
        setFocusedTeam(shooter.team);
        setSelected((ids) => ({ ...ids, [shooter.team]: shooter.id }));
        setCursor({ x: shooter.x, y: shooter.y });
      } else if (next.pendingGoalkeeperShot) {
        const pending = next.pendingGoalkeeperShot,
          roller = next.players.find(
            (player) =>
              player.id ===
              (pending.stage === "power"
                ? pending.shooterId
                : pending.goalkeeperId),
          )!;
        setFocusedTeam(roller.team);
        setSelected((ids) => ({
          ...ids,
          [roller.team]: roller.id,
        }));
        setCursor({ x: roller.x, y: roller.y });
      } else if (next.challengedBall) {
        const receiver = next.players.find(
            (player) => player.id === next.challengedBall?.receiverId,
          )!,
          defender = next.players.find(
            (player) => player.id === next.challengedBall?.defenderId,
          )!;
        setAction("challenge");
        setFocusedTeam(receiver.team);
        setSelected((ids) => ({
          ...ids,
          [receiver.team]: receiver.id,
          [defender.team]: defender.id,
        }));
        setCursor({ x: receiver.x, y: receiver.y });
      } else if (next.pendingShot) {
        setAction("shoot");
        setFocusedTeam(next.active);
        const shooter = possessor(next)!;
        setSelected((ids) => ({ ...ids, [shooter.team]: shooter.id }));
        setCursor({ x: shooter.x, y: shooter.y });
      } else if (next.pendingPass) {
        const passer = next.players.find(
          (player) => player.id === next.pendingPass?.playerId,
        )!;
        setAction("pass");
        setPassTarget({ ...next.pendingPass.to });
        setMode("pass");
        setFocusedTeam(passer.team);
        setSelected((ids) => ({ ...ids, [passer.team]: passer.id }));
        setCursor({ x: passer.x, y: passer.y });
      } else if (command.type === "resolve-block") {
        const actor = next.players.find(
          (player) => player.id === command.playerId,
        );
        if (actor && next.phase === "movement")
          setCursor({ x: actor.x, y: actor.y });
      }
      setNotice("");
      setResult(event?.text ?? "");
      if (next.pendingPass || next.pendingShot || next.pendingGoalkeeperShot)
        setResolution(null);
      else if (event?.resolution) {
        setResolution({
          difficulty: event.resolution.difficulty,
          skill: event.resolution.skill,
          dice: event.resolution.dice ?? null,
          score: event.resolution.score ?? null,
          result:
            event.resolution.result ??
            (event.resolution.score === undefined
              ? null
              : actionResult(
                  event.resolution.score,
                  event.resolution.difficulty,
                )),
          outcome: event.resolution.outcome,
          label: event.resolution.label,
          contest: event.resolution.contest,
        });
      } else if (event?.dice !== undefined && commandPreview) {
        const score = actionScore(event.dice, commandPreview.skill);
        setResolution({
          difficulty: commandPreview.difficulty,
          skill: commandPreview.skill,
          dice: event.dice,
          score,
          result: actionResult(score, commandPreview.difficulty),
          outcome:
            actionResult(score, commandPreview.difficulty) >= 0
              ? "Success"
              : "Failed",
          label: commandPreview.label,
        });
      } else setResolution(null);
      if (next.possession !== match.possession) {
        const receiver = possessor(next);
        if (receiver) {
          setSelected((ids) => ({ ...ids, [receiver.team]: receiver.id }));
          setFocusedTeam(nextStageTeam);
          if (receiver.team === nextStageTeam)
            setCursor({ x: receiver.x, y: receiver.y });
        }
      }
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  function preparePass(to: Point) {
    clearContestRolls();
    const passAction: ActionKind | null = match.oneTouch
      ? action === "low-pass" || action === "defensive-header"
        ? action
        : match.oneTouch.actions.includes("low-pass")
          ? "low-pass"
          : null
      : match.setPieceRestart?.kind === "throw-in"
        ? "throw-in"
        : "pass";
    if (!passAction) {
      setNotice("Choose an available one-touch action first.");
      return;
    }
    if (
      passAction === "low-pass" &&
      ballPlayer &&
      distance(ballPlayer, to) > 30
    ) {
      setNotice("A one-touch Low-pass cannot exceed 30 yards.");
      return;
    }
    const passDifficulty = ballPlayer
      ? distance(ballPlayer, to) *
        (passAction === "throw-in"
          ? 2
          : passAction === "defensive-header"
            ? 3
            : 1)
      : 0;
    if (passDifficulty > 100) {
      setPassVisual(null);
      setPassTarget(null);
      setNotice("A pass or throw-in cannot have difficulty above 100.");
      return;
    }
    const pass = ballPlayer
      ? actionPreview(match, passAction, ballPlayer, to)
      : null;
    if (pass && "automatic" in pass && pass.automatic) {
      dispatch(pass.command, pass);
      return;
    }
    setPassVisual(null);
    plan(passAction);
    setPassTarget(to);
  }
  function select(player: Player) {
    setResolution(null);
    clearContestRolls();
    setResult("");
    if (mode === "pass" && player.id !== ballPlayer?.id)
      preparePass({ x: player.x, y: player.y });
    else if (mode === "pass") setPassTarget(null);
    setFocusedTeam(player.team);
    setSelected((ids) => ({ ...ids, [player.team]: player.id }));
    setCursor({ x: player.x, y: player.y });
    setNotice("");
  }
  function rollContestSide(side: ContestResolution["actor"]) {
    if (!preview || !contest || contestRolls[side.playerId] !== undefined)
      return;
    const actorDice = contestRolls[contest.actor.playerId],
      foulChecksEnabled =
        action !== "pass" &&
        action !== "throw-in" &&
        action !== "low-pass" &&
        action !== "defensive-header",
      ignoredActorFoul =
        foulChecksEnabled &&
        actorDice !== undefined &&
        actorDice >= 1 &&
        actorDice <= 9 &&
        previewD6(match, contestRound * 2 + 1) === 1,
      offset =
        contestRound * 2 +
        (side.playerId === contest.actor.playerId
          ? 0
          : 1 + Number(ignoredActorFoul));
    const rolls = {
      ...contestRolls,
      [side.playerId]: previewD100(match, offset),
    };
    setContestRolls(rolls);
    if (
      side.playerId === contest.actor.playerId &&
      foulChecksEnabled &&
      rolls[contest.actor.playerId] >= 1 &&
      rolls[contest.actor.playerId] <= 9 &&
      previewD6(match, contestRound * 2 + 1) !== 1
    ) {
      dispatch(preview.command, preview);
      return;
    }
    if (
      rolls[contest.actor.playerId] !== undefined &&
      rolls[contest.opponent.playerId] !== undefined
    ) {
      const actorScore = actionScore(
          rolls[contest.actor.playerId],
          contest.actor.skill,
        ),
        opponentScore = actionScore(
          rolls[contest.opponent.playerId],
          contest.opponent.skill,
        );
      if (actorScore === opponentScore) {
        setContestRolls({});
        setContestRound((round) => round + 1);
        setNotice("Draw. Roll both dice again.");
      } else dispatch(preview.command, preview);
    }
  }
  function contestSideCard(
    side: ContestResolution["actor"],
    label: string,
    rollable: boolean,
    className = "",
    pileIndex?: number,
  ) {
    if (!contest) return null;
    const stagedDice = side.dice ?? contestRolls[side.playerId],
      stagedScore =
        side.score ??
        (stagedDice === undefined
          ? undefined
          : actionScore(stagedDice, side.skill)),
      canRoll = rollable && !!preview && stagedDice === undefined;
    return (
      <section
        className={`duel-side ${className} ${side.team} ${side.playerId === contest.winnerId ? "winner" : ""} ${canRoll ? "roll-active" : "roll-inactive"}`}
        key={side.playerId}
        style={
          pileIndex === undefined
            ? undefined
            : ({
                "--pile-index": Math.min(pileIndex, 3),
              } as React.CSSProperties)
        }
      >
        <div className="duel-heading">
          <strong className="duel-player">{side.name}</strong>
          <span className="duel-side-label">{label}</span>
        </div>
        <dl>
          <div>
            <dt>{side.skillLabel}</dt>
            <dd>{side.skill}</dd>
          </div>
          <div className="duel-dice">
            <dt>Dice</dt>
            <dd>
              <button
                className={`duel-dice-button ${stagedDice !== undefined ? "rolled" : ""}`}
                aria-label={`Roll dice for ${side.name}`}
                title={
                  canRoll
                    ? `Roll dice for ${side.name}`
                    : stagedDice !== undefined
                      ? `${side.name} has already rolled`
                      : `${side.name} is waiting`
                }
                disabled={!canRoll}
                onClick={() => rollContestSide(side)}
              >
                <DicePair compact />
              </button>
            </dd>
          </div>
          <div>
            <dt>D100</dt>
            <dd>{stagedDice ?? "—"}</dd>
          </div>
          <div>
            <dt>Score</dt>
            <dd>{stagedScore ?? "—"}</dd>
          </div>
        </dl>
      </section>
    );
  }
  function goalkeeperDuelSide({
    player,
    role,
    skillLabel,
    skill,
    dice,
    score,
    rollable = false,
  }: {
    player: Player;
    role: "Attacker" | "Goalkeeper";
    skillLabel: string;
    skill: number;
    dice?: number;
    score?: number;
    rollable?: boolean;
  }) {
    return (
      <section
        className={`duel-side ${player.team} ${rollable ? "roll-active" : "roll-inactive"}`}
      >
        <div className="duel-heading">
          <strong className="duel-player">{player.name}</strong>
          <span className="duel-side-label">{role}</span>
        </div>
        <dl>
          <div>
            <dt>{skillLabel}</dt>
            <dd>{skill}</dd>
          </div>
          <div className="duel-dice">
            <dt>Dice</dt>
            <dd>
              <button
                className={`duel-dice-button ${dice !== undefined ? "rolled" : ""}`}
                aria-label={
                  rollable
                    ? `Roll ${skillLabel} for ${player.name}`
                    : `${player.name} has already rolled`
                }
                title={
                  rollable
                    ? `Roll ${skillLabel} for ${player.name}`
                    : `${player.name} has already rolled`
                }
                disabled={!rollable || !displayedPreview}
                onClick={() =>
                  displayedPreview && dispatch(displayedPreview.command)
                }
              >
                <DicePair compact />
              </button>
            </dd>
          </div>
          <div>
            <dt>D100</dt>
            <dd>{dice ?? "—"}</dd>
          </div>
          <div>
            <dt>Score</dt>
            <dd>{score ?? "—"}</dd>
          </div>
        </dl>
      </section>
    );
  }
  function cycle(team: Team, step: number) {
    const teamPlayers = match.players.filter(
        (p) => p.team === team && !isSentOff(match, p),
      ),
      eligiblePlayers = match.setup
        ? teamPlayers.filter((player) => canRepositionPlayer(match, player))
        : match.phase === "action"
          ? teamPlayers.filter((p) => canAct(match, p))
          : teamPlayers.filter((p) => canMovePlayer(match, p)),
      players = eligiblePlayers.length ? eligiblePlayers : teamPlayers,
      index = players.findIndex((p) => p.id === selected[team]);
    const p = players[(index + step + players.length) % players.length];
    select(p);
  }
  function move(to: Point) {
    if (match.setup) prepareMove(current.id, to);
    else if (match.phase === "movement") prepareMove(current.id, to);
    else setNotice("Continue to movement before moving a player.");
  }
  function prepareMove(playerId: string, to: Point) {
    const player = match.players.find((candidate) => candidate.id === playerId);
    if (!player) return;
    if (match.setup) {
      if (canReposition(match, player, to))
        dispatch({ type: "reposition", playerId, to });
      else
        setNotice(
          match.foulRestart
            ? match.foulRestart.kind === "free-kick" &&
              match.foulRestart.setupStage === "defenders"
              ? "Use any empty field cell at least 10 yards from the ball."
              : match.foulRestart.kind === "penalty"
                ? "Only the penalty taker and defending goalkeeper may occupy the penalty area or penalty arc."
                : "Use any empty field cell. The fouled footballer remains on the restart position."
            : match.setPieceRestart
              ? "Use an empty cell. Goalkeepers must remain on their goal line, and only the restarting squad may occupy the ball position."
              : match.testSetup
                ? "Place the footballer in an empty field cell."
                : "Place the footballer in an empty cell in their own half. Drag a kickoff player onto the center dot to make them the ball bearer.",
        );
      return;
    }
    const blocker = movementBlocker(match, player, to);
    if (!blocker) {
      dispatch({ type: "move", playerId, to });
      return;
    }
    setFocusedTeam(player.team);
    setSelected((ids) => ({ ...ids, [player.team]: player.id }));
    setCursor({ x: player.x, y: player.y });
    setAction(match.possession === player.id ? "dribble" : "slip");
    setPassTarget({ ...to });
    setResolution(null);
    clearContestRolls();
    setResult("");
    setNotice("");
    setMode("select");
  }
  const legal: Point[] = [];
  if (match.phase === "movement")
    for (
      let x = Math.max(0, current.x - 10);
      x <= Math.min(99, current.x + 10);
      x++
    )
      for (
        let y = Math.max(0, current.y - 10);
        y <= Math.min(63, current.y + 10);
        y++
      )
        if (canMove(match, current, { x, y })) legal.push({ x, y });
  function playerCard(team: Team) {
    const p =
        match.players.find(
          (player) => player.id === selected[team] && player.team === team,
        ) ??
        match.players.find(
          (player) => player.team === team && !isSentOff(match, player),
        )!,
      discipline = disciplineFor(match, p),
      setupRestart = match.foulRestart ?? match.setPieceRestart,
      setupTeam = setupRestart
        ? setupRestart.setupStage === "attackers"
          ? setupRestart.team
          : other(setupRestart.team)
        : null,
      active =
        (match.setup ? !setupTeam || team === setupTeam : team === stageTeam) &&
        !match.winner,
      enabled =
        (match.setup
          ? (!setupTeam || team === setupTeam) && canRepositionPlayer(match, p)
          : false) ||
        (match.phase === "action" ? canAct(match, p) : canMovePlayer(match, p));
    return (
      <aside
        className={`player-card ${team} ${active ? "active" : ""}`}
        aria-label={`${TEAM_NAMES[team]} player card`}
      >
        <div className="card-top">
          <button
            className="icon-button"
            aria-label={`Previous ${TEAM_NAMES[team]} player`}
            onClick={() => cycle(team, -1)}
          >
            <ChevronLeft size={14} />
          </button>
          <span className={`shirt card-number ${team}`}>{p.number}</span>
          <h2>
            {p.name}
            {discipline.sentOff ? (
              <span
                className="card-badge red"
                title="Sent off"
                aria-label="Red card"
              />
            ) : (
              Array.from({ length: discipline.yellowCards }, (_, index) => (
                <span
                  className="card-badge yellow"
                  title="Yellow card"
                  aria-label="Yellow card"
                  key={index}
                />
              ))
            )}
          </h2>
          <span className="card-possession">
            {p.id === match.possession && <Football width={16} height={16} />}
          </span>
          <button
            className="icon-button"
            aria-label={`Next ${TEAM_NAMES[team]} player`}
            onClick={() => cycle(team, 1)}
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <p className="player-position">{p.role}</p>
        <div className="all-skills" aria-label={`${p.name} skills`}>
          {CARD_SKILLS.map(([group, skills]) => (
            <section className="skill-group" key={group} aria-label={group}>
              <h3>{group}</h3>
              <div>
                {skills.map((name) => {
                  const ratings = TEAM_SQUADS[team].players.find(
                    (player) => player.id === p.id,
                  )!.ratings as Record<string, number>;
                  const key = SKILL_KEYS[name] ?? name,
                    value = ratings[key],
                    preview = { team, key, label: name };
                  return value === undefined ? null : (
                    <div
                      className={`skill-row ${hoveredSkill?.team === team && hoveredSkill.key === key ? "skill-preview-active" : ""}`}
                      key={name}
                      tabIndex={0}
                      aria-label={`${name} ${value}. Show ${name} for every ${TEAM_NAMES[team]} player.`}
                      onPointerEnter={() => setHoveredSkill(preview)}
                      onPointerLeave={() =>
                        setHoveredSkill((current) =>
                          current?.team === team && current.key === key
                            ? null
                            : current,
                        )
                      }
                      onFocus={() => setHoveredSkill(preview)}
                      onBlur={() =>
                        setHoveredSkill((current) =>
                          current?.team === team && current.key === key
                            ? null
                            : current,
                        )
                      }
                    >
                      <span>{name}</span>
                      <strong>{value}</strong>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        <div className="waiting-label">
          {match.winner
            ? "Full time"
            : match.setup
              ? match.foulRestart
                ? "Free placement"
                : match.setPieceRestart
                  ? "Free placement"
                  : match.testSetup
                    ? "Position unlocked"
                    : "Arrange in own half"
              : active
                ? !enabled
                  ? "Unavailable in this stage"
                  : match.oneTouch?.playerId === p.id
                    ? "One-touch available"
                    : match.phase === "movement"
                      ? enabled
                        ? `${remainingMovement(match, p)} points available`
                        : match.moved.includes(p.id)
                          ? "Movement complete"
                          : "Unavailable in this stage"
                      : "Your turn"
                : "Waiting for their turn"}
        </div>
      </aside>
    );
  }
  return (
    <div className={`app ${pitchMaximized ? "pitch-maximized" : ""}`}>
      <header className="scorebar">
        <div
          className={`club home ${match.active === "home" && !match.winner ? "active-team" : ""}`}
          aria-current={
            match.active === "home" && !match.winner ? "true" : undefined
          }
        >
          <img src={crest("home")} alt="FC Barcelona crest" />
          <div>
            <h1>{TEAM_NAMES.home}</h1>
            <span>{TEAM_SQUADS.home.season}</span>
          </div>
          {ballPlayer?.team === "home" && (
            <Football
              className="score-possession"
              width={26}
              height={26}
              label={`${TEAM_NAMES.home} have possession`}
            />
          )}
        </div>
        <div
          className="score-center"
          aria-label={`Score: Barcelona ${match.score.home}, Madrid ${match.score.away}`}
        >
          <select
            className="winning-condition"
            aria-label="Winning condition"
            value={match.winningCondition}
            disabled={!!match.winner}
            onChange={(event) =>
              dispatch({
                type: "set-winning-condition",
                condition: event.target.value as WinningCondition,
              })
            }
          >
            {[...new Set(WINNING_CONDITIONS.map(({ group }) => group))].map(
              (group) => (
                <optgroup key={group} label={group}>
                  {WINNING_CONDITIONS.filter(
                    (condition) => condition.group === group,
                  ).map((condition) => (
                    <option key={condition.id} value={condition.id}>
                      {condition.label}
                    </option>
                  ))}
                </optgroup>
              ),
            )}
          </select>
          <div className="score">
            <strong>{match.score.home}</strong>
            <span>:</span>
            <strong>{match.score.away}</strong>
          </div>
          <button
            className="score-new-match"
            type="button"
            onClick={() => setModal("new")}
          >
            <Plus size={12} />
            New match
          </button>
        </div>
        <div
          className={`club away ${match.active === "away" && !match.winner ? "active-team" : ""}`}
          aria-current={
            match.active === "away" && !match.winner ? "true" : undefined
          }
        >
          {ballPlayer?.team === "away" && (
            <Football
              className="score-possession"
              width={26}
              height={26}
              label={`${TEAM_NAMES.away} have possession`}
            />
          )}
          <div>
            <h1>{TEAM_NAMES.away}</h1>
            <span>{TEAM_SQUADS.away.season}</span>
          </div>
          <img src={crest("away")} alt="Real Madrid crest" />
        </div>
      </header>
      <main className="match-table">
        {playerCard("home")}
        <section className="pitch-panel" aria-label="Match pitch">
          <div className="turn-stage-bar" aria-label="Turn state">
            <span className="turn-stage-phase">TURN {match.turn}</span>
            <div className="turn-stage-map">
              {[
                ["Action", ACTION_TURN_STATES, 0],
                ["Movement", MOVEMENT_TURN_STATES, 4],
              ].map(([phase, states, offset]) => (
                <section className="turn-stage-group" key={phase as string}>
                  <strong>{phase}</strong>
                  <div className="turn-stage-list">
                    {(states as readonly string[]).map((stage, index) => {
                      const absoluteIndex = (offset as number) + index;
                      return (
                        <span
                          className={
                            absoluteIndex === turnStateIndex
                              ? "current"
                              : absoluteIndex < turnStateIndex
                                ? "complete"
                                : ""
                          }
                          aria-current={
                            absoluteIndex === turnStateIndex
                              ? "step"
                              : undefined
                          }
                          key={`${phase}-${stage}`}
                        >
                          {stage}
                        </span>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
            <div className="turn-stage-controls">
              <button
                className={`turn-stage-action ${lastReplay?.goal ? "goal-replay" : ""}`}
                type="button"
                disabled={!lastReplay || !!replaySession}
                aria-label={
                  lastReplay?.goal ? "Watch last goal" : "Replay last play"
                }
                title={
                  lastReplay
                    ? `Replay ${lastReplay.steps.length} logged ${lastReplay.steps.length === 1 ? "step" : "steps"}`
                    : "No play to replay"
                }
                onClick={() =>
                  lastReplay &&
                  setReplaySession({
                    steps: lastReplay.steps.map((replayStep, index) => ({
                      ...replayStep,
                      id: Date.now() + index,
                    })),
                    index: 0,
                  })
                }
              >
                <Play size={13} />
                <span>
                  {replaySession
                    ? "Replaying"
                    : lastReplay?.goal
                      ? "Watch goal"
                      : "Replay"}
                </span>
              </button>
              <button
                className="turn-stage-toggle"
                type="button"
                aria-label={
                  pitchMaximized ? "Restore full match view" : "Maximize pitch"
                }
                title={
                  pitchMaximized ? "Restore full match view" : "Maximize pitch"
                }
                aria-pressed={pitchMaximized}
                onClick={() => setPitchMaximized((maximized) => !maximized)}
              >
                {pitchMaximized ? (
                  <Minimize2 size={16} />
                ) : (
                  <Maximize2 size={16} />
                )}
              </button>
            </div>
          </div>
          <div className="pitch-scroll">
            <div className="pitch-stage">
              {match.pendingShotTarget ? (
                <GoalTargetSelector
                  match={match}
                  onSelect={(target) =>
                    dispatch({ type: "select-shot-target", target }, null)
                  }
                />
              ) : (
                <Pitch
                  preparePass={preparePass}
                  canDragBall={
                    !match.setup &&
                    !match.challengedBall &&
                    !match.pendingPass &&
                    !match.pendingShot &&
                    !match.pendingFoul &&
                    !match.pendingGoalkeeperShot &&
                    (!match.oneTouch ||
                      action === "low-pass" ||
                      action === "defensive-header" ||
                      match.oneTouch.actions.includes("low-pass"))
                  }
                  maxPassDistance={
                    action === "defensive-header"
                      ? Math.floor(100 / 3)
                      : action === "low-pass" ||
                          (!action &&
                            match.oneTouch?.actions.includes("low-pass"))
                        ? 30
                        : ballPassAction === "throw-in"
                          ? 50
                          : 100
                  }
                  match={match}
                  replay={replay}
                  passVisual={passVisual}
                  onPassVisualComplete={(visual) => {
                    if (visual.goal || visual.out)
                      setPassVisual((current) =>
                        current?.id === visual.id ? null : current,
                      );
                    if (visual.goal) setGoalPause(true);
                    else if (visual.out) setOutPause(visual.out);
                  }}
                  passPreview={
                    (action === "pass" ||
                      action === "throw-in" ||
                      action === "low-pass" ||
                      action === "defensive-header") &&
                    passTarget
                      ? {
                          from: ball,
                          to: passTarget,
                          difficulty:
                            preview?.difficulty ?? distance(ball, passTarget),
                        }
                      : null
                  }
                  selected={selected}
                  grid={true}
                  showNames={showNames}
                  skillOverlay={hoveredSkill}
                  cursor={cursor}
                  setCursor={setCursor}
                  legal={legal}
                  select={select}
                  move={move}
                  movePlayer={prepareMove}
                  blockedActionMessage={blockedActionMessage}
                />
              )}
              {pendingFoul && foulOffender && foulVictim && (
                <div className="pitch-foul-message" role="status">
                  <WhistleIcon size={30} />
                  <div>
                    <strong>FOUL!</strong>
                    <span>
                      {foulOffender.name} fouled {foulVictim.name}. Play is
                      stopped for the referee’s decision.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div
            className="play-toolbar"
            role="toolbar"
            aria-label="Play controls"
          >
            <div
              className={`toolbar-actions ${match.oneTouch ? "one-touch-actions" : ""}`}
              role="group"
              aria-label={
                match.oneTouch ? "One-touch action" : "Action to take"
              }
            >
              {match.setup && (match.foulRestart || match.setPieceRestart) ? (
                (match.foulRestart ?? match.setPieceRestart)!.setupStage ===
                "attackers" ? (
                  <button
                    disabled={!canTakeRestart}
                    onClick={() =>
                      dispatch({ type: "take-restart", playerId: current.id })
                    }
                  >
                    <Football width={16} height={16} />
                    {(match.foulRestart ?? match.setPieceRestart)!.takerId
                      ? "Ball taken"
                      : "Take ball"}
                  </button>
                ) : null
              ) : match.setup && !match.testSetup ? (
                <div className="formation-presets">
                  {(["home", "away"] as const).map((team) => (
                    <label className="formation-preset" key={team}>
                      <span>{TEAM_NAMES[team]}</span>
                      <select
                        aria-label={`${TEAM_NAMES[team]} tactical formation`}
                        value={formationPreset[team]}
                        onChange={(event) => {
                          const formation = event.target.value as
                            TacticalFormation | "custom";
                          if (formation === "custom") {
                            setFormationPreset((current) => ({
                              ...current,
                              [team]: "custom",
                            }));
                            return;
                          }
                          dispatch({
                            type: "apply-formation",
                            team,
                            formation,
                          });
                        }}
                      >
                        <option value="custom">Custom</option>
                        {TACTICAL_FORMATIONS.map((formation) => (
                          <option key={formation} value={formation}>
                            {formation}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              ) : match.setup ||
                match.pendingFoul ||
                match.challengedBall ? null : match.oneTouch ? (
                match.oneTouch.actions
                  .filter((oneTouchAction) =>
                    ballActions.includes(oneTouchAction),
                  )
                  .map((oneTouchAction) => (
                    <button
                      key={oneTouchAction}
                      disabled={!!match.winner}
                      aria-pressed={action === oneTouchAction}
                      onClick={() => plan(oneTouchAction)}
                    >
                      {oneTouchAction === "low-pass" ||
                      oneTouchAction === "defensive-header" ? (
                        <ArrowUpRight size={16} />
                      ) : (
                        <Zap size={16} />
                      )}
                      {oneTouchAction === "low-pass"
                        ? "Low-pass"
                        : oneTouchAction === "finish"
                          ? "Finishing"
                          : oneTouchAction === "offensive-header"
                            ? "Off. header"
                            : oneTouchAction === "defensive-header"
                              ? "Def. header"
                              : "Scissors-kick"}
                    </button>
                  ))
              ) : match.phase === "action" &&
                match.actionStage === "ball-carrier" &&
                ballPlayer?.team === match.active ? (
                <>
                  <button
                    disabled={
                      !!match.winner || !ballActions.includes(ballPassAction)
                    }
                    aria-pressed={mode === "pass"}
                    onClick={() => {
                      if (match.pendingPass) {
                        setAction("pass");
                        setPassTarget({ ...match.pendingPass.to });
                      } else plan(ballPassAction);
                    }}
                  >
                    <ArrowUpRight size={16} />
                    {ballPassAction === "throw-in" ? "Throw-in" : "Pass"}
                  </button>
                  <button
                    disabled={!!match.winner || !ballActions.includes("shoot")}
                    aria-pressed={action === "shoot"}
                    onClick={() => plan("shoot")}
                  >
                    <Target size={16} />
                    {match.foulRestart?.kind === "penalty"
                      ? "Penalty"
                      : "Shoot"}
                  </button>
                  <button
                    disabled={!!match.winner || !ballActions.includes("lob")}
                    aria-pressed={action === "lob"}
                    onClick={() => plan("lob")}
                  >
                    <Zap size={16} />
                    Lob
                  </button>
                </>
              ) : match.phase === "action" &&
                match.actionStage === "defenders" ? (
                <>
                  <button
                    disabled={!!match.winner || !canTackle(match, current)}
                    aria-pressed={action === "tackle"}
                    onClick={() => plan("tackle")}
                  >
                    <Shield size={16} />
                    Tackle
                  </button>
                  <button
                    disabled={!!match.winner || !canCommitFoul(match, current)}
                    onClick={() =>
                      dispatch({ type: "foul", playerId: current.id }, null)
                    }
                  >
                    <TriangleAlert size={16} />
                    Foul
                  </button>
                </>
              ) : null}
            </div>
            {match.setup && !goalPause && !outPause ? (
              <div className="toolbar-setup" role="status">
                {match.foulRestart
                  ? match.foulRestart.setupStage === "attackers"
                    ? match.foulRestart.takerId
                      ? match.foulRestart.kind === "penalty"
                        ? `${ballPlayer?.name} has the ball. Move every other attacker outside the penalty area and arc, then continue to the defenders.`
                        : `${ballPlayer?.name} has the ball. Finish positioning the attackers, then continue to the defenders.`
                      : match.foulRestart.kind === "penalty"
                        ? `Reposition ${TEAM_NAMES[match.foulRestart.team]}, place any player in either highlighted cell behind the penalty spot, and move every other attacker outside the shaded area.`
                        : `Reposition ${TEAM_NAMES[match.foulRestart.team]}, place any player on the free-kick spot, and choose Take ball.`
                    : `Reposition ${TEAM_NAMES[other(match.foulRestart.team)]}, then start the ${match.foulRestart.kind === "penalty" ? "penalty" : "free-kick"}.${match.foulRestart.kind === "free-kick" ? " Keep every defender at least 10 yards from the ball." : " Only the goalkeeper may remain inside the penalty area or arc."}`
                  : match.setPieceRestart
                    ? match.setPieceRestart.setupStage === "attackers"
                      ? match.setPieceRestart.takerId
                        ? `${ballPlayer?.name} has the ball. Finish positioning the attackers, then continue to the defenders.`
                        : match.setPieceRestart.kind === "goal-kick"
                          ? `Reposition ${TEAM_NAMES[match.setPieceRestart.team]}. Place the taker anywhere in the highlighted goal area.`
                          : `Reposition ${TEAM_NAMES[match.setPieceRestart.team]}, then place one of their players on the ball and choose Take ball.`
                      : `Reposition ${TEAM_NAMES[other(match.setPieceRestart.team)]}, then start the restart.`
                    : match.testSetup
                      ? "Testing setup: drag any footballer into an empty field cell. The current ball carrier keeps possession."
                      : "Choose a formation for either squad or drag individual footballers."}
              </div>
            ) : pendingFoul && foulOffender ? (
              <div
                className="toolbar-metrics referee-resolution"
                aria-label="Resolve foul card"
              >
                <WhistleIcon size={24} />
                <div className="referee-resolution-copy">
                  <strong>{foulOffender.name}</strong>
                  <span>
                    {pendingFoul.stage === "card-check"
                      ? "Foul die · card, no card, or ignored"
                      : "Card die · yellow or red"}
                  </span>
                </div>
                <button
                  className="referee-roll-button"
                  onClick={() => dispatch({ type: "resolve-foul" }, null)}
                  aria-label={
                    pendingFoul.stage === "card-check"
                      ? "Roll the foul die"
                      : "Roll the card colour die"
                  }
                >
                  <span className="d6-die">D6</span>
                  {pendingFoul.stage === "card-check" ? "Foul die" : "Card die"}
                </button>
                <CardIcon />
              </div>
            ) : goalkeeperShot && goalkeeperShooter && goalkeeper ? (
              <div
                className="toolbar-metrics duel-metrics goalkeeper-duel"
                aria-label={`${goalkeeperShooter.name} shooting against goalkeeper ${goalkeeper.name}`}
              >
                <div className="duel-resolution">
                  {goalkeeperDuelSide({
                    player: goalkeeperShooter,
                    role: "Attacker",
                    skillLabel:
                      goalkeeperShot.stage === "reach"
                        ? goalkeeperShot.attempt.label
                        : goalkeeperShot.stage === "power"
                          ? goalkeeperShot.attempt.header
                            ? "Header power"
                            : "Shot power"
                          : (shotPowerResolution?.label ?? "Shot power"),
                    skill:
                      goalkeeperShot.stage === "reach"
                        ? goalkeeperShot.attempt.skill
                        : goalkeeperShot.stage === "power"
                          ? goalkeeperShot.attempt.header
                            ? goalkeeperShooter.headerPower
                            : goalkeeperShooter.shotPower
                          : (shotPowerResolution?.skill ??
                            (goalkeeperShot.attempt.header
                              ? goalkeeperShooter.headerPower
                              : goalkeeperShooter.shotPower)),
                    dice:
                      goalkeeperShot.stage === "reach"
                        ? goalkeeperShot.attempt.dice
                        : goalkeeperShot.stage === "power"
                          ? undefined
                          : shotPowerResolution?.dice,
                    score:
                      goalkeeperShot.stage === "reach"
                        ? goalkeeperShot.attempt.score
                        : goalkeeperShot.stage === "power"
                          ? undefined
                          : (shotPowerResolution?.result ??
                            shotPowerResolution?.score),
                    rollable:
                      !!match.pendingGoalkeeperShot &&
                      goalkeeperShot.stage === "power",
                  })}
                  <div className="duel-center">
                    <span className="duel-winner-label">
                      {!match.pendingGoalkeeperShot && catchResolution
                        ? "Result"
                        : goalkeeperShot.stage === "reach"
                          ? "Reach target"
                          : goalkeeperShot.stage === "power"
                            ? "Power penalty"
                            : "Catch target"}
                    </span>
                    <strong className="duel-winner">
                      {!match.pendingGoalkeeperShot && catchResolution
                        ? catchResolution.outcome
                        : goalkeeperShot.stage === "power"
                          ? goalkeeperShot.attempt.difficulty
                          : goalkeeperShot.difficulty}
                    </strong>
                    <span className="duel-stage-detail">
                      {!match.pendingGoalkeeperShot && catchResolution
                        ? `Power ${goalkeeperShot.power ?? goalkeeperShot.difficulty} vs Catch ${catchResolution.score ?? "—"}`
                        : goalkeeperShot.stage === "reach"
                          ? goalTargetName(goalkeeperShot.target)
                          : goalkeeperShot.stage === "power"
                            ? "Placement difficulty"
                            : "Shot power"}
                    </span>
                  </div>
                  <div className="duel-opponents">
                    {goalkeeperDuelSide({
                      player: goalkeeper,
                      role: "Goalkeeper",
                      skillLabel:
                        goalkeeperShot.stage === "catch" ? "Catch" : "Reach",
                      skill:
                        goalkeeperShot.stage === "catch"
                          ? goalkeeper.catch
                          : goalkeeper.reach,
                      dice:
                        goalkeeperShot.stage === "power"
                          ? reachResolution?.dice
                          : goalkeeperShot.stage === "catch" &&
                              !match.pendingGoalkeeperShot
                            ? catchResolution?.dice
                            : undefined,
                      score:
                        goalkeeperShot.stage === "power"
                          ? reachResolution?.score
                          : goalkeeperShot.stage === "catch" &&
                              !match.pendingGoalkeeperShot
                            ? catchResolution?.score
                            : undefined,
                      rollable:
                        !!match.pendingGoalkeeperShot &&
                        (goalkeeperShot.stage === "reach" ||
                          goalkeeperShot.stage === "catch"),
                    })}
                  </div>
                </div>
              </div>
            ) : displayedFoulMessage ? (
              <div
                className="toolbar-metrics foul-result-message"
                role="status"
                aria-label={displayedFoulMessage}
              >
                {displayedFoulCardColor ? (
                  <CardIcon color={displayedFoulCardColor} />
                ) : (
                  <WhistleIcon size={32} />
                )}
                <strong>{displayedFoulMessage}</strong>
              </div>
            ) : contest ? (
              <div
                className="toolbar-metrics duel-metrics"
                aria-label="One-on-one action values"
              >
                <div className="duel-resolution">
                  {contestSideCard(
                    contest.actor,
                    action === "challenge" ? "Receiver" : "Attacker",
                    true,
                    "duel-actor",
                  )}
                  <div className="duel-center">
                    <span className="duel-winner-label">
                      {displayedPreview
                        ? contestRound
                          ? `Reroll ${contestRound}`
                          : "Roll both"
                        : contest.rerolls
                          ? `Winner · ${contest.rerolls} reroll${contest.rerolls === 1 ? "" : "s"}`
                          : "Winner"}
                    </span>
                    <strong className="duel-winner">
                      {contestWinner ?? "—"}
                    </strong>
                  </div>
                  <div
                    className={`duel-opponents ${contestOpponents.length > 1 ? "card-pile" : ""}`}
                    aria-label={
                      contestOpponents.length > 1
                        ? `${contestOpponents.length} defender contests, resolve the top card first`
                        : undefined
                    }
                  >
                    {contestOpponents.map((side, index) =>
                      contestSideCard(
                        side,
                        index === 0
                          ? contestOpponents.length > 1
                            ? `${action === "challenge" ? "Challenger" : "Defender"} · 1 of ${contestOpponents.length}`
                            : action === "challenge"
                              ? "Challenger"
                              : "Defender"
                          : `Queued · ${index + 1} of ${contestOpponents.length}`,
                        index === 0 &&
                          contestRolls[contest.actor.playerId] !== undefined,
                        contestOpponents.length > 1
                          ? `pile-card ${index === 0 ? "pile-active" : "pile-queued"}`
                          : "",
                        contestOpponents.length > 1 ? index : undefined,
                      ),
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="toolbar-metrics action-metrics"
                aria-label="Action values"
              >
                <dl>
                  <div className="metric-wing metric-wing-left">
                    <div>
                      <dt>Difficulty</dt>
                      <dd>
                        {displayedPreview?.difficulty ??
                          displayedResolution?.difficulty ??
                          "—"}
                      </dd>
                    </div>
                    <div>
                      <dt>Skill</dt>
                      <dd>
                        {displayedPreview?.skill ??
                          displayedResolution?.skill ??
                          "—"}
                      </dd>
                    </div>
                  </div>
                  <div className="dice-control">
                    <dt className="sr-only">Roll dice</dt>
                    <dd>
                      <button
                        className="roll-button"
                        aria-label={
                          displayedPreview &&
                          "automatic" in displayedPreview &&
                          displayedPreview.automatic
                            ? "Complete automatic pass"
                            : "Roll two D10 dice"
                        }
                        title={
                          displayedPreview &&
                          "automatic" in displayedPreview &&
                          displayedPreview.automatic
                            ? "Complete automatic pass"
                            : "Roll two D10 dice"
                        }
                        disabled={!displayedPreview}
                        onClick={() =>
                          displayedPreview && dispatch(displayedPreview.command)
                        }
                      >
                        {displayedPreview &&
                        "automatic" in displayedPreview &&
                        displayedPreview.automatic ? (
                          <Check size={18} aria-hidden="true" />
                        ) : (
                          <DicePair />
                        )}
                      </button>
                    </dd>
                  </div>
                  <div className="metric-wing metric-wing-right">
                    <div>
                      <dt>
                        {displayedResolution?.label === "Foul" ? "D6" : "D100"}
                      </dt>
                      <dd>{displayedResolution?.dice ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>Score</dt>
                      <dd>{displayedResolution?.score ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>Result</dt>
                      <dd>
                        {displayedCardColor && (
                          <CardIcon color={displayedCardColor} />
                        )}
                        {displayedResolution?.result === null ||
                        displayedResolution?.result === undefined
                          ? (displayedResolution?.outcome ??
                            (displayedPreview && "status" in displayedPreview
                              ? displayedPreview.status
                              : "—"))
                          : `${displayedResolution.outcome} (${displayedResolution.result >= 0 ? "+" : ""}${displayedResolution.result})`}
                      </dd>
                    </div>
                  </div>
                </dl>
              </div>
            )}
            <div className="toolbar-turn">
              <button
                disabled={!history.length}
                onClick={() => {
                  const previous = history.at(-1)!;
                  const nextSeed =
                    (Math.imul(previous.seed, 1664525) + 1013904223) >>> 0;
                  setMatch({ ...previous, seed: nextSeed });
                  setOutPause(previous.setPieceRestart?.kind ?? null);
                  setPassVisual(null);
                  setFocusedTeam(previous.active);
                  const player = previous.players.find(
                    (p) => p.id === selected[previous.active],
                  )!;
                  setCursor({ x: player.x, y: player.y });
                  setHistory((h) => h.slice(0, -1));
                  setNotice("");
                  setResult("");
                  setMode("select");
                  setAction(null);
                  setPassTarget(null);
                  setResolution(null);
                  setCompletedGoalkeeperShot(null);
                  setFormationPreset({ home: "custom", away: "custom" });
                  setReplaySession(null);
                  if (!previous.setup) {
                    setLastReplay(null);
                    setPossessionReplay([]);
                  }
                  clearContestRolls();
                }}
              >
                <RotateCcw size={13} />
                Undo
              </button>

              <button
                className="end-turn"
                disabled={
                  !!match.winner ||
                  !!match.pendingPass ||
                  match.pendingShot ||
                  !!match.pendingFoul ||
                  !!match.pendingShotTarget ||
                  !!match.pendingGoalkeeperShot ||
                  !!match.challengedBall ||
                  freeKickDefendersTooClose ||
                  penaltySetupInvalid ||
                  (match.setup &&
                    !match.testSetup &&
                    !match.foulRestart &&
                    !match.setPieceRestart &&
                    !kickoffReady) ||
                  (!!match.foulRestart &&
                    (!match.setup || !match.foulRestart.takerId)) ||
                  (!!match.setPieceRestart &&
                    (!match.setup || !match.setPieceRestart.takerId))
                }
                title={
                  match.setup
                    ? match.foulRestart
                      ? match.foulRestart.setupStage === "attackers"
                        ? match.foulRestart.takerId
                          ? penaltySetupInvalid
                            ? "Move every other attacker outside the penalty area and arc"
                            : "Lock the attacking positions and position the defenders"
                          : match.foulRestart.kind === "penalty"
                            ? "Place any attacker in a highlighted penalty cell and choose Take ball"
                            : "Place any attacker on the restart spot and choose Take ball"
                        : freeKickDefendersTooClose
                          ? "Move every defender at least 10 yards from the ball"
                          : penaltySetupInvalid
                            ? "Move every defender except the goalkeeper outside the penalty area and arc"
                            : "Confirm the defending positions and begin the restart"
                      : match.setPieceRestart
                        ? match.setPieceRestart.setupStage === "attackers"
                          ? match.setPieceRestart.takerId
                            ? "Lock the attacking positions and position the defenders"
                            : "A restarting player must take possession first"
                          : "Confirm the defending positions and begin the restart"
                        : match.testSetup
                          ? "Restart the match from these testing positions"
                          : kickoffReady
                            ? "Confirm both lineups and start the match"
                            : "Place the ball bearer on the center dot first"
                    : match.pendingPass
                      ? "Complete the prepared pass first"
                      : match.pendingShot
                        ? "Complete the prepared shot first"
                        : match.pendingFoul
                          ? "Resolve the referee’s foul decision first"
                          : match.setPieceRestart
                            ? `Complete the ${match.setPieceRestart.kind} first`
                            : match.pendingShotTarget
                              ? "Choose a goal target first"
                              : match.pendingGoalkeeperShot
                                ? match.pendingGoalkeeperShot.stage === "power"
                                  ? `Roll ${match.pendingGoalkeeperShot.attempt.header ? "Header power" : "Shot power"} for the attacker first`
                                  : `Roll ${match.pendingGoalkeeperShot.stage === "reach" ? "Reach" : "Catch"} for the goalkeeper first`
                                : match.challengedBall
                                  ? "Resolve the challenged ball first"
                                  : "Continue to the next turn state"
                }
                onClick={() =>
                  dispatch(
                    match.setup ? { type: "start" } : { type: "advance" },
                  )
                }
              >
                {match.setup
                  ? match.foulRestart
                    ? match.foulRestart.setupStage === "attackers"
                      ? match.foulRestart.takerId
                        ? "Position defenders"
                        : "Choose taker"
                      : "Start restart"
                    : match.setPieceRestart
                      ? match.setPieceRestart.setupStage === "attackers"
                        ? "Position defenders"
                        : "Start restart"
                      : match.testSetup
                        ? "Restart here"
                        : "Start match"
                  : "Next"}{" "}
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
          <div className="action-readout" aria-label="Action details">
            <span className="action-label">
              {replaySession
                ? `Replay · Step ${replaySession.index + 1} of ${replaySession.steps.length}`
                : match.setup && !goalPause && !outPause
                  ? match.foulRestart
                    ? match.foulRestart.setupStage === "attackers"
                      ? match.foulRestart.takerId
                        ? match.foulRestart.kind === "penalty"
                          ? "Keep every other attacker outside the penalty area and arc"
                          : "Position the attackers, then continue to the defenders"
                        : match.foulRestart.kind === "penalty"
                          ? "Choose a taker in a highlighted cell and keep every other attacker outside the shaded area"
                          : "Position any attacker on the restart spot and choose Take ball"
                      : match.foulRestart.kind === "penalty"
                        ? "Keep every defender except the goalkeeper outside the penalty area and arc"
                        : "Position the defenders, then start the restart"
                    : match.setPieceRestart
                      ? match.setPieceRestart.setupStage === "attackers"
                        ? match.setPieceRestart.takerId
                          ? "Position the attackers, then continue to the defenders"
                          : match.setPieceRestart.kind === "goal-kick"
                            ? "Position the attackers and place the taker in the highlighted goal area"
                            : "Position the attackers and place a restarting footballer on the ball"
                        : "Position the defenders, then start the restart"
                      : match.testSetup
                        ? "Set the testing positions, then restart play from this board state"
                        : "Set both lineups; place the ball bearer on the center dot"
                  : displayedPreview?.label ||
                    displayedResolution?.label ||
                    (action === "pass" || action === "throw-in"
                      ? "Drag the ball to a destination"
                      : action === "low-pass" || action === "defensive-header"
                        ? "Drag the ball to a one-touch destination"
                        : action === "tackle"
                          ? "Select a nearby defender"
                          : action === "dribble"
                            ? "Roll Dribble against the blocking defender’s Tackle"
                            : action === "slip"
                              ? "Roll Slip against the blocking defender’s Mark"
                              : "Choose an action")}
            </span>
            {(replay?.label || notice || result) && (
              <p role="status">{replay?.label || notice || result}</p>
            )}
          </div>
          <div className="utility-bar">
            <span className="saved-label">
              {saved
                ? "Saved on this device"
                : "Not saved · storage unavailable"}
            </span>
            <div>
              <button
                aria-pressed={showNames}
                onClick={() => setShowNames((visible) => !visible)}
              >
                <Tags size={13} />
                Names
              </button>
              <button
                disabled={match.setup}
                title="Reset the match and edit all player positions for testing"
                onClick={() => dispatch({ type: "unlock-positions" }, null)}
              >
                <Unlock size={13} />
                Unlock positions
              </button>
              <button aria-label="How to play" onClick={() => setModal("help")}>
                <CircleHelp size={15} />
              </button>
            </div>
          </div>
        </section>
        {playerCard("away")}
      </main>
      {outPause && match.setPieceRestart && (
        <button
          autoFocus
          className="goal-pause out-pause"
          aria-label={`OUT! Click to restart with a ${outPause}`}
          onClick={() => setOutPause(null)}
        >
          <span className="goal-pause-card out-pause-card">
            <strong>OUT!</strong>
            <span>
              Click to restart · {TEAM_NAMES[match.setPieceRestart.team]} ·{" "}
              {outPause === "corner"
                ? "Corner"
                : outPause === "throw-in"
                  ? "Throw-in"
                  : "Goal-kick"}
            </span>
          </span>
        </button>
      )}
      {goalPause && (
        <button
          autoFocus
          className="goal-pause"
          aria-label={
            match.winner
              ? `${winnerMessage} Continue to the final score`
              : "GOOOL! Continue to the kick-off restart"
          }
          onClick={() => setGoalPause(false)}
        >
          <span
            className={`goal-pause-card ${match.winner ? "match-winner" : ""}`}
          >
            <strong>{winnerMessage}</strong>
            <span>
              {match.winner ? "Click to continue" : "Click to restart"}
            </span>
          </span>
        </button>
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setModal(null);
              if (e.key === "Tab") {
                const buttons = Array.from(
                  e.currentTarget.querySelectorAll<HTMLButtonElement>("button"),
                );
                const first = buttons[0],
                  last = buttons.at(-1);
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last?.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <button
              autoFocus
              className="icon-button modal-close"
              aria-label="Close dialog"
              onClick={() => setModal(null)}
            >
              <X size={18} />
            </button>
            <h2 id="modal-title">
              {modal === "new" ? "Start a new match?" : "How to play"}
            </h2>
            {modal === "new" ? (
              <>
                <p>
                  This replaces your saved match and loads both saved kickoff
                  arrangements.
                </p>
                <button
                  className="primary-button"
                  onClick={() => {
                    const next = createMatch(
                        Date.now(),
                        true,
                        match.kickoffLineups,
                      ),
                      ballCarrier = possessor(next)!;
                    setMatch(next);
                    setSelected(initialSelection(next));
                    setHistory([]);
                    setLastReplay(null);
                    setGoalPause(false);
                    setOutPause(null);
                    setCompletedGoalkeeperShot(null);
                    setReplaySession(null);
                    setPossessionReplay([]);
                    setMode("select");
                    setAction(null);
                    setPassTarget(null);
                    setResolution(null);
                    setFormationPreset({ home: "custom", away: "custom" });
                    clearContestRolls();
                    setFocusedTeam("home");
                    setCursor({ x: ballCarrier.x, y: ballCarrier.y });
                    setNotice("");
                    setResult("");
                    setModal(null);
                  }}
                >
                  Arrange teams <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <>
                <p>Local two-player football. First to three goals wins.</p>
                <p>
                  Select a player on the pitch or use the arrows on either card.
                  Play the ball carrier, other attackers, and defenders in
                  order, then move each side through the movement stages.
                </p>
                <p>
                  Movement uses horizontal + vertical distance. Passes target a
                  pitch position; a footballer on that position receives the
                  ball and cannot move again that turn. Zoom in for precise
                  movement on a small screen. You can also focus the pitch, use
                  arrow keys, and press Enter.
                </p>
                <p className="rules-note">
                  Passes up to 30 yards use Low-pass; those within its automatic
                  range need no roll unless a defender can intercept the
                  trajectory. Longer low passes and every High-pass use D100 ×
                  the matching skill against distance. Failed passes use a D8
                  error direction. A player receiving a pass can immediately
                  choose one eligible one-touch action or decline it with Next;
                  that player cannot move afterward, and one-touch actions do
                  not chain. A defender in the surrounding eight cells blocks a
                  pass with Tackle against Feint, forward movement with Tackle
                  against Dribble, or an off-ball runner with Mark against Slip.
                  Backward and sideways movement remain free. Offside and fouls
                  are still to come. Player ratings come from the repository’s
                  Barcelona 2014–15 and Madrid 2015–16 sheets. Reserves are
                  imported but substitutions are not implemented.
                </p>
                <button
                  className="primary-button"
                  onClick={() => setModal(null)}
                >
                  Back to the pitch <ArrowRight size={16} />
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
const rootContainer = document.getElementById("root")! as HTMLElement & {
    footrollRoot?: Root;
  },
  root = rootContainer.footrollRoot ?? createRoot(rootContainer);
rootContainer.footrollRoot = root;
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
