import {
  ballPosition,
  blockingDefenders,
  canLobShot,
  canShootAtGoal,
  canTackle,
  canMove,
  canReposition,
  challengedBallSkill,
  challengedBallSkillLabel,
  distance,
  remainingMovement,
  movementBlocker,
  interceptionSkill,
  lowPassAutomaticDistance,
  passInterceptors,
  passKind,
  possessor,
  isSentOff,
  shotDifficulty,
  TEAM_SQUADS,
  HEIGHT,
  WIDTH,
  type ContestResolution,
  type Match,
  type Player,
  type Point,
} from "@footroll/engine";
export function playerAtPoint(players: Player[], point: Point) {
  return players
    .map((player) => ({
      player,
      d: Math.hypot(
        cellCenter(player).x - point.x,
        cellCenter(player).y - point.y,
      ),
    }))
    .filter((p) => p.d <= 1.45)
    .sort((a, b) => a.d - b.d)[0]?.player;
}
export type ActionKind =
  | "pass"
  | "throw-in"
  | "shoot"
  | "lob"
  | "tackle"
  | "feint"
  | "dribble"
  | "slip"
  | "low-pass"
  | "finish"
  | "offensive-header"
  | "defensive-header"
  | "scissors-kick"
  | "challenge";
export function passBlockContests(match: Match): ContestResolution[] {
  const attacker = possessor(match);
  if (
    !attacker ||
    match.winner ||
    match.oneTouch ||
    match.phase !== "action" ||
    match.actionStage !== "ball-carrier" ||
    attacker.team !== match.active
  )
    return [];
  return blockingDefenders(match, attacker).map((defender) => ({
    actor: {
      playerId: attacker.id,
      name: attacker.name,
      team: attacker.team,
      skillLabel: "Feint",
      skill: attacker.feint,
    },
    opponent: {
      playerId: defender.id,
      name: defender.name,
      team: defender.team,
      skillLabel: "Tackle",
      skill: defender.tackle,
    },
    winnerId: null,
  }));
}
export function actionPreview(
  match: Match,
  kind: ActionKind | null,
  player: Player,
  targetPoint: Point | null,
) {
  const ballPlayer = possessor(match),
    ball = ballPosition(match);
  if (match.pendingFoul) return null;
  if (match.pendingShotTarget) return null;
  if (match.pendingGoalkeeperShot) {
    const pending = match.pendingGoalkeeperShot,
      goalkeeper = match.players.find(
        (candidate) => candidate.id === pending.goalkeeperId,
      ),
      shooter = match.players.find(
        (candidate) => candidate.id === pending.shooterId,
      );
    if (!goalkeeper || !shooter) return null;
    if (pending.stage === "power") {
      const header = pending.attempt.header;
      return {
        command: { type: "resolve-goalkeeper-shot" as const },
        difficulty: pending.attempt.difficulty,
        skill: header ? shooter.headerPower : shooter.shotPower,
        label: `${shooter.name} · ${header ? "Header power" : "Shot power"}`,
      };
    }
    return {
      command: { type: "resolve-goalkeeper-shot" as const },
      difficulty: pending.difficulty,
      skill: pending.stage === "reach" ? goalkeeper.reach : goalkeeper.catch,
      label: `${goalkeeper.name} · ${pending.stage === "reach" ? "Reach" : "Catch"}`,
    };
  }
  if (!kind || match.winner) return null;
  if (kind === "challenge" && match.challengedBall) {
    const receiver = match.players.find(
        (candidate) => candidate.id === match.challengedBall?.receiverId,
      ),
      defender = match.players.find(
        (candidate) => candidate.id === match.challengedBall?.defenderId,
      );
    if (!receiver || !defender) return null;
    const receiverSkill = challengedBallSkill(receiver),
      defenderSkill = challengedBallSkill(defender);
    return {
      command: {
        type: "resolve-challenged-ball" as const,
        receiverId: receiver.id,
        defenderId: defender.id,
      },
      difficulty: defenderSkill,
      skill: receiverSkill,
      contest: {
        actor: {
          playerId: receiver.id,
          name: receiver.name,
          team: receiver.team,
          skillLabel: challengedBallSkillLabel(receiver),
          skill: receiverSkill,
        },
        opponent: {
          playerId: defender.id,
          name: defender.name,
          team: defender.team,
          skillLabel: challengedBallSkillLabel(defender),
          skill: defenderSkill,
        },
        winnerId: null,
      } satisfies ContestResolution,
      label: `Challenged ball · ${receiver.name} vs ${defender.name}`,
    };
  }
  if (kind === "dribble" || kind === "slip") {
    if (!targetPoint || match.phase !== "movement") return null;
    const defender = movementBlocker(match, player, targetPoint),
      expectedKind = match.possession === player.id ? "dribble" : "slip";
    if (!defender || kind !== expectedKind) return null;
    const skill = kind === "dribble" ? player.dribble : player.slip,
      opponentSkill = kind === "dribble" ? defender.tackle : defender.mark,
      opponentLabel = kind === "dribble" ? "Tackle" : "Mark";
    return {
      command: {
        type: "resolve-block" as const,
        kind,
        playerId: player.id,
        defenderId: defender.id,
        to: { ...targetPoint },
      },
      difficulty: opponentSkill,
      skill,
      contest: {
        actor: {
          playerId: player.id,
          name: player.name,
          team: player.team,
          skillLabel: kind === "dribble" ? "Dribble" : "Slip",
          skill,
        },
        opponent: {
          playerId: defender.id,
          name: defender.name,
          team: defender.team,
          skillLabel: opponentLabel,
          skill: opponentSkill,
        },
        winnerId: null,
      } satisfies ContestResolution,
      label: `${player.name} · ${kind === "dribble" ? "Dribble" : "Slip"} past ${defender.name}`,
    };
  }
  if (match.phase !== "action") return null;
  if (
    kind === "pass" ||
    kind === "throw-in" ||
    kind === "low-pass" ||
    kind === "defensive-header"
  ) {
    const throwIn = kind === "throw-in",
      oneTouchPass = kind === "low-pass" || kind === "defensive-header";
    const target = match.players.find(
      (p) =>
        !isSentOff(match, p) &&
        p.x === targetPoint?.x &&
        p.y === targetPoint?.y,
    );
    if (
      !ballPlayer ||
      (throwIn && match.setPieceRestart?.kind !== "throw-in") ||
      (!throwIn &&
        !oneTouchPass &&
        match.setPieceRestart?.kind === "throw-in") ||
      (!oneTouchPass && match.foulRestart?.kind === "penalty") ||
      ballPlayer.team !== match.active ||
      (!oneTouchPass && match.actionStage !== "ball-carrier") ||
      (oneTouchPass
        ? !match.oneTouch ||
          match.oneTouch.playerId !== ballPlayer.id ||
          !match.oneTouch.actions.includes(kind)
        : !!match.oneTouch) ||
      !targetPoint ||
      !Number.isInteger(targetPoint.x) ||
      !Number.isInteger(targetPoint.y) ||
      targetPoint.x < 0 ||
      targetPoint.x >= WIDTH ||
      targetPoint.y < 0 ||
      targetPoint.y >= HEIGHT ||
      distance(ball, targetPoint) === 0
    )
      return null;
    const length = distance(ball, targetPoint),
      defensiveHeader = kind === "defensive-header",
      difficulty = defensiveHeader
        ? length * 3
        : match.setPieceRestart?.kind === "throw-in"
          ? length * 2
          : length;
    if (difficulty > 100) return null;
    if (!oneTouchPass) {
      if (
        match.pendingPass &&
        (match.pendingPass.playerId !== ballPlayer.id ||
          match.pendingPass.to.x !== targetPoint.x ||
          match.pendingPass.to.y !== targetPoint.y)
      )
        return null;
      const blocker =
        match.foulRestart || match.setPieceRestart
          ? undefined
          : blockingDefenders(match, ballPlayer)[0];
      if (blocker)
        return {
          command: {
            type: "resolve-block" as const,
            kind: "feint" as const,
            action: "pass" as const,
            playerId: ballPlayer.id,
            defenderId: blocker.id,
            to: { ...targetPoint },
          },
          difficulty: blocker.tackle,
          skill: ballPlayer.feint,
          contest: {
            actor: {
              playerId: ballPlayer.id,
              name: ballPlayer.name,
              team: ballPlayer.team,
              skillLabel: "Feint",
              skill: ballPlayer.feint,
            },
            opponent: {
              playerId: blocker.id,
              name: blocker.name,
              team: blocker.team,
              skillLabel: "Tackle",
              skill: blocker.tackle,
            },
            winnerId: null,
          } satisfies ContestResolution,
          label: `${ballPlayer.name} · Feint past ${blocker.name} to pass`,
        };
    }
    const type = oneTouchPass
        ? defensiveHeader
          ? "high-pass"
          : "low-pass"
        : match.setPieceRestart?.kind === "throw-in" ||
            match.setPieceRestart?.kind === "goal-kick"
          ? "high-pass"
          : passKind(length),
      skill = defensiveHeader
        ? ballPlayer.defensiveHeader
        : match.setPieceRestart?.kind === "throw-in"
          ? ballPlayer.throwIn
          : match.setPieceRestart?.kind === "goal-kick"
            ? ballPlayer.goalKick
            : type === "low-pass"
              ? ballPlayer.lowPass
              : ballPlayer.highPass,
      interceptors = defensiveHeader
        ? []
        : passInterceptors(match, ballPlayer, targetPoint, type),
      automatic =
        !defensiveHeader &&
        !match.setPieceRestart &&
        type === "low-pass" &&
        length <= lowPassAutomaticDistance(skill) &&
        interceptors.length === 0,
      status = automatic
        ? "Automatic"
        : interceptors.length
          ? `Contested by ${interceptors.map((defender) => defender.name).join(", ")}`
          : "Roll required",
      defender = interceptors[0];
    if (oneTouchPass && !defensiveHeader && length > 30) return null;
    const contest: ContestResolution | undefined = defender
      ? {
          actor: {
            playerId: ballPlayer.id,
            name: ballPlayer.name,
            team: ballPlayer.team,
            skillLabel: throwIn
              ? "Throw-in"
              : type === "low-pass"
                ? "Low-pass"
                : "High-pass",
            skill,
          },
          opponent: {
            playerId: defender.id,
            name: defender.name,
            team: defender.team,
            skillLabel: "Intercept",
            skill: interceptionSkill(defender),
          },
          winnerId: null,
        }
      : undefined;
    return {
      command: oneTouchPass
        ? {
            type: "one-touch-pass" as const,
            kind: (kind === "defensive-header"
              ? "defensive-header"
              : "low-pass") as "low-pass" | "defensive-header",
            to: { ...targetPoint },
          }
        : throwIn
          ? { type: "throw-in" as const, to: { ...targetPoint } }
          : { type: "pass" as const, to: { ...targetPoint } },
      difficulty,
      skill,
      automatic,
      status,
      contest,
      label: `${defensiveHeader ? "Defensive-header" : oneTouchPass ? "One-touch low-pass" : match.setPieceRestart?.kind === "throw-in" ? "Throw-in" : match.setPieceRestart?.kind === "goal-kick" ? "Goal-kick" : match.setPieceRestart ? `Corner · ${type === "low-pass" ? "Low-pass" : "High-pass"}` : `${match.foulRestart?.kind === "free-kick" ? "Free-kick · " : ""}${type === "low-pass" ? "Low-pass" : "High-pass"}`} · ${status} · ${ballPlayer.name} → ${target?.name ?? `(${targetPoint.x}, ${targetPoint.y})`}`,
    };
  }
  if (
    (kind === "shoot" || kind === "lob") &&
    !match.oneTouch &&
    !match.pendingPass &&
    match.actionStage === "ball-carrier" &&
    ballPlayer?.team === match.active &&
    canShootAtGoal(ballPlayer) &&
    (!match.setPieceRestart || match.setPieceRestart.kind === "corner") &&
    (kind === "shoot" || canLobShot(match, ballPlayer))
  ) {
    const blocker =
      match.foulRestart || match.setPieceRestart
        ? undefined
        : blockingDefenders(match, ballPlayer)[0];
    if (blocker)
      return {
        command: {
          type: "resolve-block" as const,
          kind: "feint" as const,
          action: "shoot" as const,
          playerId: ballPlayer.id,
          defenderId: blocker.id,
        },
        difficulty: blocker.tackle,
        skill: ballPlayer.feint,
        contest: {
          actor: {
            playerId: ballPlayer.id,
            name: ballPlayer.name,
            team: ballPlayer.team,
            skillLabel: "Feint",
            skill: ballPlayer.feint,
          },
          opponent: {
            playerId: blocker.id,
            name: blocker.name,
            team: blocker.team,
            skillLabel: "Tackle",
            skill: blocker.tackle,
          },
          winnerId: null,
        } satisfies ContestResolution,
        label: `${ballPlayer.name} · Feint past ${blocker.name} to shoot`,
      };
    const lob = kind === "lob";
    return {
      command: {
        type: "shoot" as const,
        ...(lob ? { kind: "lob" as const } : {}),
      },
      difficulty: shotDifficulty(match),
      skill: lob
        ? TEAM_SQUADS[ballPlayer.team].players.find(
            (candidate) => candidate.id === ballPlayer.id,
          )!.ratings.Lob
        : match.foulRestart?.kind === "penalty"
          ? ballPlayer.penalty
          : match.foulRestart?.kind === "free-kick"
            ? ballPlayer.freeKick
            : match.setPieceRestart?.kind === "corner"
              ? ballPlayer.freeKick
              : ballPlayer.shoot,
      label: `${ballPlayer.name} · ${lob ? "Lob" : match.foulRestart?.kind === "penalty" ? "Penalty" : match.foulRestart?.kind === "free-kick" ? "Free-kick" : match.setPieceRestart?.kind === "corner" ? "Corner kick" : "Shoot"}`,
    };
  }
  if (
    (kind === "finish" ||
      kind === "offensive-header" ||
      kind === "scissors-kick") &&
    ballPlayer?.team === match.active &&
    match.oneTouch?.playerId === ballPlayer.id &&
    match.oneTouch.actions.includes(kind) &&
    canShootAtGoal(ballPlayer)
  ) {
    const baseDifficulty = shotDifficulty(match),
      difficulty =
        kind === "offensive-header"
          ? Math.min(200, baseDifficulty * 2)
          : kind === "scissors-kick"
            ? Math.min(200, baseDifficulty + 20)
            : baseDifficulty,
      skill =
        kind === "finish"
          ? ballPlayer.finish
          : kind === "offensive-header"
            ? ballPlayer.offensiveHeader
            : ballPlayer.scissorsKick,
      label =
        kind === "finish"
          ? "Finishing"
          : kind === "offensive-header"
            ? "Offensive-header"
            : "Scissors-kick";
    return {
      command: { type: "one-touch-shot" as const, kind },
      difficulty,
      skill,
      label: `${ballPlayer.name} · One touch · ${label}`,
    };
  }
  if (kind === "tackle" && ballPlayer && canTackle(match, player))
    return {
      command: { type: "tackle" as const, playerId: player.id },
      difficulty: ballPlayer.feint,
      skill: player.tackle,
      contest: {
        actor: {
          playerId: ballPlayer.id,
          name: ballPlayer.name,
          team: ballPlayer.team,
          skillLabel: "Feint",
          skill: ballPlayer.feint,
        },
        opponent: {
          playerId: player.id,
          name: player.name,
          team: player.team,
          skillLabel: "Tackle",
          skill: player.tackle,
        },
        winnerId: null,
      } satisfies ContestResolution,
      label: `${player.name} · Tackle`,
    };
  return null;
}

