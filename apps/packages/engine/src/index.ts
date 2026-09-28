import squads from "./teams.json";
export const TEAM_SQUADS = squads;
/** Practice v1: a deliberately small ruleset, not the full Advanced rulebook. */
export type Team = "home" | "away";
export const WINNING_CONDITIONS = [
  {
    id: "first-to-1",
    group: "One-side maximum goals",
    label: "First to 1 goal",
  },
  {
    id: "first-to-2",
    group: "One-side maximum goals",
    label: "First to 2 goals",
  },
  {
    id: "first-to-3",
    group: "One-side maximum goals",
    label: "First to 3 goals",
  },
  {
    id: "first-to-4",
    group: "One-side maximum goals",
    label: "First to 4 goals",
  },
  {
    id: "first-to-5",
    group: "One-side maximum goals",
    label: "First to 5 goals",
  },
  {
    id: "total-2",
    group: "Total maximum goals",
    label: "2 total goals",
  },
  {
    id: "total-3",
    group: "Total maximum goals",
    label: "3 total goals",
  },
  {
    id: "total-4",
    group: "Total maximum goals",
    label: "4 total goals",
  },
  {
    id: "total-5",
    group: "Total maximum goals",
    label: "5 total goals",
  },
  {
    id: "first-to-3-or-total-4",
    group: "One-side plus total maximum",
    label: "First to 3 or 4 total",
  },
  {
    id: "lead-by-2",
    group: "Goal difference without limit",
    label: "Lead by 2 goals",
  },
  {
    id: "lead-by-3",
    group: "Goal difference without limit",
    label: "Lead by 3 goals",
  },
  {
    id: "lead-by-2-or-first-to-5",
    group: "Goal difference with one-side limit",
    label: "Lead by 2 or first to 5",
  },
  {
    id: "lead-by-3-or-first-to-5",
    group: "Goal difference with one-side limit",
    label: "Lead by 3 or first to 5",
  },
  {
    id: "lead-by-2-or-total-4",
    group: "Goal difference with total limit",
    label: "Lead by 2 or 4 total",
  },
  {
    id: "lead-by-2-or-total-5",
    group: "Goal difference with total limit",
    label: "Lead by 2 or 5 total",
  },
  {
    id: "lead-by-2-or-total-6",
    group: "Goal difference with total limit",
    label: "Lead by 2 or 6 total",
  },
] as const;
export type WinningCondition = (typeof WINNING_CONDITIONS)[number]["id"];
export type MatchResult = Team | "draw";
export const DEFAULT_WINNING_CONDITION: WinningCondition = "first-to-3";
export type MovementStage = "attack-opponent" | "defense" | "attack-own";
export type Point = { x: number; y: number };
export type Player = Point & {
  id: string;
  team: Team;
  number: number;
  name: string;
  role: string;
  velocity: number;
  lowPass: number;
  highPass: number;
  cornerKick: number;
  throwIn: number;
  goalKick: number;
  intercept: number;
  finish: number;
  offensiveHeader: number;
  defensiveHeader: number;
  scissorsKick: number;
  pass: number;
  shoot: number;
  freeKick: number;
  penalty: number;
  tackle: number;
  feint: number;
  dribble: number;
  slip: number;
  mark: number;
  strength: number;
  reach: number;
  catch: number;
  shotPower: number;
  headerPower: number;
};
export type ContestSide = {
  playerId: string;
  name: string;
  team: Team;
  skillLabel: string;
  skill: number;
  dice?: number;
  score?: number;
};
export type ContestResolution = {
  actor: ContestSide;
  opponent: ContestSide;
  winnerId: string | null;
  rerolls?: number;
};
export type OneTouchKind =
  | "low-pass"
  | "finish"
  | "offensive-header"
  | "defensive-header"
  | "scissors-kick";
export type PlayerAction =
  | "pass"
  | "throw-in"
  | "shoot"
  | "lob"
  | "tackle"
  | "foul"
  | "feint"
  | "dribble"
  | "slip"
  | "challenge"
  | OneTouchKind;
export type OneTouchOpportunity = {
  playerId: string;
  sourcePass: PassKind;
  actions: OneTouchKind[];
  resume: "action-attackers" | "movement" | "new-turn";
};
export type ChallengedBall = {
  receiverId: string;
  defenderId: string;
  sourcePass: PassKind;
  allowOneTouch: boolean;
  resume: OneTouchOpportunity["resume"];
};
export type Event = {
  id: number;
  turn: number;
  text: string;
  kind: "info" | "move" | "dice" | "goal";
  dice?: number;
  resolution?: {
    label: string;
    difficulty: number;
    skill: number;
    dice?: number;
    score?: number;
    result?: number;
    outcome: string;
    d8?: number;
    contest?: ContestResolution;
    discipline?: {
      playerId: string;
      card: "yellow" | "red" | null;
      yellowCards: number;
      sentOff: boolean;
    };
  };
};
export type KickoffLineup = {
  bearerId: string;
  positions: Record<string, Point>;
};
export type PlayerDiscipline = {
  yellowCards: number;
  sentOff: boolean;
};
export type FoulRoll = {
  offender: "actor" | "opponent";
  d100?: number;
  foulD6?: number;
  card: boolean;
  cardD6?: number;
};
export type PendingFoul = {
  stage: "card-check" | "card-color";
  offenderId: string;
  victimId: string;
  actionLabel: string;
  foul: FoulRoll;
};
export type FoulRestart = {
  kind: "free-kick" | "penalty";
  team: Team;
  position: Point;
  fouledPlayerId: string;
  offenderId: string;
  takerId: string | null;
  setupStage: "attackers" | "defenders";
};
export type SetPieceRestart = {
  kind: "corner" | "throw-in" | "goal-kick";
  team: Team;
  position: Point;
  takerId: string | null;
  setupStage: "attackers" | "defenders";
};
export type GoalTarget = { row: 0 | 1 | 2; column: number };
export type ShotAttempt = {
  label: string;
  difficulty: number;
  skill: number;
  dice: number;
  score: number;
  result: number;
  header: boolean;
  lob: boolean;
};
export type PendingGoalkeeperShot = {
  stage: "reach" | "power" | "catch";
  shooterId: string;
  goalkeeperId: string;
  attempt: ShotAttempt;
  target: GoalTarget;
  difficulty: number;
  power?: number;
};
export type PendingShotTarget = {
  shooterId: string;
  attempt: ShotAttempt;
  closest: GoalTarget;
  maxDistance: number;
  allowInterception: boolean;
};
export type Match = {
  version: 1;
  rosterVersion?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  ruleset: "practice-v1";
  seed: number;
  turn: number;
  active: Team;
  setup: boolean;
  testSetup: boolean;
  kickoffLineups: Record<Team, KickoffLineup>;
  phase: "action" | "movement";
  actionStage: "ball-carrier" | "attackers" | "defenders";
  movementStage: MovementStage;
  players: Player[];
  ball: Point;
  possession: string | null;
  score: Record<Team, number>;
  winningCondition: WinningCondition;
  moved: string[];
  movementSpent: Record<string, number>;
  movementStageUsed: Record<string, MovementStage>;
  movementHalved: string[];
  actionSpent: string[];
  resolvedBlocks: string[];
  discipline: Record<string, PlayerDiscipline>;
  pendingFoul: PendingFoul | null;
  foulRestart: FoulRestart | null;
  setPieceRestart: SetPieceRestart | null;
  pendingPass: { playerId: string; to: Point } | null;
  pendingShot: boolean;
  pendingShotTarget: PendingShotTarget | null;
  pendingGoalkeeperShot: PendingGoalkeeperShot | null;
  challengedBall: ChallengedBall | null;
  oneTouch: OneTouchOpportunity | null;
  log: Event[];
  winner: MatchResult | null;
};
export type Command =
  | { type: "set-winning-condition"; condition: WinningCondition }
  | { type: "unlock-positions" }
  | { type: "apply-formation"; team: Team; formation: TacticalFormation }
  | { type: "reposition"; playerId: string; to: Point }
  | { type: "take-restart"; playerId: string }
  | { type: "start" }
  | { type: "move"; playerId: string; to: Point }
  | { type: "pass"; to: Point }
  | { type: "throw-in"; to: Point }
  | {
      type: "one-touch-pass";
      kind: "low-pass" | "defensive-header";
      to: Point;
    }
  | { type: "shoot"; kind?: "shot" | "lob" }
  | { type: "select-shot-target"; target: GoalTarget }
  | { type: "resolve-goalkeeper-shot" }
  | {
      type: "one-touch-shot";
      kind: "finish" | "offensive-header" | "scissors-kick";
    }
  | { type: "tackle"; playerId: string }
  | { type: "foul"; playerId: string }
  | { type: "resolve-foul" }
  | {
      type: "resolve-block";
      kind: "feint" | "dribble" | "slip";
      playerId: string;
      defenderId: string;
      to?: Point;
      action?: "pass" | "shoot";
    }
  | {
      type: "resolve-challenged-ball";
      receiverId: string;
      defenderId: string;
    }
  | { type: "advance" };
export const WIDTH = 100,
  HEIGHT = 64;
const MAX_FIELD_WIDTH = 130,
  MAX_FIELD_HEIGHT = 100,
  GOAL_WIDTH = 8;
export const TEAM_NAMES: Record<Team, string> = {
  home: TEAM_SQUADS.home.name,
  away: TEAM_SQUADS.away.name,
};
export const other = (team: Team): Team => (team === "home" ? "away" : "home");
export function matchResultForScore(
  score: Record<Team, number>,
  condition: WinningCondition,
): MatchResult | null {
  const total = score.home + score.away,
    difference = Math.abs(score.home - score.away),
    leader: MatchResult =
      score.home === score.away
        ? "draw"
        : score.home > score.away
          ? "home"
          : "away",
    oneSide = (maximum: number) =>
      Math.max(score.home, score.away) >= maximum ? leader : null,
    totalGoals = (maximum: number) => (total >= maximum ? leader : null),
    goalDifference = (maximum: number) =>
      difference >= maximum ? leader : null;
  switch (condition) {
    case "first-to-1":
      return oneSide(1);
    case "first-to-2":
      return oneSide(2);
    case "first-to-3":
      return oneSide(3);
    case "first-to-4":
      return oneSide(4);
    case "first-to-5":
      return oneSide(5);
    case "total-2":
      return totalGoals(2);
    case "total-3":
      return totalGoals(3);
    case "total-4":
      return totalGoals(4);
    case "total-5":
      return totalGoals(5);
    case "first-to-3-or-total-4":
      return oneSide(3) ?? totalGoals(4);
    case "lead-by-2":
      return goalDifference(2);
    case "lead-by-3":
      return goalDifference(3);
    case "lead-by-2-or-first-to-5":
      return goalDifference(2) ?? oneSide(5);
    case "lead-by-3-or-first-to-5":
      return goalDifference(3) ?? oneSide(5);
    case "lead-by-2-or-total-4":
      return goalDifference(2) ?? totalGoals(4);
    case "lead-by-2-or-total-5":
      return goalDifference(2) ?? totalGoals(5);
    case "lead-by-2-or-total-6":
      return goalDifference(2) ?? totalGoals(6);
  }
}
export const distance = (a: Point, b: Point) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export const actionScore = (dice: number, skill: number) =>
  Math.round((dice * skill) / 100);
export const actionResult = (score: number, difficulty: number) =>
  score - difficulty;
export const errorMagnitude = (
  score: number,
  difficulty: number,
  scalingFactor: number,
) => Math.round(scalingFactor * (difficulty - score));
export const successRate = (score: number, difficulty: number) =>
  Math.round((score * (100 - difficulty)) / 100);
export const oneselfDifficulty = (skill: number) => 101 - skill;
export const modifiedDifficulty = (
  difficulty: number,
  ...modifiers: number[]
) =>
  Math.round(difficulty + modifiers.reduce((total, value) => total + value, 0));
export type PassKind = "low-pass" | "high-pass";
export const TACTICAL_FORMATIONS = [
  "3-4-3",
  "4-3-3",
  "4-4-2",
  "5-3-2",
  "5-4-1",
] as const;
export type TacticalFormation = (typeof TACTICAL_FORMATIONS)[number];
export const passKind = (length: number): PassKind =>
  length <= 30 ? "low-pass" : "high-pass";
export const lowPassAutomaticDistance = (skill: number) =>
  Math.max(0, Math.min(30, (skill - 40) / 2));
export const isOpponentSide = (team: Team, point: Point) =>
  team === "home" ? point.x >= WIDTH / 2 : point.x < WIDTH / 2;
export const canShootAtGoal = (player: Player) =>
  isOpponentSide(player.team, player);
const isInsideCenterCircle = (point: Point) =>
  Math.hypot(point.x + 0.5 - WIDTH / 2, point.y + 0.5 - HEIGHT / 2) < 10;
export const kickoffPosition = (team: Team): Point =>
  team === "home"
    ? { x: WIDTH / 2 - 1, y: HEIGHT / 2 }
    : { x: WIDTH / 2, y: HEIGHT / 2 - 1 };
const isKickoffPosition = (point: Point, team: Team) => {
  const center = kickoffPosition(team);
  return point.x === center.x && point.y === center.y;
};
export const penaltyTakerPositions = (team: Team): [Point, Point] => {
  const x = team === "home" ? 87 : 12;
  return [
    { x, y: HEIGHT / 2 - 1 },
    { x, y: HEIGHT / 2 },
  ];
};
const isPenaltyTakerPosition = (point: Point, team: Team) =>
  penaltyTakerPositions(team).some(
    (position) => position.x === point.x && position.y === point.y,
  );
const formation = [
  [0, 32],
  [22, 10],
  [20, 25],
  [20, 39],
  [22, 54],
  [35, 15],
  [32, 32],
  [35, 49],
  [44, 12],
  [49, 32],
  [44, 52],
];
const formationShape: Record<
  TacticalFormation,
  { defenders: number; midfielders: number; forwards: number }
> = {
  "3-4-3": { defenders: 3, midfielders: 4, forwards: 3 },
  "4-3-3": { defenders: 4, midfielders: 3, forwards: 3 },
  "4-4-2": { defenders: 4, midfielders: 4, forwards: 2 },
  "5-3-2": { defenders: 5, midfielders: 3, forwards: 2 },
  "5-4-1": { defenders: 5, midfielders: 4, forwards: 1 },
};
const formationLineY = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    Math.round(((index + 1) * HEIGHT) / (count + 1) - 0.5),
  );
function tacticalFormationPositions(
  team: Team,
  shape: TacticalFormation,
  bearerId: string,
  takingKickoff: boolean,
): Record<string, Point> {
  const ids = TEAM_SQUADS[team].players.slice(0, 11).map((player) => player.id),
    goalkeeperId = `${team}-1`,
    safeBearerId =
      bearerId !== goalkeeperId && ids.includes(bearerId)
        ? bearerId
        : `${team}-10`,
    outfield = ids.filter((id) => id !== goalkeeperId && id !== safeBearerId),
    counts = formationShape[shape],
    defenders = outfield.slice(0, counts.defenders),
    midfielders = outfield.slice(
      counts.defenders,
      counts.defenders + counts.midfielders,
    ),
    otherForwards = outfield.slice(counts.defenders + counts.midfielders),
    orient = (point: Point): Point =>
      team === "home"
        ? point
        : { x: WIDTH - 1 - point.x, y: HEIGHT - 1 - point.y },
    positions: Record<string, Point> = {
      [goalkeeperId]: goalkeeperSetupPosition(team),
    },
    assignLine = (lineIds: string[], x: number) =>
      formationLineY(lineIds.length).forEach((y, index) => {
        positions[lineIds[index]] = orient({ x, y });
      });
  assignLine(defenders, 20);
  assignLine(midfielders, 33);
  const forwards = takingKickoff
    ? otherForwards
    : [...otherForwards, safeBearerId];
  formationLineY(forwards.length).forEach((y, index) => {
    let point = { x: 44, y };
    if (isInsideCenterCircle(point)) point = { ...point, x: 38 };
    positions[forwards[index]] = orient(point);
  });
  if (takingKickoff) positions[safeBearerId] = kickoffPosition(team);
  return positions;
}
const goalkeeperSetupPosition = (team: Team): Point => ({
  x: team === "home" ? 0 : WIDTH - 1,
  y: team === "home" ? HEIGHT / 2 : HEIGHT / 2 - 1,
});
const isGoalkeeperSetupPosition = (team: Team, point: Point) =>
  point.x === (team === "home" ? 0 : WIDTH - 1) &&
  point.y >= (HEIGHT - GOAL_WIDTH) / 2 &&
  point.y < (HEIGHT + GOAL_WIDTH) / 2;
