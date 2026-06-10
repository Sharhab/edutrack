const RESULT_STATE = Object.freeze({
  DRAFT: "DRAFT",
  GENERATED: "GENERATED",
  PUBLISHED: "PUBLISHED",
  LOCKED: "LOCKED",
});

/* =========================================
   STATE TRANSITION MATRIX
   (single source of truth)
========================================= */

const STATE_FLOW = Object.freeze({
  DRAFT: ["GENERATED"],

  GENERATED: ["PUBLISHED"],

  PUBLISHED: ["LOCKED"],

  LOCKED: ["PUBLISHED"], // unlock allowed
});

/* =========================================
   VALIDATE STATE TRANSITION
========================================= */

function canTransition(current, next) {
  if (!current || !next) return false;

  return STATE_FLOW[current]?.includes(next) || false;
}

/* =========================================
   OPTIONAL: GET NEXT ALLOWED STATES
   (useful for UI + debugging)
========================================= */

function getAllowedNextStates(current) {
  return STATE_FLOW[current] || [];
}

/* =========================================
   OPTIONAL: CHECK IF FINAL STATE
========================================= */

function isFinalState(state) {
  return state === RESULT_STATE.LOCKED;
}