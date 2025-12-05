import type { PersonaProfile } from "@/db/schema/simulation";

type BaseState = {
	mocked?: boolean;
};

export type CreateSessionState =
	| (BaseState & { status: "idle" })
	| (BaseState & {
			status: "error";
			message: string;
	  })
	| (BaseState & {
			status: "success";
			persona: PersonaProfile;
			sessionId: string;
	  });

export const initialCreateSessionState: CreateSessionState = { status: "idle" };
