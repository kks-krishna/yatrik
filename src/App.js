import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage.jsx';
import CommuterApp from './CommuterApp.jsx';
import DriverApp from './DriverApp.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/commuter" element={<CommuterApp />} />
        <Route path="/driver" element={<DriverApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
