import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { DashboardSummaryResponse } from '../types/api';
import { formatCurrency, formatNumber, formatRateIDR } from '../utils/format';

interface DashboardTabProps {
  onNavigate: (tab: 'dashboard' | 'transactions' | 'pockets' | 'portfolio') => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ onNavigate }) => {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getDashboard(month);
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat ringkasan dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [month]);

  if (loading && !data) {
    return <div className="loading-state">Memuat data dashboard...</div>;
  }

  const pnl = Number(data?.portfolio_unrealized_pnl_idr || 0);
  const pnlPct = Number(data?.portfolio_unrealized_percent || 0);
  const netCashflow = Number(data?.monthly_net_cashflow_idr || 0);
  const totalExpense = Number(data?.monthly_expense_idr || 0);

  return (
    <div className="tab-content">
      <div className="page-header">
        <div>
          <h2>Ringkasan Keuangan & Kekayaan Bersih</h2>
          <p className="text-muted">
            Pantau saldo seluruh kantong, arus kas bulanan, serta margin portofolio Valas & Investasi
          </p>
        </div>
        <div className="header-actions">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="input-month"
          />
          <button className="btn btn-secondary" onClick={fetchSummary}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Hero Net Worth Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <span className="stat-label">Total Kekayaan Bersih (Net Worth)</span>
          <h3 className="stat-value">{formatCurrency(data?.total_net_worth_idr)}</h3>
          <span className="stat-sub">Gabungan Kantong IDR + Nilai Pasar Portofolio</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Total Saldo Kantong IDR</span>
          <h3 className="stat-value">{formatCurrency(data?.total_idr_pockets_balance)}</h3>
          <span className="stat-sub">{data?.pockets?.length || 0} kantong terdaftar</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Nilai Pasar Portofolio (Valas/Investasi)</span>
          <h3 className="stat-value">{formatCurrency(data?.portfolio_market_value_idr)}</h3>
          <span className={`stat-sub ${pnl >= 0 ? 'text-success' : 'text-danger'}`}>
            Margin: {pnl >= 0 ? '+' : ''}
            {formatCurrency(pnl)} ({pnl >= 0 ? '+' : ''}
            {formatNumber(pnlPct, 2)}%)
          </span>
        </div>
      </div>

      {/* Monthly Cashflow */}
      <div className="stats-grid stats-grid-3">
        <div className="stat-card">
          <span className="stat-label">Pemasukan Bulan Ini ({month})</span>
          <h3 className="stat-value text-success">{formatCurrency(data?.monthly_income_idr)}</h3>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pengeluaran Bulan Ini ({month})</span>
          <h3 className="stat-value text-danger">{formatCurrency(data?.monthly_expense_idr)}</h3>
        </div>
        <div className="stat-card">
          <span className="stat-label">Arus Kas Bersih (Net Cashflow)</span>
          <h3 className={`stat-value ${netCashflow >= 0 ? 'text-success' : 'text-danger'}`}>
            {netCashflow >= 0 ? '+' : ''}
            {formatCurrency(netCashflow)}
          </h3>
        </div>
      </div>

      <div className="dashboard-columns">
        {/* Pockets Summary */}
        <div className="card">
          <div className="card-header">
            <h3>Daftar Kantong (Pockets)</h3>
            <button className="btn-link" onClick={() => onNavigate('pockets')}>
              Kelola Kantong →
            </button>
          </div>
          {!data?.pockets || data.pockets.length === 0 ? (
            <div className="empty-box">
              <p>Belum ada kantong yang dibuat.</p>
              <button className="btn btn-primary btn-sm" onClick={() => onNavigate('pockets')}>
                + Buat Kantong Pertama
              </button>
            </div>
          ) : (
            <div className="list-group">
              {data.pockets.map((p) => (
                <div key={p.id} className="list-item">
                  <div>
                    <div className="item-title">{p.name}</div>
                    <div className="item-meta">
                      <span className={`badge badge-${p.type}`}>{p.type.toUpperCase()}</span>
                      <span>Mata Uang: {p.currency}</span>
                    </div>
                  </div>
                  <div className="item-amount">{formatCurrency(p.balance, p.currency)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expense Breakdown by Category */}
        <div className="card">
          <div className="card-header">
            <h3>Rincian Pengeluaran per Kategori</h3>
            <button className="btn-link" onClick={() => onNavigate('transactions')}>
              Lihat Transaksi →
            </button>
          </div>
          {!data?.expense_by_category || data.expense_by_category.length === 0 ? (
            <div className="empty-box">
              <p>Belum ada pengeluaran tercatat pada bulan {month}.</p>
              <button className="btn btn-primary btn-sm" onClick={() => onNavigate('transactions')}>
                + Catat Transaksi
              </button>
            </div>
          ) : (
            <div className="list-group">
              {data.expense_by_category.map((cat) => {
                const amt = Number(cat.total_amount || 0);
                const pct = totalExpense > 0 ? Math.min(100, (amt / totalExpense) * 100) : 0;
                return (
                  <div key={cat.category_id} className="category-progress-item">
                    <div className="cat-row">
                      <span className="item-title">{cat.category_name}</span>
                      <span className="item-amount">
                        {formatCurrency(amt)} ({formatNumber(pct, 1)}%)
                      </span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Quick View */}
      {data?.portfolio && data.portfolio.holdings && data.portfolio.holdings.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>Portofolio Valas & Investasi</h3>
            <button className="btn-link" onClick={() => onNavigate('portfolio')}>
              Buka Kalkulator & Transaksi Valas →
            </button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Aset</th>
                  <th>Unit / Saldo</th>
                  <th>Avg Kurs Beli</th>
                  <th>Kurs Saat Ini</th>
                  <th>Modal (IDR)</th>
                  <th>Nilai Pasar (IDR)</th>
                  <th>Unrealized P&L</th>
                </tr>
              </thead>
              <tbody>
                {data.portfolio.holdings.map((item) => {
                  const uPnl = Number(item.unrealized_pnl_idr || 0);
                  const uPct = Number(item.unrealized_pnl_percent || 0);
                  return (
                    <tr key={item.holding.id}>
                      <td>
                        <strong>{item.holding.name}</strong>{' '}
                        <span className="badge">{item.holding.symbol}</span>
                      </td>
                      <td>
                        {formatNumber(item.holding.total_units, 4)} {item.holding.symbol}
                      </td>
                      <td>{formatRateIDR(item.holding.average_buy_rate_idr)}</td>
                      <td>{formatRateIDR(item.current_rate_idr)}</td>
                      <td>{formatCurrency(item.holding.total_cost_idr)}</td>
                      <td>
                        <strong>{formatCurrency(item.market_value_idr)}</strong>
                      </td>
                      <td className={uPnl >= 0 ? 'text-success' : 'text-danger'}>
                        {uPnl >= 0 ? '+' : ''}
                        {formatCurrency(uPnl)} ({uPnl >= 0 ? '+' : ''}
                        {formatNumber(uPct, 2)}%)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

