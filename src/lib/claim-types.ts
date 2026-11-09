/** Respuesta de /api/claim (refleja el JSON de la función SQL claim_word). */
export type ClaimStatus =
  | "won" // primera persona: medalla 🥇
  | "joined" // ya tenía dueño; quedas apuntado con tu posición
  | "already_yours" // ya la habías mandado este año
  | "invalid" // no está en el diccionario
  | "rate_limited"
  | "no_profile"
  | "unauthenticated"
  | "human_required"
  | "error";

export type ClaimResponse = {
  status: ClaimStatus;
  word?: string;
  year?: number;
  position?: number;
  total?: number;
  claimed_at?: string;
  owner?: { username: string; country: string | null; claimed_at: string } | null;
  retry_after?: number;
  message?: string;
};
