import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Identification from './pages/Identification';
import Evaluation from './pages/Evaluation';
import Exams from './pages/Exams';
import Plan from './pages/Plan';
import Sessions from './pages/Sessions';
import Financial from './pages/Financial';
import Reports from './pages/Reports';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/identificacao" replace />} />
          <Route path="/identificacao" element={<Identification />} />
          <Route path="/avaliacao" element={<Evaluation />} />
          <Route path="/exames" element={<Exams />} />
          <Route path="/plano" element={<Plan />} />
          <Route path="/sessoes" element={<Sessions />} />
          <Route path="/financeiro" element={<Financial />} />
          <Route path="/relatorios" element={<Reports />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
