export type Outcome = {
  value: number;
  crit?: true;
  success?: boolean;
  with?: "hope" | "fear";
};

export function label(o: Outcome) {
  return `${o.crit ? "critical " : ""}${o.success ? "success" : o.success === false ? "failure" : "roll"}${o.with ? " with " : ""}${o.with ?? ""}`;
}

export function isSuccess(o: Outcome) {
  return o.success === true;
}

export function isFailure(o: Outcome) {
  return o.success === false;
}

export function isCriticalSuccess(o: Outcome) {
  return isSuccess(o) && o.crit === true;
}