// Include the starting cell so dropping back onto the player cancels movement.
export function dragDestination(
  match: Match,
  player: Player,
  point: Point,
): Point {
  let best = { x: player.x, y: player.y };
  let nearest = Infinity;
  const range = match.setup ? WIDTH : remainingMovement(match, player),
    unrestrictedSetup =
      match.testSetup || !!match.foulRestart || !!match.setPieceRestart;
  const minX = match.setup
      ? unrestrictedSetup
        ? 0
        : player.team === "home"
          ? 0
          : WIDTH / 2
      : player.x - range,
    maxX = match.setup
      ? unrestrictedSetup
        ? WIDTH - 1
        : player.team === "home"
          ? WIDTH / 2 - 1
          : WIDTH - 1
      : player.x + range,
    minY = match.setup ? 0 : player.y - range,
    maxY = match.setup ? HEIGHT - 1 : player.y + range;
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      if (
        (x !== player.x || y !== player.y) &&
        !(match.setup
          ? canReposition(match, player, { x, y })
          : canMove(match, player, { x, y }))
      )
        continue;
      const distance = Math.hypot(
        cellCenter({ x, y }).x - point.x,
        cellCenter({ x, y }).y - point.y,
      );
      if (distance < nearest) {
        nearest = distance;
        best = { x, y };
      }
    }
  }
  return best;
}

export function cellCenter(point: Point): Point {
  return { x: point.x + 0.5, y: point.y + 0.5 };
}
export function gridCell(point: Point): Point {
  return { x: Math.floor(point.x), y: Math.floor(point.y) };
}
