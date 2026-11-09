import { useEffect, useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { DashboardTab } from './components/DashboardTab';
import { TransactionsTab } from './components/TransactionsTab';
import { PocketsCategoriesTab } from './components/PocketsCategoriesTab';
import { PortfolioTab } from './components/PortfolioTab';
import { api, getApiBaseUrl, getToken, setApiBaseUrl, setToken } from './services/api';
import type { User } from './types/api';
import goCuanIcon from './assets/GoCuan-icon.png';
import './App.css';

type ActiveTab = 'dashboard' | 'transactions' | 'pockets' | 'portfolio';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const [showApiModal, setShowApiModal] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(getApiBaseUrl());

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setCheckingAuth(false);
      return;
    }

    api
      .getMe()
      .then((u) => {
        setUser(u);
      })
      .catch(() => {
        setToken(null);
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, []);

  const handleLogout = () => {
    setToken(null);
    setUser(null);
  };

  const handleSaveApiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setApiBaseUrl(apiUrlInput);
    setShowApiModal(false);
    window.location.reload();
  };

  if (checkingAuth) {
    return (
      <div className="fullscreen-loader">
        <div className="spinner" />
        <p>Menghubungkan ke server MnyMngmnt...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="app-layout">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="navbar-brand">
          <img src={goCuanIcon} alt="GoCuan" className="navbar-logo-img" />
          <div>
            <strong>GoCuan</strong>
            <span className="env-pill" onClick={() => setShowApiModal(true)} title="Klik untuk ubah URL API">
              EC2 Connected ⚙️
            </span>
          </div>
        </div>

        <nav className="navbar-nav">
          <button
            type="button"
            className={activeTab === 'dashboard' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            type="button"
            className={activeTab === 'transactions' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveTab('transactions')}
          >
            💸 Transaksi
          </button>
          <button
            type="button"
            className={activeTab === 'pockets' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveTab('pockets')}
          >
            👛 Kantong & Kategori
          </button>
          <button
            type="button"
            className={activeTab === 'portfolio' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveTab('portfolio')}
          >
            🌍 Valas & Investasi
          </button>
        </nav>

        <div className="navbar-user">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-email">{user.email}</span>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Keluar
          </button>
        </div>
      </header>

      {/* Modal Ubah URL API */}
      {showApiModal && (
        <div className="modal-backdrop" onClick={() => setShowApiModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Pengaturan Endpoint API EC2</h3>
            <form onSubmit={handleSaveApiConfig} className="form-stack">
              <div className="form-group">
                <label>Base URL API</label>
                <input
                  type="text"
                  value={apiUrlInput}
                  onChange={(e) => setApiUrlInput(e.target.value)}
                />
              </div>
              <div className="input-row">
                <button type="submit" className="btn btn-primary">
                  Simpan & Muat Ulang
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowApiModal(false)}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="main-container">
        {activeTab === 'dashboard' && <DashboardTab onNavigate={setActiveTab} />}
        {activeTab === 'transactions' && <TransactionsTab />}
        {activeTab === 'pockets' && <PocketsCategoriesTab />}
        {activeTab === 'portfolio' && <PortfolioTab />}
      </main>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <button
          type="button"
          className={activeTab === 'dashboard' ? 'mobile-nav-item active' : 'mobile-nav-item'}
          onClick={() => setActiveTab('dashboard')}
        >
          <span className="mobile-nav-icon">📊</span>
          <span>Dashboard</span>
        </button>
        <button
          type="button"
          className={activeTab === 'transactions' ? 'mobile-nav-item active' : 'mobile-nav-item'}
          onClick={() => setActiveTab('transactions')}
        >
          <span className="mobile-nav-icon">💸</span>
          <span>Transaksi</span>
        </button>
        <button
          type="button"
          className={activeTab === 'pockets' ? 'mobile-nav-item active' : 'mobile-nav-item'}
          onClick={() => setActiveTab('pockets')}
        >
          <span className="mobile-nav-icon">👛</span>
          <span>Kantong</span>
        </button>
        <button
          type="button"
          className={activeTab === 'portfolio' ? 'mobile-nav-item active' : 'mobile-nav-item'}
          onClick={() => setActiveTab('portfolio')}
        >
          <span className="mobile-nav-icon">🌍</span>
          <span>Valas</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
