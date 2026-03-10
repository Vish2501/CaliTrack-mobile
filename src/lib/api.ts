import { supabase } from "./supabase";

const BASE_URL = "http://localhost:8080";

export type WorkoutResponse = {
  id: number;
  userId: string;
  startTime: string;
  endTime: string | null;
  notes: string | null;
};

export type SetResponse = {
  id: number;
  workoutId: number;
  exerciseId: number;
  exerciseName: string;
  reps: number | null;
  weight: number | null;
  rpe: number | null;
  timestamp: string;
};
import { ExerciseEntry } from "../types/workout";

export async function commitWorkout(
  workoutId: number,
  entries: ExerciseEntry[],
) {
  const completedSets = entries.flatMap((exercise) =>
    exercise.sets
      .filter(
        (set) =>
          set.completed &&
          set.reps.trim().length > 0 &&
          set.weight.trim().length > 0,
      )
      .map((set) => ({
        exerciseId: Number(exercise.id),
        reps: Number(set.reps),
        weight: Number(set.weight),
      })),
  );

  for (const set of completedSets) {
    await addWorkoutSet(workoutId, set);
  }

  await finishWorkout(workoutId);

  return completedSets.length;
}

export type WorkoutDetailsResponse = WorkoutResponse & {
  sets: SetResponse[];
};

async function authHeaders(includeJson = false) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("No session");

  return {
    Authorization: `Bearer ${token}`,
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
  };
}

export async function startWorkout() {
  const res = await fetch(`${BASE_URL}/api/workouts`, {
    method: "POST",
    headers: await authHeaders(),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return (await res.json()) as WorkoutResponse;
}

export async function getWorkoutDetails(workoutId: number) {
  const res = await fetch(`${BASE_URL}/api/workouts/${workoutId}`, {
    headers: await authHeaders(),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return (await res.json()) as WorkoutDetailsResponse;
}

export async function addWorkoutSet(
  workoutId: number,
  payload: {
    exerciseId: number;
    reps: number;
    weight: number;
    rpe?: number | null;
  },
) {
  const res = await fetch(`${BASE_URL}/api/workouts/${workoutId}/sets`, {
    method: "POST",
    headers: await authHeaders(true),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return (await res.json()) as SetResponse;
}

export async function finishWorkout(workoutId: number) {
  const res = await fetch(`${BASE_URL}/api/workouts/${workoutId}/finish`, {
    method: "PATCH",
    headers: await authHeaders(true),
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return (await res.json()) as WorkoutResponse;
}