export function isGoalAreaPosition(point: Point, team: Team) {
  return (
    point.y >= 22 &&
    point.y < 42 &&
    (team === "home"
      ? point.x >= 0 && point.x < 6
      : point.x >= 94 && point.x < WIDTH)
  );
}
function normalizeKickoffGoalkeepers(lineups: Record<Team, KickoffLineup>) {
  for (const lineup of Object.values(lineups)) {
    for (const team of ["home", "away"] as const) {
      const goalkeeperId = `${team}-1`,
        current = lineup.positions[goalkeeperId];
      if (!current || isGoalkeeperSetupPosition(team, current)) continue;
      const target = goalkeeperSetupPosition(team),
        occupant = Object.entries(lineup.positions).find(
          ([id, point]) =>
            id !== goalkeeperId && point.x === target.x && point.y === target.y,
        );
      if (occupant) lineup.positions[occupant[0]] = { ...current };
      lineup.positions[goalkeeperId] = target;
    }
  }
}
function normalizeKickoffCenters(lineups: Record<Team, KickoffLineup>) {
  for (const team of ["home", "away"] as const) {
    const lineup = lineups[team],
      current = lineup.positions[lineup.bearerId],
      target = kickoffPosition(team);
    if (!current || isKickoffPosition(current, team)) continue;
    const occupant = Object.entries(lineup.positions).find(
      ([id, point]) =>
        id !== lineup.bearerId && point.x === target.x && point.y === target.y,
    );
    if (occupant) lineup.positions[occupant[0]] = { ...current };
    lineup.positions[lineup.bearerId] = target;
  }
}
function rosterAttributes(team: Team, index: number) {
  const player = TEAM_SQUADS[team].players[index];
  return {
    number: player.number,
    name: player.name,
    role: player.role,
    velocity: player.ratings.Pace,
    lowPass: player.ratings["Short pass"],
    highPass: player.ratings["Long pass"],
    cornerKick: player.ratings["Corner kick"],
    throwIn: player.ratings["Throw in"],
    goalKick: player.ratings["Goalkeeper kick"],
    intercept: player.ratings.Intercept,
    finish: player.ratings.Finish,
    offensiveHeader: player.ratings["Offensive header"],
    defensiveHeader: player.ratings["Defensive header"],
    scissorsKick: player.ratings["Scissor kick"],
    pass: player.ratings["Short pass"],
    shoot: player.ratings.Shoot,
    freeKick: player.ratings["Free kick"],
    penalty: player.ratings.Penalty,
    tackle: player.ratings.Tackle,
    feint: player.ratings.Feint,
    dribble: player.ratings.Dribble,
    slip: player.ratings.Slip,
    mark: player.ratings.Mark,
    strength: player.ratings.Strength,
    reach: player.ratings.Reach,
    catch: player.ratings.Catch,
    shotPower: player.ratings["Shoot power"],
    headerPower: player.ratings["Header power"],
  };
}
function kickoffPlayers(kickoffTeam: Team): Player[] {
  return (["home", "away"] as Team[]).flatMap((team) =>
    formation.map(([x, y], i) => {
      const kickoffOpponent = i === 9 && team !== kickoffTeam;
      return {
        id: `${team}-${i + 1}`,
        team,
        ...rosterAttributes(team, i),
        x: kickoffOpponent
          ? team === "home"
            ? 38
            : 61
          : team === "home"
            ? x
            : 99 - x,
        y: team === "home" ? y : 63 - y,
      };
    }),
  );
}
function lineupFromPlayers(players: Player[], bearerId: string): KickoffLineup {
  return {
    bearerId,
    positions: Object.fromEntries(
      players.map((player) => [player.id, { x: player.x, y: player.y }]),
    ),
  };
}
function defaultKickoffLineups(): Record<Team, KickoffLineup> {
  return {
    home: lineupFromPlayers(kickoffPlayers("home"), "home-10"),
    away: lineupFromPlayers(kickoffPlayers("away"), "away-10"),
  };
}
function playersFromLineup(team: Team, lineup: KickoffLineup): Player[] {
  return kickoffPlayers(team).map((player) => ({
    ...player,
    ...lineup.positions[player.id],
  }));
}
function oppositeKickoffLineup(
  players: Player[],
  currentBearerId: string,
  nextTeam: Team,
  savedNextLineup: KickoffLineup,
): KickoffLineup {
  const positions = Object.fromEntries(
      players.map((player) => [player.id, { x: player.x, y: player.y }]),
    ),
    nextBearerId = savedNextLineup.bearerId,
    nextCenter = { ...savedNextLineup.positions[nextBearerId] },
    currentBearer = players.find((player) => player.id === currentBearerId)!;
  const occupied = new Set(
    players
      .filter(
        (player) => player.id !== currentBearerId && player.id !== nextBearerId,
      )
      .map((player) => `${player.x},${player.y}`),
  );
  occupied.add(`${nextCenter.x},${nextCenter.y}`);
  const desiredFallback = savedNextLineup.positions[currentBearerId],
    legalFallbacks: Point[] = [];
  for (
    let x = currentBearer.team === "home" ? 0 : WIDTH / 2;
    x < (currentBearer.team === "home" ? WIDTH / 2 : WIDTH);
    x++
  )
    for (let y = 0; y < HEIGHT; y++)
      if (!isInsideCenterCircle({ x, y }) && !occupied.has(`${x},${y}`))
        legalFallbacks.push({ x, y });
  legalFallbacks.sort(
    (a, b) =>
      distance(a, desiredFallback) - distance(b, desiredFallback) ||
      a.x - b.x ||
      a.y - b.y,
  );
  positions[nextBearerId] = nextCenter;
  positions[currentBearerId] = legalFallbacks[0];
  return { bearerId: nextBearerId, positions };
}
export function createMatch(
  seed = 42,
  setup = false,
  savedLineups?: Record<Team, KickoffLineup>,
): Match {
  const kickoffLineups = structuredClone(
    savedLineups ?? defaultKickoffLineups(),
  );
  normalizeKickoffGoalkeepers(kickoffLineups);
  normalizeKickoffCenters(kickoffLineups);
  const players = playersFromLineup("home", kickoffLineups.home),
    possession = kickoffLineups.home.bearerId,
    bearer = players.find((player) => player.id === possession)!;
  return {
    version: 1,
    rosterVersion: 7,
    ruleset: "practice-v1",
    seed: seed >>> 0,
    turn: 1,
    active: "home",
    setup,
    testSetup: false,
    kickoffLineups,
    phase: "action",
    actionStage: "ball-carrier",
    movementStage: "attack-opponent",
    players,
    ball: { x: bearer.x, y: bearer.y },
    possession,
    score: { home: 0, away: 0 },
    winningCondition: DEFAULT_WINNING_CONDITION,
    moved: [],
    movementSpent: {},
    movementStageUsed: {},
    movementHalved: [],
    actionSpent: [],
    resolvedBlocks: [],
    discipline: Object.fromEntries(
      players.map((player) => [player.id, { yellowCards: 0, sentOff: false }]),
    ),
    pendingFoul: null,
    foulRestart: null,
    setPieceRestart: null,
    pendingPass: null,
    pendingShot: false,
    pendingShotTarget: null,
    pendingGoalkeeperShot: null,
    challengedBall: null,
    oneTouch: null,
    log: [
      {
        id: 1,
        turn: 1,
        kind: "info",
        text: setup
          ? "Arrange both teams in their own half before kick-off."
          : `Kick-off. ${TEAM_NAMES.home} have the ball.`,
      },
    ],
    winner: null,
  };
}
export const possessor = (s: Match) =>
  s.possession
    ? s.players.find((player) => player.id === s.possession)
    : undefined;
export const disciplineFor = (s: Match, player: Player) =>
  s.discipline[player.id] ?? { yellowCards: 0, sentOff: false };
export const isSentOff = (s: Match, player: Player) =>
  disciplineFor(s, player).sentOff;
export const ballPosition = (s: Match): Point => possessor(s) ?? s.ball;
export const carrier = (s: Match) => {
  const player = possessor(s);
  if (!player) throw new Error("No footballer currently has possession.");
  return player;
};
function segmentIntersectsReachZone(from: Point, to: Point, player: Player) {
  const x0 = from.x + 0.5,
    y0 = from.y + 0.5,
    dx = to.x - from.x,
    dy = to.y - from.y,
    minX = player.x - 1,
    maxX = player.x + 2,
    minY = player.y - 1,
    maxY = player.y + 2;
  let start = 0,
    end = 1;
  for (const [origin, delta, min, max] of [
    [x0, dx, minX, maxX],
    [y0, dy, minY, maxY],
  ] as const) {
    if (delta === 0) {
      if (origin < min || origin > max) return false;
      continue;
    }
    const near = (min - origin) / delta,
      far = (max - origin) / delta,
      low = Math.min(near, far),
      high = Math.max(near, far);
    start = Math.max(start, low);
    end = Math.min(end, high);
    if (start > end) return false;
  }
  return true;
}
export function passInterceptors(
  s: Match,
  passer: Player,
  to: Point,
  kind = passKind(distance(passer, to)),
) {
  const receiver = s.players.find(
    (player) =>
      player.team === passer.team &&
      !isSentOff(s, player) &&
      player.x === to.x &&
      player.y === to.y,
  );
  return s.players
    .filter(
      (player) =>
        player.team !== passer.team &&
        !isSentOff(s, player) &&
        !s.resolvedBlocks.includes(blockKey(passer, player)) &&
        segmentIntersectsReachZone(passer, to, player) &&
        (!receiver || !withinReach(receiver, player)) &&
        (kind === "low-pass" || distance(passer, player) <= 2),
    )
    .sort((a, b) => distance(passer, a) - distance(passer, b));
}
function isInPenaltyAreaForTeam(point: Point, team: Team) {
  const centerX = point.x + 0.5,
    centerY = point.y + 0.5;
  return (
    centerY >= 10 &&
    centerY <= 54 &&
    (team === "home" ? centerX <= 18 : centerX >= 82)
  );
}
export function isInPenaltyExclusionZone(point: Point, attackingTeam: Team) {
  const defendingTeam = other(attackingTeam),
    spot = { x: attackingTeam === "home" ? 88 : 12, y: HEIGHT / 2 },
    insideArc = Math.hypot(point.x + 0.5 - spot.x, point.y + 0.5 - spot.y) < 10;
  return isInPenaltyAreaForTeam(point, defendingTeam) || insideArc;
}
function isInOwnPenaltyArea(player: Player) {
  return isInPenaltyAreaForTeam(player, player.team);
}
export const interceptionSkill = (player: Player) =>
  player.role === "Goalkeeper" && isInOwnPenaltyArea(player)
    ? player.intercept + 20
    : player.intercept;
export const challengedBallSkill = (player: Player) =>
  player.role === "Goalkeeper" && isInOwnPenaltyArea(player)
    ? player.catch + 20
    : player.strength;
export const challengedBallSkillLabel = (player: Player) =>
  player.role === "Goalkeeper" && isInOwnPenaltyArea(player)
    ? "Catch +20"
    : "Strength";
export function canLobShot(s: Match, shooter: Player) {
  return s.players.some(
    (player) =>
      player.team !== shooter.team &&
      player.role === "Goalkeeper" &&
      !isSentOff(s, player) &&
      isInOwnPenaltyArea(player) &&
      !(player.team === "home" ? player.x <= 1 : player.x >= WIDTH - 2),
  );
}
export const withinReach = (a: Point, b: Point) =>
  Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) <= 1;
const blockKey = (attacker: Player, defender: Player) =>
  `${attacker.id}:${defender.id}`;
export function blockingDefenders(s: Match, attacker: Player): Player[] {
  return s.players.filter(
    (player) =>
      player.team !== attacker.team &&
      !isSentOff(s, player) &&
      withinReach(attacker, player) &&
      !s.resolvedBlocks.includes(blockKey(attacker, player)),
  );
}
export const isForwardMove = (player: Player, to: Point) =>
  player.team === "home" ? to.x > player.x : to.x < player.x;
