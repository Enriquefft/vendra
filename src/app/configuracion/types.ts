import type { PersonaProfile } from "@/db/schema/simulation";

export type CreateSessionState =
        | { status: "idle" }
        | {
                  message: string;
                  status: "error";
          }
        | {
                  persona: PersonaProfile;
                  sessionId: string;
                  status: "success";
          };

export const initialCreateSessionState: CreateSessionState = { status: "idle" };
