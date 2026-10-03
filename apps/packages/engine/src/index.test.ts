import { describe, expect, it } from "vitest";
import {
  actionResult,
  actionScore,
  applyCommand,
  availableActions,
  blockingDefenders,
  canAct,
  canCommitFoul,
  canMove,
  canReposition,
  carrier,
  challengedBallSkill,
  createMatch,
  deserialize,
  disciplineFor,
  distance,
  errorMagnitude,
  goalTargetReachDifficulty,
  lowPassAutomaticDistance,
  matchResultForScore,
  movementAllowance,
  movementBlocker,
  modifiedDifficulty,
  oneselfDifficulty,
  passInterceptors,
  passErrorPosition,
  penaltyTakerPositions,
  penaltySetupIsLegal,
  isInPenaltyExclusionZone,
  previewD6,
  previewD100,
  remainingMovement,
  serialize,
  shotDifficulty,
  isSentOff,
  successRate,
  TACTICAL_FORMATIONS,
  WINNING_CONDITIONS,
  withinReach,
  type GoalTarget,
  type Match,
} from "./index";
const movement = () => {
  return applyCommand(createMatch(1), { type: "advance" });
};
const selectShotTarget = (
  shot: Match,
  strategy: "closest" | "farthest" = "closest",
) => {
  const pending = shot.pendingShotTarget;
  if (!pending) return shot;
  let target: GoalTarget = pending.closest;
  if (strategy === "farthest") {
    const legal: GoalTarget[] = [];
    for (const row of [0, 1, 2] as const)
      for (let column = 0; column < 8; column++) {
        const candidate = { row, column };
        if (
          Math.abs(row - pending.closest.row) +
            Math.abs(column - pending.closest.column) <=
          pending.maxDistance
        )
          legal.push(candidate);
      }
    target = legal.sort(
      (a, b) =>
        Math.abs(b.row - pending.closest.row) +
        Math.abs(b.column - pending.closest.column) -
        (Math.abs(a.row - pending.closest.row) +
          Math.abs(a.column - pending.closest.column)),
    )[0];
  }
  return applyCommand(shot, { type: "select-shot-target", target });
};
describe("practice engine", () => {
  it("implements every winning condition listed in the rulebook", () => {
    const examples: Record<
      (typeof WINNING_CONDITIONS)[number]["id"],
      [{ home: number; away: number }, "home" | "away" | "draw"]
    > = {
      "first-to-1": [{ home: 1, away: 0 }, "home"],
      "first-to-2": [{ home: 1, away: 2 }, "away"],
      "first-to-3": [{ home: 3, away: 2 }, "home"],
      "first-to-4": [{ home: 3, away: 4 }, "away"],
      "first-to-5": [{ home: 5, away: 4 }, "home"],
      "total-2": [{ home: 1, away: 1 }, "draw"],
      "total-3": [{ home: 1, away: 2 }, "away"],
      "total-4": [{ home: 2, away: 2 }, "draw"],
      "total-5": [{ home: 3, away: 2 }, "home"],
      "first-to-3-or-total-4": [{ home: 2, away: 2 }, "draw"],
      "lead-by-2": [{ home: 4, away: 2 }, "home"],
      "lead-by-3": [{ home: 1, away: 4 }, "away"],
      "lead-by-2-or-first-to-5": [{ home: 5, away: 4 }, "home"],
      "lead-by-3-or-first-to-5": [{ home: 4, away: 5 }, "away"],
      "lead-by-2-or-total-4": [{ home: 2, away: 2 }, "draw"],
      "lead-by-2-or-total-5": [{ home: 3, away: 2 }, "home"],
      "lead-by-2-or-total-6": [{ home: 3, away: 3 }, "draw"],
    };
    expect(Object.keys(examples)).toHaveLength(WINNING_CONDITIONS.length);
    for (const condition of WINNING_CONDITIONS) {
      const [score, result] = examples[condition.id];
      expect(matchResultForScore(score, condition.id)).toBe(result);
      expect(
        matchResultForScore({ home: 0, away: 0 }, condition.id),
      ).toBeNull();
    }
  });
  it("saves a selected winning condition and supports drawn results", () => {
    const match = createMatch();
    match.score = { home: 1, away: 1 };

    const ended = applyCommand(match, {
      type: "set-winning-condition",
      condition: "total-2",
    });

    expect(ended.winningCondition).toBe("total-2");
    expect(ended.winner).toBe("draw");
    expect(deserialize(serialize(ended))).toEqual(ended);
  });
  it("unlocks the current board for a fresh testing restart", () => {
    const played = createMatch(11),
      bearer = carrier(played),
      teammate = played.players.find((player) => player.id === "home-2")!,
      savedLineups = structuredClone(played.kickoffLineups);
    Object.assign(bearer, { x: 74, y: 12 });
    played.ball = { x: bearer.x, y: bearer.y };
    played.turn = 9;
    played.score = { home: 2, away: 1 };
    played.discipline[teammate.id] = { yellowCards: 2, sentOff: true };

    const unlocked = applyCommand(played, { type: "unlock-positions" });
    expect(unlocked.setup).toBe(true);
    expect(unlocked.testSetup).toBe(true);
    expect(unlocked.turn).toBe(1);
    expect(unlocked.score).toEqual({ home: 0, away: 0 });
    expect(unlocked.discipline[teammate.id]).toEqual({
      yellowCards: 0,
      sentOff: false,
    });
    expect(unlocked.kickoffLineups).toEqual(savedLineups);
    expect(canReposition(unlocked, teammate, { x: 70, y: 50 })).toBe(true);
    expect(
      canReposition(
        unlocked,
        unlocked.players.find((player) => player.id === "home-1")!,
        { x: 80, y: 10 },
      ),
    ).toBe(true);

    const arranged = applyCommand(unlocked, {
        type: "reposition",
        playerId: teammate.id,
        to: { x: 70, y: 50 },
      }),
      restarted = applyCommand(arranged, { type: "start" });
    expect(restarted.setup).toBe(false);
    expect(restarted.testSetup).toBe(false);
    expect(
      restarted.players.find((player) => player.id === teammate.id),
    ).toMatchObject({ x: 70, y: 50 });
    expect(carrier(restarted).id).toBe(bearer.id);
    expect(deserialize(serialize(restarted))).toEqual(restarted);
  });
  it("applies every tactical formation to either kickoff squad", () => {
    const shapes = {
      "3-4-3": [3, 4, 3],
      "4-3-3": [4, 3, 3],
      "4-4-2": [4, 4, 2],
      "5-3-2": [5, 3, 2],
      "5-4-1": [5, 4, 1],
    } as const;
    const insideCenter = (point: { x: number; y: number }) =>
      Math.hypot(point.x + 0.5 - 50, point.y + 0.5 - 32) < 10;
    for (const formation of TACTICAL_FORMATIONS) {
      let arranged = createMatch(22, true);
      arranged = applyCommand(arranged, {
        type: "apply-formation",
        team: "home",
        formation,
      });
      arranged = applyCommand(arranged, {
        type: "apply-formation",
        team: "away",
        formation,
      });
      const [defenders, midfielders, forwards] = shapes[formation],
        homeKickoff = arranged.kickoffLineups.home,
        outfield = Array.from(
          { length: 10 },
          (_, index) => `home-${index + 2}`,
        ).filter((id) => id !== homeKickoff.bearerId);
      expect(
        outfield
          .slice(0, defenders)
          .every((id) => [20].includes(homeKickoff.positions[id].x)),
      ).toBe(true);
      expect(
        outfield
          .slice(defenders, defenders + midfielders)
          .every((id) => homeKickoff.positions[id].x === 33),
      ).toBe(true);
      expect(
        outfield
          .slice(defenders + midfielders)
          .every((id) => [38, 44].includes(homeKickoff.positions[id].x)),
      ).toBe(true);
      expect(outfield.slice(defenders + midfielders)).toHaveLength(
        forwards - 1,
      );
      for (const kickoffTeam of ["home", "away"] as const) {
        const lineup = arranged.kickoffLineups[kickoffTeam],
          inside = Object.entries(lineup.positions)
            .filter(([, point]) => insideCenter(point))
            .map(([id]) => id);
        expect(inside).toEqual([lineup.bearerId]);
      }
      expect(deserialize(serialize(arranged))).toEqual(arranged);
    }
  });
  it("applies the section 2.5 action resolution formulas", () => {
    expect(actionScore(62, 90)).toBe(56);
    expect(actionResult(56, 30)).toBe(26);
    expect(errorMagnitude(23, 39, 0.5)).toBe(8);
    expect(successRate(50, 20)).toBe(40);
    expect(oneselfDifficulty(100)).toBe(1);
    expect(modifiedDifficulty(20, 10, -2)).toBe(28);
  });
  it("maps low-pass skills to the section 2.6 automatic distances", () => {
    expect([50, 60, 70, 80, 90, 100].map(lowPassAutomaticDistance)).toEqual([
      5, 10, 15, 20, 25, 30,
    ]);
  });
  it("uses the error magnitude as the total Manhattan length in every D8 direction", () => {
    const target = { x: 50, y: 32 },
      positions = Array.from({ length: 8 }, (_, index) =>
        passErrorPosition("home", target, 7, index + 1),
      );

    positions.forEach((position) => expect(distance(target, position)).toBe(7));
    expect(positions[0]).toEqual({ x: 43, y: 32 });
    expect(positions[1]).toEqual({ x: 46, y: 29 });
    expect(positions[2]).toEqual({ x: 47, y: 36 });
    expect(positions[5]).toEqual({ x: 53, y: 28 });
    expect(positions[6]).toEqual({ x: 54, y: 35 });
    expect(positions[7]).toEqual({ x: 57, y: 32 });
    expect(passErrorPosition("away", target, 7, 2)).toEqual({
      x: 54,
      y: 29,
    });
  });
  it("calculates Annex B shot difficulty from distance and goal aperture", () => {
    const s = createMatch(),
      shooter = carrier(s);
    const difficultyAt = (x: number, y: number) => {
      Object.assign(shooter, { x, y });
      return shotDifficulty(s);
    };

    expect(difficultyAt(99, 31)).toBe(1);
    expect(difficultyAt(99, 0)).toBe(96);
    expect(difficultyAt(95, 31)).toBe(6);
    expect(difficultyAt(80, 31)).toBe(24);
    expect(difficultyAt(50, 31)).toBe(60);
    expect(difficultyAt(50, 0)).toBe(72);
    expect(difficultyAt(0, 31)).toBe(100);
  });
  it("mirrors Annex B shot difficulty for the opposite goal", () => {
    const s = createMatch(),
      awayShooter = s.players.find((player) => player.id === "away-10")!;
    s.possession = awayShooter.id;

    Object.assign(awayShooter, { x: 0, y: 32 });
    expect(shotDifficulty(s)).toBe(1);
    Object.assign(awayShooter, { x: 19, y: 32 });
    expect(shotDifficulty(s)).toBe(24);
    Object.assign(awayShooter, { x: 49, y: 63 });
    expect(shotDifficulty(s)).toBe(72);
  });
  it("only allows shots from the opponent's half", () => {
    const homeMatch = createMatch(),
      homeShooter = carrier(homeMatch);
    expect(availableActions(homeMatch, homeShooter)).toEqual(["pass"]);
    expect(() => applyCommand(homeMatch, { type: "shoot" })).toThrow(
      "only shoot from the opponent’s half",
    );
    homeShooter.x = 50;
    homeMatch.ball = { x: homeShooter.x, y: homeShooter.y };
    expect(availableActions(homeMatch, homeShooter)).toEqual(["pass", "shoot"]);

    const awayMatch = createMatch(),
      awayShooter = awayMatch.players.find(
        (player) => player.id === "away-10",
      )!;
    awayMatch.active = "away";
    awayMatch.possession = awayShooter.id;
    Object.assign(awayShooter, { x: 50, y: 32 });
    awayMatch.ball = { x: awayShooter.x, y: awayShooter.y };
    expect(availableActions(awayMatch, awayShooter)).toEqual(["pass"]);
    expect(() => applyCommand(awayMatch, { type: "shoot" })).toThrow(
      "only shoot from the opponent’s half",
    );
    awayShooter.x = 49;
    awayMatch.ball.x = awayShooter.x;
    expect(availableActions(awayMatch, awayShooter)).toEqual(["pass", "shoot"]);
  });
  it("waits for the attacker to choose an allowed goal cell", () => {
    const s = createMatch(36),
      shooter = carrier(s);
    Object.assign(shooter, { x: 80, y: 32 });
    s.ball = { x: shooter.x, y: shooter.y };

    const aimed = applyCommand(s, { type: "shoot" });
    expect(aimed.pendingShotTarget).toMatchObject({
      shooterId: shooter.id,
      closest: { row: 0, column: 4 },
    });
    expect(availableActions(aimed, shooter)).toEqual([]);
    expect(() => applyCommand(aimed, { type: "advance" })).toThrow(
      "Choose the shot’s goal target",
    );
    expect(() =>
      applyCommand(aimed, {
        type: "select-shot-target",
        target: { row: 2, column: 8 },
      }),
    ).toThrow("Choose one of the available goal targets");

    const resolved = selectShotTarget(aimed);
    expect(resolved.pendingShotTarget).toBeNull();
    expect(
      resolved.log.some((event) =>
        event.text.includes("aims at the low target 5"),
      ),
    ).toBe(true);
  });
  it("calculates the goalkeeper Reach difficulty shown on goal cells", () => {
    const s = createMatch(),
      goalkeeper = s.players.find((player) => player.id === "away-1")!;
    Object.assign(goalkeeper, { x: 99, y: 32 });

    expect(goalTargetReachDifficulty(goalkeeper, { row: 0, column: 4 })).toBe(
      0,
    );
    expect(goalTargetReachDifficulty(goalkeeper, { row: 1, column: 3 })).toBe(
      20,
    );
    expect(goalTargetReachDifficulty(goalkeeper, { row: 2, column: 0 })).toBe(
      60,
    );
  });
  it("removes one-touch shots received in the player's own half", () => {
    const s = createMatch(),
      player = carrier(s);
    s.oneTouch = {
      playerId: player.id,
      sourcePass: "low-pass",
      actions: ["low-pass", "finish"],
      resume: "action-attackers",
    };
    expect(availableActions(s, player)).toEqual(["low-pass"]);
    expect(() =>
      applyCommand(s, { type: "one-touch-shot", kind: "finish" }),
    ).toThrow("only shoot from the opponent’s half");
  });
  it("creates two full teams on distinct in-bounds cells", () => {
    const s = createMatch();
    expect(s.players).toHaveLength(22);
    expect(new Set(s.players.map((p) => `${p.x},${p.y}`)).size).toBe(22);
    expect(deserialize(serialize(s))).toEqual(s);
  });
  it("keeps the kickoff opponents outside the center circle", () => {
    const s = createMatch();
    expect(
      s.players
        .filter((player) => player.team === "away")
        .every(
          (player) => Math.hypot(player.x + 0.5 - 50, player.y + 0.5 - 32) > 10,
        ),
    ).toBe(true);
  });
  it("allows both teams to arrange freely in their own half before kick-off", () => {
    const setup = createMatch(42, true),
      bearer = setup.players.find((player) => player.id === "home-10")!,
      home = setup.players.find((player) => player.id === "home-9")!,
      away = setup.players.find((player) => player.id === "away-10")!;
    expect(setup.setup).toBe(true);
    expect(canReposition(setup, home, { x: 0, y: 63 })).toBe(true);
    expect(canReposition(setup, home, { x: 50, y: 63 })).toBe(false);
    expect(canReposition(setup, home, { x: 48, y: 32 })).toBe(false);
    expect(canReposition(setup, home, { x: 49, y: 32 })).toBe(true);
    expect(canReposition(setup, bearer, { x: 0, y: 63 })).toBe(false);
    expect(canReposition(setup, bearer, { x: 48, y: 32 })).toBe(false);
    expect(canReposition(setup, away, { x: 99, y: 0 })).toBe(true);
    expect(canReposition(setup, away, { x: 50, y: 32 })).toBe(false);
    expect(
      canReposition(setup, home, {
        x: setup.players[1].x,
        y: setup.players[1].y,
      }),
    ).toBe(false);

    const arranged = applyCommand(setup, {
      type: "reposition",
      playerId: home.id,
      to: { x: 49, y: 32 },
    });
    expect(
      arranged.players.find((player) => player.id === home.id),
    ).toMatchObject({ x: 49, y: 32 });
    expect(
      arranged.players.find((player) => player.id === bearer.id),
    ).toMatchObject({ x: home.x, y: home.y });
    expect(arranged.possession).toBe(home.id);
    expect(arranged.ball).toEqual({ x: 49, y: 32 });
    expect(
      arranged.players.filter(
        (player) => Math.hypot(player.x + 0.5 - 50, player.y + 0.5 - 32) < 10,
      ),
    ).toHaveLength(1);
    expect(
      new Set(arranged.players.map((player) => `${player.x},${player.y}`)).size,
    ).toBe(22);
    expect(arranged.log).toEqual(setup.log);
    expect(() => applyCommand(arranged, { type: "advance" })).toThrow();

    const started = applyCommand(arranged, { type: "start" });
    expect(started).toMatchObject({
      setup: false,
      phase: "action",
      actionStage: "ball-carrier",
    });
    expect(availableActions(started, carrier(started))).toEqual(["pass"]);
    expect(started.kickoffLineups.home).toMatchObject({
      bearerId: home.id,
      positions: {
        [home.id]: { x: 49, y: 32 },
        [bearer.id]: { x: home.x, y: home.y },
      },
    });
  });
  it("refuses to start a kick-off away from the center dot", () => {
    const setup = createMatch(43, true),
      bearer = carrier(setup);
    Object.assign(bearer, { x: 48, y: 32 });
    setup.ball = { x: 48, y: 32 };

    expect(() => applyCommand(setup, { type: "start" })).toThrow("center dot");
  });
  it("reuses each saved kickoff lineup and reopens it for changes", () => {
    let setup = createMatch(1000, true);
    setup = applyCommand(setup, {
      type: "reposition",
      playerId: "home-9",
      to: { x: 49, y: 32 },
    });
    expect(
      canReposition(
        setup,
        setup.players.find((player) => player.id === "home-1")!,
        { x: 10, y: 60 },
      ),
    ).toBe(false);
    const legacyLineups = structuredClone(setup.kickoffLineups);
    legacyLineups.home.positions["home-9"] = { x: 48, y: 32 };
    legacyLineups.home.positions["home-1"] = { x: 10, y: 60 };
    legacyLineups.home.positions["away-1"] = { x: 90, y: 60 };
    const newGame = createMatch(123, true, legacyLineups);
    expect(newGame).toMatchObject({
      turn: 1,
      score: { home: 0, away: 0 },
      possession: "home-9",
      ball: { x: 49, y: 32 },
    });
    expect(
      newGame.players.find((player) => player.id === "home-1"),
    ).toMatchObject({ x: 0, y: 32 });
    expect(
      newGame.players.find((player) => player.id === "away-1"),
    ).toMatchObject({ x: 99, y: 31 });
    const homeStarted = applyCommand(setup, { type: "start" });
    Object.assign(carrier(homeStarted), { x: 95, y: 32 });
    Object.assign(
      homeStarted.players.find((player) => player.id === "away-1")!,
      { x: 90, y: 0 },
    );
    homeStarted.ball = { x: 95, y: 32 };

    const awaySetup = selectShotTarget(
      applyCommand(homeStarted, { type: "shoot" }),
    );
    expect(awaySetup).toMatchObject({ active: "away", setup: true });
    expect(
      awaySetup.players.find((player) => player.id === "away-1"),
    ).toMatchObject({ x: 99, y: 31 });
    const awayStarted = applyCommand(awaySetup, { type: "start" });
    Object.assign(carrier(awayStarted), { x: 4, y: 32 });
    Object.assign(
      awayStarted.players.find((player) => player.id === "home-1")!,
      { x: 10, y: 0 },
    );
    awayStarted.ball = { x: 4, y: 32 };
    awayStarted.seed = 1000;

    const reusedHomeSetup = selectShotTarget(
      applyCommand(awayStarted, { type: "shoot" }),
    );
    expect(reusedHomeSetup).toMatchObject({
      active: "home",
      setup: true,
      possession: "home-9",
      ball: { x: 49, y: 32 },
    });
    expect(
      reusedHomeSetup.players.find((player) => player.id === "home-1"),
    ).toMatchObject({ x: 0, y: 32 });
    expect(
      canReposition(
        reusedHomeSetup,
        reusedHomeSetup.players.find((player) => player.id === "home-1")!,
        { x: 0, y: 31 },
      ),
    ).toBe(true);
  });
  it("uses Manhattan distance, enforces phases, and never mutates input", () => {
    const s = createMatch();
    expect(() =>
      applyCommand(s, {
        type: "move",
        playerId: "home-10",
        to: { x: 53, y: 36 },
      }),
    ).toThrow();
    const m = movement();
    const before = serialize(m);
    const next = applyCommand(m, {
      type: "move",
      playerId: "home-10",
      to: { x: 53, y: 36 },
    });
    expect(carrier(next)).toMatchObject({ x: 53, y: 36 });
    expect(serialize(m)).toBe(before);
    expect(() =>
      applyCommand(m, {
        type: "move",
        playerId: "home-10",
        to: { x: 54, y: 36 },
      }),
    ).toThrow();
  });
  it("skips action stages without an eligible player", () => {
    const ballCarrier = createMatch();
    expect(ballCarrier.actionStage).toBe("ball-carrier");
    expect(availableActions(ballCarrier, carrier(ballCarrier))).toEqual([
      "pass",
    ]);
    const movementPhase = applyCommand(ballCarrier, { type: "advance" });
    expect(movementPhase).toMatchObject({
      phase: "movement",
      movementStage: "attack-opponent",
    });

    const contested = createMatch();
    Object.assign(
      contested.players.find((player) => player.id === "away-10")!,
      { x: 50, y: 31 },
    );
    const defenders = applyCommand(contested, { type: "advance" });
    expect(defenders).toMatchObject({
      phase: "action",
      actionStage: "defenders",
    });
    expect(defenders.players.some((player) => canAct(defenders, player))).toBe(
      true,
    );
    const contestedMovement = applyCommand(defenders, { type: "advance" });
    expect(contestedMovement).toMatchObject({
      phase: "movement",
      movementStage: "attack-opponent",
    });
  });
  it("uses the surrounding eight cells as the blocking reach zone", () => {
    const s = createMatch(),
      attacker = carrier(s),
      defender = s.players.find((player) => player.id === "away-10")!;
    Object.assign(defender, { x: attacker.x + 1, y: attacker.y + 1 });
    expect(withinReach(attacker, defender)).toBe(true);
    expect(blockingDefenders(s, attacker)).toContain(defender);
    defender.x = attacker.x + 2;
    defender.y = attacker.y;
    expect(withinReach(attacker, defender)).toBe(false);
    expect(blockingDefenders(s, attacker)).not.toContain(defender);
  });
  it("requires a successful feint before a blocked pass", () => {
    const s = createMatch(10),
      attacker = carrier(s),
      defender = s.players.find((player) => player.id === "away-10")!,
      target = s.players.find((player) => player.id === "home-7")!;
    Object.assign(defender, { x: 50, y: 31, tackle: 10 });
    attacker.feint = 100;
    attacker.lowPass = 50;
    expect(() =>
      applyCommand(s, { type: "pass", to: { x: target.x, y: target.y } }),
    ).toThrow("must feint");

    const feinted = applyCommand(s, {
      type: "resolve-block",
      kind: "feint",
      playerId: attacker.id,
      defenderId: defender.id,
      to: { x: target.x, y: target.y },
    });
    expect(feinted.pendingPass).toEqual({
      playerId: attacker.id,
      to: { x: target.x, y: target.y },
    });
    expect(feinted.possession).toBe(attacker.id);
    expect(feinted.movementHalved).toEqual([defender.id]);
    expect(feinted.resolvedBlocks).toContain(`${attacker.id}:${defender.id}`);
    expect(
      feinted.players.find((player) => player.id === attacker.id),
    ).toMatchObject({ x: attacker.x, y: attacker.y });
    expect(
      feinted.players.find((player) => player.id === defender.id),
    ).toMatchObject({ x: defender.x, y: defender.y });
    expect(() =>
      applyCommand(feinted, { type: "pass", to: { x: 10, y: 10 } }),
    ).toThrow("prepared by the successful feint");
    const secondDefender = feinted.players.find(
      (player) => player.id === "away-9",
    )!;
    Object.assign(secondDefender, { x: attacker.x + 1, y: attacker.y + 1 });
    expect(() =>
      applyCommand(feinted, {
        type: "pass",
        to: { x: target.x, y: target.y },
      }),
    ).toThrow("must feint");
    feinted.resolvedBlocks.push(`${attacker.id}:${secondDefender.id}`);
    const passed = applyCommand(feinted, {
      type: "pass",
      to: { x: target.x, y: target.y },
    });
    expect(passed.pendingPass).toBeNull();
  });
  it("requires a successful feint before a blocked shot", () => {
    const s = createMatch(10),
      attacker = carrier(s),
      defender = s.players.find((player) => player.id === "away-10")!;
    Object.assign(attacker, { x: 50, y: 32 });
    s.ball = { x: attacker.x, y: attacker.y };
    Object.assign(defender, { x: 51, y: 31, tackle: 10 });
    attacker.feint = 100;
    expect(() => applyCommand(s, { type: "shoot" })).toThrow("must feint");

    const feinted = applyCommand(s, {
      type: "resolve-block",
      kind: "feint",
      action: "shoot",
      playerId: attacker.id,
      defenderId: defender.id,
    });
    expect(feinted.pendingShot).toBe(true);
    expect(feinted.score).toEqual({ home: 0, away: 0 });
    expect(() => applyCommand(feinted, { type: "advance" })).toThrow(
      "Complete the prepared shot",
    );

    const shot = applyCommand(feinted, { type: "shoot" });
    expect(shot.pendingShot).toBe(false);
    expect(shot.log.some((event) => event.resolution?.label === "Shot")).toBe(
      true,
    );
  });
  it("materializes an automatic pass after the final sequential block", () => {
    const s = createMatch(1),
      attacker = carrier(s),
      first = s.players.find((player) => player.id === "away-9")!,
      second = s.players.find((player) => player.id === "away-10")!,
      destination = { x: attacker.x + 2, y: attacker.y + 1 };
    attacker.feint = 100;
    attacker.lowPass = 100;
    first.tackle = 0;
    second.tackle = 0;
    Object.assign(first, { x: attacker.x + 1, y: attacker.y });
    Object.assign(second, { x: attacker.x + 1, y: attacker.y + 1 });

    const afterFirst = applyCommand(s, {
        type: "resolve-block",
        kind: "feint",
        playerId: attacker.id,
        defenderId: first.id,
        to: destination,
      }),
      afterSecond = applyCommand(afterFirst, {
        type: "resolve-block",
        kind: "feint",
        playerId: attacker.id,
        defenderId: second.id,
        to: destination,
      });

    expect(afterFirst.pendingPass).toEqual({
      playerId: attacker.id,
      to: destination,
    });
    expect(afterSecond.pendingPass).toBeNull();
    expect(afterSecond.ball).toEqual(destination);
    expect(
      afterSecond.log.findLast((event) => event.resolution)?.resolution,
    ).toMatchObject({
      label: "Low-pass",
      outcome: "Automatic",
    });
  });
  it("does not allow Next to discard a prepared pass", () => {
    const s = createMatch();
    s.pendingPass = { playerId: s.possession!, to: { x: 52, y: 32 } };
    expect(() => applyCommand(s, { type: "advance" })).toThrow(
      "Complete the prepared pass",
    );
  });
  it("awards a failed blocked pass contest to the defender", () => {
    const s = createMatch(1),
      attacker = carrier(s),
      defender = s.players.find((player) => player.id === "away-10")!;
    Object.assign(defender, { x: 50, y: 31, tackle: 100 });
    attacker.feint = 10;
    const next = applyCommand(s, {
      type: "resolve-block",
      kind: "feint",
      playerId: attacker.id,
      defenderId: defender.id,
      to: { x: 30, y: 30 },
    });
    expect(next.active).toBe(defender.team);
    expect(next.possession).toBe(defender.id);
    expect(next.pendingPass).toBeNull();
    expect(next.movementHalved).toEqual([attacker.id]);
  });
  it("blocks only forward attacker movement and selects Dribble or Slip", () => {
    const dribble = movement(),
      carrierPlayer = carrier(dribble),
      defender = dribble.players.find((player) => player.id === "away-10")!;
    Object.assign(defender, { x: 50, y: 31 });
    expect(movementBlocker(dribble, carrierPlayer, { x: 52, y: 32 })?.id).toBe(
      defender.id,
    );
    expect(() =>
      applyCommand(dribble, {
        type: "move",
        playerId: carrierPlayer.id,
        to: { x: 52, y: 32 },
      }),
    ).toThrow("must dribble");
    expect(
      applyCommand(dribble, {
        type: "move",
        playerId: carrierPlayer.id,
        to: { x: 48, y: 32 },
      }).players.find((player) => player.id === carrierPlayer.id),
    ).toMatchObject({ x: 48, y: 32 });

    const slip = movement(),
      runner = slip.players.find((player) => player.id === "home-9")!,
      marker = slip.players.find((player) => player.id === "away-9")!;
    Object.assign(runner, { x: 40, y: 20 });
    Object.assign(marker, { x: 41, y: 21 });
    expect(movementBlocker(slip, runner, { x: 44, y: 20 })?.id).toBe(marker.id);
    expect(() =>
      applyCommand(slip, {
        type: "move",
        playerId: runner.id,
        to: { x: 44, y: 20 },
      }),
    ).toThrow("must slip");
    expect(
      applyCommand(slip, {
        type: "move",
        playerId: runner.id,
        to: { x: 40, y: 24 },
      }).players.find((player) => player.id === runner.id),
    ).toMatchObject({ x: 40, y: 24 });
  });
  it("resolves Dribble and Slip blocks without blocking defenders", () => {
    const dribble = movement(),
      attacker = carrier(dribble),
      defender = dribble.players.find((player) => player.id === "away-10")!,
      attackerStart = { x: attacker.x, y: attacker.y },
      defenderStart = { x: 50, y: 31 };
    Object.assign(defender, { ...defenderStart, tackle: 10 });
    attacker.dribble = 100;
    const dribbled = applyCommand(dribble, {
      type: "resolve-block",
      kind: "dribble",
      playerId: attacker.id,
      defenderId: defender.id,
      to: { x: 52, y: 32 },
    });
    expect(dribbled.possession).toBe(attacker.id);
    expect(dribbled.players.find((p) => p.id === attacker.id)).toMatchObject({
      ...attackerStart,
    });
    expect(dribbled.players.find((p) => p.id === defender.id)).toMatchObject(
      defenderStart,
    );
    expect(dribbled.movementHalved).toEqual([defender.id]);

    const slip = movement(),
      runner = slip.players.find((player) => player.id === "home-9")!,
      marker = slip.players.find((player) => player.id === "away-9")!,
      runnerStart = { x: 40, y: 20 },
      markerStart = { x: 41, y: 21 };
    Object.assign(runner, { ...runnerStart, slip: 100 });
    Object.assign(marker, { ...markerStart, mark: 10 });
    const slipped = applyCommand(slip, {
      type: "resolve-block",
      kind: "slip",
      playerId: runner.id,
      defenderId: marker.id,
      to: { x: 44, y: 20 },
    });
    expect(slipped.possession).toBe("home-10");
    expect(slipped.movementHalved).toEqual([marker.id]);
    expect(slipped.players.find((p) => p.id === runner.id)).toMatchObject(
      runnerStart,
    );
    expect(slipped.players.find((p) => p.id === marker.id)).toMatchObject(
      markerStart,
    );

    const failedSlip = movement(),
      stoppedRunner = failedSlip.players.find(
        (player) => player.id === "home-9",
      )!,
      winningMarker = failedSlip.players.find(
        (player) => player.id === "away-9",
      )!;
    Object.assign(stoppedRunner, { x: 40, y: 20, slip: 10 });
    Object.assign(winningMarker, { x: 41, y: 21, mark: 100 });
    const stopped = applyCommand(failedSlip, {
      type: "resolve-block",
      kind: "slip",
      playerId: stoppedRunner.id,
      defenderId: winningMarker.id,
      to: { x: 44, y: 20 },
    });
    expect(remainingMovement(stopped, stoppedRunner)).toBe(0);
    expect(stopped.movementHalved).not.toContain(stoppedRunner.id);
    expect(
      stopped.players.find((p) => p.id === stoppedRunner.id),
    ).toMatchObject({
      x: stoppedRunner.x,
      y: stoppedRunner.y,
    });
    expect(
      stopped.players.find((p) => p.id === winningMarker.id),
    ).toMatchObject({
      x: winningMarker.x,
      y: winningMarker.y,
    });
    expect(stopped.log.at(-1)?.text).toContain(
      `${stoppedRunner.name} has no movement points left.`,
    );

    const defense = applyCommand(movement(), { type: "advance" }),
      activeDefender = defense.players.find(
        (player) => player.id === "away-9",
      )!;
    expect(movementBlocker(defense, activeDefender, { x: 54, y: 12 })).toBe(
      undefined,
    );
  });
  it("supports movement in steps and rejects exhausted, occupied, opposing, fractional and off-pitch moves", () => {
    const s = movement();
    Object.assign(
      s.players.find((player) => player.id === "away-10")!,
      { x: 50, y: 31 },
    );
    const next = applyCommand(s, {
      type: "move",
      playerId: "home-10",
      to: { x: 48, y: 32 },
    });
    const continued = applyCommand(next, {
        type: "move",
        playerId: "home-10",
        to: { x: 47, y: 32 },
      }),
      player = continued.players.find(
        (candidate) => candidate.id === "home-10",
      )!;
    expect(remainingMovement(continued, player)).toBe(6);
    const exhausted = applyCommand(continued, {
      type: "move",
      playerId: "home-10",
      to: { x: 41, y: 32 },
    });
    expect(
      remainingMovement(
        exhausted,
        exhausted.players.find((candidate) => candidate.id === "home-10")!,
      ),
    ).toBe(0);
    expect(() =>
      applyCommand(exhausted, {
        type: "move",
        playerId: "home-10",
        to: { x: 40, y: 32 },
      }),
    ).toThrow();
    for (const to of [
      { x: 50, y: 31 },
      { x: -1, y: 32 },
      { x: 49.5, y: 32 },
    ])
      expect(() =>
        applyCommand(s, { type: "move", playerId: "home-10", to }),
      ).toThrow();
    expect(() =>
      applyCommand(s, {
        type: "move",
        playerId: "away-10",
        to: { x: 51, y: 31 },
      }),
    ).toThrow();
  });
  it("reproduces dice and results when replaying identical commands", () => {
    const s = createMatch(123);
    const target = s.players.find((p) => p.id === "home-7")!;
    const command = { type: "pass" as const, to: { x: target.x, y: target.y } };
    expect(applyCommand(s, command)).toEqual(applyCommand(s, command));
    expect(s.seed).toBe(123);
  });
  it("previews one-on-one dice without consuming the random state", () => {
    const s = createMatch(1000);
    expect([previewD100(s), previewD100(s, 1)]).toEqual([62, 98]);
    expect(previewD6(s, 1)).toBe(6);
    expect(s.seed).toBe(1000);
  });
  it("locks a successful pass receiver for movement", () => {
    const s = createMatch(1000);
    Object.assign(
      s.players.find((p) => p.id === "away-10")!,
      {
        x: 60,
        y: 0,
      },
    );
    s.players.find((p) => p.id === "home-7")!.x = 48;
    s.players.find((p) => p.id === "home-7")!.y = 32;
    const next = applyCommand(s, { type: "pass", to: { x: 48, y: 32 } });
    expect(next.possession).toBe("home-7");
    expect(next.phase).toBe("action");
    expect(next.oneTouch?.playerId).toBe("home-7");
    const movement = applyCommand(next, { type: "advance" });
    expect(() =>
      applyCommand(movement, {
        type: "move",
        playerId: "home-7",
        to: { x: 47, y: 32 },
      }),
    ).toThrow();
  });
  it("places a failed contested pass at its D8 error position as a loose ball", () => {
    const s = createMatch(42);
    Object.assign(
      s.players.find((player) => player.id === "away-10")!,
      { x: 47, y: 32 },
    );
    const next = applyCommand(s, { type: "pass", to: { x: 10, y: 32 } });
    expect(next.ball).toEqual({ x: 10, y: 40 });
    expect(next.possession).toBeNull();
    expect(next.active).toBe("home");
    expect(next).toMatchObject({
      phase: "movement",
      movementStage: "attack-opponent",
    });
    expect(
      next.log.find((event) => event.resolution)?.resolution,
    ).toMatchObject({
      label: "High-pass",
      difficulty: 39,
      skill: 90,
      dice: 25,
      score: 23,
      outcome: "Failed",
      d8: 5,
      contest: {
        winnerId: "home-10",
      },
    });
  });
  it("awards a throw-in when a failed pass crosses the touchline", () => {
    const s = createMatch(2),
      passer = carrier(s);
    Object.assign(passer, { x: 40, y: 1 });
    s.ball = { x: 40, y: 1 };
    s.players
      .filter((player) => player.id !== passer.id)
      .forEach((player, index) =>
        Object.assign(player, {
          x: index < 10 ? 5 + index : 90 - (index - 10),
          y: 50 + (index % 10),
        }),
      );

    const out = applyCommand(s, { type: "pass", to: { x: 80, y: 0 } }),
      taker = out.players.find((player) => player.id === "away-11")!;

    expect(out.setPieceRestart).toMatchObject({
      kind: "throw-in",
      team: "away",
      position: { x: 80, y: 0 },
      takerId: null,
    });
    expect(out.active).toBe("away");
    expect(out.setup).toBe(true);
    expect(out.possession).toBeNull();
    expect(availableActions(out, taker)).toEqual([]);
    expect(() => applyCommand(out, { type: "start" })).toThrow(
      "must place a footballer on the ball",
    );
    expect(deserialize(serialize(out))).toEqual(out);
    const defender = out.players.find((player) => player.id === "home-2")!;
    expect(canReposition(out, taker, { x: taker.x, y: taker.y })).toBe(true);
    expect(canReposition(out, defender, { x: defender.x, y: defender.y })).toBe(
      false,
    );

    const positioned = applyCommand(out, {
        type: "reposition",
        playerId: taker.id,
        to: { x: 80, y: 0 },
      }),
      taken = applyCommand(positioned, {
        type: "take-restart",
        playerId: taker.id,
      }),
      defenders = applyCommand(taken, { type: "start" }),
      started = applyCommand(defenders, { type: "start" });
    expect(positioned.possession).toBeNull();
    expect(positioned.setPieceRestart?.takerId).toBeNull();
    expect(taken.possession).toBe(taker.id);
    expect(taken.setPieceRestart?.takerId).toBe(taker.id);
    expect(defenders.setPieceRestart?.setupStage).toBe("defenders");
    expect(canReposition(defenders, taker, { x: taker.x, y: taker.y })).toBe(
      false,
    );
    expect(
      canReposition(defenders, defender, { x: defender.x, y: defender.y }),
    ).toBe(true);
    expect(started.setup).toBe(false);
    expect(availableActions(started, taker)).toEqual(["throw-in"]);
    expect(() =>
      applyCommand(started, { type: "pass", to: { x: 80, y: 10 } }),
    ).toThrow("Throw-in action");
    expect(() =>
      applyCommand(started, { type: "throw-in", to: { x: 30, y: 0 } }),
    ).not.toThrow();
    expect(() =>
      applyCommand(started, { type: "throw-in", to: { x: 29, y: 0 } }),
    ).toThrow("difficulty above 100");

    const thrown = applyCommand(started, {
      type: "throw-in",
      to: { x: 80, y: 10 },
    });
    expect(thrown.setPieceRestart).toBeNull();
    expect(
      thrown.log.findLast((event) =>
        event.resolution?.label.startsWith("Throw-in"),
      )?.resolution,
    ).toMatchObject({ difficulty: 20, skill: taker.throwIn });
  });
  it("rejects passes whose difficulty exceeds 100", () => {
    const s = createMatch(37),
      passer = carrier(s);
    Object.assign(passer, { x: 0, y: 0 });
    s.ball = { x: 0, y: 0 };

    expect(() =>
      applyCommand(s, { type: "pass", to: { x: 99, y: 1 } }),
    ).not.toThrow();
    expect(() =>
      applyCommand(s, { type: "pass", to: { x: 99, y: 2 } }),
    ).toThrow("difficulty above 100");
  });
  it("resolves low passes automatically within the skill distance", () => {
    const s = createMatch(123);
    Object.assign(
      s.players.find((p) => p.id === "away-10")!,
      {
        x: 60,
        y: 0,
      },
    );
    const target = s.players.find((p) => p.id === "home-7")!;
    const next = applyCommand(s, {
      type: "pass",
      to: { x: target.x, y: target.y },
    });
    expect(next.seed).toBe(s.seed);
    expect(next.possession).toBe(target.id);
    expect(
      next.log.find((event) => event.resolution)?.resolution,
    ).toMatchObject({
      label: "Low-pass",
      difficulty: 17,
      skill: 90,
      outcome: "Automatic",
    });
    expect(
      next.log.find((event) => event.resolution)?.resolution?.dice,
    ).toBeUndefined();
  });
  it("rolls low passes beyond their automatic distance and all high passes", () => {
    const low = createMatch(1000);
    Object.assign(
      low.players.find((p) => p.id === "away-10")!,
      {
        x: 60,
        y: 0,
      },
    );
    const lowResult = applyCommand(low, {
      type: "pass",
      to: { x: 19, y: 32 },
    });
    expect(
      lowResult.log.find((event) => event.resolution)?.resolution,
    ).toMatchObject({
      label: "Low-pass",
      difficulty: 30,
      skill: 90,
      dice: 62,
      score: 56,
      outcome: "Success",
    });

    const high = createMatch(1000);
    Object.assign(
      high.players.find((p) => p.id === "away-10")!,
      {
        x: 60,
        y: 0,
      },
    );
    const highResult = applyCommand(high, {
      type: "pass",
      to: { x: 3, y: 32 },
    });
    expect(
      highResult.log.find((event) => event.resolution)?.resolution,
    ).toMatchObject({
      label: "High-pass",
      difficulty: 46,
      skill: 90,
      dice: 62,
      score: 56,
      outcome: "Success",
    });
    expect(highResult.moved).toContain("home-10");
    expect(lowResult.moved).not.toContain("home-10");
  });
  it("spends the high-pass taker's movement without a one-touch action", () => {
    const s = createMatch(42);
    Object.assign(
      s.players.find((player) => player.id === "away-10")!,
      { x: 60, y: 0 },
    );
    const next = applyCommand(s, { type: "pass", to: { x: 10, y: 32 } });
    expect(next.moved).toContain("home-10");
    expect(next.oneTouch).toBeNull();
    expect(next.phase).toBe("movement");
    expect(
      canMove(
        next,
        next.players.find((player) => player.id === "home-10")!,
        { x: 48, y: 32 },
      ),
    ).toBe(false);
  });
  it("uses the pass trajectory and pass type to find eligible interceptors", () => {
    const s = createMatch(),
      passer = carrier(s),
      defender = s.players.find((p) => p.id === "away-2")!;
    Object.assign(
      s.players.find((p) => p.id === "away-10")!,
      {
        x: 60,
        y: 0,
      },
    );
    Object.assign(defender, { x: 40, y: 32 });
    expect(passInterceptors(s, passer, { x: 32, y: 32 }, "low-pass")).toContain(
      defender,
    );
    expect(
      passInterceptors(s, passer, { x: 3, y: 32 }, "high-pass"),
    ).not.toContain(defender);
    Object.assign(defender, { x: 48, y: 31 });
    expect(passInterceptors(s, passer, { x: 3, y: 32 }, "high-pass")).toContain(
      defender,
    );
  });
  it("rolls an eligible defender against the pass score and awards possession", () => {
    const s = createMatch(1000),
      defender = s.players.find((p) => p.id === "away-2")!;
    s.players
      .filter((p) => p.team === "away")
      .forEach((p, index) => Object.assign(p, { x: 80 + index, y: index }));
    Object.assign(defender, { x: 40, y: 32 });
    const next = applyCommand(s, { type: "pass", to: { x: 32, y: 32 } });
    const event = next.log.find((entry) => entry.resolution);
    expect(next.possession).toBe(defender.id);
    expect(next.ball).toEqual({ x: defender.x, y: defender.y });
    expect(next.active).toBe("away");
    expect(next.turn).toBe(2);
    expect(next.phase).toBe("action");
    expect(next.movementStage).toBe("attack-opponent");
    expect(next.moved).toEqual([]);
    expect(event?.resolution).toMatchObject({
      label: "Low-pass",
      difficulty: 17,
      dice: 62,
      score: 56,
      outcome: "Intercepted",
      contest: {
        actor: {
          playerId: "home-10",
          skillLabel: "Low-pass",
          skill: 90,
          dice: 62,
          score: 56,
        },
        opponent: {
          playerId: "away-2",
          skillLabel: "Intercept",
          skill: 80,
          dice: 98,
          score: 78,
        },
        winnerId: "away-2",
      },
    });
    expect(event?.text).toContain(
      "intercepts with 78 (D100 98 × Intercept 80)",
    );
    expect(event?.text).toContain("starts a new turn for Real Madrid");
  });
  it("awards an interception before a short pass can scatter loose", () => {
    const s = createMatch(1),
      defender = s.players.find((p) => p.id === "away-2")!;
    s.players
      .filter((p) => p.team === "away")
      .forEach((p, index) => Object.assign(p, { x: 80 + index, y: index }));
    Object.assign(defender, { x: 35, y: 32 });

    const next = applyCommand(s, { type: "pass", to: { x: 20, y: 32 } });

    expect(
      next.log.find((event) => event.resolution)?.resolution,
    ).toMatchObject({
      difficulty: 29,
      score: 21,
      outcome: "Intercepted",
      contest: {
        opponent: { playerId: defender.id, dice: 36, score: 29 },
        winnerId: defender.id,
      },
    });
    expect(next.possession).toBe(defender.id);
    expect(next.ball).toEqual({ x: defender.x, y: defender.y });
    expect(next.active).toBe("away");
    expect(next.turn).toBe(2);
    expect(next.phase).toBe("action");
  });
  it("rerolls a tied pass and interception contest", () => {
    const s = createMatch(1),
      defender = s.players.find((p) => p.id === "away-2")!;
    s.players
      .filter((p) => p.team === "away")
      .forEach((p, index) => Object.assign(p, { x: 80 + index, y: index }));
    Object.assign(defender, { x: 40, y: 32, intercept: 58 });
    const next = applyCommand(s, { type: "pass", to: { x: 32, y: 32 } });
    const event = next.log.find((entry) => entry.resolution);
    expect(Math.round((36 * defender.intercept) / 100)).toBe(21);
    expect(event?.resolution).toMatchObject({ score: 45, outcome: "Success" });
    expect(event?.resolution?.contest).toMatchObject({
      winnerId: "home-10",
      rerolls: 1,
    });
    expect(next.possession).toBe("home-7");
  });
  it("adds the goalkeeper's +20 Intercept bonus inside their penalty area", () => {
    const s = createMatch(1),
      passer = carrier(s),
      goalkeeper = s.players.find((p) => p.id === "away-1")!;
    Object.assign(passer, { x: 83, y: 32 });
    s.ball = { x: 83, y: 32 };
    s.players
      .filter((p) => p.team === "away")
      .forEach((p, index) => Object.assign(p, { x: 70 + index, y: index }));
    Object.assign(goalkeeper, { x: 85, y: 32 });
    const next = applyCommand(s, { type: "pass", to: { x: 99, y: 32 } });
    const event = next.log.find((entry) => entry.resolution);
    expect(next.possession).toBe(goalkeeper.id);
    expect(event?.text).toContain(
      "intercepts with 25 (D100 36 × Intercept 70)",
    );
  });
  it("targets passes by position and leaves a completed pass loose on an empty cell", () => {
    const s = createMatch(10);
    const next = applyCommand(s, { type: "pass", to: { x: 50, y: 32 } });
    expect(next.ball).toEqual({ x: 50, y: 32 });
    expect(next.possession).toBeNull();
    const recovered = applyCommand(next, {
      type: "move",
      playerId: "home-10",
      to: { x: 50, y: 32 },
    });
    expect(recovered.possession).toBe("home-10");
    expect(() =>
      applyCommand(s, { type: "pass", to: { x: 49, y: 32 } }),
    ).toThrow();
    expect(() =>
      applyCommand(s, { type: "pass", to: { x: 100, y: 32 } }),
    ).toThrow();
    s.active = "away";
    expect(() => applyCommand(s, { type: "shoot" })).toThrow();
  });
  it("resolves the pass before a receiver and nearby defender challenge for control", () => {
    const s = createMatch(1000),
      receiver = s.players.find((player) => player.id === "home-7")!,
      defender = s.players.find((player) => player.id === "away-2")!;
    s.players
      .filter((player) => player.team === "away")
      .forEach((player, index) =>
        Object.assign(player, { x: 80 + index, y: index }),
      );
    Object.assign(receiver, { x: 20, y: 32, strength: 100 });
    Object.assign(defender, { x: 20, y: 31, strength: 10 });

    const passed = applyCommand(s, { type: "pass", to: receiver });
    expect(
      passed.log.find((event) => event.resolution)?.resolution,
    ).toMatchObject({
      label: "Low-pass",
      outcome: "Success",
    });
    expect(passed.possession).toBeNull();
    expect(passed.ball).toEqual({ x: 20, y: 32 });
    expect(passed.challengedBall).toEqual({
      receiverId: receiver.id,
      defenderId: defender.id,
      sourcePass: "low-pass",
      allowOneTouch: true,
      resume: "action-attackers",
    });
    expect(deserialize(serialize(passed))).toEqual(passed);
    expect(() => applyCommand(passed, { type: "advance" })).toThrow(
      "Resolve the challenged ball",
    );

    const resolved = applyCommand(passed, {
      type: "resolve-challenged-ball",
      receiverId: receiver.id,
      defenderId: defender.id,
    });
    expect(resolved.challengedBall).toBeNull();
    expect(resolved.possession).toBe(receiver.id);
    expect(resolved.ball).toEqual({ x: 20, y: 32 });
    expect(
      resolved.players.find((player) => player.id === receiver.id),
    ).toMatchObject({ x: 20, y: 32 });
    expect(
      resolved.players.find((player) => player.id === defender.id),
    ).toMatchObject({ x: 20, y: 31 });
    expect(resolved.movementHalved).toContain(defender.id);
    expect(resolved.actionSpent).toContain(defender.id);
    expect(resolved.oneTouch?.playerId).toBe(receiver.id);
    expect(resolved.log.at(-1)?.resolution).toMatchObject({
      label: "Challenged ball",
      contest: {
        actor: { playerId: receiver.id, skillLabel: "Strength", skill: 100 },
        opponent: {
          playerId: defender.id,
          skillLabel: "Strength",
          skill: 10,
        },
        winnerId: receiver.id,
      },
    });

    const defenderWins = structuredClone(passed);
    defenderWins.players.find((player) => player.id === receiver.id)!.strength =
      10;
    defenderWins.players.find((player) => player.id === defender.id)!.strength =
      100;
    const taken = applyCommand(defenderWins, {
      type: "resolve-challenged-ball",
      receiverId: receiver.id,
      defenderId: defender.id,
    });
    expect(taken.possession).toBe(defender.id);
    expect(taken.ball).toEqual({ x: 20, y: 31 });
    expect(
      taken.players.find((player) => player.id === receiver.id),
    ).toMatchObject({ x: 20, y: 32 });
    expect(
      taken.players.find((player) => player.id === defender.id),
    ).toMatchObject({ x: 20, y: 31 });
    expect(taken.active).toBe("away");
    expect(taken.turn).toBe(2);
    expect(taken.movementHalved).toContain(receiver.id);
    expect(taken.actionSpent).toContain(receiver.id);
    expect(taken.oneTouch?.playerId).toBe(defender.id);

    const failedPass = createMatch(42),
      missedReceiver = failedPass.players.find(
        (player) => player.id === "home-7",
      )!,
      nearbyDefender = failedPass.players.find(
        (player) => player.id === "away-2",
      )!;
    failedPass.players
      .filter((player) => player.team === "away")
      .forEach((player, index) =>
        Object.assign(player, { x: 80 + index, y: index }),
      );
    Object.assign(missedReceiver, { x: 20, y: 32 });
    Object.assign(nearbyDefender, { x: 20, y: 31 });
    expect(
      applyCommand(failedPass, { type: "pass", to: missedReceiver })
        .challengedBall,
    ).toBeNull();
  });
  it("uses goalkeeper Catch +20 for a challenged ball in their penalty area", () => {
    const s = createMatch(),
      goalkeeper = s.players.find((player) => player.id === "home-1")!;
    expect(challengedBallSkill(goalkeeper)).toBe(goalkeeper.catch + 20);
    goalkeeper.x = 30;
    expect(challengedBallSkill(goalkeeper)).toBe(goalkeeper.strength);
  });
  it("offers the section 2.7 actions after a low-pass reception", () => {
    const s = createMatch(123),
      receiver = s.players.find((p) => p.id === "home-7")!;
    Object.assign(receiver, { x: 48, y: 32 });
    Object.assign(
      s.players.find((p) => p.id === "away-10")!,
      { x: 60, y: 0 },
    );

    const received = applyCommand(s, { type: "pass", to: receiver });

    expect(received.possession).toBe(receiver.id);
    expect(received.phase).toBe("action");
    expect(received.moved).toContain(receiver.id);
    expect(received.oneTouch).toEqual({
      playerId: receiver.id,
      sourcePass: "low-pass",
      actions: ["low-pass", "finish"],
      resume: "action-attackers",
    });
    expect(deserialize(serialize(received))).toEqual(received);
    Object.assign(
      received.players.find((player) => player.id === "away-10")!,
      { x: 49, y: 32 },
    );
    const declined = applyCommand(received, { type: "advance" });
    expect(declined.oneTouch).toBeNull();
    expect(declined).toMatchObject({
      phase: "movement",
      movementStage: "attack-opponent",
    });
    expect(declined.moved).toContain(receiver.id);
  });
  it("allows one one-touch low-pass and does not concatenate another", () => {
    const s = createMatch(123),
      receiver = s.players.find((p) => p.id === "home-7")!,
      secondReceiver = s.players.find((p) => p.id === "home-8")!;
    Object.assign(receiver, { x: 48, y: 32 });
    Object.assign(secondReceiver, { x: 47, y: 32 });
    Object.assign(
      s.players.find((p) => p.id === "away-10")!,
      { x: 60, y: 0 },
    );
    const received = applyCommand(s, { type: "pass", to: receiver });

    expect(() =>
      applyCommand(received, {
        type: "one-touch-pass",
        kind: "low-pass",
        to: { x: 0, y: 32 },
      }),
    ).toThrow("cannot exceed 30 yards");

    const touched = applyCommand(received, {
      type: "one-touch-pass",
      kind: "low-pass",
      to: secondReceiver,
    });

    expect(touched.possession).toBe(secondReceiver.id);
    expect(touched).toMatchObject({
      phase: "movement",
      movementStage: "attack-opponent",
    });
    expect(touched.oneTouch).toBeNull();
    expect(touched.moved).toEqual(
      expect.arrayContaining([receiver.id, secondReceiver.id]),
    );
    expect(() =>
      applyCommand(touched, {
        type: "one-touch-pass",
        kind: "low-pass",
        to: { x: 46, y: 32 },
      }),
    ).toThrow();
  });
  it("offers high-pass one-touch techniques and applies their shot modifiers", () => {
    const s = createMatch(1000),
      receiver = s.players.find((p) => p.id === "home-7")!;
    Object.assign(receiver, { x: 80, y: 32 });
    s.players
      .filter((player) => player.team === "away")
      .forEach((player, index) => Object.assign(player, { x: 90, y: index }));

    const received = applyCommand(s, { type: "pass", to: receiver });

    expect(received.oneTouch?.actions).toEqual([
      "offensive-header",
      "defensive-header",
      "scissors-kick",
    ]);
    expect(received.moved).toContain("home-10");
    expect(received.moved).toContain(receiver.id);
    expect(() =>
      applyCommand(received, {
        type: "one-touch-shot",
        kind: "finish",
      }),
    ).toThrow();
    const header = applyCommand(received, {
      type: "one-touch-shot",
      kind: "offensive-header",
    });
    expect(
      header.log.find((event) => event.resolution?.label === "Offensive-header")
        ?.resolution,
    ).toMatchObject({
      difficulty: Math.min(200, shotDifficulty(received) * 2),
      skill: receiver.offensiveHeader,
    });
    expect(header.oneTouch).toBeNull();

    const declined = applyCommand(received, { type: "advance" });
    expect(declined).toMatchObject({
      phase: "movement",
      movementStage: "attack-opponent",
    });
    expect(
      canMove(
        declined,
        declined.players.find((player) => player.id === receiver.id)!,
        { x: 9, y: 32 },
      ),
    ).toBe(false);
  });
  it("lets a defender redirect a received high pass before their new turn", () => {
    const s = createMatch(1000),
      defender = s.players.find((p) => p.id === "away-2")!,
      teammate = s.players.find((p) => p.id === "away-3")!;
    Object.assign(defender, { x: 10, y: 32 });
    Object.assign(teammate, { x: 11, y: 32 });
    Object.assign(
      s.players.find((p) => p.id === "away-10")!,
      { x: 60, y: 0 },
    );

    const received = applyCommand(s, { type: "pass", to: defender });
    expect(received.turn).toBe(1);
    expect(received.active).toBe("away");
    expect(received.oneTouch).toMatchObject({
      playerId: defender.id,
      actions: ["defensive-header"],
      resume: "new-turn",
    });

    const redirected = applyCommand(received, {
      type: "one-touch-pass",
      kind: "defensive-header",
      to: teammate,
    });
    expect(redirected.possession).toBe(teammate.id);
    expect(redirected.turn).toBe(2);
    expect(redirected.active).toBe("away");
    expect(redirected.phase).toBe("action");
    expect(redirected.oneTouch).toBeNull();
  });
  it("keeps the attacking and defending teams when movement ends with a loose ball", () => {
    let s = applyCommand(createMatch(), {
      type: "pass",
      to: { x: 50, y: 32 },
    });
    expect(s.possession).toBeNull();
    expect(s.active).toBe("home");
    for (let stage = 0; stage < 3; stage++) {
      s = applyCommand(s, { type: "advance" });
      expect(s.active).toBe("home");
    }
    expect(s.phase).toBe("movement");
    expect(s.movementStage).toBe("attack-opponent");
    expect(s.turn).toBe(2);
    expect(s.possession).toBeNull();
  });
  it("requires tackles to be close to the ball", () => {
    const s = createMatch(10);
    s.actionStage = "defenders";
    const attacker = carrier(s),
      defender = s.players.find((player) => player.id === "away-10")!,
      attackerStart = { x: attacker.x, y: attacker.y },
      defenderStart = { x: 50, y: 31 };
    Object.assign(defender, defenderStart);
    expect(() =>
      applyCommand(s, { type: "tackle", playerId: "away-1" }),
    ).toThrow();
    const next = applyCommand(s, { type: "tackle", playerId: "away-10" });
    expect(next.phase).toBe("movement");
    expect(
      next.players.find((player) => player.id === attacker.id),
    ).toMatchObject(attackerStart);
    expect(
      next.players.find((player) => player.id === defender.id),
    ).toMatchObject(defenderStart);
    expect(next.ball).toEqual(attackerStart);
    expect(next.movementHalved).toEqual([defender.id]);
    expect(next.resolvedBlocks).toContain(`${attacker.id}:${defender.id}`);
    expect(
      movementBlocker(
        next,
        next.players.find((player) => player.id === attacker.id)!,
        { x: defenderStart.x + 1, y: defenderStart.y },
      ),
    ).toBeUndefined();
    expect(
      movementAllowance(
        next,
        next.players.find((player) => player.id === defender.id)!,
      ),
    ).toBe(Math.round(defender.velocity / 20));
    expect(next.log.at(-1)?.resolution?.contest).toMatchObject({
      actor: { playerId: "home-10", skillLabel: "Feint" },
      opponent: { playerId: "away-10", skillLabel: "Tackle" },
    });
  });
  it("carries a halved allowance into the new turn when the tackle wins", () => {
    const s = createMatch(1),
      attacker = carrier(s),
      defender = s.players.find((player) => player.id === "away-10")!,
      attackerStart = { x: attacker.x, y: attacker.y },
      defenderStart = { x: 50, y: 31 };
    s.actionStage = "defenders";
    attacker.feint = 10;
    defender.tackle = 100;
    Object.assign(defender, defenderStart);

    const next = applyCommand(s, {
      type: "tackle",
      playerId: defender.id,
    });

    expect(next.active).toBe("away");
    expect(next.possession).toBe(defender.id);
    expect(next.ball).toEqual(defenderStart);
    expect(
      next.players.find((player) => player.id === attacker.id),
    ).toMatchObject(attackerStart);
    expect(
      next.players.find((player) => player.id === defender.id),
    ).toMatchObject(defenderStart);
    expect(next.movementHalved).toEqual([attacker.id]);
    expect(
      movementAllowance(
        next,
        next.players.find((player) => player.id === attacker.id)!,
      ),
    ).toBe(Math.round(attacker.velocity / 20));
  });
  it("stops a one-on-one when an involuntary foul is confirmed", () => {
    const s = createMatch(2000),
      attacker = carrier(s),
      defender = s.players.find((player) => player.id === "away-10")!;
    s.actionStage = "defenders";
    Object.assign(attacker, { x: 50, y: 32 });
    s.ball = { x: attacker.x, y: attacker.y };
    Object.assign(defender, { x: 49, y: 32 });

    const whistled = applyCommand(s, {
      type: "tackle",
      playerId: defender.id,
    });

    expect(whistled.pendingFoul).toMatchObject({
      stage: "card-check",
      offenderId: attacker.id,
      victimId: defender.id,
      foul: { d100: 1, foulD6: 5, card: true },
    });
    expect(deserialize(serialize(whistled))).toEqual(whistled);
    expect(whistled.log.at(-1)?.text).toContain("FOUL!");
    expect(() => applyCommand(whistled, { type: "advance" })).toThrow(
      "Resolve the referee’s foul decision",
    );
    const cardPending = applyCommand(whistled, { type: "resolve-foul" });
    expect(cardPending.pendingFoul?.stage).toBe("card-color");
    const next = applyCommand(cardPending, { type: "resolve-foul" });

    expect(next.active).toBe("away");
    expect(next.turn).toBe(2);
    expect(next.possession).toBeNull();
    expect(next.ball).toEqual({ x: defender.x, y: defender.y });
    expect(next.foulRestart).toMatchObject({
      kind: "free-kick",
      team: "away",
      fouledPlayerId: defender.id,
      offenderId: attacker.id,
      takerId: null,
      setupStage: "attackers",
    });
    expect(next.setup).toBe(true);
    const awayOutfielder = next.players.find(
        (player) => player.team === "away" && player.role !== "Goalkeeper",
      )!,
      awayGoalkeeper = next.players.find(
        (player) => player.team === "away" && player.role === "Goalkeeper",
      )!,
      homeOutfielder = next.players.find(
        (player) => player.team === "home" && player.role !== "Goalkeeper",
      )!;
    expect(canReposition(next, awayOutfielder, awayOutfielder)).toBe(true);
    expect(canReposition(next, awayOutfielder, { x: 25, y: 0 })).toBe(true);
    expect(canReposition(next, awayGoalkeeper, { x: 25, y: 1 })).toBe(true);
    expect(
      canReposition(
        next,
        next.players.find((player) => player.id === defender.id)!,
        { x: defender.x, y: defender.y },
      ),
    ).toBe(true);
    expect(canReposition(next, homeOutfielder, homeOutfielder)).toBe(false);
    expect(disciplineFor(next, attacker)).toEqual({
      yellowCards: 1,
      sentOff: false,
    });
    expect(next.log.at(-1)?.text).toContain("D100 1; foul D6 5");
    expect(next.log.at(-1)?.text).toContain("Card D6 2");
    expect(next.log.at(-1)?.resolution?.contest).toBeUndefined();
    const restartPosition = next.foulRestart!.position,
      fouledPlayer = next.players.find((player) => player.id === defender.id)!,
      fouledPlayerDestination = Array.from(
        { length: 100 * 64 },
        (_, index) => ({
          x: index % 100,
          y: Math.floor(index / 100),
        }),
      ).find((point) => canReposition(next, fouledPlayer, point))!;
    let attackersSetup = applyCommand(next, {
      type: "reposition",
      playerId: fouledPlayer.id,
      to: fouledPlayerDestination,
    });
    attackersSetup = applyCommand(attackersSetup, {
      type: "reposition",
      playerId: awayOutfielder.id,
      to: restartPosition,
    });
    attackersSetup = applyCommand(attackersSetup, {
      type: "take-restart",
      playerId: awayOutfielder.id,
    });
    expect(attackersSetup.foulRestart?.takerId).toBe(awayOutfielder.id);
    expect(attackersSetup.possession).toBe(awayOutfielder.id);
    expect(
      canReposition(
        attackersSetup,
        attackersSetup.players.find(
          (player) => player.id === awayOutfielder.id,
        )!,
        restartPosition,
      ),
    ).toBe(false);
    const defendersSetup = applyCommand(attackersSetup, { type: "start" });
    expect(defendersSetup.foulRestart?.setupStage).toBe("defenders");
    expect(canReposition(defendersSetup, awayOutfielder, awayOutfielder)).toBe(
      false,
    );
    const adjacentPosition = {
      x: restartPosition.x + (restartPosition.x < 99 ? 1 : -1),
      y: restartPosition.y,
    };
    expect(canReposition(defendersSetup, homeOutfielder, homeOutfielder)).toBe(
      true,
    );
    expect(
      canReposition(defendersSetup, homeOutfielder, adjacentPosition),
    ).toBe(false);
    expect(() => applyCommand(defendersSetup, { type: "start" })).toThrow(
      "at least 10 yards",
    );
    let legalDefendersSetup = defendersSetup;
    for (const defenderToMove of legalDefendersSetup.players.filter(
      (player) =>
        player.team === "home" &&
        !isSentOff(legalDefendersSetup, player) &&
        distance(player, restartPosition) < 10,
    )) {
      const movableDefender = legalDefendersSetup.players.find(
          (player) => player.id === defenderToMove.id,
        )!,
        destination = Array.from({ length: 100 * 64 }, (_, index) => ({
          x: index % 100,
          y: Math.floor(index / 100),
        })).find((point) =>
          canReposition(legalDefendersSetup, movableDefender, point),
        )!;
      legalDefendersSetup = applyCommand(legalDefendersSetup, {
        type: "reposition",
        playerId: movableDefender.id,
        to: destination,
      });
    }
    const ready = applyCommand(legalDefendersSetup, { type: "start" });
    expect(ready.setup).toBe(false);
    const restarted = applyCommand(ready, { type: "shoot" }),
      restartResolution = restarted.log.findLast(
        (event) => event.resolution?.label === "Free-kick",
      )?.resolution;
    expect(restartResolution).toMatchObject({
      label: "Free-kick",
      skill: awayOutfielder.freeKick,
    });
    expect(restarted.foulRestart).toBeNull();
  });
  it("continues a one-on-one when the referee ignores the foul roll", () => {
    const s = createMatch(2004),
      attacker = carrier(s),
      defender = s.players.find((player) => player.id === "away-10")!;
    s.actionStage = "defenders";
    attacker.feint = 100;
    defender.tackle = 10;
    Object.assign(defender, { x: attacker.x + 1, y: attacker.y });

    const next = applyCommand(s, {
      type: "tackle",
      playerId: defender.id,
    });

    expect(next.foulRestart).toBeNull();
    expect(
      next.log.findLast((event) => event.resolution)?.resolution?.contest
        ?.opponent.dice,
    ).toBeDefined();
  });
  it("sends off the last defender even when the foul die issues no card", () => {
    const s = createMatch(1997),
      attacker = carrier(s),
      defender = s.players.find((player) => player.id === "away-10")!;
    s.actionStage = "defenders";
    Object.assign(attacker, { x: 1, y: 32 });
    Object.assign(defender, { x: 2, y: 32 });
    s.ball = { x: attacker.x, y: attacker.y };

    const whistled = applyCommand(s, {
        type: "tackle",
        playerId: defender.id,
      }),
      next = applyCommand(whistled, { type: "resolve-foul" });

    expect(disciplineFor(next, attacker)).toEqual({
      yellowCards: 0,
      sentOff: true,
    });
    expect(next.log.at(-1)?.text).toContain("last defender");
  });
  it("resolves voluntary fouls, penalties, second yellows and dismissals", () => {
    const s = createMatch(1),
      attacker = carrier(s),
      defender = s.players.find((player) => player.id === "away-10")!;
    s.actionStage = "defenders";
    Object.assign(attacker, { x: 84, y: 32 });
    Object.assign(defender, { x: 85, y: 32 });
    Object.assign(
      s.players.find((player) => player.id === "away-2")!,
      { x: 90, y: 10 },
    );
    s.ball = { x: attacker.x, y: attacker.y };
    s.discipline[defender.id].yellowCards = 1;
    expect(canCommitFoul(s, defender)).toBe(true);

    const whistled = applyCommand(s, {
      type: "foul",
      playerId: defender.id,
    });
    expect(whistled.pendingFoul).toMatchObject({
      stage: "card-color",
      offenderId: defender.id,
      victimId: attacker.id,
    });
    const next = applyCommand(whistled, { type: "resolve-foul" });

    expect(next.foulRestart).toMatchObject({
      kind: "penalty",
      team: "home",
      position: { x: 87, y: 31 },
    });
    expect(disciplineFor(next, defender)).toEqual({
      yellowCards: 2,
      sentOff: true,
    });
    expect(isSentOff(next, defender)).toBe(true);
    expect(canAct(next, defender)).toBe(false);
    expect(next.setup).toBe(true);
    expect(next.foulRestart?.setupStage).toBe("attackers");
    const alternatePosition = penaltyTakerPositions("home")[1],
      alternateSetup = applyCommand(next, {
        type: "reposition",
        playerId: attacker.id,
        to: alternatePosition,
      }),
      takerChosen = applyCommand(alternateSetup, {
        type: "take-restart",
        playerId: attacker.id,
      });
    expect(takerChosen.foulRestart?.position).toEqual(alternatePosition);
    expect(isInPenaltyExclusionZone({ x: 83, y: 20 }, "home")).toBe(true);
    expect(isInPenaltyExclusionZone({ x: 82, y: 53 }, "home")).toBe(true);
    expect(isInPenaltyExclusionZone({ x: 82, y: 54 }, "home")).toBe(false);
    expect(isInPenaltyExclusionZone({ x: 81, y: 20 }, "home")).toBe(false);
    expect(isInPenaltyExclusionZone({ x: 80, y: 30 }, "home")).toBe(true);
    expect(isInPenaltyExclusionZone({ x: 77, y: 30 }, "home")).toBe(false);

    const attackingTeammate = takerChosen.players.find(
      (player) => player.team === "home" && player.id !== attacker.id,
    )!;
    expect(
      canReposition(takerChosen, attackingTeammate, { x: 80, y: 30 }),
    ).toBe(false);
    const illegalAttackers = structuredClone(takerChosen);
    const illegalAttackingTeammate = illegalAttackers.players.find(
      (player) => player.id === attackingTeammate.id,
    )!;
    Object.assign(illegalAttackingTeammate, { x: 80, y: 30 });
    expect(penaltySetupIsLegal(illegalAttackers)).toBe(false);
    expect(() => applyCommand(illegalAttackers, { type: "start" })).toThrow(
      "penalty taker",
    );

    const defendersSetup = applyCommand(takerChosen, { type: "start" });
    expect(defendersSetup.foulRestart?.setupStage).toBe("defenders");
    const goalkeeper = defendersSetup.players.find(
        (player) => player.id === "away-1",
      )!,
      defendingOutfielder = defendersSetup.players.find(
        (player) => player.id === "away-2",
      )!;
    expect(canReposition(defendersSetup, goalkeeper, { x: 90, y: 32 })).toBe(
      true,
    );
    expect(
      canReposition(defendersSetup, defendingOutfielder, { x: 83, y: 20 }),
    ).toBe(false);
    expect(penaltySetupIsLegal(defendersSetup)).toBe(false);
    expect(() => applyCommand(defendersSetup, { type: "start" })).toThrow(
      "defending goalkeeper",
    );
    const legalDefenders = applyCommand(defendersSetup, {
        type: "reposition",
        playerId: defendingOutfielder.id,
        to: { x: 77, y: 20 },
      }),
      ready = applyCommand(legalDefenders, { type: "start" });
    expect(ready.setup).toBe(false);
    expect(() => applyCommand(ready, { type: "advance" })).toThrow(
      "Complete the penalty",
    );
    expect(next.log.at(-1)?.text).toContain("second yellow");
    ready.seed = 42;
    const penalty = applyCommand(ready, { type: "shoot" });
    expect(
      penalty.log.findLast((event) => event.resolution?.label === "Penalty")
        ?.resolution,
    ).toMatchObject({ label: "Penalty", skill: attacker.penalty });
    expect(penalty.pendingShotTarget).toMatchObject({
      allowInterception: false,
    });
    const aimed = selectShotTarget(penalty);
    expect(
      aimed.log.findLast(
        (event) => event.resolution?.label === "Shot interception",
      ),
    ).toBeUndefined();
  });
  it("rerolls both sides when one-on-one action scores are tied", () => {
    const s = createMatch(221),
      attacker = carrier(s),
      defender = s.players.find((player) => player.id === "away-10")!;
    s.actionStage = "defenders";
    attacker.feint = 100;
    defender.tackle = 100;
    Object.assign(defender, { x: 50, y: 31 });

    const next = applyCommand(s, { type: "tackle", playerId: defender.id }),
      contest = next.log.find((event) => event.resolution)?.resolution?.contest;

    expect(contest).toMatchObject({
      actor: { dice: 14, score: 14 },
      opponent: { dice: 84, score: 84 },
      winnerId: defender.id,
      rerolls: 1,
    });
  });
  it("restarts after goals and ends at three goals", () => {
    const s = createMatch(1000);
    s.discipline["away-10"].yellowCards = 1;
    carrier(s).x = 95;
    carrier(s).y = 32;
    Object.assign(
      s.players.find((player) => player.id === "away-1")!,
      { x: 90, y: 0 },
    );
    const goal = selectShotTarget(applyCommand(s, { type: "shoot" }));
    expect(goal.score.home).toBe(1);
    expect(goal.setup).toBe(true);
    expect(goal.possession).toBe("away-10");
    expect(goal.active).toBe("away");
    expect(goal.discipline["away-10"]).toEqual({
      yellowCards: 1,
      sentOff: false,
    });
    expect(deserialize(serialize(goal)).discipline["away-10"]).toEqual({
      yellowCards: 1,
      sentOff: false,
    });
    expect(
      goal.players
        .filter((player) => player.team === "home")
        .every(
          (player) => Math.hypot(player.x + 0.5 - 50, player.y + 0.5 - 32) > 10,
        ),
    ).toBe(true);
    expect(() => applyCommand(goal, { type: "advance" })).toThrow();
    expect(applyCommand(goal, { type: "start" }).setup).toBe(false);
    s.score.home = 2;
    const win = selectShotTarget(applyCommand(s, { type: "shoot" }));
    expect(win.winner).toBe("home");
    expect(() => applyCommand(win, { type: "advance" })).toThrow();
  });
  it("resolves an off-line goalkeeper as a shot interceptor", () => {
    const s = createMatch(36),
      shooter = carrier(s),
      goalkeeper = s.players.find((player) => player.id === "away-1")!;
    Object.assign(shooter, { x: 80, y: 32 });
    s.ball = { x: shooter.x, y: shooter.y };
    s.players
      .filter((player) => player.team === "away" && player.id !== goalkeeper.id)
      .forEach((player, index) =>
        Object.assign(player, { x: 89 + (index % 10), y: index }),
      );
    Object.assign(goalkeeper, { x: 96, y: 32 });

    const intercepted = selectShotTarget(applyCommand(s, { type: "shoot" })),
      resolution = intercepted.log.findLast(
        (event) => event.resolution?.label === "Shot interception",
      )?.resolution;

    expect(intercepted.score.home).toBe(0);
    expect(intercepted.possession).toBe(goalkeeper.id);
    expect(intercepted.active).toBe("away");
    expect(resolution).toMatchObject({
      outcome: "Intercepted",
      contest: {
        opponent: { playerId: goalkeeper.id, skillLabel: "Intercept +20" },
        winnerId: goalkeeper.id,
      },
    });
  });
  it("scores when nobody defends the goal line or intercepts the shot", () => {
    const s = createMatch(36),
      shooter = carrier(s);
    Object.assign(shooter, { x: 80, y: 32 });
    s.ball = { x: shooter.x, y: shooter.y };
    s.players
      .filter((player) => player.team === "away")
      .forEach((player, index) => Object.assign(player, { x: 90, y: index }));

    const goal = selectShotTarget(applyCommand(s, { type: "shoot" }));

    expect(goal.score.home).toBe(1);
    expect(
      goal.log.findLast((event) => event.resolution?.outcome === "Goal")?.text,
    ).toContain("nobody is defending the goal line");
  });
  it("treats a Lob as a high pass against an off-line goalkeeper", () => {
    const s = createMatch(36),
      shooter = carrier(s),
      goalkeeper = s.players.find((player) => player.id === "away-1")!;
    Object.assign(shooter, { x: 80, y: 32 });
    s.ball = { x: shooter.x, y: shooter.y };
    s.players
      .filter((player) => player.team === "away" && player.id !== goalkeeper.id)
      .forEach((player, index) => Object.assign(player, { x: 90, y: index }));
    Object.assign(goalkeeper, { x: 96, y: 32 });

    expect(availableActions(s, shooter)).toContain("lob");
    const lob = applyCommand(s, { type: "shoot", kind: "lob" });

    expect(
      lob.log.some((event) => event.resolution?.label === "Shot interception"),
    ).toBe(false);
    expect(lob.log.some((event) => event.resolution?.label === "Lob")).toBe(
      true,
    );
  });
  it("uses Reach, shot power and Catch for a goalkeeper on the goal line", () => {
    const s = createMatch(47),
      shooter = carrier(s),
      goalkeeper = s.players.find((player) => player.id === "away-1")!;
    Object.assign(shooter, { x: 80, y: 32 });
    s.ball = { x: shooter.x, y: shooter.y };
    s.players
      .filter((player) => player.team === "away" && player.id !== goalkeeper.id)
      .forEach((player, index) =>
        Object.assign(player, { x: 89 + (index % 10), y: index }),
      );
    Object.assign(goalkeeper, { x: 99, y: 32 });

    const placed = selectShotTarget(
      applyCommand(s, { type: "shoot" }),
      "farthest",
    );
    expect(placed.pendingGoalkeeperShot).toMatchObject({
      stage: "reach",
      goalkeeperId: goalkeeper.id,
      shooterId: shooter.id,
    });
    expect(() => applyCommand(placed, { type: "advance" })).toThrow(
      "Roll the goalkeeper’s dice",
    );
    const reached = applyCommand(placed, {
      type: "resolve-goalkeeper-shot",
    });
    expect(reached.pendingGoalkeeperShot).toMatchObject({ stage: "power" });
    expect(
      reached.log.some((event) => event.resolution?.label === "Shot power"),
    ).toBe(false);
    const powered = applyCommand(reached, {
      type: "resolve-goalkeeper-shot",
    });
    expect(powered.pendingGoalkeeperShot).toMatchObject({ stage: "catch" });
    const caught = applyCommand(powered, {
      type: "resolve-goalkeeper-shot",
    });

    expect(caught.score.home).toBe(0);
    expect(caught.possession).toBe(goalkeeper.id);
    expect(
      caught.log.some((event) => event.resolution?.label === "Reach"),
    ).toBe(true);
    expect(
      caught.log.some((event) => event.resolution?.label === "Shot power"),
    ).toBe(true);
    expect(
      caught.log.findLast((event) => event.resolution?.label === "Catch")
        ?.resolution?.outcome,
    ).toBe("Caught");
    expect(
      caught.log.findLast((event) => event.resolution?.label === "Catch")
        ?.resolution?.contest,
    ).toMatchObject({
      actor: {
        playerId: shooter.id,
        skillLabel: "Shot power",
      },
      opponent: {
        playerId: goalkeeper.id,
        skillLabel: "Catch",
      },
      winnerId: goalkeeper.id,
    });
  });
  it("restarts a goalkeeper deflection with a corner", () => {
    const s = createMatch(43),
      shooter = carrier(s),
      goalkeeper = s.players.find((player) => player.id === "away-1")!;
    Object.assign(shooter, { x: 80, y: 32 });
    s.ball = { x: shooter.x, y: shooter.y };
    s.players
      .filter((player) => player.team === "away" && player.id !== goalkeeper.id)
      .forEach((player, index) =>
        Object.assign(player, { x: 89 + (index % 10), y: index }),
      );
    Object.assign(goalkeeper, { x: 99, y: 32 });

    let corner = selectShotTarget(applyCommand(s, { type: "shoot" }));
    while (corner.pendingGoalkeeperShot)
      corner = applyCommand(corner, { type: "resolve-goalkeeper-shot" });
    const taker = corner.players.find((player) => player.id === shooter.id)!;

    expect(corner.setPieceRestart).toMatchObject({
      kind: "corner",
      team: "home",
      position: { x: 99, y: 63 },
      takerId: null,
    });
    expect(corner.setup).toBe(true);
    expect(corner.possession).toBeNull();
    const positioned = applyCommand(corner, {
        type: "reposition",
        playerId: taker.id,
        to: { x: 99, y: 63 },
      }),
      taken = applyCommand(positioned, {
        type: "take-restart",
        playerId: taker.id,
      }),
      defenders = applyCommand(taken, { type: "start" }),
      started = applyCommand(defenders, { type: "start" });
    expect(positioned.possession).toBeNull();
    expect(taken.possession).toBe(taker.id);
    expect(defenders.setPieceRestart?.setupStage).toBe("defenders");
    expect(availableActions(started, taker)).toEqual(["pass", "shoot"]);

    const passed = applyCommand(started, {
      type: "pass",
      to: { x: 94, y: 58 },
    });
    expect(passed.setPieceRestart).toBeNull();
    expect(
      passed.log.findLast((event) =>
        event.resolution?.label.startsWith("Corner"),
      )?.resolution?.skill,
    ).toBe(taker.lowPass);
  });
  it("scores when a goal-line goalkeeper fails the Reach action", () => {
    const s = createMatch(141),
      shooter = carrier(s),
      goalkeeper = s.players.find((player) => player.id === "away-1")!;
    Object.assign(shooter, { x: 80, y: 32 });
    s.ball = { x: shooter.x, y: shooter.y };
    s.players
      .filter((player) => player.team === "away" && player.id !== goalkeeper.id)
      .forEach((player, index) =>
        Object.assign(player, { x: 89 + (index % 10), y: index }),
      );
    Object.assign(goalkeeper, { x: 99, y: 32 });

    const placed = selectShotTarget(
      applyCommand(s, { type: "shoot" }),
      "farthest",
    );
    expect(placed.pendingGoalkeeperShot?.stage).toBe("reach");
    const goal = applyCommand(placed, { type: "resolve-goalkeeper-shot" });

    expect(goal.score.home).toBe(1);
    expect(
      goal.log.findLast((event) => event.resolution?.outcome === "Goal")
        ?.resolution,
    ).toMatchObject({ label: "Reach", outcome: "Goal" });
  });
  it("uses a D8 when shot placement equals the difficulty and hits the post", () => {
    const s = createMatch(11),
      shooter = carrier(s);
    Object.assign(shooter, { x: 80, y: 32 });
    s.ball = { x: shooter.x, y: shooter.y };

    const post = applyCommand(s, { type: "shoot" }),
      resolution = post.log.find(
        (event) => event.resolution?.outcome === "Post · back to field",
      )?.resolution;

    expect(resolution).toMatchObject({ result: 0, d8: 3 });
    expect(post.possession).toBeNull();
    expect(post.phase).toBe("movement");
  });
  it("starts a fresh turn for the goalkeeper after a failed shot", () => {
    const s = createMatch(42),
      goalkeeper = s.players.find((player) => player.id === "away-1")!;
    s.moved = ["home-9"];
    s.movementSpent = { "home-9": 3 };
    s.movementStageUsed = { "home-9": "attack-opponent" };
    s.movementHalved = ["home-9"];
    s.actionSpent = ["away-1"];
    s.resolvedBlocks = ["home-9:away-1"];
    Object.assign(carrier(s), { x: 50, y: 32 });
    s.ball = { x: 50, y: 32 };

    const saved = applyCommand(s, { type: "shoot" });

    expect(saved).toMatchObject({
      turn: 2,
      active: "away",
      phase: "action",
      actionStage: "ball-carrier",
      movementStage: "attack-opponent",
      setup: true,
      possession: null,
      ball: { x: goalkeeper.x, y: goalkeeper.y },
      moved: [],
      movementSpent: {},
      movementStageUsed: {},
      movementHalved: [],
      actionSpent: [],
      resolvedBlocks: [],
      pendingPass: null,
      pendingShot: false,
      setPieceRestart: {
        kind: "goal-kick",
        team: "away",
        takerId: null,
        setupStage: "attackers",
      },
      challengedBall: null,
      oneTouch: null,
    });
    expect(availableActions(saved, goalkeeper)).toEqual([]);
    expect(saved.log.at(-3)?.text).toContain("prepares the goal-kick");
    expect(saved.log.at(-2)?.text).toBe("Real Madrid to play.");
    expect(saved.log.at(-1)?.text).toContain("Goal-kick to Real Madrid");

    expect(canReposition(saved, goalkeeper, { x: 95, y: 30 })).toBe(true);
    const teammate = saved.players.find(
        (player) => player.team === "away" && player.id !== goalkeeper.id,
      )!,
      positioned = applyCommand(saved, {
        type: "reposition",
        playerId: goalkeeper.id,
        to: { x: 95, y: 30 },
      }),
      taken = applyCommand(positioned, {
        type: "take-restart",
        playerId: goalkeeper.id,
      }),
      oppositeSidePosition = Array.from({ length: 50 * 64 }, (_, index) => ({
        x: index % 50,
        y: Math.floor(index / 50),
      })).find((point) => canReposition(taken, teammate, point))!,
      attackersPositioned = applyCommand(taken, {
        type: "reposition",
        playerId: teammate.id,
        to: oppositeSidePosition,
      }),
      defenders = applyCommand(attackersPositioned, { type: "start" }),
      started = applyCommand(defenders, { type: "start" });
    expect(positioned.possession).toBeNull();
    expect(positioned.setPieceRestart?.takerId).toBeNull();
    expect(taken.possession).toBe(goalkeeper.id);
    expect(taken.setPieceRestart?.takerId).toBe(goalkeeper.id);
    expect(taken.setPieceRestart?.position).toEqual({ x: 95, y: 30 });
    expect(taken.ball).toEqual({ x: 95, y: 30 });
    expect(
      attackersPositioned.players.find((player) => player.id === goalkeeper.id),
    ).toMatchObject({ x: 95, y: 30 });
    expect(attackersPositioned.possession).toBe(goalkeeper.id);
    expect(attackersPositioned.ball).toEqual({ x: 95, y: 30 });
    expect(defenders.setPieceRestart?.setupStage).toBe("defenders");
    expect(availableActions(started, goalkeeper)).toEqual(["pass"]);

    const restartedGoalkeeper = started.players.find(
        (player) => player.id === goalkeeper.id,
      )!,
      destination = {
        x: restartedGoalkeeper.x - 35,
        y: restartedGoalkeeper.y,
      };
    const restarted = applyCommand(started, {
      type: "pass",
      to: destination,
    });
    expect(restarted.setPieceRestart).toBeNull();
    expect(
      restarted.log.findLast((event) =>
        event.resolution?.label.startsWith("Goal-kick"),
      )?.resolution,
    ).toMatchObject({
      difficulty: 35,
      skill: goalkeeper.goalKick,
    });
  });
  it("preserves the delayed own-side stage and clears movement allowance", () => {
    const pass = applyCommand(createMatch(), {
      type: "pass",
      to: { x: 50, y: 32 },
    });
    const s = applyCommand(pass, {
      type: "move",
      playerId: "home-10",
      to: { x: 48, y: 32 },
    });
    const defenders = applyCommand(s, { type: "advance" });
    expect(defenders.moved).toContain("home-10");
    const ownSide = applyCommand(defenders, { type: "advance" });
    expect(ownSide.moved).toContain("home-10");
    expect(
      canMove(
        ownSide,
        ownSide.players.find((p) => p.id === "home-10")!,
        { x: 49, y: 32 },
      ),
    ).toBe(false);
    const movementEnd = applyCommand(ownSide, { type: "advance" });
    const next = movementEnd;
    expect(next.active).toBe("home");
    expect(next.possession).toBeNull();
    expect(next.phase).toBe("movement");
    expect(next.movementStage).toBe("attack-opponent");
    expect(next.moved).toEqual([]);
  });
  it("ends movement after defenders when the ball is in the attacking team's own half", () => {
    const attackers = movement();
    expect(attackers.active).toBe("home");
    expect(attackers.ball.x).toBeLessThan(50);
    const defenders = applyCommand(attackers, { type: "advance" });
    const nextTurn = applyCommand(defenders, { type: "advance" });
    expect(nextTurn.phase).toBe("action");
    expect(nextTurn.movementStage).toBe("attack-opponent");
    expect(nextTurn.turn).toBe(2);
  });
  it("rejects corrupt, incompatible and inconsistent saves", () => {
    for (const bad of [
      "null",
      "{}",
      "not json",
      JSON.stringify({ ...createMatch(), version: 2 }),
      serialize({ ...createMatch(), possession: "missing" }),
      serialize({ ...createMatch(), score: { home: 3, away: 0 } }),
    ])
      expect(() => deserialize(bad)).toThrow();
    const s = createMatch();
    s.players[1].x = s.players[0].x;
    s.players[1].y = s.players[0].y;
    expect(() => deserialize(serialize(s))).toThrow();
  });
  it("round-trips a long headless session while preserving invariants", () => {
    let s: Match = createMatch();
    for (let i = 0; i < 300; i++) {
      s = applyCommand(s, { type: "advance" });
      expect(deserialize(serialize(s))).toEqual(s);
    }
    expect(s.log.length).toBeLessThanOrEqual(150);
  });
});

