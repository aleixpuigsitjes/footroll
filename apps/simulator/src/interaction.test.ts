import { describe, it, expect } from "vitest";
import {
  createMatch,
  applyCommand,
  carrier,
  canMove,
  canReposition,
} from "@footroll/engine";
import {
  playerAtPoint,
  actionPreview,
  dragDestination,
  gridCell,
  cellCenter,
  passBlockContests,
} from "./interaction";
describe("pitch interaction", () => {
  it("selects the nearest adjacent player regardless of draw order", () => {
    const s = createMatch(),
      a = s.players.find((p) => p.id === "home-10")!,
      b = s.players.find((p) => p.id === "away-10")!;
    expect(playerAtPoint(s.players, { x: a.x + 0.5, y: a.y + 0.5 })?.id).toBe(
      a.id,
    );
    expect(
      playerAtPoint([...s.players].reverse(), { x: b.x + 0.5, y: b.y + 0.5 })
        ?.id,
    ).toBe(b.id);
    expect(playerAtPoint(s.players, { x: 60, y: 60 })).toBeUndefined();
  });
  it("previews passes to occupied or empty positions without changing possession", () => {
    const s = createMatch();
    Object.assign(
      s.players.find((player) => player.id === "away-10")!,
      {
        x: 60,
        y: 0,
      },
    );
    const snapshot = JSON.stringify(s),
      p = s.players.find((p) => p.id === "home-7")!;
    const preview = actionPreview(s, "pass", p, { x: p.x, y: p.y })!;
    expect(preview.difficulty).toBe(17);
    expect(preview.skill).toBe(90);
    expect(preview.automatic).toBe(true);
    expect(preview.status).toBe("Automatic");
    expect(actionPreview(s, "pass", p, { x: 3, y: 32 })).toMatchObject({
      difficulty: 46,
      skill: 90,
      automatic: false,
      status: "Roll required",
    });
    expect(JSON.stringify(s)).toBe(snapshot);
    const opponent = s.players.find((player) => player.id === "away-1")!;
    expect(
      actionPreview(s, "pass", p, { x: opponent.x, y: opponent.y }),
    ).not.toBeNull();
    expect(actionPreview(s, "pass", p, { x: 60, y: 60 })).not.toBeNull();
    const resolved = applyCommand(s, preview.command);
    expect(carrier(resolved).id).toBe(p.id);
  });
  it("explains when an automatic-range low-pass requires an interception roll", () => {
    const s = createMatch(),
      ballCarrier = carrier(s);
    Object.assign(ballCarrier, { x: 50, y: 32 });
    s.ball = { x: ballCarrier.x, y: ballCarrier.y };
    Object.assign(
      s.players.find((player) => player.id === "away-10")!,
      { x: 51, y: 31 },
    );
    const receiver = s.players.find((p) => p.id === "home-9")!;
    expect(actionPreview(s, "pass", receiver, receiver)).toMatchObject({
      command: { type: "resolve-block", kind: "feint", action: "pass" },
      contest: {
        actor: { skillLabel: "Feint" },
        opponent: { skillLabel: "Tackle" },
      },
    });
    expect(actionPreview(s, "shoot", carrier(s), null)).toMatchObject({
      command: { type: "resolve-block", kind: "feint", action: "shoot" },
      contest: {
        actor: { skillLabel: "Feint" },
        opponent: { skillLabel: "Tackle" },
      },
    });
    Object.assign(
      s.players.find((player) => player.id === "away-10")!,
      { x: 49, y: 28 },
    );
    const preview = actionPreview(s, "pass", receiver, receiver)!;
    expect(preview.automatic).toBe(false);
    expect(preview.status).toContain("Contested by");
    expect(preview.contest).toMatchObject({
      actor: {
        playerId: "home-10",
        name: "Neymar",
        skillLabel: "Low-pass",
        skill: 90,
      },
      opponent: {
        playerId: "away-10",
        name: "Benzema",
        skillLabel: "Intercept",
        skill: 60,
      },
      winnerId: null,
    });
  });
  it("previews a challenged ball as receiver Strength against defender Strength", () => {
    const s = createMatch(1000),
      receiver = s.players.find((player) => player.id === "home-7")!,
      defender = s.players.find((player) => player.id === "away-2")!;
    s.players
      .filter((player) => player.team === "away")
      .forEach((player, index) =>
        Object.assign(player, { x: 80 + index, y: index }),
      );
    Object.assign(receiver, { x: 20, y: 32 });
    Object.assign(defender, { x: 20, y: 31 });
    const passed = applyCommand(s, { type: "pass", to: receiver });

    expect(actionPreview(passed, "challenge", receiver, null)).toMatchObject({
      command: {
        type: "resolve-challenged-ball",
        receiverId: receiver.id,
        defenderId: defender.id,
      },
      contest: {
        actor: { playerId: receiver.id, skillLabel: "Strength" },
        opponent: { playerId: defender.id, skillLabel: "Strength" },
        winnerId: null,
      },
    });
  });
  it("lists every unresolved defender blocking the ball carrier", () => {
    const s = createMatch(),
      ballCarrier = carrier(s),
      first = s.players.find((player) => player.id === "away-9")!,
      second = s.players.find((player) => player.id === "away-10")!;
    Object.assign(first, { x: ballCarrier.x + 1, y: ballCarrier.y });
    Object.assign(second, { x: ballCarrier.x, y: ballCarrier.y + 1 });

    const contests = passBlockContests(s);
    expect(contests).toHaveLength(2);
    expect(contests.map((item) => item.actor.playerId)).toEqual([
      ballCarrier.id,
      ballCarrier.id,
    ]);
    expect(contests.map((item) => item.opponent.playerId)).toEqual([
      first.id,
      second.id,
    ]);

    s.resolvedBlocks.push(`${ballCarrier.id}:${first.id}`);
    expect(passBlockContests(s).map((item) => item.opponent.playerId)).toEqual([
      second.id,
    ]);
  });
  it("previews only the one-touch actions allowed by the received pass", () => {
    const s = createMatch(123),
      receiver = s.players.find((p) => p.id === "home-7")!;
    Object.assign(receiver, { x: 50, y: 32 });
    Object.assign(
      s.players.find((p) => p.id === "away-10")!,
      { x: 60, y: 0 },
    );
    const received = applyCommand(s, { type: "pass", to: receiver });

    expect(
      actionPreview(received, "low-pass", receiver, { x: 49, y: 32 }),
    ).toMatchObject({
      command: {
        type: "one-touch-pass",
        kind: "low-pass",
        to: { x: 49, y: 32 },
      },
    });
    expect(actionPreview(received, "finish", receiver, null)).toMatchObject({
      command: { type: "one-touch-shot", kind: "finish" },
      skill: receiver.finish,
    });
    expect(
      actionPreview(received, "offensive-header", receiver, null),
    ).toBeNull();
    expect(
      actionPreview(received, "pass", receiver, { x: 49, y: 32 }),
    ).toBeNull();
    expect(
      actionPreview(received, "low-pass", receiver, { x: 20, y: 32 }),
    ).not.toBeNull();
    expect(
      actionPreview(received, "low-pass", receiver, { x: 19, y: 32 }),
    ).toBeNull();
  });
  it("previews the three one-touch techniques allowed by a high pass", () => {
    const s = createMatch(1000),
      receiver = s.players.find((p) => p.id === "home-7")!;
    Object.assign(receiver, { x: 80, y: 32 });
    s.players
      .filter((player) => player.team === "away")
      .forEach((player, index) =>
        Object.assign(player, { x: 89 + (index % 10), y: index }),
      );
    const received = applyCommand(s, { type: "pass", to: receiver });

    for (const action of ["offensive-header", "scissors-kick"] as const)
      expect(actionPreview(received, action, receiver, null)).not.toBeNull();
    expect(
      actionPreview(received, "defensive-header", receiver, {
        x: 81,
        y: 32,
      }),
    ).not.toBeNull();
    expect(
      actionPreview(received, "low-pass", receiver, { x: 79, y: 32 }),
    ).toBeNull();
    expect(actionPreview(received, "finish", receiver, null)).toBeNull();
  });
  it("allows tackling only for the active defender and disables action previews during movement", () => {
    const s = createMatch();
    s.actionStage = "defenders";
    Object.assign(
      s.players.find((player) => player.id === "away-10")!,
      { x: 50, y: 31 },
    );
    expect(
      actionPreview(
        s,
        "tackle",
        s.players.find((p) => p.id === "away-10")!,
        null,
      )?.contest,
    ).toMatchObject({
      actor: { playerId: "home-10", skillLabel: "Feint" },
      opponent: { playerId: "away-10", skillLabel: "Tackle" },
    });
    expect(actionPreview(s, "tackle", carrier(s), null)).toBeNull();
    s.phase = "movement";
    expect(actionPreview(s, "tackle", s.players[21], null)).toBeNull();
  });
  it("previews Dribble and Slip when forward movement is blocked", () => {
    const dribble = applyCommand(createMatch(), { type: "advance" }),
      carrierPlayer = carrier(dribble),
      tackler = dribble.players.find((player) => player.id === "away-10")!;
    Object.assign(tackler, { x: 50, y: 31 });
    expect(
      actionPreview(dribble, "dribble", carrierPlayer, { x: 52, y: 32 }),
    ).toMatchObject({
      command: { type: "resolve-block", kind: "dribble" },
      contest: {
        actor: { skillLabel: "Dribble" },
        opponent: { skillLabel: "Tackle" },
      },
    });

    const runner = dribble.players.find((player) => player.id === "home-9")!,
      marker = dribble.players.find((player) => player.id === "away-9")!;
    Object.assign(runner, { x: 40, y: 20 });
    Object.assign(marker, { x: 41, y: 21 });
    expect(
      actionPreview(dribble, "slip", runner, { x: 44, y: 20 }),
    ).toMatchObject({
      command: { type: "resolve-block", kind: "slip" },
      contest: {
        actor: { skillLabel: "Slip" },
        opponent: { skillLabel: "Mark" },
      },
    });
    expect(actionPreview(dribble, "slip", runner, { x: 40, y: 24 })).toBeNull();
  });
  it("previews Reach, shot power and Catch as separate dice actions", () => {
    const match = createMatch(47),
      shooter = carrier(match),
      goalkeeper = match.players.find((player) => player.id === "away-1")!;
    Object.assign(shooter, { x: 80, y: 32 });
    match.ball = { x: shooter.x, y: shooter.y };
    match.players
      .filter((player) => player.team === "away" && player.id !== goalkeeper.id)
      .forEach((player, index) =>
        Object.assign(player, { x: 89 + (index % 9), y: index }),
      );
    Object.assign(goalkeeper, { x: 99, y: 32 });

    const aimed = applyCommand(match, { type: "shoot" }),
      placed = applyCommand(aimed, {
        type: "select-shot-target",
        target: aimed.pendingShotTarget!.closest,
      });
    expect(actionPreview(placed, null, goalkeeper, null)).toMatchObject({
      command: { type: "resolve-goalkeeper-shot" },
      skill: goalkeeper.reach,
      label: "Navas · Reach",
    });
    const reached = applyCommand(placed, {
      type: "resolve-goalkeeper-shot",
    });
    expect(actionPreview(reached, null, shooter, null)).toMatchObject({
      command: { type: "resolve-goalkeeper-shot" },
      difficulty: reached.pendingGoalkeeperShot?.attempt.difficulty,
      skill: shooter.shotPower,
      label: `${shooter.name} · Shot power`,
    });
    const powered = applyCommand(reached, {
      type: "resolve-goalkeeper-shot",
    });
    expect(actionPreview(powered, null, goalkeeper, null)).toMatchObject({
      command: { type: "resolve-goalkeeper-shot" },
      skill: goalkeeper.catch,
      label: "Navas · Catch",
    });
  });
});

