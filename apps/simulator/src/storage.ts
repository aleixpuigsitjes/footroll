import {
  createMatch,
  deserialize,
  serialize,
  type Match,
} from "@footroll/engine";
/** Replace this adapter if native storage or cloud saves are added. */
export interface MatchStorage {
  load(): Match | null;
  save(match: Match): void;
}
export const localMatchStorage: MatchStorage = {
  load() {
    const data = localStorage.getItem("footroll.practice.v1");
    return data ? deserialize(data) : null;
  },
  save(match) {
    localStorage.setItem("footroll.practice.v1", serialize(match));
  },
};
export function restoreMatch() {
  try {
    return {
      match: localMatchStorage.load() ?? createMatch(42, true),
      warning: "",
    };
  } catch {
    return {
      match: createMatch(42, true),
      warning:
        "The saved match could not be loaded. A new practice match is ready.",
    };
  }
}