export function movementBlocker(
  s: Match,
  player: Player,
  to: Point,
): Player | undefined {
  if (
    s.phase !== "movement" ||
    player.team !== s.active ||
    !isForwardMove(player, to)
  )
    return undefined;
  return blockingDefenders(s, player)[0];
}
export function canTackle(s: Match, player: Player): boolean {
  const ballPlayer = possessor(s);
  return (
    !s.winner &&
    !s.setup &&
    !s.oneTouch &&
    !isSentOff(s, player) &&
    s.phase === "action" &&
    s.actionStage === "defenders" &&
    !s.actionSpent.includes(player.id) &&
    !!ballPlayer &&
    ballPlayer.team === s.active &&
    player.team !== s.active &&
    !s.resolvedBlocks.includes(blockKey(ballPlayer, player)) &&
    withinReach(player, ballPlayer)
  );
}
export function canCommitFoul(s: Match, player: Player): boolean {
  const ballPlayer = possessor(s);
  return (
    !s.winner &&
    !s.setup &&
    !s.oneTouch &&
    !isSentOff(s, player) &&
    s.phase === "action" &&
    s.actionStage === "defenders" &&
    !s.actionSpent.includes(player.id) &&
    s.possession !== player.id &&
    !!ballPlayer &&
    ballPlayer.team === s.active &&
    player.team !== s.active &&
    withinReach(player, ballPlayer)
  );
}
export function availableActions(s: Match, player: Player): PlayerAction[] {
  if (s.winner || s.setup || s.phase !== "action" || isSentOff(s, player))
    return [];
  if (s.pendingFoul || s.pendingShotTarget || s.pendingGoalkeeperShot)
    return [];
  if (s.actionSpent.includes(player.id)) return [];
  if (s.challengedBall)
    return s.challengedBall.receiverId === player.id ? ["challenge"] : [];
  if (s.oneTouch)
    return s.oneTouch.playerId === player.id
      ? s.oneTouch.actions.filter(
          (action) =>
            canShootAtGoal(player) ||
            (action !== "finish" &&
              action !== "offensive-header" &&
              action !== "scissors-kick"),
        )
      : [];
  if (s.foulRestart)
    return s.possession === player.id
      ? s.foulRestart.kind === "penalty"
        ? ["shoot"]
        : [
            "pass",
            ...(canShootAtGoal(player) ? (["shoot"] as const) : []),
            ...(canShootAtGoal(player) && canLobShot(s, player)
              ? (["lob"] as const)
              : []),
          ]
      : [];
  if (s.setPieceRestart)
    return s.setPieceRestart.takerId === player.id
      ? s.setPieceRestart.kind === "throw-in"
        ? ["throw-in"]
        : s.setPieceRestart.kind === "corner"
          ? ["pass", ...(canShootAtGoal(player) ? (["shoot"] as const) : [])]
          : ["pass"]
      : [];
  if (s.actionStage === "ball-carrier")
    return s.possession === player.id
      ? s.pendingPass
        ? ["pass"]
        : s.pendingShot
          ? canShootAtGoal(player)
            ? ["shoot", ...(canLobShot(s, player) ? (["lob"] as const) : [])]
            : []
          : [
              "pass",
              ...(canShootAtGoal(player) ? (["shoot"] as const) : []),
              ...(canShootAtGoal(player) && canLobShot(s, player)
                ? (["lob"] as const)
                : []),
            ]
      : [];
  if (s.actionStage === "attackers") return [];
  return [
    ...(canTackle(s, player) ? (["tackle"] as const) : []),
    ...(canCommitFoul(s, player) ? (["foul"] as const) : []),
  ];
}
export function canAct(s: Match, player: Player): boolean {
  return availableActions(s, player).length > 0;
}
export function movementAllowance(s: Match, player: Player): number {
  const allowance = player.velocity / 10;
  return s.movementHalved.includes(player.id)
    ? Math.round(allowance / 2)
    : allowance;
}
export function remainingMovement(s: Match, player: Player): number {
  return Math.max(
    0,
    movementAllowance(s, player) - (s.movementSpent[player.id] ?? 0),
  );
}
export function canMovePlayer(s: Match, p: Player): boolean {
  const playerOwnSide = s.active === "home" ? p.x < 50 : p.x >= 50;
  const eligibleTeam =
    s.movementStage === "defense" ? p.team !== s.active : p.team === s.active;
  const eligibleSide =
    s.movementStage !== "attack-own" ||
    (isOpponentSide(s.active, ballPosition(s)) && playerOwnSide);
  const startedInThisStage =
    !s.moved.includes(p.id) || s.movementStageUsed[p.id] === s.movementStage;
  return (
    !s.winner &&
    !s.setup &&
    !isSentOff(s, p) &&
    s.phase === "movement" &&
    eligibleTeam &&
    eligibleSide &&
    startedInThisStage &&
    remainingMovement(s, p) > 0
  );
}
export function canMove(s: Match, p: Player, to: Point): boolean {
  const destinationOwnSide = s.active === "home" ? to.x < 50 : to.x >= 50;
  const eligibleSide =
    s.movementStage !== "attack-own" ||
    (isOpponentSide(s.active, ballPosition(s)) && destinationOwnSide);
  return (
    canMovePlayer(s, p) &&
    eligibleSide &&
    Number.isInteger(to.x) &&
    Number.isInteger(to.y) &&
    to.x >= 0 &&
    to.x < WIDTH &&
    to.y >= 0 &&
    to.y < HEIGHT &&
    distance(p, to) > 0 &&
    distance(p, to) <= remainingMovement(s, p) &&
    !s.players.some((q) => !isSentOff(s, q) && q.x === to.x && q.y === to.y)
  );
}
export function canTakeSetPiece(s: Match, p: Player): boolean {
  const restart = s.foulRestart ?? s.setPieceRestart;
  if (
    !s.setup ||
    !restart ||
    restart.setupStage !== "attackers" ||
    p.team !== restart.team ||
    isSentOff(s, p)
  )
    return false;
  if ("takerId" in restart && restart.kind === "goal-kick")
    return isGoalAreaPosition(p, restart.team);
  if (restart.kind === "penalty")
    return isPenaltyTakerPosition(p, restart.team);
  return p.x === restart.position.x && p.y === restart.position.y;
}
export function canRepositionPlayer(s: Match, p: Player): boolean {
  if (!s.setup || s.winner || isSentOff(s, p)) return false;
  if (s.foulRestart)
    return (
      p.id !== s.foulRestart.takerId &&
      p.team ===
        (s.foulRestart.setupStage === "attackers"
          ? s.foulRestart.team
          : other(s.foulRestart.team))
    );
  if (s.setPieceRestart)
    return (
      p.id !== s.setPieceRestart.takerId &&
      p.team ===
        (s.setPieceRestart.setupStage === "attackers"
          ? s.setPieceRestart.team
          : other(s.setPieceRestart.team))
    );
  return true;
}
function canOccupyPenaltySetupPosition(
  s: Match,
  player: Player,
  position: Point,
) {
  const restart = s.foulRestart;
  if (!restart || restart.kind !== "penalty") return true;
  if (player.id === restart.takerId) return true;
  if (
    restart.takerId === null &&
    player.team === restart.team &&
    isPenaltyTakerPosition(position, restart.team)
  )
    return true;
  if (player.team !== restart.team && player.role === "Goalkeeper") return true;
  return !isInPenaltyExclusionZone(position, restart.team);
}
export function penaltySetupIsLegal(s: Match) {
  const restart = s.foulRestart;
  if (!s.setup || !restart || restart.kind !== "penalty") return true;
  const setupTeam =
    restart.setupStage === "attackers" ? restart.team : other(restart.team);
  return s.players
    .filter((player) => player.team === setupTeam && !isSentOff(s, player))
    .every((player) => canOccupyPenaltySetupPosition(s, player, player));
}
export function canReposition(s: Match, p: Player, to: Point): boolean {
  if (s.setup && s.foulRestart) {
    const restart = s.foulRestart,
      isRestartPlayer = p.id === restart.takerId,
      isRestartPosition =
        to.x === restart.position.x && to.y === restart.position.y,
      respectsFreeKickDistance =
        restart.kind !== "free-kick" ||
        restart.setupStage !== "defenders" ||
        distance(to, restart.position) >= 10;
    return (
      canRepositionPlayer(s, p) &&
      Number.isInteger(to.x) &&
      Number.isInteger(to.y) &&
      to.x >= 0 &&
      to.x < WIDTH &&
      to.y >= 0 &&
      to.y < HEIGHT &&
      !isRestartPlayer &&
      (!isRestartPosition ||
        (restart.setupStage === "attackers" && p.team === restart.team)) &&
      respectsFreeKickDistance &&
      canOccupyPenaltySetupPosition(s, p, to) &&
      !s.players.some(
        (otherPlayer) =>
          otherPlayer.id !== p.id &&
          !isSentOff(s, otherPlayer) &&
          otherPlayer.x === to.x &&
          otherPlayer.y === to.y,
      )
    );
  }
  if (s.setup && s.setPieceRestart) {
    const restart = s.setPieceRestart,
      isRestartPosition =
        to.x === restart.position.x && to.y === restart.position.y;
    return (
      canRepositionPlayer(s, p) &&
      Number.isInteger(to.x) &&
      Number.isInteger(to.y) &&
      to.x >= 0 &&
      to.x < WIDTH &&
      to.y >= 0 &&
      to.y < HEIGHT &&
      (p.role !== "Goalkeeper" ||
        isGoalkeeperSetupPosition(p.team, to) ||
        (restart.kind === "goal-kick" &&
          p.team === restart.team &&
          isGoalAreaPosition(to, restart.team))) &&
      (!isRestartPosition || p.team === restart.team) &&
      !s.players.some(
        (otherPlayer) =>
          otherPlayer.id !== p.id &&
          !isSentOff(s, otherPlayer) &&
          otherPlayer.x === to.x &&
          otherPlayer.y === to.y,
      )
    );
  }
  const inOwnHalf = p.team === "home" ? to.x < WIDTH / 2 : to.x >= WIDTH / 2;
  const insideCenterCircle = isInsideCenterCircle(to);
  const isBallBearer = p.id === s.possession,
    onKickoffPosition = isKickoffPosition(to, p.team);
  return (
    s.setup &&
    !s.winner &&
    !isSentOff(s, p) &&
    Number.isInteger(to.x) &&
    Number.isInteger(to.y) &&
    to.x >= 0 &&
    to.x < WIDTH &&
    to.y >= 0 &&
    to.y < HEIGHT &&
    (s.testSetup || inOwnHalf) &&
    (s.testSetup ||
      p.role !== "Goalkeeper" ||
      isGoalkeeperSetupPosition(p.team, to)) &&
    (s.testSetup ||
      (isBallBearer
        ? onKickoffPosition
        : !insideCenterCircle || (p.team === s.active && onKickoffPosition))) &&
    !s.players.some(
      (otherPlayer) =>
        otherPlayer.id !== p.id &&
        !isSentOff(s, otherPlayer) &&
        otherPlayer.x === to.x &&
        otherPlayer.y === to.y &&
        !(
          !s.testSetup &&
          p.team === s.active &&
          onKickoffPosition &&
          otherPlayer.id === s.possession
        ),
    )
  );
}
export function shotDifficultyAt(point: Point, team: Team): number {
  const shooter = { ...point, team },
    // Cell centers are one unit from the goal line at the closest column.
    dx = shooter.team === "home" ? WIDTH - shooter.x : shooter.x + 1,
    // The two central rows are equally close to the center of the 8-cell goal.
    dy = Math.max(HEIGHT / 2 - shooter.y, shooter.y - HEIGHT / 2 + 1),
    distanceComponent =
      Math.hypot(dx, dy) /
      Math.hypot(MAX_FIELD_WIDTH / 2, MAX_FIELD_HEIGHT / 2),
    aperture =
      dx === 0
        ? 0
        : Math.atan((dy + GOAL_WIDTH / 2) / dx) -
          Math.atan((dy - GOAL_WIDTH / 2) / dx),
    apertureComponent = (1 - aperture / Math.PI) ** 15,
    difficulty = 100 * Math.max(distanceComponent, apertureComponent);
  // Annex B values are printed as integers; the pitch generator truncates them.
  return Math.min(100, Math.max(1, Math.trunc(difficulty)));
}
export function shotDifficulty(s: Match): number {
  const shooter = carrier(s);
  if (s.foulRestart?.kind === "penalty")
    return shotDifficultyAt(
      { x: shooter.team === "home" ? 88 : 11, y: HEIGHT / 2 },
      shooter.team,
    );
  return shotDifficultyAt(shooter, shooter.team);
}
function random(s: Match) {
  s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
  return s.seed / 4294967296;
}
function roll(s: Match): number {
  return Math.floor(random(s) * 100);
}
function rollD6(s: Match): number {
  return Math.floor(random(s) * 6) + 1;
}
function checkInvoluntaryFoul(
  s: Match,
  offender: FoulRoll["offender"],
  d100: number,
): FoulRoll | null {
  if (d100 < 1 || d100 > 9) return null;
  const foulD6 = rollD6(s);
  // One face is ignored, three award a foul, and two award a foul with a card.
  if (foulD6 === 1) return null;
  const card = foulD6 >= 5;
  return {
    offender,
    d100,
    foulD6,
    card,
  };
}
function rollOneOnOne(
  s: Match,
  actorSkill: number,
  opponentSkill: number,
  initialActorDice?: number,
  allowFouls = true,
) {
  let actorDice = initialActorDice ?? roll(s),
    rerolls = 0;
  for (;;) {
    const actorScore = actionScore(actorDice, actorSkill),
      actorFoul = allowFouls
        ? checkInvoluntaryFoul(s, "actor", actorDice)
        : null;
    if (actorFoul)
      return {
        actorDice,
        actorScore,
        opponentDice: undefined,
        opponentScore: undefined,
        rerolls,
        foul: actorFoul,
      };
    const opponentDice = roll(s),
      opponentScore = actionScore(opponentDice, opponentSkill),
      opponentFoul = allowFouls
        ? checkInvoluntaryFoul(s, "opponent", opponentDice)
        : null;
    if (opponentFoul)
      return {
        actorDice,
        actorScore,
        opponentDice,
        opponentScore,
        rerolls,
        foul: opponentFoul,
      };
    if (actorScore !== opponentScore)
      return {
        actorDice,
        actorScore,
        opponentDice,
        opponentScore,
        rerolls,
        foul: null,
      };
    rerolls++;
    actorDice = roll(s);
  }
}
export function previewD100(s: Match, offset = 0): number {
  if (!Number.isInteger(offset) || offset < 0)
    throw new Error("Dice preview offset must be a non-negative integer.");
  const preview = structuredClone(s);
  let result = 0;
  for (let index = 0; index <= offset; index++) result = roll(preview);
  return result;
}
export function previewD6(s: Match, offset = 0): number {
  if (!Number.isInteger(offset) || offset < 0)
    throw new Error("Dice preview offset must be a non-negative integer.");
  const preview = structuredClone(s);
  for (let index = 0; index < offset; index++) random(preview);
  return rollD6(preview);
}
function rollD8(s: Match): number {
  return Math.floor(random(s) * 8) + 1;
}
export function passErrorPosition(
  team: Team,
  target: Point,
  magnitude: number,
  d8: number,
): Point {
  const [forward, lateral] = (
      {
        1: [-1, 0],
        2: [-1, -1],
        3: [-1, 1],
        4: [0, -1],
        5: [0, 1],
        6: [1, -1],
        7: [1, 1],
        8: [1, 0],
      } as Record<number, [number, number]>
    )[d8] ?? [0, 0],
    direction = team === "home" ? 1 : -1,
    diagonal = forward !== 0 && lateral !== 0,
    forwardGetsRemainder = d8 === 2 || d8 === 7,
    forwardMagnitude = diagonal
      ? Math.floor(magnitude / 2) + (forwardGetsRemainder ? magnitude % 2 : 0)
      : magnitude,
    lateralMagnitude = diagonal ? magnitude - forwardMagnitude : magnitude;
  return {
    x: target.x + forward * direction * forwardMagnitude,
    y: target.y + lateral * lateralMagnitude,
  };
}
function record(
  s: Match,
  text: string,
  kind: Event["kind"] = "info",
  dice?: number,
  resolution?: Event["resolution"],
) {
  s.log.push({
    id: (s.log.at(-1)?.id ?? 0) + 1,
    turn: s.turn,
    text,
    kind,
    ...(dice === undefined ? {} : { dice }),
    ...(resolution === undefined ? {} : { resolution }),
  });
  s.log = s.log.slice(-150);
}
function next(s: Match, team = other(s.active)) {
  s.active = team;
  s.turn++;
  s.setup = false;
  s.testSetup = false;
  s.phase = "action";
  s.actionStage = "ball-carrier";
  s.movementStage = "attack-opponent";
  s.moved = [];
  s.movementSpent = {};
  s.movementStageUsed = {};
  s.movementHalved = [];
  s.actionSpent = [];
  s.resolvedBlocks = [];
  s.pendingPass = null;
  s.pendingShot = false;
  s.pendingFoul = null;
  s.pendingShotTarget = null;
  s.pendingGoalkeeperShot = null;
  s.challengedBall = null;
  s.oneTouch = null;
  s.foulRestart = null;
  s.setPieceRestart = null;
  record(s, `${TEAM_NAMES[team]} to play.`);
}
function beginTurnWithPossession(s: Match, player: Player) {
  s.possession = player.id;
  s.ball = { x: player.x, y: player.y };
  next(s, player.team);
}
function restartLabel(kind: SetPieceRestart["kind"]) {
  return kind === "corner"
    ? "Corner"
    : kind === "throw-in"
      ? "Throw-in"
      : "Goal-kick";
}
function beginSetPiece(
  s: Match,
  kind: SetPieceRestart["kind"],
  team: Team,
  position: Point,
) {
  next(s, team);
  const restartPosition = {
    x: Math.max(0, Math.min(WIDTH - 1, position.x)),
    y: Math.max(0, Math.min(HEIGHT - 1, position.y)),
  };
  s.setup = true;
  s.possession = null;
  s.ball = { ...restartPosition };
  s.setPieceRestart = {
    kind,
    team,
    position: restartPosition,
    takerId: null,
    setupStage: "attackers",
  };
  record(
    s,
    `${restartLabel(kind)} to ${TEAM_NAMES[team]}. Reposition the footballers and choose a player to take the ball.`,
  );
}
function beginOutRestart(s: Match, lastTouch: Team, outside: Point) {
  const restartTeam = other(lastTouch);
  if (outside.y < 0 || outside.y >= HEIGHT) {
    beginSetPiece(s, "throw-in", restartTeam, {
      x: Math.max(0, Math.min(WIDTH - 1, outside.x)),
      y: outside.y < 0 ? 0 : HEIGHT - 1,
    });
    return;
  }
  const crossedHomeGoalLine = outside.x < 0,
    defendingTeam: Team = crossedHomeGoalLine ? "home" : "away";
  if (lastTouch === defendingTeam) {
    beginSetPiece(s, "corner", restartTeam, {
      x: crossedHomeGoalLine ? 0 : WIDTH - 1,
      y: outside.y < HEIGHT / 2 ? 0 : HEIGHT - 1,
    });
  } else {
    beginSetPiece(s, "goal-kick", restartTeam, {
      x: crossedHomeGoalLine ? 0 : WIDTH - 1,
      y: Math.max(
        GOAL_START_Y,
        Math.min(GOAL_START_Y + GOAL_WIDTH - 1, outside.y),
      ),
    });
  }
}
const GOAL_START_Y = HEIGHT / 2 - GOAL_WIDTH / 2;
function closestGoalTarget(shooter: Player): GoalTarget {
  return {
    row: 0,
    column: Math.max(
      0,
      Math.min(GOAL_WIDTH - 1, Math.round(shooter.y - GOAL_START_Y)),
    ),
  };
}
export function goalTargetDistance(a: GoalTarget, b: GoalTarget) {
  return Math.abs(a.row - b.row) + Math.abs(a.column - b.column);
}
export function goalTargetThreshold(closest: GoalTarget, target: GoalTarget) {
  return goalTargetDistance(closest, target) * 5;
}
export function isLegalGoalTarget(
  pending: PendingShotTarget,
  target: GoalTarget,
) {
  return (
    Number.isInteger(target.row) &&
    target.row >= 0 &&
    target.row < 3 &&
    Number.isInteger(target.column) &&
    target.column >= 0 &&
    target.column < GOAL_WIDTH &&
    goalTargetDistance(pending.closest, target) <= pending.maxDistance
  );
}
export function goalTargetPoint(shooter: Player, target: GoalTarget): Point {
  return {
    x: shooter.team === "home" ? WIDTH - 1 : 0,
    y: GOAL_START_Y + target.column,
  };
}
function isOnOwnGoalLine(player: Player) {
  return player.team === "home" ? player.x <= 1 : player.x >= WIDTH - 2;
}
export function goalTargetReachDistance(player: Player, target: GoalTarget) {
  return Math.abs(player.y - (GOAL_START_Y + target.column)) + target.row;
}
export function goalTargetReachDifficulty(player: Player, target: GoalTarget) {
  return Math.min(
    500,
    (player.role === "Goalkeeper" ? 10 : 33) *
      goalTargetReachDistance(player, target),
  );
}
export function goalTargetName(target: GoalTarget) {
  return `${["low", "middle", "high"][target.row]} target ${target.column + 1}`;
}
function restartAfterGoal(s: Match, scoringTeam: Team) {
  const opponent = other(scoringTeam),
    lineup = s.kickoffLineups[opponent],
    retainedDiscipline = structuredClone(s.discipline),
    result = matchResultForScore(s.score, s.winningCondition);
  if (result) {
    s.winner = result;
    record(
      s,
      result === "draw"
        ? "The match ends in a draw."
        : `${TEAM_NAMES[result]} win the match.`,
    );
    return;
  }
  s.players = playersFromLineup(opponent, lineup);
  s.discipline = Object.fromEntries(
    s.players.map((player) => [
      player.id,
      retainedDiscipline[player.id] ?? { yellowCards: 0, sentOff: false },
    ]),
  );
  let kickoff = s.players.find((player) => player.id === lineup.bearerId)!;
  if (isSentOff(s, kickoff)) {
    const replacement = s.players.find(
      (player) => player.team === opponent && !isSentOff(s, player),
    );
    if (!replacement)
      throw new Error(`${TEAM_NAMES[opponent]} have no player available.`);
    const replacementPosition = { x: replacement.x, y: replacement.y };
    Object.assign(replacement, { x: kickoff.x, y: kickoff.y });
    Object.assign(kickoff, replacementPosition);
    kickoff = replacement;
  }
  s.possession = kickoff.id;
  s.ball = { x: kickoff.x, y: kickoff.y };
  next(s, opponent);
  s.setup = true;
}
function awardGoal(
  s: Match,
  shooter: Player,
  text: string,
  dice: number,
  resolution: NonNullable<Event["resolution"]>,
) {
  s.pendingShotTarget = null;
  s.pendingGoalkeeperShot = null;
  s.score[shooter.team]++;
  record(s, `GOOOL! ${text}`, "goal", dice, {
    ...resolution,
    outcome: "Goal",
  });
  restartAfterGoal(s, shooter.team);
}
function shotInterceptors(
  s: Match,
  shooter: Player,
  target: GoalTarget,
  lob: boolean,
) {
  const targetPoint = goalTargetPoint(shooter, target);
  return s.players
    .filter(
      (player) =>
        player.team !== shooter.team &&
        !isSentOff(s, player) &&
        !isOnOwnGoalLine(player) &&
        !s.resolvedBlocks.includes(blockKey(shooter, player)) &&
        segmentIntersectsReachZone(shooter, targetPoint, player) &&
        (!lob || distance(shooter, player) <= 2),
    )
    .sort((a, b) => distance(shooter, a) - distance(shooter, b));
}
function resolveShotTarget(
  s: Match,
  shooter: Player,
  attempt: ShotAttempt,
  target: GoalTarget,
  allowInterception = true,
) {
  const targetName = goalTargetName(target);
  if (allowInterception)
    for (const defender of shotInterceptors(s, shooter, target, attempt.lob)) {
      const defenderSkill = interceptionSkill(defender),
        defenderDice = roll(s),
        defenderScore = actionScore(defenderDice, defenderSkill),
        intercepted = defenderScore >= attempt.score,
        contest: ContestResolution = {
          actor: {
            playerId: shooter.id,
            name: shooter.name,
            team: shooter.team,
            skillLabel: attempt.label,
            skill: attempt.skill,
            dice: attempt.dice,
            score: attempt.score,
          },
          opponent: {
            playerId: defender.id,
            name: defender.name,
            team: defender.team,
            skillLabel:
              defender.role === "Goalkeeper" && isInOwnPenaltyArea(defender)
                ? "Intercept +20"
                : "Intercept",
            skill: defenderSkill,
            dice: defenderDice,
            score: defenderScore,
          },
          winnerId: intercepted ? defender.id : shooter.id,
        };
      record(
        s,
        `${defender.name} ${intercepted ? "intercepts" : "cannot intercept"} ${shooter.name}’s shot to the ${targetName}: ${defenderScore} vs ${attempt.score}.`,
        "dice",
        defenderDice,
        {
          label: "Shot interception",
          difficulty: attempt.score,
          skill: defenderSkill,
          dice: defenderDice,
          score: defenderScore,
          result: defenderScore - attempt.score,
          outcome: intercepted ? "Intercepted" : "Beaten",
          contest,
        },
      );
      if (intercepted) {
        beginTurnWithPossession(s, defender);
        return;
      }
    }
  const goalLineDefenders = s.players
      .filter(
        (player) =>
          player.team !== shooter.team &&
          !isSentOff(s, player) &&
          isOnOwnGoalLine(player),
      )
      .sort(
        (a, b) =>
          (a.role === "Goalkeeper" ? -1 : 1) -
            (b.role === "Goalkeeper" ? -1 : 1) ||
          goalTargetReachDistance(a, target) -
            goalTargetReachDistance(b, target),
      ),
    defender = goalLineDefenders[0];
  if (!defender) {
    awardGoal(
      s,
      shooter,
      `${shooter.name} finds the ${targetName}; nobody is defending the goal line.`,
      attempt.dice,
      {
        label: attempt.label,
        difficulty: attempt.difficulty,
        skill: attempt.skill,
        dice: attempt.dice,
        score: attempt.score,
        result: attempt.result,
        outcome: "Goal",
      },
    );
    return;
  }
  const goalkeeper = defender.role === "Goalkeeper",
    reachSkill = goalkeeper ? defender.reach : defender.intercept,
    reachDifficulty = goalTargetReachDifficulty(defender, target);
  if (goalkeeper) {
    s.pendingGoalkeeperShot = {
      stage: "reach",
      shooterId: shooter.id,
      goalkeeperId: defender.id,
      attempt,
      target,
      difficulty: reachDifficulty,
    };
    return;
  }
  const reachDice = roll(s),
    reachScore = actionScore(reachDice, reachSkill),
    reached = reachScore >= reachDifficulty;
  record(
    s,
    `${defender.name}: ${goalkeeper ? "reach" : "goal-line intercept"} ${reachScore} vs ${reachDifficulty} for the ${targetName}.`,
    "dice",
    reachDice,
    {
      label: "Goal-line intercept",
      difficulty: reachDifficulty,
      skill: reachSkill,
      dice: reachDice,
      score: reachScore,
      result: reachScore - reachDifficulty,
      outcome: reached ? "Reached" : "Failed",
    },
  );
  if (!reached) {
    awardGoal(
      s,
      shooter,
      `${defender.name} cannot reach the shot.`,
      reachDice,
      {
        label: "Goal-line intercept",
        difficulty: reachDifficulty,
        skill: reachSkill,
        dice: reachDice,
        score: reachScore,
        result: reachScore - reachDifficulty,
        outcome: "Goal",
      },
    );
    return;
  }
  record(
    s,
    `${defender.name} stops the shot on the goal line and takes possession.`,
    "dice",
    reachDice,
    {
      label: "Goal-line intercept",
      difficulty: reachDifficulty,
      skill: reachSkill,
      dice: reachDice,
      score: reachScore,
      result: reachScore - reachDifficulty,
      outcome: "Stopped",
    },
  );
  beginTurnWithPossession(s, defender);
}
function resolveGoalkeeperShot(s: Match) {
  const pending = s.pendingGoalkeeperShot;
  if (!pending)
    throw new Error("There is no goalkeeper action waiting to be resolved.");
  const shooter = s.players.find((player) => player.id === pending.shooterId),
    goalkeeper = s.players.find((player) => player.id === pending.goalkeeperId);
  if (!shooter || !goalkeeper || goalkeeper.role !== "Goalkeeper")
    throw new Error("The pending goalkeeper action is no longer valid.");
  if (pending.stage === "reach") {
    const reachDice = roll(s),
      reachScore = actionScore(reachDice, goalkeeper.reach),
      reached = reachScore >= pending.difficulty,
      targetName = goalTargetName(pending.target);
    record(
      s,
      `${goalkeeper.name}: reach ${reachScore} vs ${pending.difficulty} for the ${targetName}.`,
      "dice",
      reachDice,
      {
        label: "Reach",
        difficulty: pending.difficulty,
        skill: goalkeeper.reach,
        dice: reachDice,
        score: reachScore,
        result: reachScore - pending.difficulty,
        outcome: reached ? "Reached" : "Failed",
      },
    );
    if (!reached) {
      s.pendingGoalkeeperShot = null;
      awardGoal(
        s,
        shooter,
        `${goalkeeper.name} cannot reach the shot.`,
        reachDice,
        {
          label: "Reach",
          difficulty: pending.difficulty,
          skill: goalkeeper.reach,
          dice: reachDice,
          score: reachScore,
          result: reachScore - pending.difficulty,
          outcome: "Goal",
        },
      );
      return;
    }
    s.pendingGoalkeeperShot = {
      ...pending,
      stage: "power",
    };
    return;
  }
  if (pending.stage === "power") {
    const powerSkill = pending.attempt.header
        ? shooter.headerPower
        : shooter.shotPower,
      powerDice = roll(s),
      powerAction = actionScore(powerDice, powerSkill),
      power = Math.round(
        (powerAction * (100 - pending.attempt.difficulty)) / 100,
      );
    record(
      s,
      `${shooter.name}: ${pending.attempt.header ? "header" : "shot"} power ${power} (${powerAction} at difficulty ${pending.attempt.difficulty}).`,
      "dice",
      powerDice,
      {
        label: pending.attempt.header ? "Header power" : "Shot power",
        difficulty: 0,
        skill: powerSkill,
        dice: powerDice,
        score: powerAction,
        result: power,
        outcome: `Power ${power}`,
      },
    );
    s.pendingGoalkeeperShot = {
      ...pending,
      stage: "catch",
      difficulty: power,
      power,
    };
    return;
  }
  const power = pending.power ?? pending.difficulty,
    catchDice = roll(s),
    catchScore = actionScore(catchDice, goalkeeper.catch),
    powerResolution = [...s.log]
      .reverse()
      .find(
        (event) =>
          event.turn === s.turn &&
          (event.resolution?.label === "Shot power" ||
            event.resolution?.label === "Header power"),
      )?.resolution,
    catchContest: ContestResolution = {
      actor: {
        playerId: shooter.id,
        name: shooter.name,
        team: shooter.team,
        skillLabel: pending.attempt.header ? "Header power" : "Shot power",
        skill: pending.attempt.header ? shooter.headerPower : shooter.shotPower,
        dice: powerResolution?.dice,
        score: power,
      },
      opponent: {
        playerId: goalkeeper.id,
        name: goalkeeper.name,
        team: goalkeeper.team,
        skillLabel: "Catch",
        skill: goalkeeper.catch,
        dice: catchDice,
        score: catchScore,
      },
      winnerId: catchScore < power ? shooter.id : goalkeeper.id,
    };
  s.pendingGoalkeeperShot = null;
  if (catchScore < power) {
    awardGoal(
      s,
      shooter,
      `${goalkeeper.name} cannot catch the ball.`,
      catchDice,
      {
        label: "Catch",
        difficulty: power,
        skill: goalkeeper.catch,
        dice: catchDice,
        score: catchScore,
        result: catchScore - power,
        outcome: "Goal",
        contest: catchContest,
      },
    );
  } else if (catchScore >= power * 2) {
    record(
      s,
      `${goalkeeper.name} catches the shot (${catchScore} vs ${power * 2}) and starts a new turn.`,
      "dice",
      catchDice,
      {
        label: "Catch",
        difficulty: power * 2,
        skill: goalkeeper.catch,
        dice: catchDice,
        score: catchScore,
        result: catchScore - power * 2,
        outcome: "Caught",
        contest: catchContest,
      },
    );
    beginTurnWithPossession(s, goalkeeper);
  } else {
    record(
      s,
      `${goalkeeper.name} deflects the shot out for a corner (${catchScore} vs ${power}).`,
      "dice",
      catchDice,
      {
        label: "Catch",
        difficulty: power,
        skill: goalkeeper.catch,
        dice: catchDice,
        score: catchScore,
        result: catchScore - power,
        outcome: "Corner",
        contest: catchContest,
      },
    );
    const targetPoint = goalTargetPoint(shooter, pending.target);
    beginSetPiece(s, "corner", shooter.team, {
      x: shooter.team === "home" ? WIDTH - 1 : 0,
      y: targetPoint.y < HEIGHT / 2 ? 0 : HEIGHT - 1,
    });
  }
}
function continueWithAttackers(s: Match) {
  s.phase = "action";
  s.actionStage = "attackers";
}
function advanceActionStage(s: Match) {
  s.pendingPass = null;
  s.pendingShot = false;
  s.pendingFoul = null;
  s.pendingShotTarget = null;
  s.pendingGoalkeeperShot = null;
  s.challengedBall = null;
  if (s.actionStage === "ball-carrier") {
    s.actionStage = "attackers";
    record(s, "Other attackers’ action phase.");
  } else if (s.actionStage === "attackers") {
    s.actionStage = "defenders";
    record(s, "Defenders’ action phase.");
  } else {
    s.phase = "movement";
    s.movementStage = "attack-opponent";
    record(
      s,
      "Movement phase. Move each footballer once, up to their allowance.",
    );
  }
}
function skipUnavailableActionStages(s: Match): Match {
  while (
    !s.winner &&
    !s.setup &&
    s.phase === "action" &&
    !s.oneTouch &&
    !s.pendingFoul &&
    !s.pendingShotTarget &&
    !s.pendingGoalkeeperShot &&
    !s.players.some((player) => canAct(s, player))
  )
    advanceActionStage(s);
  return s;
}
function applyOneOnOneAftermath(
  s: Match,
  actor: Player,
  opponent: Player,
  loser: Player,
) {
  if (s.possession === actor.id) s.ball = { x: actor.x, y: actor.y };
  else if (s.possession === opponent.id)
    s.ball = { x: opponent.x, y: opponent.y };
  if (!s.movementHalved.includes(loser.id)) s.movementHalved.push(loser.id);
}
function isLastDefender(s: Match, offender: Player) {
  if (offender.role === "Goalkeeper") return false;
  const closerToOwnGoal = (player: Player) =>
    offender.team === "home" ? player.x < offender.x : player.x > offender.x;
  return !s.players.some(
    (player) =>
      player.id !== offender.id &&
      player.team === offender.team &&
      player.role !== "Goalkeeper" &&
      !isSentOff(s, player) &&
      closerToOwnGoal(player),
  );
}
function queueFoul(
  s: Match,
  offender: Player,
  victim: Player,
  foul: FoulRoll,
  actionLabel: string,
) {
  s.pendingFoul = {
    stage: foul.d100 === undefined && foul.card ? "card-color" : "card-check",
    offenderId: offender.id,
    victimId: victim.id,
    actionLabel,
    foul,
  };
  record(
    s,
    `FOUL! The referee stops play after ${offender.name} fouls ${victim.name}. Resolve the ${s.pendingFoul.stage === "card-check" ? "foul card" : "card colour"} dice.`,
    "dice",
    foul.cardD6 ?? foul.foulD6 ?? foul.d100,
    {
      label: "Foul",
      difficulty: 9,
      skill: 100,
      dice: foul.cardD6 ?? foul.foulD6 ?? foul.d100,
      outcome: "Whistle · Resolution paused",
    },
  );
}
function resolveFoul(
  s: Match,
  offender: Player,
  victim: Player,
  foul: FoulRoll,
  actionLabel: string,
) {
  const victimPosition = { x: victim.x, y: victim.y },
    repeatedRestart = s.foulRestart ? structuredClone(s.foulRestart) : null,
    lastDefender = isLastDefender(s, offender),
    discipline = disciplineFor(s, offender),
    cardColor = foul.card ? (foul.cardD6! <= 4 ? "yellow" : "red") : null;
  if (cardColor === "yellow") discipline.yellowCards++;
  if (cardColor === "red" || discipline.yellowCards >= 2 || lastDefender)
    discipline.sentOff = true;
  s.discipline[offender.id] = discipline;
  const restartKind = isInPenaltyAreaForTeam(victim, offender.team)
      ? "penalty"
      : "free-kick",
    restart: FoulRestart = repeatedRestart ?? {
      kind: restartKind,
      team: victim.team,
      position:
        restartKind === "penalty"
          ? penaltyTakerPositions(victim.team)[0]
          : { x: victim.x, y: victim.y },
      fouledPlayerId: victim.id,
      offenderId: offender.id,
      takerId: null,
      setupStage: "attackers",
    },
    cardText = lastDefender
      ? `${offender.name} is sent off as the last defender.`
      : !foul.card
        ? "No card."
        : discipline.sentOff
          ? cardColor === "red"
            ? `${offender.name} is shown a red card and sent off.`
            : `${offender.name} receives a second yellow card and is sent off.`
          : `${offender.name} is shown a yellow card.`;
  next(s, victim.team);
  s.possession = null;
  s.ball = { ...restart.position };
  const restartOccupant = s.players.find(
    (player) =>
      player.id !== victim.id &&
      player.x === restart.position.x &&
      player.y === restart.position.y,
  );
  if (restartOccupant) Object.assign(restartOccupant, victimPosition);
  Object.assign(victim, restart.position);
  restart.takerId = null;
  restart.setupStage = "attackers";
  s.foulRestart = restart;
  s.setup = true;
  const rollText =
    foul.d100 === undefined
      ? "voluntary foul"
      : `D100 ${foul.d100}; foul D6 ${foul.foulD6}`;
  record(
    s,
    `${offender.name} fouls ${victim.name} during ${actionLabel.toLowerCase()} (${rollText}). ${cardText}${foul.card ? ` Card D6 ${foul.cardD6}.` : ""} ${repeatedRestart ? "The restart is repeated." : `${restartKind === "penalty" ? "Penalty" : "Free-kick"} to ${TEAM_NAMES[victim.team]} at (${restart.position.x}, ${restart.position.y}).`}`,
    "dice",
    foul.d100,
    {
      label: "Foul",
      difficulty: 9,
      skill: 100,
      dice: foul.d100,
      score: undefined,
      outcome: discipline.sentOff
        ? "Foul · Sent off"
        : cardColor === "yellow"
          ? "Foul · Yellow card"
          : "Foul",
      discipline: {
        playerId: offender.id,
        card: cardColor,
        yellowCards: discipline.yellowCards,
        sentOff: discipline.sentOff,
      },
    },
  );
}
/** All mutations flow through commands; rejected commands leave the input untouched. */
export function applyCommand(input: Match, command: Command): Match {
  if (command.type === "set-winning-condition") {
    if (!WINNING_CONDITIONS.some(({ id }) => id === command.condition))
      throw new Error("Unknown winning condition.");
    const s: Match = structuredClone(input);
    s.winningCondition = command.condition;
    s.winner = matchResultForScore(s.score, command.condition);
    if (s.winner)
      record(
        s,
        s.winner === "draw"
          ? "The selected winning condition makes this match a draw."
          : `${TEAM_NAMES[s.winner]} win under the selected winning condition.`,
      );
    return s;
  }
  if (command.type === "unlock-positions") {
    const s: Match = structuredClone(input),
      previouslySentOff = new Set(
        s.players
          .filter((player) => isSentOff(s, player))
          .map((player) => player.id),
      ),
      currentBearer = possessor(s),
      bearer =
        currentBearer ??
        s.players
          .filter((player) => player.team === s.active)
          .sort((a, b) => distance(a, s.ball) - distance(b, s.ball))[0];
    if (!bearer) throw new Error("A ball bearer is required to restart play.");
    const occupied = new Set<string>();
    for (const player of [...s.players].sort(
      (a, b) =>
        Number(previouslySentOff.has(a.id)) -
        Number(previouslySentOff.has(b.id)),
    )) {
      const key = `${player.x},${player.y}`;
      if (!occupied.has(key)) {
        occupied.add(key);
        continue;
      }
      const available: Point[] = [];
      for (let x = 0; x < WIDTH; x++)
        for (let y = 0; y < HEIGHT; y++)
          if (!occupied.has(`${x},${y}`)) available.push({ x, y });
      available.sort(
        (a, b) =>
          distance(a, player) - distance(b, player) || a.x - b.x || a.y - b.y,
      );
      Object.assign(player, available[0]);
      occupied.add(`${player.x},${player.y}`);
    }
    s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
    s.turn = 1;
    s.active = bearer.team;
    s.setup = true;
    s.testSetup = true;
    s.phase = "action";
    s.actionStage = "ball-carrier";
    s.movementStage = "attack-opponent";
    s.possession = bearer.id;
    s.ball = { x: bearer.x, y: bearer.y };
    s.score = { home: 0, away: 0 };
    s.moved = [];
    s.movementSpent = {};
    s.movementStageUsed = {};
    s.movementHalved = [];
    s.actionSpent = [];
    s.resolvedBlocks = [];
    s.discipline = Object.fromEntries(
      s.players.map((player) => [
        player.id,
        { yellowCards: 0, sentOff: false },
      ]),
    );
    s.pendingFoul = null;
    s.foulRestart = null;
    s.setPieceRestart = null;
    s.pendingPass = null;
    s.pendingShot = false;
    s.pendingShotTarget = null;
    s.pendingGoalkeeperShot = null;
    s.challengedBall = null;
    s.oneTouch = null;
    s.winner = null;
    s.log = [
      {
        id: 1,
        turn: 1,
        kind: "info",
        text: "Testing setup unlocked. Arrange the footballers and restart play from this position.",
      },
    ];
    return s;
  }
  if (input.winner)
    throw new Error("The match has finished. Start a new match to play again.");
  const s: Match = structuredClone(input);
  if (command.type === "apply-formation") {
    if (
      !s.setup ||
      s.testSetup ||
      !!s.setPieceRestart ||
      !TACTICAL_FORMATIONS.includes(command.formation)
    )
      throw new Error(
        "Tactical formations can only be applied during kick-off setup.",
      );
    const bearerId =
      command.team === s.active
        ? (s.possession ?? s.kickoffLineups[command.team].bearerId)
        : s.kickoffLineups[command.team].bearerId;
    for (const kickoffTeam of ["home", "away"] as const) {
      Object.assign(
        s.kickoffLineups[kickoffTeam].positions,
        tacticalFormationPositions(
          command.team,
          command.formation,
          bearerId,
          kickoffTeam === command.team,
        ),
      );
      if (kickoffTeam === command.team)
        s.kickoffLineups[kickoffTeam].bearerId = bearerId;
    }
    const currentPositions = tacticalFormationPositions(
      command.team,
      command.formation,
      bearerId,
      command.team === s.active,
    );
    for (const player of s.players.filter(
      (candidate) => candidate.team === command.team,
    ))
      Object.assign(player, currentPositions[player.id]);
    if (s.possession) {
      const bearer = possessor(s);
      if (bearer) s.ball = { x: bearer.x, y: bearer.y };
    }
    return s;
  }
  if (command.type === "reposition") {
    const player = s.players.find(
      (candidate) => candidate.id === command.playerId,
    );
    if (!player || !canReposition(s, player, command.to))
      throw new Error(
        s.foulRestart
          ? "Place an eligible footballer in any empty field cell. The fouled footballer must remain on the restart position."
          : s.setPieceRestart
            ? "Place the footballer in an empty cell. Goalkeepers must stay on their goal line, and only the restarting squad can occupy the ball position."
            : s.testSetup
              ? "Place the footballer in an empty field cell."
              : "Place the footballer in an empty cell in their own half. The goalkeeper must stay on the last row in front of goal. The ball bearer must remain on the center dot and every other player must remain outside the center circle.",
      );
    const previousPosition = { x: player.x, y: player.y };
    if (s.foulRestart) {
      Object.assign(player, command.to);
      if (s.possession === player.id) s.ball = { ...command.to };
      return s;
    }
    if (s.setPieceRestart) {
      Object.assign(player, command.to);
      return s;
    }
    if (
      !s.testSetup &&
      player.id !== s.possession &&
      isKickoffPosition(command.to, player.team)
    ) {
      const previousBearer = possessor(s);
      if (!previousBearer || player.team !== s.active)
        throw new Error(
          "Only the team taking kick-off can enter the center circle.",
        );
      Object.assign(previousBearer, previousPosition);
      s.possession = player.id;
    }
    Object.assign(player, command.to);
    if (s.possession === player.id) s.ball = { ...command.to };
    if (!s.testSetup) {
      const bearer = possessor(s)!;
      s.kickoffLineups[s.active] = lineupFromPlayers(s.players, bearer.id);
      const nextTeam = other(s.active);
      s.kickoffLineups[nextTeam] = oppositeKickoffLineup(
        s.players,
        bearer.id,
        nextTeam,
        s.kickoffLineups[nextTeam],
      );
    }
    return s;
  }
  if (command.type === "take-restart") {
    const restart = s.foulRestart ?? s.setPieceRestart,
      player = s.players.find((candidate) => candidate.id === command.playerId);
    if (!s.setup || !restart || !player || !canTakeSetPiece(s, player))
      throw new Error(
        "Place a footballer from the restarting squad on the ball first.",
      );
    s.possession = player.id;
    restart.takerId = player.id;
    if (
      "takerId" in restart &&
      (restart.kind === "goal-kick" || restart.kind === "penalty")
    )
      restart.position = { x: player.x, y: player.y };
    s.ball = { ...restart.position };
    record(s, `${player.name} takes the ball for the restart.`);
    return s;
  }
  if (command.type === "start") {
    if (!s.setup) throw new Error("The match has already started.");
    const bearer = possessor(s);
    if (!bearer || bearer.team !== s.active)
      throw new Error(
        s.setPieceRestart || s.foulRestart
          ? "The restarting squad must place a footballer on the ball and take possession."
          : "The team taking kick-off needs a ball bearer.",
      );
    if (s.foulRestart) {
      if (
        bearer.id !== s.foulRestart.takerId ||
        bearer.x !== s.foulRestart.position.x ||
        bearer.y !== s.foulRestart.position.y
      )
        throw new Error(
          "The selected free-kick taker must keep possession at the restart position.",
        );
      if (!penaltySetupIsLegal(s))
        throw new Error(
          s.foulRestart.setupStage === "attackers"
            ? "Only the penalty taker may remain inside the penalty area or penalty arc."
            : "Only the defending goalkeeper may remain inside the penalty area or penalty arc.",
        );
      if (s.foulRestart.setupStage === "attackers") {
        s.foulRestart.setupStage = "defenders";
        return s;
      }
      if (
        s.foulRestart.kind === "free-kick" &&
        s.players.some(
          (player) =>
            player.team !== s.foulRestart!.team &&
            !isSentOff(s, player) &&
            distance(player, s.foulRestart!.position) < 10,
        )
      )
        throw new Error(
          "Every defender must be at least 10 yards from the ball.",
        );
      s.setup = false;
      record(
        s,
        `${s.foulRestart.kind === "penalty" ? "Penalty" : "Free-kick"} setup confirmed. ${bearer.name} has the ball.`,
      );
      return s;
    }
    if (s.setPieceRestart) {
      if (
        bearer.id !== s.setPieceRestart.takerId ||
        bearer.x !== s.setPieceRestart.position.x ||
        bearer.y !== s.setPieceRestart.position.y
      )
        throw new Error(
          "The restarting footballer must take possession at the restart position.",
        );
      if (s.setPieceRestart.setupStage === "attackers") {
        s.setPieceRestart.setupStage = "defenders";
        return s;
      }
      s.setup = false;
      record(
        s,
        `${restartLabel(s.setPieceRestart.kind)} setup confirmed. ${bearer.name} has the ball.`,
      );
      return s;
    }
    if (s.testSetup) {
      s.setup = false;
      s.testSetup = false;
      record(s, `Testing restart. ${TEAM_NAMES[s.active]} have the ball.`);
      return skipUnavailableActionStages(s);
    }
    if (
      !isKickoffPosition(bearer, s.active) ||
      !isKickoffPosition(s.ball, s.active) ||
      s.ball.x !== bearer.x ||
      s.ball.y !== bearer.y
    )
      throw new Error(
        "Place the ball bearer on the center dot before starting.",
      );
    const nextTeam = other(s.active);
    s.kickoffLineups[nextTeam] = oppositeKickoffLineup(
      s.players,
      bearer.id,
      nextTeam,
      s.kickoffLineups[nextTeam],
    );
    s.kickoffLineups[s.active] = lineupFromPlayers(s.players, bearer.id);
    s.setup = false;
    s.testSetup = false;
    record(s, `Kick-off. ${TEAM_NAMES[s.active]} have the ball.`);
    return skipUnavailableActionStages(s);
  }
  if (s.setup)
    throw new Error("Confirm the kick-off positions before playing.");
  if (command.type === "resolve-foul") {
    const pending = s.pendingFoul,
      offender = pending
        ? s.players.find((player) => player.id === pending.offenderId)
        : undefined,
      victim = pending
        ? s.players.find((player) => player.id === pending.victimId)
        : undefined;
    if (!pending || !offender || !victim)
      throw new Error("There is no foul waiting to be resolved.");
    if (pending.stage === "card-check" && pending.foul.card) {
      pending.stage = "card-color";
      record(
        s,
        `The foul die is ${pending.foul.foulD6}: ${offender.name} will receive a card. Roll for its colour.`,
        "dice",
        pending.foul.foulD6,
        {
          label: "Foul card check",
          difficulty: 0,
          skill: 100,
          dice: pending.foul.foulD6,
          outcome: "Card",
        },
      );
      return s;
    }
    if (pending.stage === "card-color") pending.foul.cardD6 = rollD6(s);
    s.pendingFoul = null;
    resolveFoul(s, offender, victim, pending.foul, pending.actionLabel);
    return skipUnavailableActionStages(s);
  }
  if (s.pendingFoul)
    throw new Error("Resolve the referee’s foul decision before continuing.");
  if (command.type === "select-shot-target") {
    const pending = s.pendingShotTarget,
      shooter = pending
        ? s.players.find((player) => player.id === pending.shooterId)
        : undefined;
    if (!pending || !shooter || !isLegalGoalTarget(pending, command.target))
      throw new Error("Choose one of the available goal targets.");
    s.pendingShotTarget = null;
    record(
      s,
      `${shooter.name} aims at the ${goalTargetName(command.target)} (${goalTargetThreshold(pending.closest, command.target)} placement points).`,
    );
    resolveShotTarget(
      s,
      shooter,
      pending.attempt,
      command.target,
      pending.allowInterception,
    );
    return skipUnavailableActionStages(s);
  }
  if (s.pendingShotTarget)
    throw new Error("Choose the shot’s goal target before continuing.");
  if (command.type === "resolve-goalkeeper-shot") {
    resolveGoalkeeperShot(s);
    return skipUnavailableActionStages(s);
  }
  if (s.pendingGoalkeeperShot)
    throw new Error("Roll the goalkeeper’s dice before continuing.");
  const ballPlayer = possessor(s),
    ball = ballPosition(s);
  if (command.type === "advance") {
    if (s.setPieceRestart)
      throw new Error(
        `Complete the ${restartLabel(s.setPieceRestart.kind).toLowerCase()} before continuing.`,
      );
    if (s.foulRestart)
      throw new Error(
        `Complete the ${s.foulRestart.kind === "penalty" ? "penalty" : "free-kick"} before continuing.`,
      );
    if (s.pendingFoul)
      throw new Error("Resolve the referee’s foul decision before continuing.");
    if (s.pendingPass)
      throw new Error("Complete the prepared pass before continuing.");
    if (s.pendingShot)
      throw new Error("Complete the prepared shot before continuing.");
    if (s.pendingShotTarget)
      throw new Error("Choose the shot’s goal target before continuing.");
    if (s.pendingGoalkeeperShot)
      throw new Error("Roll the goalkeeper’s dice before continuing.");
    if (s.challengedBall)
      throw new Error("Resolve the challenged ball before continuing.");
    if (s.oneTouch) {
      const opportunity = s.oneTouch,
        player = s.players.find((p) => p.id === opportunity.playerId)!;
      s.oneTouch = null;
      if (opportunity.resume === "new-turn") next(s, player.team);
      else {
        s.phase = "movement";
        s.movementStage = "attack-opponent";
        record(s, `${player.name} declines the one-touch action.`);
      }
      return skipUnavailableActionStages(s);
    }
    if (s.phase === "action") {
      advanceActionStage(s);
    } else if (s.movementStage === "attack-opponent") {
      s.movementStage = "defense";
      record(s, "Defenders’ movement phase.");
    } else if (s.movementStage === "defense") {
      if (isOpponentSide(s.active, ball)) {
        s.movementStage = "attack-own";
        record(s, "Attackers’ remaining own-side movement phase.");
      } else {
        const nextAttackingTeam = ballPlayer?.team ?? s.active;
        next(s, nextAttackingTeam);
      }
    } else {
      // A loose ball does not swap the attacking and defending teams.
      const nextAttackingTeam = ballPlayer?.team ?? s.active;
      next(s, nextAttackingTeam);
    }
    return skipUnavailableActionStages(s);
  }
  if (command.type === "resolve-challenged-ball") {
    const challenge = s.challengedBall,
      receiver = s.players.find((player) => player.id === command.receiverId),
      defender = s.players.find((player) => player.id === command.defenderId);
    if (
      !challenge ||
      !receiver ||
      !defender ||
      challenge.receiverId !== receiver.id ||
      challenge.defenderId !== defender.id ||
      receiver.team === defender.team ||
      !withinReach(receiver, defender)
    )
      throw new Error("That challenged ball is not available now.");
    const receiverSkill = challengedBallSkill(receiver),
      defenderSkill = challengedBallSkill(defender),
      receiverSkillLabel = challengedBallSkillLabel(receiver),
      defenderSkillLabel = challengedBallSkillLabel(defender),
      duel = rollOneOnOne(s, receiverSkill, defenderSkill);
    if (duel.foul) {
      const offender = duel.foul.offender === "actor" ? receiver : defender,
        victim = offender.id === receiver.id ? defender : receiver;
      queueFoul(s, offender, victim, duel.foul, "Challenged ball");
      return s;
    }
    const receiverWon = duel.actorScore > duel.opponentScore!,
      winner = receiverWon ? receiver : defender,
      loser = receiverWon ? defender : receiver,
      contest: ContestResolution = {
        actor: {
          playerId: receiver.id,
          name: receiver.name,
          team: receiver.team,
          skillLabel: receiverSkillLabel,
          skill: receiverSkill,
          dice: duel.actorDice,
          score: duel.actorScore,
        },
        opponent: {
          playerId: defender.id,
          name: defender.name,
          team: defender.team,
          skillLabel: defenderSkillLabel,
          skill: defenderSkill,
          dice: duel.opponentDice!,
          score: duel.opponentScore!,
        },
        winnerId: winner.id,
        ...(duel.rerolls ? { rerolls: duel.rerolls } : {}),
      };
    s.possession = winner.id;
    s.ball = { x: winner.x, y: winner.y };
    if (!s.movementHalved.includes(loser.id)) s.movementHalved.push(loser.id);
    s.actionSpent.push(loser.id);
    s.challengedBall = null;
    record(
      s,
      `${receiver.name}: ${receiverSkillLabel.toLowerCase()} ${duel.actorScore} against ${defender.name}’s ${defenderSkillLabel.toLowerCase()} ${duel.opponentScore}.${duel.rerolls ? ` ${duel.rerolls} tied ${duel.rerolls === 1 ? "round was" : "rounds were"} rerolled.` : ""} ${winner.name} controls the ball and ${loser.name} loses half their movement points.`,
      "dice",
      duel.actorDice,
      {
        label: "Challenged ball",
        difficulty: duel.opponentScore!,
        skill: receiverSkill,
        dice: duel.actorDice,
        score: duel.actorScore,
        result: actionResult(duel.actorScore, duel.opponentScore!),
        outcome: `${winner.name} controls the ball`,
        contest,
      },
    );
    const nextTeam = winner.team !== s.active;
    if (nextTeam) {
      next(s, winner.team);
      s.movementHalved.push(loser.id);
      s.actionSpent.push(loser.id);
    }
    if (!s.moved.includes(winner.id)) s.moved.push(winner.id);
    if (challenge.allowOneTouch) {
      s.oneTouch = {
        playerId: winner.id,
        sourcePass: challenge.sourcePass,
        actions:
          challenge.sourcePass === "low-pass"
            ? ["low-pass", "finish"]
            : ["offensive-header", "defensive-header", "scissors-kick"],
        resume: nextTeam ? "action-attackers" : challenge.resume,
      };
    } else if (!nextTeam) {
      if (challenge.resume === "new-turn") next(s, winner.team);
      else continueWithAttackers(s);
    }
    return skipUnavailableActionStages(s);
  }
  if (command.type === "move") {
    const p = s.players.find((p) => p.id === command.playerId);
    if (!p || !canMove(s, p, command.to))
      throw new Error(
        "Choose an empty highlighted cell within this player’s movement allowance.",
      );
    const blocker = movementBlocker(s, p, command.to);
    if (blocker)
      throw new Error(
        `${p.name} must ${s.possession === p.id ? "dribble" : "slip"} past ${blocker.name} before moving forward.`,
      );
    const length = distance(p, command.to);
    Object.assign(p, command.to);
    if (s.possession === p.id) s.ball = { ...command.to };
    else if (!s.possession && distance(s.ball, command.to) === 0)
      s.possession = p.id;
    if (!s.moved.includes(p.id)) {
      s.moved.push(p.id);
      s.movementStageUsed[p.id] = s.movementStage;
    }
    s.movementSpent[p.id] = (s.movementSpent[p.id] ?? 0) + length;
    record(
      s,
      `${p.name} moved ${length} ${length === 1 ? "yard" : "yards"}.`,
      "move",
    );
    return skipUnavailableActionStages(s);
  }
  if (command.type === "resolve-block") {
    const attacker = s.players.find((p) => p.id === command.playerId),
      defender = s.players.find((p) => p.id === command.defenderId);
    if (
      !attacker ||
      !defender ||
      attacker.team !== s.active ||
      defender.team === attacker.team ||
      !withinReach(attacker, defender) ||
      s.resolvedBlocks.includes(blockKey(attacker, defender))
    )
      throw new Error("Choose a defender currently blocking this footballer.");
    const isFeint = command.kind === "feint",
      isDribble = command.kind === "dribble",
      ballCarrier = s.possession === attacker.id,
      blockedAction = isFeint ? (command.action ?? "pass") : null,
      target = command.to,
      validPassTarget =
        !!target &&
        Number.isInteger(target.x) &&
        Number.isInteger(target.y) &&
        target.x >= 0 &&
        target.x < WIDTH &&
        target.y >= 0 &&
        target.y < HEIGHT &&
        distance(target, attacker) > 0;
    if (
      (isFeint &&
        (s.phase !== "action" ||
          s.actionStage !== "ball-carrier" ||
          !ballCarrier ||
          (blockedAction === "pass"
            ? !validPassTarget || s.pendingShot
            : s.pendingPass !== null || !canShootAtGoal(attacker)))) ||
      (!isFeint &&
        (!target ||
          s.phase !== "movement" ||
          !isForwardMove(attacker, target) ||
          !canMove(s, attacker, target) ||
          (isDribble ? !ballCarrier : ballCarrier)))
    )
      throw new Error("That blocking action is not available now.");
    const actorSkill = isFeint
        ? attacker.feint
        : isDribble
          ? attacker.dribble
          : attacker.slip,
      opponentSkill = command.kind === "slip" ? defender.mark : defender.tackle,
      duel = rollOneOnOne(s, actorSkill, opponentSkill);
    if (duel.foul) {
      const offender = duel.foul.offender === "actor" ? attacker : defender,
        victim = offender.id === attacker.id ? defender : attacker;
      queueFoul(s, offender, victim, duel.foul, command.kind);
      return s;
    }
    const success = duel.actorScore > duel.opponentScore!,
      loser = success ? defender : attacker,
      actorLabel = isFeint ? "Feint" : isDribble ? "Dribble" : "Slip",
      opponentLabel = command.kind === "slip" ? "Mark" : "Tackle",
      contest: ContestResolution = {
        actor: {
          playerId: attacker.id,
          name: attacker.name,
          team: attacker.team,
          skillLabel: actorLabel,
          skill: actorSkill,
          dice: duel.actorDice,
          score: duel.actorScore,
        },
        opponent: {
          playerId: defender.id,
          name: defender.name,
          team: defender.team,
          skillLabel: opponentLabel,
          skill: opponentSkill,
          dice: duel.opponentDice!,
          score: duel.opponentScore!,
        },
        winnerId: success ? attacker.id : defender.id,
        ...(duel.rerolls ? { rerolls: duel.rerolls } : {}),
      };
    if (!success && (isFeint || isDribble)) s.possession = defender.id;
    applyOneOnOneAftermath(s, attacker, defender, loser);
    const failedSlip = command.kind === "slip" && !success;
    if (failedSlip) {
      s.movementHalved = s.movementHalved.filter(
        (playerId) => playerId !== attacker.id,
      );
      s.movementSpent[attacker.id] = movementAllowance(s, attacker);
    }
    if (success) s.resolvedBlocks.push(blockKey(attacker, defender));
    const movementPenalty = failedSlip
      ? `${attacker.name} has no movement points left.`
      : `${loser.name} has ${Math.round(loser.velocity / 20)} movement points.`;
    record(
      s,
      `${attacker.name}: ${actorLabel.toLowerCase()} ${duel.actorScore} against ${defender.name}’s ${opponentLabel.toLowerCase()} ${duel.opponentScore}.${duel.rerolls ? ` ${duel.rerolls} tied ${duel.rerolls === 1 ? "round was" : "rounds were"} rerolled.` : ""} ${movementPenalty} ${success ? `${attacker.name} overcomes the block.` : `${defender.name} wins the contest.`}`,
      "dice",
      duel.actorDice,
      {
        label: actorLabel,
        difficulty: duel.opponentScore!,
        skill: actorSkill,
        dice: duel.actorDice,
        score: duel.actorScore,
        result: actionResult(duel.actorScore, duel.opponentScore!),
        outcome: success ? "Block overcome" : "Blocked",
        contest,
      },
    );
    if (isFeint && success) {
      if (blockedAction === "shoot") {
        s.pendingShot = true;
        return skipUnavailableActionStages(s);
      }
      s.pendingPass = { playerId: attacker.id, to: { ...target! } };
      const passLength = distance(ballPosition(s), target!),
        kind = passKind(passLength),
        skill = kind === "low-pass" ? attacker.lowPass : attacker.highPass,
        automatic =
          blockingDefenders(s, attacker).length === 0 &&
          kind === "low-pass" &&
          passLength <= lowPassAutomaticDistance(skill) &&
          passInterceptors(s, attacker, target!, kind).length === 0;
      if (automatic) return applyCommand(s, { type: "pass", to: target! });
    } else if (!success && (isFeint || isDribble)) {
      next(s, defender.team);
      s.movementHalved.push(loser.id);
    }
    return skipUnavailableActionStages(s);
  }
  if (s.phase !== "action")
    throw new Error("Actions are only available during the action phase.");
  if (command.type === "tackle") {
    const p = s.players.find((p) => p.id === command.playerId);
    if (!p || !canTackle(s, p) || !ballPlayer)
      throw new Error(
        "Select a defender whose reach zone includes the ball carrier.",
      );
    const duel = rollOneOnOne(s, ballPlayer.feint, p.tackle);
    if (duel.foul) {
      const offender = duel.foul.offender === "actor" ? ballPlayer : p,
        victim = offender.id === ballPlayer.id ? p : ballPlayer;
      queueFoul(s, offender, victim, duel.foul, "Tackle");
      return s;
    }
    const attackerDice = duel.actorDice,
      attackerScore = duel.actorScore,
      defenderDice = duel.opponentDice!,
      defenderScore = duel.opponentScore!,
      won = defenderScore > attackerScore,
      contest: ContestResolution = {
        actor: {
          playerId: ballPlayer.id,
          name: ballPlayer.name,
          team: ballPlayer.team,
          skillLabel: "Feint",
          skill: ballPlayer.feint,
          dice: attackerDice,
          score: attackerScore,
        },
        opponent: {
          playerId: p.id,
          name: p.name,
          team: p.team,
          skillLabel: "Tackle",
          skill: p.tackle,
          dice: defenderDice,
          score: defenderScore,
        },
        winnerId: won ? p.id : ballPlayer.id,
        ...(duel.rerolls ? { rerolls: duel.rerolls } : {}),
      };
    const loser = won ? ballPlayer : p;
    if (won) s.possession = p.id;
    applyOneOnOneAftermath(s, ballPlayer, p, loser);
    record(
      s,
      `${p.name}: tackle ${defenderScore} against ${ballPlayer.name}’s feint ${attackerScore}.${duel.rerolls ? ` ${duel.rerolls} tied ${duel.rerolls === 1 ? "round was" : "rounds were"} rerolled.` : ""} ${won ? `Possession won; ${TEAM_NAMES[p.team]} start a new turn.` : "Attacker keeps the ball."} ${loser.name} has ${Math.round(loser.velocity / 20)} movement points.`,
      "dice",
      defenderDice,
      {
        label: "Tackle",
        difficulty: attackerScore,
        skill: p.tackle,
        dice: defenderDice,
        score: defenderScore,
        result: actionResult(defenderScore, attackerScore),
        outcome: won ? "Possession won" : "Attacker keeps the ball",
        contest,
      },
    );
    if (won) {
      next(s, p.team);
      s.movementHalved.push(loser.id);
    } else {
      s.resolvedBlocks.push(blockKey(ballPlayer, p));
      s.phase = "movement";
      s.movementStage = "attack-opponent";
    }
    return skipUnavailableActionStages(s);
  }
  if (command.type === "foul") {
    const offender = s.players.find((player) => player.id === command.playerId);
    if (!offender || !ballPlayer || !canCommitFoul(s, offender))
      throw new Error(
        "Select a defender whose reach zone includes the ball carrier.",
      );
    queueFoul(
      s,
      offender,
      ballPlayer,
      {
        offender: "actor",
        card: true,
      },
      "Voluntary foul",
    );
    return s;
  }
  if (!ballPlayer || ballPlayer.team !== s.active)
    throw new Error("Your team needs possession for that action.");
  if (!s.oneTouch && s.actionStage !== "ball-carrier")
    throw new Error(
      "Ball actions are only available during the ball carrier stage.",
    );
  if (
    command.type === "pass" ||
    command.type === "throw-in" ||
    command.type === "one-touch-pass"
  ) {
    const oneTouchPass = command.type === "one-touch-pass",
      throwIn = command.type === "throw-in",
      opportunity = s.oneTouch,
      restart = s.foulRestart,
      setPiece = s.setPieceRestart;
    if (throwIn && setPiece?.kind !== "throw-in")
      throw new Error("A Throw-in action is only available after an out.");
    if (!throwIn && !oneTouchPass && setPiece?.kind === "throw-in")
      throw new Error("Restart an out with the Throw-in action.");
    if (!oneTouchPass && restart?.kind === "penalty")
      throw new Error("A penalty must be taken as a shot.");
    if (oneTouchPass) {
      if (
        !opportunity ||
        opportunity.playerId !== ballPlayer.id ||
        !opportunity.actions.includes(command.kind)
      )
        throw new Error("That one-touch action is not available.");
    } else if (opportunity)
      throw new Error("Complete or decline the one-touch action first.");
    if (!oneTouchPass) {
      if (s.pendingShot)
        throw new Error("Complete the prepared shot before passing.");
      if (
        s.pendingPass &&
        (s.pendingPass.playerId !== ballPlayer.id ||
          s.pendingPass.to.x !== command.to.x ||
          s.pendingPass.to.y !== command.to.y)
      )
        throw new Error("Complete the pass prepared by the successful feint.");
      const blocker =
        restart || setPiece ? undefined : blockingDefenders(s, ballPlayer)[0];
      if (blocker)
        throw new Error(
          `${ballPlayer.name} must feint past ${blocker.name} before passing.`,
        );
      s.pendingPass = null;
    }
    if (
      !Number.isInteger(command.to.x) ||
      !Number.isInteger(command.to.y) ||
      command.to.x < 0 ||
      command.to.x >= WIDTH ||
      command.to.y < 0 ||
      command.to.y >= HEIGHT ||
      distance(ball, command.to) === 0
    )
      throw new Error("Choose another position on the pitch.");
    const target = s.players.find(
      (p) => !isSentOff(s, p) && p.x === command.to.x && p.y === command.to.y,
    );
    const length = distance(ball, command.to);
    if (oneTouchPass && command.kind === "low-pass" && length > 30)
      throw new Error("A one-touch Low-pass cannot exceed 30 yards.");
    const defensiveHeader = oneTouchPass && command.kind === "defensive-header",
      kind: PassKind = oneTouchPass
        ? command.kind === "low-pass"
          ? "low-pass"
          : "high-pass"
        : setPiece?.kind === "throw-in" || setPiece?.kind === "goal-kick"
          ? "high-pass"
          : passKind(length),
      skill = defensiveHeader
        ? ballPlayer.defensiveHeader
        : setPiece?.kind === "throw-in"
          ? ballPlayer.throwIn
          : setPiece?.kind === "goal-kick"
            ? ballPlayer.goalKick
            : kind === "low-pass"
              ? ballPlayer.lowPass
              : ballPlayer.highPass,
      difficulty = defensiveHeader
        ? length * 3
        : setPiece?.kind === "throw-in"
          ? length * 2
          : length,
      interceptors = defensiveHeader
        ? []
        : passInterceptors(s, ballPlayer, command.to, kind),
      automatic =
        !defensiveHeader &&
        !setPiece &&
        kind === "low-pass" &&
        length <= lowPassAutomaticDistance(skill) &&
        interceptors.length === 0,
      label = defensiveHeader
        ? "Defensive-header"
        : oneTouchPass
          ? "One-touch low-pass"
          : setPiece?.kind === "throw-in" || setPiece?.kind === "goal-kick"
            ? restartLabel(setPiece.kind)
            : setPiece
              ? `${restartLabel(setPiece.kind)} · ${kind === "low-pass" ? "Low-pass" : "High-pass"}`
              : `${restart?.kind === "free-kick" ? "Free-kick · " : ""}${kind === "low-pass" ? "Low-pass" : "High-pass"}`;
    if (!oneTouchPass) s.foulRestart = null;
    if (!oneTouchPass) s.setPieceRestart = null;
    let dice = automatic ? undefined : roll(s),
      score = automatic ? difficulty : actionScore(dice!, skill);
    if (
      !oneTouchPass &&
      kind === "high-pass" &&
      !s.moved.includes(ballPlayer.id)
    )
      s.moved.push(ballPlayer.id);
    const interceptionAttempts: Array<{
      defender: Player;
      passDice: number;
      passScore: number;
      interceptDice: number;
      interceptSkill: number;
      interceptScore: number;
      rerolls: number;
    }> = [];
    for (const defender of interceptors) {
      const interceptSkill = interceptionSkill(defender),
        duel = rollOneOnOne(s, skill, interceptSkill, dice!, false);
      dice = duel.actorDice;
      score = duel.actorScore;
      interceptionAttempts.push({
        defender,
        passDice: duel.actorDice,
        passScore: duel.actorScore,
        interceptDice: duel.opponentDice!,
        interceptSkill,
        interceptScore: duel.opponentScore!,
        rerolls: duel.rerolls,
      });
      if (duel.opponentScore! > duel.actorScore) break;
    }
    const interception = interceptionAttempts.find(
        ({ interceptScore, passScore }) => interceptScore > passScore,
      ),
      contestAttempt = interception ?? interceptionAttempts[0],
      contest = contestAttempt
        ? {
            actor: {
              playerId: ballPlayer.id,
              name: ballPlayer.name,
              team: ballPlayer.team,
              skillLabel: label,
              skill,
              dice: contestAttempt.passDice,
              score: contestAttempt.passScore,
            },
            opponent: {
              playerId: contestAttempt.defender.id,
              name: contestAttempt.defender.name,
              team: contestAttempt.defender.team,
              skillLabel: "Intercept",
              skill: contestAttempt.interceptSkill,
              dice: contestAttempt.interceptDice,
              score: contestAttempt.interceptScore,
            },
            winnerId: interception ? contestAttempt.defender.id : ballPlayer.id,
            ...(contestAttempt.rerolls
              ? { rerolls: contestAttempt.rerolls }
              : {}),
          }
        : undefined;
    if (interception) {
      const { defender, interceptDice, interceptSkill, interceptScore } =
        interception;
      s.possession = defender.id;
      s.ball = { x: defender.x, y: defender.y };
      record(
        s,
        `${ballPlayer.name}: ${label.toLowerCase()} ${score} vs ${difficulty}. ${defender.name} intercepts with ${interceptScore} (D100 ${interceptDice} × Intercept ${interceptSkill}) and starts a new turn for ${TEAM_NAMES[defender.team]}.`,
        "dice",
        dice,
        {
          label,
          difficulty,
          skill,
          dice,
          score,
          result: actionResult(score, difficulty),
          outcome: "Intercepted",
          contest,
        },
      );
      next(s, defender.team);
      return skipUnavailableActionStages(s);
    }
    if (actionResult(score, difficulty) < 0) {
      const error = errorMagnitude(
          score,
          difficulty,
          1 / (defensiveHeader ? 3 : 2),
        ),
        d8 = rollD8(s),
        finalPosition = passErrorPosition(
          ballPlayer.team,
          command.to,
          error,
          d8,
        ),
        wentOut =
          finalPosition.x < 0 ||
          finalPosition.x >= WIDTH ||
          finalPosition.y < 0 ||
          finalPosition.y >= HEIGHT,
        finalPlayer = s.players.find(
          (player) =>
            !wentOut &&
            !isSentOff(s, player) &&
            player.x === finalPosition.x &&
            player.y === finalPosition.y,
        );
      s.ball = wentOut
        ? {
            x: Math.max(0, Math.min(WIDTH - 1, finalPosition.x)),
            y: Math.max(0, Math.min(HEIGHT - 1, finalPosition.y)),
          }
        : finalPosition;
      s.possession = wentOut ? null : (finalPlayer?.id ?? null);
      record(
        s,
        `${ballPlayer.name}: ${label.toLowerCase()} ${score} vs ${difficulty}. Error ${error}, D8 ${d8}; ${wentOut ? "the ball goes out of play" : `the ball finishes at (${finalPosition.x}, ${finalPosition.y})${finalPlayer ? ` with ${finalPlayer.name}` : " and is loose"}`}.`,
        "dice",
        dice,
        {
          label,
          difficulty,
          skill,
          dice,
          score,
          result: actionResult(score, difficulty),
          outcome: "Failed",
          d8,
          ...(contest ? { contest } : {}),
        },
      );
      if (wentOut) {
        beginOutRestart(s, ballPlayer.team, finalPosition);
        return skipUnavailableActionStages(s);
      }
      if (oneTouchPass) {
        s.oneTouch = null;
        if (opportunity?.resume === "new-turn")
          next(s, finalPlayer?.team ?? ballPlayer.team);
        else if (finalPlayer?.team !== undefined) {
          if (finalPlayer.team === ballPlayer.team) {
            s.moved.push(finalPlayer.id);
            continueWithAttackers(s);
          } else next(s, finalPlayer.team);
        } else continueWithAttackers(s);
      } else if (finalPlayer?.team !== undefined) {
        if (finalPlayer.team === ballPlayer.team) {
          s.moved.push(finalPlayer.id);
          continueWithAttackers(s);
        } else next(s, finalPlayer.team);
      } else continueWithAttackers(s);
      return skipUnavailableActionStages(s);
    }
    const challengedBy =
      target?.team === ballPlayer.team
        ? blockingDefenders(s, target)[0]
        : undefined;
    s.ball = { x: command.to.x, y: command.to.y };
    s.possession = challengedBy ? null : (target?.id ?? null);
    record(
      s,
      `${ballPlayer.name}: ${label.toLowerCase()}${automatic ? " automatically succeeds" : ` ${score} vs ${difficulty}`}. ${target ? (challengedBy ? `${target.name} reaches the ball but is challenged by ${challengedBy.name}.` : `${target.name} receives the ball.`) : "The ball reaches its position and is loose."}`,
      "dice",
      dice,
      {
        label,
        difficulty,
        skill,
        dice,
        ...(automatic ? {} : { score }),
        ...(automatic ? {} : { result: actionResult(score, difficulty) }),
        outcome: automatic ? "Automatic" : "Success",
        ...(contest ? { contest } : {}),
      },
    );
    if (target && challengedBy) {
      s.challengedBall = {
        receiverId: target.id,
        defenderId: challengedBy.id,
        sourcePass: kind,
        allowOneTouch: !oneTouchPass,
        resume: oneTouchPass
          ? (opportunity?.resume ?? "action-attackers")
          : "action-attackers",
      };
      s.oneTouch = null;
      return skipUnavailableActionStages(s);
    }
    if (oneTouchPass) {
      s.oneTouch = null;
      if (opportunity?.resume === "new-turn")
        next(s, target?.team ?? ballPlayer.team);
      else if (target?.team !== undefined && target.team !== ballPlayer.team)
        next(s, target.team);
      else {
        if (target) s.moved.push(target.id);
        continueWithAttackers(s);
      }
    } else if (target?.team !== undefined && target.team !== ballPlayer.team) {
      if (kind === "high-pass") {
        s.active = target.team;
        s.moved.push(target.id);
        s.oneTouch = {
          playerId: target.id,
          sourcePass: kind,
          actions: ["defensive-header"],
          resume: "new-turn",
        };
        record(s, `${target.name} may play a one-touch defensive-header.`);
      } else next(s, target.team);
    } else if (target) {
      s.moved.push(target.id);
      s.oneTouch = {
        playerId: target.id,
        sourcePass: kind,
        actions:
          kind === "low-pass"
            ? ["low-pass", "finish"]
            : ["offensive-header", "defensive-header", "scissors-kick"],
        resume: "action-attackers",
      };
      record(
        s,
        `${target.name} may play one touch: ${s.oneTouch.actions.join(" or ")}.`,
      );
    } else continueWithAttackers(s);
    return skipUnavailableActionStages(s);
  }
  if (command.type === "shoot" || command.type === "one-touch-shot") {
    const oneTouchShot = command.type === "one-touch-shot",
      opportunity = s.oneTouch,
      restart = s.foulRestart,
      setPiece = s.setPieceRestart;
    if (!oneTouchShot && setPiece && setPiece.kind !== "corner")
      throw new Error(
        `A ${restartLabel(setPiece.kind).toLowerCase()} must restart play with a pass.`,
      );
    if (!ballPlayer || !canShootAtGoal(ballPlayer))
      throw new Error("A footballer can only shoot from the opponent’s half.");
    if (!oneTouchShot && s.pendingPass)
      throw new Error("Complete the pass prepared by the successful feint.");
    if (!oneTouchShot) {
      const blocker =
        restart || setPiece ? undefined : blockingDefenders(s, ballPlayer!)[0];
      if (blocker)
        throw new Error(
          `${ballPlayer!.name} must feint past ${blocker.name} before shooting.`,
        );
      s.pendingShot = false;
    }
    if (oneTouchShot) {
      if (
        !opportunity ||
        opportunity.playerId !== ballPlayer.id ||
        !opportunity.actions.includes(command.kind)
      )
        throw new Error("That one-touch action is not available.");
    } else if (opportunity)
      throw new Error("Complete or decline the one-touch action first.");
    const baseDifficulty = shotDifficulty(s),
      label = oneTouchShot
        ? command.kind === "finish"
          ? "Finishing"
          : command.kind === "offensive-header"
            ? "Offensive-header"
            : "Scissors-kick"
        : command.type === "shoot" && command.kind === "lob"
          ? "Lob"
          : restart?.kind === "penalty"
            ? "Penalty"
            : restart?.kind === "free-kick"
              ? "Free-kick"
              : setPiece?.kind === "corner"
                ? "Corner kick"
                : "Shot",
      skill = oneTouchShot
        ? command.kind === "finish"
          ? ballPlayer.finish
          : command.kind === "offensive-header"
            ? ballPlayer.offensiveHeader
            : ballPlayer.scissorsKick
        : command.type === "shoot" && command.kind === "lob"
          ? TEAM_SQUADS[ballPlayer.team].players.find(
              (player) => player.id === ballPlayer.id,
            )!.ratings.Lob
          : restart?.kind === "penalty"
            ? ballPlayer.penalty
            : restart?.kind === "free-kick"
              ? ballPlayer.freeKick
              : setPiece?.kind === "corner"
                ? ballPlayer.freeKick
                : ballPlayer.shoot,
      difficulty = oneTouchShot
        ? command.kind === "offensive-header"
          ? Math.min(200, baseDifficulty * 2)
          : command.kind === "scissors-kick"
            ? Math.min(200, baseDifficulty + 20)
            : baseDifficulty
        : baseDifficulty,
      dice = roll(s),
      score = actionScore(dice, skill),
      result = actionResult(score, difficulty),
      opponent = other(ballPlayer.team),
      attempt: ShotAttempt = {
        label,
        difficulty,
        skill,
        dice,
        score,
        result,
        header: oneTouchShot && command.kind === "offensive-header",
        lob: !oneTouchShot && command.kind === "lob",
      };
    if (!oneTouchShot) s.foulRestart = null;
    if (!oneTouchShot) s.setPieceRestart = null;
    if (oneTouchShot && !s.moved.includes(ballPlayer.id))
      s.moved.push(ballPlayer.id);
    s.oneTouch = null;
    if (result > 0) {
      const closest = closestGoalTarget(ballPlayer),
        maxDistance = Math.floor(result / 5);
      s.pendingShotTarget = {
        shooterId: ballPlayer.id,
        attempt,
        closest,
        maxDistance,
        allowInterception: restart?.kind !== "penalty",
      };
      record(
        s,
        `${ballPlayer.name}: ${label.toLowerCase()} placement ${score} vs ${difficulty}. Success (+${result}); choose a target up to ${maxDistance} ${maxDistance === 1 ? "cell" : "cells"} from the closest target.`,
        "dice",
        dice,
        {
          label,
          difficulty,
          skill,
          dice,
          score,
          result,
          outcome: "Choose target",
        },
      );
    } else if (result === 0) {
      const d8 = Math.floor(random(s) * 8) + 1,
        closest = closestGoalTarget(ballPlayer);
      record(
        s,
        `${ballPlayer.name}: ${label.toLowerCase()} equals difficulty ${difficulty} and hits the post. Rebound D8 ${d8}.`,
        "dice",
        dice,
        {
          label,
          difficulty,
          skill,
          dice,
          score,
          result,
          outcome:
            d8 <= 3
              ? "Post · back to field"
              : d8 <= 5
                ? "Post · out"
                : "Post · towards goal",
          d8,
        },
      );
      if (d8 >= 6)
        resolveShotTarget(
          s,
          ballPlayer,
          attempt,
          { ...closest, row: (d8 - 6) as 0 | 1 | 2 },
          false,
        );
      else if (d8 <= 3) {
        s.possession = null;
        s.ball = {
          x: ballPlayer.team === "home" ? WIDTH - 2 : 1,
          y: Math.max(
            0,
            Math.min(HEIGHT - 1, GOAL_START_Y + closest.column + d8 - 2),
          ),
        };
        s.phase = "movement";
        s.movementStage = "attack-opponent";
        record(
          s,
          `The post rebound returns to the field at (${s.ball.x}, ${s.ball.y}).`,
        );
      } else {
        const goalkeeper =
          s.players.find(
            (player) =>
              player.team === opponent &&
              player.role === "Goalkeeper" &&
              !isSentOff(s, player),
          ) ??
          s.players.find(
            (player) => player.team === opponent && !isSentOff(s, player),
          );
        if (!goalkeeper)
          throw new Error(`${TEAM_NAMES[opponent]} have no player available.`);
        beginSetPiece(s, "goal-kick", opponent, {
          x: goalkeeper.x,
          y: goalkeeper.y,
        });
      }
    } else {
      const goalkeeper =
        s.players.find(
          (player) =>
            player.team === opponent &&
            player.role === "Goalkeeper" &&
            !isSentOff(s, player),
        ) ??
        s.players.find(
          (player) => player.team === opponent && !isSentOff(s, player),
        );
      if (!goalkeeper)
        throw new Error(`${TEAM_NAMES[opponent]} have no player available.`);
      record(
        s,
        `${ballPlayer.name}: ${label.toLowerCase()} placement ${score} vs ${difficulty}. The shot misses; ${goalkeeper.name} prepares the goal-kick.`,
        "dice",
        dice,
        {
          label,
          difficulty,
          skill,
          dice,
          score,
          result,
          outcome: "Missed · goal-kick",
        },
      );
      beginSetPiece(s, "goal-kick", opponent, {
        x: goalkeeper.x,
        y: goalkeeper.y,
      });
    }
    return skipUnavailableActionStages(s);
  }
  throw new Error("Unknown command.");
}
export function serialize(s: Match) {
  return JSON.stringify(s);
}
function restoreDisciplineFromLog(s: Match) {
  const inferred = Object.fromEntries(
    s.players.map((player) => [player.id, { yellowCards: 0, sentOff: false }]),
  ) as Record<string, PlayerDiscipline>;
  for (const event of s.log) {
    const recorded = event.resolution?.discipline;
    if (recorded && inferred[recorded.playerId]) {
      inferred[recorded.playerId].yellowCards = Math.max(
        inferred[recorded.playerId].yellowCards,
        recorded.yellowCards,
      );
      inferred[recorded.playerId].sentOff ||= recorded.sentOff;
      continue;
    }
    for (const player of s.players) {
      const discipline = inferred[player.id];
      if (event.text.includes(`${player.name} is shown a yellow card.`))
        discipline.yellowCards++;
      if (
        event.text.includes(
          `${player.name} receives a second yellow card and is sent off.`,
        )
      ) {
        discipline.yellowCards = Math.max(discipline.yellowCards, 2);
        discipline.sentOff = true;
      }
      if (
        event.text.includes(
          `${player.name} is shown a red card and sent off.`,
        ) ||
        event.text.includes(`${player.name} is sent off as the last defender.`)
      )
        discipline.sentOff = true;
    }
  }
  for (const player of s.players) {
    const saved = s.discipline[player.id] ?? {
        yellowCards: 0,
        sentOff: false,
      },
      recovered = inferred[player.id];
    s.discipline[player.id] = {
      yellowCards: Math.max(saved.yellowCards, recovered.yellowCards),
      sentOff: saved.sentOff || recovered.sentOff,
    };
  }
}
/** Validate persisted data before exposing it to the engine. */
export function deserialize(json: string): Match {
  const s = JSON.parse(json) as Match;
  // Older saves predate movement stages; they resume at attacker movement.
  if (s && s.movementStage === undefined) s.movementStage = "attack-opponent";
  if (s && s.actionStage === undefined) s.actionStage = "ball-carrier";
  if (s && s.winningCondition === undefined)
    s.winningCondition = DEFAULT_WINNING_CONDITION;
  if (s && s.movementHalved === undefined) s.movementHalved = [];
  if (s && s.actionSpent === undefined) s.actionSpent = [];
  if (s && s.movementSpent === undefined) s.movementSpent = {};
  if (s && s.movementStageUsed === undefined) s.movementStageUsed = {};
  if (s && s.resolvedBlocks === undefined) s.resolvedBlocks = [];
  if (s && s.pendingPass === undefined) s.pendingPass = null;
  if (s && s.pendingShot === undefined) s.pendingShot = false;
  if (s && s.pendingShotTarget === undefined) s.pendingShotTarget = null;
  if (s && s.pendingGoalkeeperShot === undefined)
    s.pendingGoalkeeperShot = null;
  if (s && s.pendingFoul === undefined) s.pendingFoul = null;
  if (s && s.challengedBall === undefined) s.challengedBall = null;
  if (s && s.oneTouch === undefined) s.oneTouch = null;
  if (s && s.foulRestart === undefined) s.foulRestart = null;
  if (
    s &&
    s.foulRestart &&
    (s.foulRestart as FoulRestart).takerId === undefined
  ) {
    if (s.setup && s.foulRestart.setupStage === "attackers") {
      s.foulRestart.takerId = null;
      s.possession = null;
    } else s.foulRestart.takerId = s.possession ?? s.foulRestart.fouledPlayerId;
  }
  if (s && s.foulRestart && s.foulRestart.setupStage === undefined)
    s.foulRestart.setupStage = s.setup ? "attackers" : "defenders";
  if (
    s?.foulRestart?.kind === "penalty" &&
    Array.isArray(s.players) &&
    !isPenaltyTakerPosition(s.foulRestart.position, s.foulRestart.team)
  ) {
    const target = penaltyTakerPositions(s.foulRestart.team)[0],
      taker = s.players.find(
        (player) =>
          player.id ===
          (s.foulRestart!.takerId ?? s.foulRestart!.fouledPlayerId),
      );
    if (taker) {
      const previous = { x: taker.x, y: taker.y },
        occupant = s.players.find(
          (player) =>
            player.id !== taker.id &&
            player.x === target.x &&
            player.y === target.y,
        );
      if (occupant) Object.assign(occupant, previous);
      Object.assign(taker, target);
    }
    s.foulRestart.position = { ...target };
    s.ball = { ...target };
  }
  if (s && s.setPieceRestart === undefined) s.setPieceRestart = null;
  if (s && s.setPieceRestart && s.setPieceRestart.setupStage === undefined)
    s.setPieceRestart.setupStage = "attackers";
  if (s && s.discipline === undefined && Array.isArray(s.players))
    s.discipline = Object.fromEntries(
      s.players.map((player) => [
        player.id,
        { yellowCards: 0, sentOff: false },
      ]),
    );
  if (
    s &&
    Array.isArray(s.players) &&
    Array.isArray(s.log) &&
    s.discipline &&
    typeof s.discipline === "object"
  )
    restoreDisciplineFromLog(s);
  if (s && Array.isArray(s.players))
    for (const player of s.players) {
      const index = TEAM_SQUADS[player.team]?.players
        .slice(0, 11)
        .findIndex((candidate) => candidate.id === player.id);
      if (index !== undefined && index >= 0) {
        const attributes = rosterAttributes(player.team, index);
        if (player.freeKick === undefined)
          player.freeKick = attributes.freeKick;
        if (player.penalty === undefined) player.penalty = attributes.penalty;
        if (player.cornerKick === undefined)
          player.cornerKick = attributes.cornerKick;
        if (player.throwIn === undefined) player.throwIn = attributes.throwIn;
        if (player.goalKick === undefined)
          player.goalKick = attributes.goalKick;
      }
    }
  if (s && s.setup === undefined) s.setup = false;
  if (s && s.testSetup === undefined) s.testSetup = false;
  if (s && s.kickoffLineups === undefined)
    s.kickoffLineups = defaultKickoffLineups();
  if (s?.kickoffLineups) {
    normalizeKickoffGoalkeepers(s.kickoffLineups);
    normalizeKickoffCenters(s.kickoffLineups);
  }
  if (s?.oneTouch?.resume === "movement")
    s.oneTouch.resume = "action-attackers";
  const integer = (v: unknown, min: number, max: number) =>
    typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
  const team = (v: unknown) => v === "home" || v === "away";
  if (
    !s ||
    s.version !== 1 ||
    (s.rosterVersion !== undefined &&
      ![1, 2, 3, 4, 5, 6, 7].includes(s.rosterVersion)) ||
    s.ruleset !== "practice-v1" ||
    !integer(s.seed, 0, 4294967295) ||
    !integer(s.turn, 1, 1000000) ||
    !team(s.active) ||
    !WINNING_CONDITIONS.some(({ id }) => id === s.winningCondition) ||
    typeof s.setup !== "boolean" ||
    typeof s.testSetup !== "boolean" ||
    (s.testSetup && !s.setup) ||
    typeof s.pendingShot !== "boolean" ||
    (s.pendingShotTarget !== null && typeof s.pendingShotTarget !== "object") ||
    (s.pendingGoalkeeperShot !== null &&
      typeof s.pendingGoalkeeperShot !== "object") ||
    (s.pendingFoul !== null && typeof s.pendingFoul !== "object") ||
    (s.setPieceRestart !== null && typeof s.setPieceRestart !== "object") ||
    !["action", "movement"].includes(s.phase) ||
    !["ball-carrier", "attackers", "defenders"].includes(s.actionStage) ||
    !Array.isArray(s.players) ||
    s.players.length !== 22 ||
    !s.score ||
    !integer(s.score.home, 0, 999) ||
    !integer(s.score.away, 0, 999) ||
    !Array.isArray(s.moved) ||
    !s.movementSpent ||
    typeof s.movementSpent !== "object" ||
    !s.movementStageUsed ||
    typeof s.movementStageUsed !== "object" ||
    !Array.isArray(s.movementHalved) ||
    !Array.isArray(s.actionSpent) ||
    !Array.isArray(s.resolvedBlocks) ||
    !s.discipline ||
    typeof s.discipline !== "object" ||
    !Array.isArray(s.log) ||
    s.log.length > 150 ||
    (s.winner !== null && s.winner !== "draw" && !team(s.winner))
  )
    throw new Error("This is not a compatible Footroll save.");
  const ids = new Set<string>(),
    cells = new Set<string>();
  for (const p of s.players) {
    if (
      !p ||
      typeof p.id !== "string" ||
      !team(p.team) ||
      !integer(p.number, 1, 99) ||
      !TEAM_SQUADS[p.team].players
        .slice(0, 11)
        .some((player) => player.id === p.id) ||
      typeof p.name !== "string" ||
      p.name.length > 60 ||
      typeof p.role !== "string" ||
      !integer(p.x, 0, 99) ||
      !integer(p.y, 0, 63) ||
      ![p.velocity, p.pass, p.shoot, p.tackle].every((v) =>
        integer(v, 10, 100),
      ) ||
      (s.rosterVersion === 2 &&
        ![p.lowPass, p.highPass, p.intercept].every((v) =>
          integer(v, 10, 100),
        )) ||
      ([3, 4, 5, 6, 7].includes(s.rosterVersion ?? 1) &&
        ![
          p.lowPass,
          p.highPass,
          p.intercept,
          p.finish,
          p.offensiveHeader,
          p.defensiveHeader,
          p.scissorsKick,
        ].every((v) => integer(v, 10, 100))) ||
      ([4, 5, 6, 7].includes(s.rosterVersion ?? 1) &&
        !integer(p.feint, 10, 100)) ||
      ([5, 6, 7].includes(s.rosterVersion ?? 1) &&
        ![p.dribble, p.slip, p.mark].every((v) => integer(v, 10, 100))) ||
      ([6, 7].includes(s.rosterVersion ?? 1) &&
        ![p.strength, p.catch, p.freeKick, p.penalty].every((v) =>
          integer(v, 10, 100),
        )) ||
      (s.rosterVersion === 7 &&
        ![p.reach, p.shotPower, p.headerPower].every((v) =>
          integer(v, 10, 100),
        )) ||
      ids.has(p.id) ||
      cells.has(`${p.x},${p.y}`)
    )
      throw new Error("Invalid players in save.");
    ids.add(p.id);
    cells.add(`${p.x},${p.y}`);
  }
  const validKickoffLineup = (value: unknown, kickoffTeam: Team) => {
    if (!value || typeof value !== "object") return false;
    const lineup = value as Partial<KickoffLineup>;
    if (
      typeof lineup.bearerId !== "string" ||
      !lineup.positions ||
      typeof lineup.positions !== "object"
    )
      return false;
    const entries = Object.entries(lineup.positions),
      lineupCells = new Set<string>();
    if (entries.length !== ids.size || !ids.has(lineup.bearerId)) return false;
    for (const [id, point] of entries) {
      const player = s.players.find((candidate) => candidate.id === id);
      if (
        !player ||
        !point ||
        !integer(point.x, 0, WIDTH - 1) ||
        !integer(point.y, 0, HEIGHT - 1) ||
        isOpponentSide(player.team, point) ||
        lineupCells.has(`${point.x},${point.y}`)
      )
        return false;
      lineupCells.add(`${point.x},${point.y}`);
    }
    const inside = entries
      .filter(([, point]) => isInsideCenterCircle(point))
      .map(([id]) => id);
    return (
      inside.length === 1 &&
      inside[0] === lineup.bearerId &&
      isKickoffPosition(lineup.positions[lineup.bearerId], kickoffTeam) &&
      s.players.find((player) => player.id === lineup.bearerId)?.team ===
        kickoffTeam
    );
  };
  const savedPossessor = s.possession
      ? s.players.find((player) => player.id === s.possession)
      : undefined,
    challengedReceiver = s.challengedBall
      ? s.players.find((player) => player.id === s.challengedBall?.receiverId)
      : undefined,
    challengedDefender = s.challengedBall
      ? s.players.find((player) => player.id === s.challengedBall?.defenderId)
      : undefined,
    pendingGoalkeeper = s.pendingGoalkeeperShot
      ? s.players.find(
          (player) => player.id === s.pendingGoalkeeperShot?.goalkeeperId,
        )
      : undefined,
    pendingShooter = s.pendingGoalkeeperShot
      ? s.players.find(
          (player) => player.id === s.pendingGoalkeeperShot?.shooterId,
        )
      : undefined,
    pendingTargetShooter = s.pendingShotTarget
      ? s.players.find((player) => player.id === s.pendingShotTarget?.shooterId)
      : undefined,
    pendingFoulOffender = s.pendingFoul
      ? s.players.find((player) => player.id === s.pendingFoul?.offenderId)
      : undefined,
    pendingFoulVictim = s.pendingFoul
      ? s.players.find((player) => player.id === s.pendingFoul?.victimId)
      : undefined,
    restartTaker = s.setPieceRestart
      ? s.players.find((player) => player.id === s.setPieceRestart?.takerId)
      : undefined,
    foulRestartTaker = s.foulRestart
      ? s.players.find((player) => player.id === s.foulRestart?.takerId)
      : undefined;
  const validDiscipline =
    Object.keys(s.discipline).length === ids.size &&
    Object.entries(s.discipline).every(
      ([id, value]) =>
        ids.has(id) &&
        !!value &&
        integer(value.yellowCards, 0, 2) &&
        typeof value.sentOff === "boolean" &&
        (value.yellowCards < 2 || value.sentOff),
    );
  if (!s.ball && savedPossessor)
    s.ball = { x: savedPossessor.x, y: savedPossessor.y };
  if (
    !validDiscipline ||
    !s.kickoffLineups ||
    !validKickoffLineup(s.kickoffLineups.home, "home") ||
    !validKickoffLineup(s.kickoffLineups.away, "away") ||
    (s.possession !== null &&
      (!ids.has(s.possession) || s.discipline[s.possession]?.sentOff)) ||
    !integer(s.ball?.x, 0, WIDTH - 1) ||
    !integer(s.ball?.y, 0, HEIGHT - 1) ||
    (!!savedPossessor &&
      (savedPossessor.x !== s.ball.x || savedPossessor.y !== s.ball.y)) ||
    !s.moved.every((id) => ids.has(id)) ||
    new Set(s.moved).size !== s.moved.length ||
    !Object.entries(s.movementSpent).every(
      ([id, spent]) => ids.has(id) && integer(spent, 0, 100),
    ) ||
    !Object.entries(s.movementStageUsed).every(
      ([id, stage]) =>
        ids.has(id) &&
        ["attack-opponent", "defense", "attack-own"].includes(stage),
    ) ||
    !s.movementHalved.every((id) => ids.has(id)) ||
    new Set(s.movementHalved).size !== s.movementHalved.length ||
    !s.actionSpent.every((id) => ids.has(id)) ||
    new Set(s.actionSpent).size !== s.actionSpent.length ||
    !s.resolvedBlocks.every((key) => {
      const [attackerId, defenderId, ...rest] = key.split(":");
      return !rest.length && ids.has(attackerId) && ids.has(defenderId);
    }) ||
    new Set(s.resolvedBlocks).size !== s.resolvedBlocks.length ||
    (s.pendingPass !== null &&
      (!s.pendingPass ||
        !ids.has(s.pendingPass.playerId) ||
        !integer(s.pendingPass.to?.x, 0, WIDTH - 1) ||
        !integer(s.pendingPass.to?.y, 0, HEIGHT - 1))) ||
    (s.pendingShotTarget !== null &&
      (!s.pendingShotTarget ||
        !pendingTargetShooter ||
        s.possession !== pendingTargetShooter.id ||
        s.phase !== "action" ||
        !integer(s.pendingShotTarget.closest?.row, 0, 2) ||
        !integer(s.pendingShotTarget.closest?.column, 0, GOAL_WIDTH - 1) ||
        !integer(s.pendingShotTarget.maxDistance, 0, 20) ||
        typeof s.pendingShotTarget.allowInterception !== "boolean" ||
        !s.pendingShotTarget.attempt ||
        typeof s.pendingShotTarget.attempt.label !== "string" ||
        !integer(s.pendingShotTarget.attempt.difficulty, 0, 200) ||
        !integer(s.pendingShotTarget.attempt.skill, 10, 100) ||
        !integer(s.pendingShotTarget.attempt.dice, 1, 100) ||
        !integer(s.pendingShotTarget.attempt.score, 0, 100) ||
        !integer(s.pendingShotTarget.attempt.result, -200, 100) ||
        typeof s.pendingShotTarget.attempt.header !== "boolean" ||
        typeof s.pendingShotTarget.attempt.lob !== "boolean")) ||
    (s.pendingShotTarget !== null && s.pendingGoalkeeperShot !== null) ||
    (s.pendingFoul !== null &&
      (!pendingFoulOffender ||
        !pendingFoulVictim ||
        pendingFoulOffender.id === pendingFoulVictim.id ||
        pendingFoulOffender.team === pendingFoulVictim.team ||
        !["card-check", "card-color"].includes(s.pendingFoul.stage) ||
        typeof s.pendingFoul.actionLabel !== "string" ||
        !s.pendingFoul.foul ||
        !["actor", "opponent"].includes(s.pendingFoul.foul.offender) ||
        typeof s.pendingFoul.foul.card !== "boolean" ||
        (s.pendingFoul.foul.d100 !== undefined &&
          !integer(s.pendingFoul.foul.d100, 0, 99)) ||
        (s.pendingFoul.foul.foulD6 !== undefined &&
          !integer(s.pendingFoul.foul.foulD6, 1, 6)) ||
        s.pendingFoul.foul.cardD6 !== undefined ||
        (s.pendingFoul.stage === "card-check" &&
          !integer(s.pendingFoul.foul.foulD6, 2, 6)) ||
        (s.pendingFoul.stage === "card-color" && !s.pendingFoul.foul.card) ||
        s.phase !== "action")) ||
    (s.pendingFoul !== null &&
      (s.pendingShotTarget !== null || s.pendingGoalkeeperShot !== null)) ||
    (s.pendingGoalkeeperShot !== null &&
      (!s.pendingGoalkeeperShot ||
        !["reach", "power", "catch"].includes(s.pendingGoalkeeperShot.stage) ||
        !pendingGoalkeeper ||
        pendingGoalkeeper.role !== "Goalkeeper" ||
        !pendingShooter ||
        pendingShooter.team === pendingGoalkeeper.team ||
        s.possession !== pendingShooter.id ||
        s.phase !== "action" ||
        !integer(s.pendingGoalkeeperShot.target?.row, 0, 2) ||
        !integer(s.pendingGoalkeeperShot.target?.column, 0, GOAL_WIDTH - 1) ||
        !integer(s.pendingGoalkeeperShot.difficulty, 0, 500) ||
        !s.pendingGoalkeeperShot.attempt ||
        typeof s.pendingGoalkeeperShot.attempt.label !== "string" ||
        !integer(s.pendingGoalkeeperShot.attempt.difficulty, 0, 200) ||
        !integer(s.pendingGoalkeeperShot.attempt.skill, 10, 100) ||
        !integer(s.pendingGoalkeeperShot.attempt.dice, 1, 100) ||
        !integer(s.pendingGoalkeeperShot.attempt.score, 0, 100) ||
        !integer(s.pendingGoalkeeperShot.attempt.result, -200, 100) ||
        typeof s.pendingGoalkeeperShot.attempt.header !== "boolean" ||
        typeof s.pendingGoalkeeperShot.attempt.lob !== "boolean" ||
        (s.pendingGoalkeeperShot.stage === "catch" &&
          !integer(s.pendingGoalkeeperShot.power, 0, 100)))) ||
    (s.challengedBall !== null &&
      (!s.challengedBall ||
        !ids.has(s.challengedBall.receiverId) ||
        !ids.has(s.challengedBall.defenderId) ||
        s.challengedBall.receiverId === s.challengedBall.defenderId ||
        !challengedReceiver ||
        !challengedDefender ||
        challengedReceiver.team === challengedDefender.team ||
        !withinReach(challengedReceiver, challengedDefender) ||
        s.phase !== "action" ||
        s.possession !== null ||
        s.ball.x !== challengedReceiver.x ||
        s.ball.y !== challengedReceiver.y ||
        !["low-pass", "high-pass"].includes(s.challengedBall.sourcePass) ||
        typeof s.challengedBall.allowOneTouch !== "boolean" ||
        !["action-attackers", "movement", "new-turn"].includes(
          s.challengedBall.resume,
        ))) ||
    (s.foulRestart !== null &&
      (!s.foulRestart ||
        !["free-kick", "penalty"].includes(s.foulRestart.kind) ||
        !team(s.foulRestart.team) ||
        !ids.has(s.foulRestart.fouledPlayerId) ||
        !ids.has(s.foulRestart.offenderId) ||
        s.foulRestart.fouledPlayerId === s.foulRestart.offenderId ||
        !["attackers", "defenders"].includes(s.foulRestart.setupStage) ||
        !integer(s.foulRestart.position?.x, 0, WIDTH - 1) ||
        !integer(s.foulRestart.position?.y, 0, HEIGHT - 1) ||
        s.active !== s.foulRestart.team ||
        s.phase !== "action" ||
        s.actionStage !== "ball-carrier" ||
        (s.foulRestart.kind === "penalty" &&
          !isPenaltyTakerPosition(
            s.foulRestart.position,
            s.foulRestart.team,
          )) ||
        (s.foulRestart.takerId === null
          ? !s.setup ||
            s.foulRestart.setupStage !== "attackers" ||
            s.possession !== null
          : !ids.has(s.foulRestart.takerId) ||
            s.possession !== s.foulRestart.takerId ||
            foulRestartTaker?.team !== s.foulRestart.team ||
            foulRestartTaker?.x !== s.foulRestart.position.x ||
            foulRestartTaker?.y !== s.foulRestart.position.y))) ||
    (s.setPieceRestart !== null &&
      (!s.setPieceRestart ||
        !["corner", "throw-in", "goal-kick"].includes(s.setPieceRestart.kind) ||
        !team(s.setPieceRestart.team) ||
        !["attackers", "defenders"].includes(s.setPieceRestart.setupStage) ||
        !integer(s.setPieceRestart.position?.x, 0, WIDTH - 1) ||
        !integer(s.setPieceRestart.position?.y, 0, HEIGHT - 1) ||
        s.active !== s.setPieceRestart.team ||
        s.phase !== "action" ||
        s.actionStage !== "ball-carrier" ||
        s.foulRestart !== null ||
        (s.setPieceRestart.takerId === null
          ? !s.setup || s.possession !== null
          : !restartTaker ||
            restartTaker.team !== s.setPieceRestart.team ||
            restartTaker.x !== s.setPieceRestart.position.x ||
            restartTaker.y !== s.setPieceRestart.position.y ||
            s.possession !== s.setPieceRestart.takerId))) ||
    s.players.filter((p) => p.team === "home").length !== 11 ||
    (s.oneTouch !== null &&
      (!s.oneTouch ||
        !ids.has(s.oneTouch.playerId) ||
        !["low-pass", "high-pass"].includes(s.oneTouch.sourcePass) ||
        !Array.isArray(s.oneTouch.actions) ||
        s.oneTouch.actions.length === 0 ||
        !s.oneTouch.actions.every((action) =>
          [
            "low-pass",
            "finish",
            "offensive-header",
            "defensive-header",
            "scissors-kick",
          ].includes(action),
        ) ||
        !["action-attackers", "movement", "new-turn"].includes(
          s.oneTouch.resume,
        ))) ||
    s.winner !== matchResultForScore(s.score, s.winningCondition)
  )
    throw new Error("Invalid match state in save.");
  const validContestSide = (side: ContestSide) =>
    !!side &&
    ids.has(side.playerId) &&
    typeof side.name === "string" &&
    side.name.length <= 60 &&
    team(side.team) &&
    typeof side.skillLabel === "string" &&
    side.skillLabel.length <= 40 &&
    integer(side.skill, 10, 120) &&
    (side.dice === undefined || integer(side.dice, 0, 99)) &&
    (side.score === undefined || integer(side.score, 0, 120));
  const validContest = (contest: ContestResolution) =>
    validContestSide(contest.actor) &&
    validContestSide(contest.opponent) &&
    !!contest.winnerId &&
    [contest.actor.playerId, contest.opponent.playerId].includes(
      contest.winnerId,
    ) &&
    (contest.rerolls === undefined || integer(contest.rerolls, 0, 100));
  if (
    s.log.some(
      (e, i) =>
        !e ||
        !integer(e.id, 1, 10000000) ||
        (i > 0 && e.id <= s.log[i - 1].id) ||
        !integer(e.turn, 1, s.turn) ||
        typeof e.text !== "string" ||
        e.text.length > 500 ||
        !["info", "move", "dice", "goal"].includes(e.kind) ||
        (e.dice !== undefined &&
          !integer(e.dice, 0, (s.rosterVersion ?? 1) >= 2 ? 99 : 100)) ||
        (e.resolution !== undefined &&
          (typeof e.resolution.label !== "string" ||
            !integer(e.resolution.difficulty, 0, 500) ||
            !integer(e.resolution.skill, 10, 120) ||
            (e.resolution.dice !== undefined &&
              !integer(e.resolution.dice, 0, 99)) ||
            (e.resolution.score !== undefined &&
              !integer(e.resolution.score, 0, 120)) ||
            (e.resolution.result !== undefined &&
              !integer(e.resolution.result, -500, 500)) ||
            typeof e.resolution.outcome !== "string" ||
            (e.resolution.d8 !== undefined &&
              !integer(e.resolution.d8, 1, 8)) ||
            (e.resolution.contest !== undefined &&
              !validContest(e.resolution.contest)))),
    )
  )
    throw new Error("Invalid match history in save.");
  s.log = s.log.map((event) => ({
    ...event,
    text: event.text
      .replaceAll("Forest FC", TEAM_NAMES.home)
      .replaceAll("Terracotta United", TEAM_NAMES.away),
  }));
  if (s.rosterVersion !== 7) {
    s.players = s.players.map((player) => ({
      ...player,
      ...rosterAttributes(player.team, Number(player.id.split("-")[1]) - 1),
    }));
    s.rosterVersion = 7;
    record(
      s,
      "Squads and player skills updated from the Barcelona 2014–2015 and Madrid 2015–2016 team sheets. Positions and score retained.",
    );
  }
  // Normalize saves made while either side of the high-pass movement rule was
  // missing. Both the passer and its one-touch receiver are spent.
  for (const event of s.log) {
    if (event.turn !== s.turn || event.resolution?.label !== "High-pass")
      continue;
    const passer = s.players.find((player) =>
      event.text.startsWith(`${player.name}:`),
    );
    if (passer && !s.moved.includes(passer.id)) s.moved.push(passer.id);
    const receiver = s.players.find((player) =>
      event.text.includes(`${player.name} receives the ball.`),
    );
    if (receiver && !s.moved.includes(receiver.id)) s.moved.push(receiver.id);
  }
  if (s.phase === "action") {
    const ballPlayer = possessor(s);
    if (ballPlayer) s.active = ballPlayer.team;
  }
  return skipUnavailableActionStages(s);
}
