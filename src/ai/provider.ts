import type { Env } from "../server";

export type Seam = "read" | "compose";

export interface ModelClient {
  seam: Seam;
  available(): boolean;
  complete(prompt: string): Promise<string | null>;
}

/** Factory per seam — do not share one client across Read and Compose. */
export function createModelClient(seam: Seam, env: Env): ModelClient {
  const key = seam === "read" ? env.MODEL_READ_API_KEY : env.MODEL_COMPOSE_API_KEY;
  const model = seam === "read" ? env.MODEL_READ_MODEL : env.MODEL_COMPOSE_MODEL;
  const baseUrl =
    seam === "read" ? env.MODEL_READ_BASE_URL : env.MODEL_COMPOSE_BASE_URL;

  return {
    seam,
    available: () => Boolean(key),
    async complete(prompt: string) {
      if (!key) return null;
      // Phase 0: wire provider. Keep call sites in seams/*.ts only.
      void model;
      void baseUrl;
      void prompt;
      return null;
    },
  };
}