describe("drag movement bounds", () => {
  it("clamps distant and occupied drops to legal cells, while allowing cancellation", () => {
    const match = createMatch();
    match.phase = "movement";
    const player = match.players[0];
    for (const point of [
      { x: -100, y: -100 },
      { x: 200, y: 200 },
      { x: match.players[1].x + 0.5, y: match.players[1].y + 0.5 },
    ]) {
      const to = dragDestination(match, player, point);
      expect(canMove(match, player, to)).toBe(true);
    }
    expect(
      dragDestination(match, player, { x: player.x + 0.5, y: player.y + 0.5 }),
    ).toEqual({ x: player.x, y: player.y });
    match.moved.push(player.id);
    expect(dragDestination(match, player, { x: 50, y: 50 })).toEqual({
      x: player.x,
      y: player.y,
    });
  });
  it("keeps lineup drags inside each team’s legal half", () => {
    const match = createMatch(42, true),
      home = match.players.find((player) => player.id === "home-1")!,
      away = match.players.find((player) => player.id === "away-1")!;
    const homeDrop = dragDestination(match, home, { x: 200, y: 63.5 }),
      awayDrop = dragDestination(match, away, { x: -100, y: 0.5 });
    expect(canReposition(match, home, homeDrop)).toBe(true);
    expect(homeDrop).toEqual({ x: 0, y: 35 });
    expect(canReposition(match, away, awayDrop)).toBe(true);
    expect(awayDrop).toEqual({ x: 99, y: 28 });
  });
  it("allows goal-kick attackers to be positioned across midfield", () => {
    const match = createMatch(42, true),
      attacker = match.players.find((player) => player.id === "home-2")!;
    match.possession = null;
    match.ball = { x: 4, y: 32 };
    match.setPieceRestart = {
      kind: "goal-kick",
      team: "home",
      position: { x: 4, y: 32 },
      takerId: null,
      setupStage: "attackers",
    };

    const destination = dragDestination(match, attacker, { x: 80.5, y: 5.5 });

    expect(destination.x).toBeGreaterThanOrEqual(50);
    expect(canReposition(match, attacker, destination)).toBe(true);
  });
});

it("maps rectangular cell centers to their original cells", () => {
  for (const point of [
    { x: 0, y: 0 },
    { x: 13, y: 7 },
    { x: 99, y: 62 },
    { x: 50, y: 32 },
  ]) {
    expect(gridCell(cellCenter(point))).toEqual(point);
  }
});