describe("repository team sheets", () => {
  it("uses printed shirt numbers and scales /10 ratings to /100", () => {
    const s = createMatch();
    expect(s.players.find((p) => p.id === "home-9")).toMatchObject({
      name: "Messi",
      number: 10,
      velocity: 80,
      pass: 100,
      shoot: 100,
      tackle: 60,
    });
    expect(s.players.find((p) => p.id === "away-11")).toMatchObject({
      name: "C. Ronaldo",
      number: 7,
      velocity: 90,
      pass: 80,
      shoot: 100,
      tackle: 60,
    });
    expect(s.players.find((p) => p.id === "home-6")).toMatchObject({
      name: "Busquets",
      number: 28,
    });
    expect(deserialize(serialize(s))).toEqual(s);
  });
  it("migrates placeholder saves without resetting positions, score or possession", () => {
    const old = createMatch();
    delete old.rosterVersion;
    delete (old as Partial<Match>).kickoffLineups;
    old.score.home = 1;
    old.players[8].name = "Sala";
    old.players[8].number = 9;
    old.players[8].x = 41;
    const updated = deserialize(serialize(old));
    expect(updated.players[8]).toMatchObject({
      name: "Messi",
      number: 10,
      x: 41,
      shoot: 100,
    });
    expect(updated.score).toEqual(old.score);
    expect(updated.possession).toBe(old.possession);
    expect(updated.rosterVersion).toBe(7);
    expect(updated.kickoffLineups.home.bearerId).toBe("home-10");
    expect(deserialize(serialize(updated))).toEqual(updated);
  });
  it("recovers persistent bookings from recorded foul resolutions", () => {
    const saved = createMatch();
    saved.log.push({
      id: 2,
      turn: 1,
      kind: "dice",
      text: "Benzema fouls Messi. Benzema is shown a yellow card.",
    });

    const restored = deserialize(serialize(saved));

    expect(restored.discipline["away-10"]).toEqual({
      yellowCards: 1,
      sentOff: false,
    });
    expect(deserialize(serialize(restored))).toEqual(restored);
  });
});
