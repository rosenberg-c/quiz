import { Route, Routes } from "react-router";
import { Home } from "./pages/Home/Home";
import { NotFound } from "./pages/NotFound/NotFound";
import { Quiz } from "./pages/Quiz/Quiz";
import { Settings } from "./pages/Settings/Settings";
import { SiteLayout } from "./features/site-layout/SiteLayout";
import { QuizSessionProvider } from "./features/quiz-session/QuizSessionContext";
import { paths } from "./routes";

export const App = () => {
  return (
    <QuizSessionProvider>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path={paths.settings} element={<Settings />} />
          <Route path={paths.quiz} element={<Quiz />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </QuizSessionProvider>
  );
};
