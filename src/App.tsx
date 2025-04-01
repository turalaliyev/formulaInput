import FormulaInput from "./components/FormulaInput";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <FormulaInput />
      </div>
    </QueryClientProvider>
  );
};

export default App;
