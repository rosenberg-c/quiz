import { createContext, useContext } from "react";
import type { SessionContext } from "./quiz-session-types";

export const QuizSessionContext = createContext<SessionContext | null>(null);

export const useQuizSession = (): SessionContext => {
  const context = useContext(QuizSessionContext);
  if (context === null) {
    throw new Error("useQuizSession requires QuizSessionProvider");
  }
  return context;
};
