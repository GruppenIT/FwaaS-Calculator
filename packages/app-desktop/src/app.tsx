import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SetupPage } from './pages/setup/setup-page';
import { LoginPage } from './pages/login/login-page';

export function App() {
  // TODO: verificar se já foi configurado (primeiro uso vs login)
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
