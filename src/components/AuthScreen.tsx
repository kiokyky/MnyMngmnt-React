import React, { useState } from 'react';
import { api, getApiBaseUrl, setApiBaseUrl, setToken } from '../services/api';
import type { User } from '../types/api';

interface AuthScreenProps {
  onSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('IDR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showApiConfig, setShowApiConfig] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(getApiBaseUrl());
  const [apiSavedMsg, setApiSavedMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login({ email, password });
        setToken(res.token);
        onSuccess(res.user);
      } else {
        const res = await api.register({
          name,
          email,
          password,
          base_currency: baseCurrency,
        });
        setToken(res.token);
        onSuccess(res.user);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan koneksi ke server');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setApiBaseUrl(apiUrlInput);
    setApiUrlInput(getApiBaseUrl());
    setApiSavedMsg('URL API berhasil disimpan!');
    setTimeout(() => setApiSavedMsg(''), 2500);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-logo">💎</div>
          <div>
            <h1>MnyMngmnt</h1>
            <p>Personal Finance, Multi-Pocket & Valas Tracker</p>
          </div>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => {
              setMode('login');
              setError('');
            }}
          >
            Masuk
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => {
              setMode('register');
              setError('');
            }}
          >
            Daftar Akun
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="form-stack">
          {mode === 'register' && (
            <div className="form-group">
              <label>Nama Lengkap</label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label>Mata Uang Utama (Base Currency)</label>
              <select value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)}>
                <option value="IDR">IDR — Rupiah Indonesia</option>
                <option value="USD">USD — US Dollar</option>
                <option value="SGD">SGD — Singapore Dollar</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading
              ? 'Memproses...'
              : mode === 'login'
              ? 'Masuk ke Dashboard'
              : 'Buat Akun Sekarang'}
          </button>
        </form>

        <div className="auth-footer">
          <button
            type="button"
            className="btn-link"
            onClick={() => setShowApiConfig(!showApiConfig)}
          >
            ⚙️ Pengaturan Endpoint Server EC2
          </button>

          {showApiConfig && (
            <form onSubmit={handleSaveApiUrl} className="api-config-box">
              <label>Base URL API Backend</label>
              <div className="input-row">
                <input
                  type="text"
                  value={apiUrlInput}
                  onChange={(e) => setApiUrlInput(e.target.value)}
                  placeholder="http://ec2-...:8080/api/v1"
                />
                <button type="submit" className="btn btn-secondary">
                  Simpan
                </button>
              </div>
              {apiSavedMsg && <span className="text-success">{apiSavedMsg}</span>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

