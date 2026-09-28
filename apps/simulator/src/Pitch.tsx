import {
  dragDestination,
  playerAtPoint,
  cellCenter,
  gridCell,
} from "./interaction";
import { Football } from "./Football";
import {
  TEAM_NAMES,
  TEAM_SQUADS,
  HEIGHT,
  WIDTH,
  ballPosition,
  canAct,
  canMovePlayer,
  canReposition,
  canRepositionPlayer,
  disciplineFor,
  distance,
  remainingMovement,
  passKind,
  penaltyTakerPositions,
  isInPenaltyExclusionZone,
  possessor,
  isSentOff,
} from "@footroll/engine";
import {
  useRef,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { Match, Player, Point, Team } from "@footroll/engine";
export type BallMotion = "low-pass" | "high-pass" | "linear";
export type LiveBallVisual = {
  from: Point;
  to: Point;
  difficulty: number;
  kind: BallMotion;
  id: number;
  goal?: boolean;
  out?: NonNullable<Match["setPieceRestart"]>["kind"];
  hideLabel?: boolean;
  displayMatch?: Match;
};
const LIVE_PASS_DURATION_MS: Record<BallMotion, number> = {
  "low-pass": 700,
  "high-pass": 1750,
  linear: 1400,
};
const REPLAY_PASS_DURATION_MS: Record<BallMotion, number> = {
  "low-pass": 650,
  "high-pass": 1650,
  linear: 1300,
};
type Props = {
  match: Match;
  replay: PitchReplay | null;
  passVisual: LiveBallVisual | null;
  onPassVisualComplete?: (visual: LiveBallVisual) => void;
  passPreview: { from: Point; to: Point; difficulty: number } | null;
  selected: Record<Team, string>;
  grid: boolean;
  showNames: boolean;
  skillOverlay: { team: Team; key: string; label: string } | null;
  cursor: Point;
  setCursor: Dispatch<SetStateAction<Point>>;
  legal: Point[];
  select: (player: Player) => void;
  move: (point: Point) => void;
  preparePass: (to: Point) => void;
  canDragBall: boolean;
  maxPassDistance?: number;
  movePlayer: (id: string, point: Point) => void;
  blockedActionMessage: string | null;
};
export type PitchReplay = {
  from: Match;
  to: Match;
  id: number;
  goal?: boolean;
  ballMotion?: BallMotion;
};
function AnimatedBall({
  from,
  to,
  motion,
  durationMs,
  animationKey,
  onComplete,
}: {
  from: Point;
  to: Point;
  motion: BallMotion;
  durationMs: number;
  animationKey: number | string;
  onComplete?: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  useEffect(() => {
    let frame = 0;
    const startedAt = performance.now();
    const animate = (now: number) => {
      const next = Math.min(1, (now - startedAt) / durationMs);
      setProgress(next);
      if (next < 1) frame = requestAnimationFrame(animate);
      else onCompleteRef.current?.();
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, animationKey]);
  const start = cellCenter(from),
    end = cellCenter(to),
    arcHeight = Math.min(12, Math.max(5, distance(from, to) * 0.3)),
    x = start.x + (end.x - start.x) * progress,
    y =
      start.y +
      (end.y - start.y) * progress -
      (motion === "high-pass" ? 4 * arcHeight * progress * (1 - progress) : 0),
    turns =
      motion === "high-pass"
        ? Math.max(1, Math.round(distance(from, to) / 8))
        : Math.max(2, Math.round(distance(from, to) / 3)),
    rollPhase = progress * turns * Math.PI * 2,
    rollAxis =
      (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI + 90,
    patternTransform =
      motion === "low-pass" || motion === "high-pass"
        ? `rotate(${rollAxis} 12 12) translate(12 12) scale(1 ${Math.cos(rollPhase)}) translate(-12 -12) rotate(${-rollAxis} 12 12)`
        : undefined;
  return (
    <g key={animationKey} pointerEvents="none">
      <Football
        x={x - 0.7}
        y={y - 0.7}
        width={1.4}
        height={1.4}
        patternTransform={patternTransform}
      />
    </g>
  );
}
export function Pitch({
  match,
  replay,
  passVisual,
  onPassVisualComplete,
  passPreview,
  selected,
  grid,
  showNames,
  skillOverlay,
  cursor,
  setCursor,
  legal,
  select,
  move,
  movePlayer,
  preparePass,
  canDragBall,
  maxPassDistance,
  blockedActionMessage,
}: Props) {
  const displayMatch = passVisual?.displayMatch ?? replay?.to ?? match;
  const [finishedPassId, setFinishedPassId] = useState<number | null>(null);
  const passing = !!passVisual && finishedPassId !== passVisual.id;
  const [ballDrag, setBallDrag] = useState<Point | null>(null);
  const ballPlayer = possessor(displayMatch),
    ball = ballPosition(displayMatch),
    replayFromBall = replay ? ballPosition(replay.from) : null,
    replayToBall = replay ? ballPosition(replay.to) : null,
    replayMovesBall =
      !!replay &&
      !!replayFromBall &&
      !!replayToBall &&
      (replayFromBall.x !== replayToBall.x ||
        replayFromBall.y !== replayToBall.y ||
        replay.from.possession !== replay.to.possession);
  const hoveredPlayer =
      ballDrag &&
      playerAtPoint(
        match.players.filter((player) => !isSentOff(match, player)),
        ballDrag,
      ),
    hoverPlayer =
      hoveredPlayer &&
      (maxPassDistance === undefined ||
        distance(ball, hoveredPlayer) <= maxPassDistance)
        ? hoveredPlayer
        : null;
  const dragTo = hoverPlayer ?? (ballDrag ? gridCell(ballDrag) : null);
  const goalKickArea =
    displayMatch.setup &&
    displayMatch.setPieceRestart?.kind === "goal-kick" &&
    displayMatch.setPieceRestart.setupStage === "attackers"
      ? Array.from({ length: 6 * 20 }, (_, index) => ({
          x:
            displayMatch.setPieceRestart!.team === "home"
              ? index % 6
              : WIDTH - 6 + (index % 6),
          y: 22 + Math.floor(index / 6),
        }))
      : [];
  const penaltyCells =
    displayMatch.setup &&
    displayMatch.foulRestart?.kind === "penalty" &&
    displayMatch.foulRestart.setupStage === "attackers"
      ? penaltyTakerPositions(displayMatch.foulRestart.team)
      : [];
  const penaltyRestrictedCells =
    displayMatch.setup && displayMatch.foulRestart?.kind === "penalty"
      ? Array.from({ length: WIDTH * HEIGHT }, (_, index) => ({
          x: index % WIDTH,
          y: Math.floor(index / WIDTH),
        })).filter((cell) =>
          isInPenaltyExclusionZone(cell, displayMatch.foulRestart!.team),
        )
      : [];
  const pass =
    ballDrag && dragTo
      ? { from: ball, to: dragTo, difficulty: distance(ball, dragTo) }
      : (passPreview ?? (passing ? passVisual : null));
  const visualPassKind = pass
    ? "kind" in pass
      ? pass.kind
      : passKind(pass.difficulty)
    : null;
  const gesture = useRef<{
    kind: "move" | "pass";
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    started: boolean;
  } | null>(null);
  const [drag, setDrag] = useState<{ id: string; point: Point } | null>(null);
  const suppressClick = useRef(false);
  function location(e: ReactPointerEvent<SVGSVGElement>) {
    const point = e.currentTarget.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    const matrix = e.currentTarget.getScreenCTM();
    return matrix ? point.matrixTransform(matrix.inverse()) : null;
  }
  function cancelDrag() {
    gesture.current = null;
    setDrag(null);
    setBallDrag(null);
  }
  function passTarget(point: Point): Point {
    const target = {
      x: Math.max(0, Math.min(WIDTH - 1, Math.floor(point.x))),
      y: Math.max(0, Math.min(HEIGHT - 1, Math.floor(point.y))),
    };
    if (
      maxPassDistance === undefined ||
      distance(ball, target) <= maxPassDistance
    )
      return target;
    const dx = target.x - ball.x,
      dy = target.y - ball.y,
      total = Math.abs(dx) + Math.abs(dy);
    let xSteps = Math.min(
        Math.abs(dx),
        Math.round((maxPassDistance * Math.abs(dx)) / total),
      ),
      ySteps = maxPassDistance - xSteps;
    if (ySteps > Math.abs(dy)) {
      xSteps += ySteps - Math.abs(dy);
      ySteps = Math.abs(dy);
    }
    return {
      x: ball.x + Math.sign(dx) * xSteps,
      y: ball.y + Math.sign(dy) * ySteps,
    };
  }
  function playerDisabled(player: Player) {
    if (replay) return false;
    if (isSentOff(displayMatch, player)) return true;
    if (displayMatch.setup) return !canRepositionPlayer(displayMatch, player);
    if (displayMatch.phase === "action") return !canAct(displayMatch, player);
    return !canMovePlayer(displayMatch, player);
  }

  return (
    <svg
      className={`pitch ${displayMatch.setup ? "setup-pitch" : displayMatch.phase === "movement" ? "movement-pitch" : ""} ${drag || ballDrag ? "dragging" : ""} ${replay ? "replaying" : ""}`}
      viewBox="-3 -2 106 68"
      role="application"
      aria-label="Interactive football pitch. Select players on the pitch or with the arrows on each player card. Arrow keys choose a cell; Enter moves the selected player."
      tabIndex={0}
      onPointerDown={(e) => {
        suppressClick.current = false;
        if (e.button !== 0 || !e.isPrimary || match.winner || replay || passing)
          return;
        const point = location(e);
        if (!point) return;
        const ballX = ballPlayer
          ? cellCenter(ball).x + (ballPlayer.team === "home" ? 2.05 : -2.05)
          : cellCenter(ball).x;
        if (
          match.phase === "action" &&
          !!ballPlayer &&
          canAct(match, ballPlayer) &&
          canDragBall &&
          Math.hypot(point.x - ballX, point.y - cellCenter(ball).y) <= 1.6
        ) {
          gesture.current = {
            kind: "pass",
            id: ballPlayer.id,
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            started: false,
          };
          setBallDrag(point);
          e.currentTarget.setPointerCapture(e.pointerId);
          return;
        }
        if (!match.setup && match.phase !== "movement") return;
        const player =
          point &&
          playerAtPoint(
            match.players.filter((candidate) => !isSentOff(match, candidate)),
            point,
          );
        if (!player) return;
        select(player);
        const canDrag = match.setup
          ? canRepositionPlayer(match, player)
          : canMovePlayer(match, player);
        if (!canDrag) return;
        gesture.current = {
          kind: "move",
          id: player.id,
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          started: false,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const g = gesture.current;
        if (!g || g.pointerId !== e.pointerId) return;
        if (Math.hypot(e.clientX - g.startX, e.clientY - g.startY) > 3)
          g.started = true;
        const point = location(e);
        if (g.kind === "pass") {
          if (point) {
            const target = passTarget(point);
            setBallDrag(
              distance(ball, gridCell(point)) >
                (maxPassDistance ?? Number.POSITIVE_INFINITY)
                ? cellCenter(target)
                : point,
            );
          }
          return;
        }
        if (g.started && point)
          setDrag({
            id: g.id,
            point: dragDestination(
              match,
              match.players.find((p) => p.id === g.id)!,
              point,
            ),
          });
      }}
      onPointerUp={(e) => {
        const g = gesture.current;
        if (!g || g.pointerId !== e.pointerId) return;
        const point = location(e);
        suppressClick.current = g.started || g.kind === "pass";
        cancelDrag();
        if (e.currentTarget.hasPointerCapture(e.pointerId))
          e.currentTarget.releasePointerCapture(e.pointerId);
        if (g.kind === "pass") {
          const target = point && passTarget(point);
          if (
            g.started &&
            target &&
            target.x >= 0 &&
            target.x < WIDTH &&
            target.y >= 0 &&
            target.y < HEIGHT
          )
            preparePass(target);
          return;
        }
        if (g.started && point) {
          const player = match.players.find((p) => p.id === g.id)!;
          const to = dragDestination(match, player, point);
          if (to.x !== player.x || to.y !== player.y) movePlayer(g.id, to);
        }
      }}
      onPointerCancel={() => {
        suppressClick.current = true;
        cancelDrag();
      }}
      onLostPointerCapture={cancelDrag}
      onKeyDown={(e) => {
        if (replay || passing) return;
        if (e.key === "Escape") {
          cancelDrag();
          return;
        }
        if (e.target !== e.currentTarget) return;
        if (
          ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
        ) {
          e.preventDefault();
          setCursor((c) => ({
            x: Math.max(
              0,
              Math.min(
                99,
                c.x +
                  (e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0),
              ),
            ),
            y: Math.max(
              0,
              Math.min(
                63,
                c.y +
                  (e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0),
              ),
            ),
          }));
        }
        if (e.key === "Enter") {
          e.preventDefault();
          move(cursor);
        }
      }}
      onClick={(e) => {
        if (replay || passing) return;
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        const svg = e.currentTarget;
        const point = svg.createSVGPoint();
        point.x = e.clientX;
        point.y = e.clientY;
        const matrix = svg.getScreenCTM();
        if (matrix) {
          const local = point.matrixTransform(matrix.inverse());
          const player = playerAtPoint(
            match.players.filter((candidate) => !isSentOff(match, candidate)),
            local,
          );
          const disabled = !!player && playerDisabled(player);
          if (player && !disabled) select(player);
          else if (!player) move(gridCell(local));
        }
      }}
    >
      <defs>
        <pattern
          id="pitch-grid"
          width="1"
          height="1"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M1 0H0V1"
            fill="none"
            stroke="#c7e0b7"
            strokeOpacity=".32"
            strokeWidth=".08"
          />
        </pattern>
        <filter id="shadow" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy=".3" stdDeviation=".3" floodOpacity=".3" />
        </filter>
      </defs>
      <rect x="-6" y="-6" width="112" height="76" fill="#18523a" />
      <rect width="100" height="64" fill="#24734f" />
      {grid && <rect width="100" height="64" fill="url(#pitch-grid)" />}
      <g fill="none" stroke="#d1dfc3" strokeWidth=".22" opacity=".8">
        <rect width="100" height="64" />
        <path d="M50 0V64" />
        <circle cx="50" cy="32" r="10" />
        <rect x="0" y="10" width="18" height="44" />
        <rect x="82" y="10" width="18" height="44" />
        <rect x="0" y="22" width="6" height="20" />
        <rect x="94" y="22" width="6" height="20" />
        <path d="M18 24 A10 10 0 0 1 18 40 M82 24 A10 10 0 0 0 82 40" />
        <path d="M0 28H-2V36H0 M100 28H102V36H100" />
        <path d="M0 1A1 1 0 0 0 1 0 M99 0A1 1 0 0 0 100 1 M0 63A1 1 0 0 1 1 64 M99 64A1 1 0 0 1 100 63" />
      </g>
      <g fill="#d1dfc3">
        <circle cx="50" cy="32" r=".3" />
        <circle cx="12" cy="32" r=".3" />
        <circle cx="88" cy="32" r=".3" />
      </g>
      {!replay &&
        goalKickArea.map((cell) => (
          <rect
            key={`goal-kick-${cell.x}-${cell.y}`}
            x={cell.x}
            y={cell.y}
            width="1"
            height="1"
            fill="#d5ed94"
            opacity=".28"
          />
        ))}
      {!replay &&
        penaltyRestrictedCells.map((cell) => (
          <rect
            key={`penalty-restricted-${cell.x}-${cell.y}`}
            x={cell.x}
            y={cell.y}
            width="1"
            height="1"
            fill="#ef8f82"
            opacity=".2"
          />
        ))}
      {!replay &&
        penaltyCells.map((cell) => (
          <rect
            key={`penalty-${cell.x}-${cell.y}`}
            x={cell.x}
            y={cell.y}
            width="1"
            height="1"
            fill="#d5ed94"
            opacity=".48"
          />
        ))}
      {!replay &&
        legal.map((c) => (
          <rect
            key={`${c.x}-${c.y}`}
            x={c.x}
            y={c.y}
            width="1"
            height="1"
            fill="#d5ed94"
            opacity=".38"
          />
        ))}
      {pass && (
        <g pointerEvents="none">
          <line
            x1={cellCenter(pass.from).x}
            y1={cellCenter(pass.from).y}
            x2={cellCenter(pass.to).x}
            y2={cellCenter(pass.to).y}
            stroke="#fff"
            strokeWidth=".18"
            strokeDasharray={
              visualPassKind === "high-pass" ? "1 .65" : undefined
            }
          />
          {!("hideLabel" in pass && pass.hideLabel) && (
            <text
              x={(cellCenter(pass.from).x + cellCenter(pass.to).x) / 2}
              y={(pass.from.y + pass.to.y) / 2 - 0.5}
              textAnchor="middle"
              fill="#fff"
              stroke="#254837"
              strokeWidth=".45"
              paintOrder="stroke"
              fontSize="1.5"
            >
              {pass.difficulty}
            </text>
          )}
        </g>
      )}
      {[...displayMatch.players]
        .filter((player) => !isSentOff(displayMatch, player))
        .sort(
          (a, b) =>
            Number(a.id === displayMatch.possession) -
            Number(b.id === displayMatch.possession),
        )
        .map((player) => {
          const fromPlayer = replay?.from.players.find(
              (candidate) => candidate.id === player.id,
            ),
            toPlayer = replay?.to.players.find(
              (candidate) => candidate.id === player.id,
            ),
            replayMovement =
              fromPlayer &&
              toPlayer &&
              (fromPlayer.x !== toPlayer.x || fromPlayer.y !== toPlayer.y)
                ? {
                    x: fromPlayer.x - toPlayer.x,
                    y: fromPlayer.y - toPlayer.y,
                  }
                : null,
            hoveredSkillValue =
              skillOverlay?.team === player.team
                ? (
                    TEAM_SQUADS[player.team].players.find(
                      (candidate) => candidate.id === player.id,
                    )?.ratings as Record<string, number> | undefined
                  )?.[skillOverlay.key]
                : undefined,
            discipline = disciplineFor(displayMatch, player);
          return (
            <g
              key={player.id}
              className={`player-token ${player.id === selected[player.team] ? "selected" : ""} ${playerDisabled(player) ? "stage-disabled" : ""}`}
              aria-pressed={player.id === selected[player.team]}
              aria-disabled={playerDisabled(player)}
              transform={
                drag?.id === player.id
                  ? `translate(${cellCenter(drag.point).x - cellCenter(player).x} ${drag.point.y - player.y})`
                  : undefined
              }
              style={
                drag?.id === player.id
                  ? { pointerEvents: "none", opacity: 0.8 }
                  : undefined
              }
              role="button"
              tabIndex={playerDisabled(player) ? -1 : 0}
              onKeyDown={(e) => {
                if (
                  !playerDisabled(player) &&
                  (e.key === "Enter" || e.key === " ")
                ) {
                  e.preventDefault();
                  e.stopPropagation();
                  select(player);
                }
              }}
              aria-label={`${TEAM_NAMES[player.team]} ${player.number}, ${player.name}${discipline.yellowCards ? ", yellow card" : ""}`}
            >
              {replayMovement && (
                <animateTransform
                  key={`${replay?.id}-${player.id}`}
                  attributeName="transform"
                  type="translate"
                  from={`${replayMovement.x} ${replayMovement.y}`}
                  to="0 0"
                  dur="1s"
                  calcMode="spline"
                  keySplines="0.22 1 0.36 1"
                  fill="freeze"
                />
              )}
              <title>
                {player.name} · {player.role} ·{" "}
                {remainingMovement(match, player)}
                movement points
              </title>
              <circle
                className={`player-disc ${player.team}`}
                cx={cellCenter(player).x}
                cy={cellCenter(player).y}
                r="1.35"
                fill={player.team === "home" ? "#244fa0" : "#fff9e9"}
                stroke="#17251e"
                strokeWidth=".1"
                filter="url(#shadow)"
              />
              {player.id === selected[player.team] && (
                <circle
                  cx={cellCenter(player).x}
                  cy={cellCenter(player).y}
                  r="1.48"
                  fill="none"
                  stroke="#fff"
                  strokeWidth=".16"
                />
              )}
              <text
                x={cellCenter(player).x}
                y={player.y + 0.57}
                className="token-number"
                fill={player.team === "home" ? "#ff5252" : "#343b50"}
              >
                {player.number}
              </text>
              {(showNames ||
                hoveredSkillValue !== undefined ||
                discipline.yellowCards > 0) && (
                <text
                  x={cellCenter(player).x}
                  y={player.team === "home" ? player.y - 1.05 : player.y + 2.65}
                  className={`player-name-label ${hoveredSkillValue !== undefined ? "skill-preview" : ""}`}
                >
                  {player.name}
                  {hoveredSkillValue !== undefined
                    ? ` · ${hoveredSkillValue}`
                    : ""}
                  {discipline.yellowCards > 0 && (
                    <tspan
                      className="pitch-card-icon yellow"
                      dx="0.22"
                      aria-label="Yellow card"
                    >
                      ▮
                    </tspan>
                  )}
                </text>
              )}
              {player.id === displayMatch.possession &&
                !replayMovesBall &&
                !passing &&
                !ballDrag &&
                !passPreview && (
                  <g pointerEvents="none">
                    <Football
                      x={
                        player.team === "home"
                          ? cellCenter(player).x + 1.35
                          : cellCenter(player).x - 2.75
                      }
                      y={player.y - 0.2}
                      width={1.4}
                      height={1.4}
                    />
                  </g>
                )}
            </g>
          );
        })}
      {!replayMovesBall &&
        !ballPlayer &&
        !passing &&
        !ballDrag &&
        !passPreview && (
          <Football
            x={cellCenter(ball).x - 0.7}
            y={cellCenter(ball).y - 0.7}
            width={1.4}
            height={1.4}
            pointerEvents="none"
          />
        )}
      {!replay && passPreview && !passing && !ballDrag && (
        <Football
          x={cellCenter(passPreview.to).x - 0.7}
          y={cellCenter(passPreview.to).y - 0.7}
          width={1.4}
          height={1.4}
          pointerEvents="none"
        />
      )}
      {!replay && ballDrag && (
        <Football
          x={ballDrag.x - 0.7}
          y={ballDrag.y - 0.7}
          width={1.4}
          height={1.4}
          pointerEvents="none"
        />
      )}
      {!replay && passing && passVisual && (
        <AnimatedBall
          from={passVisual.from}
          to={passVisual.to}
          motion={passVisual.kind}
          durationMs={
            passVisual.goal
              ? LIVE_PASS_DURATION_MS["low-pass"]
              : LIVE_PASS_DURATION_MS[passVisual.kind]
          }
          animationKey={passVisual.id}
          onComplete={() => {
            setFinishedPassId(passVisual.id);
            onPassVisualComplete?.(passVisual);
          }}
        />
      )}
      {replay && replayMovesBall && replayFromBall && replayToBall && (
        <g key={`replay-${replay.id}`} pointerEvents="none">
          <line
            className="replay-ball-path"
            x1={cellCenter(replayFromBall).x}
            y1={cellCenter(replayFromBall).y}
            x2={cellCenter(replayToBall).x}
            y2={cellCenter(replayToBall).y}
          >
            <animate
              attributeName="opacity"
              values="0;0.7;0"
              dur="1.15s"
              fill="freeze"
            />
          </line>
          <AnimatedBall
            from={replayFromBall}
            to={replayToBall}
            motion={replay.ballMotion ?? "linear"}
            durationMs={REPLAY_PASS_DURATION_MS[replay.ballMotion ?? "linear"]}
            animationKey={`ball-${replay.id}`}
          />
          {replay.goal && (
            <circle
              className="goal-replay-burst"
              cx={cellCenter(replayToBall).x}
              cy={cellCenter(replayToBall).y}
              r="1"
            >
              <animate
                attributeName="r"
                values="1;4.5;6"
                begin=".72s"
                dur=".65s"
                fill="freeze"
              />
              <animate
                attributeName="opacity"
                values="0;0.9;0"
                begin=".72s"
                dur=".65s"
                fill="freeze"
              />
            </circle>
          )}
        </g>
      )}
      {!replay && blockedActionMessage && (
        <g
          className="pitch-blocked-message"
          role="status"
          aria-label={blockedActionMessage}
          pointerEvents="none"
        >
          <rect x="24" y="29.5" width="52" height="5" rx="2.5" />
          <text x="50" y="32.75" textAnchor="middle">
            {blockedActionMessage}
          </text>
        </g>
      )}
      <rect
        className="keyboard-cursor"
        x={cursor.x}
        y={cursor.y}
        width="1"
        height="1"
        fill="none"
        stroke="#fff"
        strokeWidth=".18"
        pointerEvents="none"
        visibility={replay || passing ? "hidden" : undefined}
      />
    </svg>
  );
}
