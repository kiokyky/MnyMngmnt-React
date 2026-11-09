import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type {
  AssetTransaction,
  AssetType,
  Category,
  HoldingMarginView,
  Pocket,
  PortfolioOverviewResponse,
} from '../types/api';
import { formatCurrency, formatDate, formatNumber } from '../utils/format';

export const PortfolioTab: React.FC = () => {
  const [overview, setOverview] = useState<PortfolioOverviewResponse | null>(null);
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create Holding Modal
  const [showCreate, setShowCreate] = useState(false);
  const [assetType, setAssetType] = useState<AssetType>('forex');
  const [symbol, setSymbol] = useState('USD');
  const [name, setName] = useState('');
  const [currentRate, setCurrentRate] = useState('');
  const [createPocket, setCreatePocket] = useState(true);

  // Selected Holding for Detail / Buy / Sell / Rate Simulation
  const [selectedHolding, setSelectedHolding] = useState<HoldingMarginView | null>(null);
  const [history, setHistory] = useState<AssetTransaction[]>([]);
  const [simRate, setSimRate] = useState('');
  const [actionMode, setActionMode] = useState<'none' | 'buy' | 'sell' | 'rate'>('none');

  // Buy / Sell Form
  const [pocketId, setPocketId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [units, setUnits] = useState('');
  const [rateIdr, setRateIdr] = useState('');
  const [feeIdr, setFeeIdr] = useState('0');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPortfolio = async () => {
    setLoading(true);
    setError('');
    try {
      const [portRes, pList, cList] = await Promise.all([
        api.listHoldings(),
        api.listPockets(),
        api.listCategories(),
      ]);
      setOverview(portRes);
      setPockets(pList);
      setCategories(cList);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat portofolio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const openHoldingDetail = async (id: string, overrideRate?: number) => {
    try {
      const detail = await api.getHoldingDetail(id, overrideRate);
      setSelectedHolding(detail.summary);
      setHistory(detail.history || []);
      if (!overrideRate) {
        setSimRate(String(Number(detail.summary.current_rate_idr || 0)));
        setRateIdr(String(Number(detail.summary.current_rate_idr || 0)));
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal memuat detail aset');
    }
  };

  const handleCreateHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.createHolding({
        asset_type: assetType,
        symbol: symbol.toUpperCase(),
        name,
        current_rate_idr: Number(currentRate || 0),
        create_pocket: createPocket,
      });
      setName('');
      setCurrentRate('');
      setShowCreate(false);
      await loadPortfolio();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membuat aset portofolio');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBuyOrSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHolding) return;
    setSubmitting(true);
    setError('');

    try {
      if (actionMode === 'buy') {
        await api.buyHolding(selectedHolding.holding.id, {
          source_pocket_id: pocketId || null,
          category_id: categoryId || null,
          units: Number(units),
          rate_idr: Number(rateIdr),
          fee_idr: Number(feeIdr || 0),
          notes,
        });
      } else if (actionMode === 'sell') {
        await api.sellHolding(selectedHolding.holding.id, {
          target_pocket_id: pocketId || null,
          category_id: categoryId || null,
          units: Number(units),
          rate_idr: Number(rateIdr),
          fee_idr: Number(feeIdr || 0),
          notes,
        });
      }
      setUnits('');
      setNotes('');
      setActionMode('none');
      await Promise.all([loadPortfolio(), openHoldingDetail(selectedHolding.holding.id)]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memproses transaksi aset');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHolding) return;
    setSubmitting(true);
    try {
      await api.updateHoldingRate(selectedHolding.holding.id, Number(simRate));
      setActionMode('none');
      await Promise.all([loadPortfolio(), openHoldingDetail(selectedHolding.holding.id)]);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal memperbarui kurs pasar');
    } finally {
      setSubmitting(false);
    }
  };

  const idrPockets = pockets.filter((p) => p.currency.toUpperCase() === 'IDR');
  const totalUnrealized = Number(overview?.total_unrealized_pnl_idr || 0);
  const totalUnrealizedPct = Number(overview?.total_unrealized_percent || 0);

  return (
    <div className="tab-content">
      <div className="page-header">
        <div>
          <h2>Portofolio Valas (Blu Valas, dll.) & Investasi</h2>
          <p className="text-muted">
            Perhitungan otomatis Weighted Average Cost, pemotongan kantong IDR, serta simulasi Margin
            P&L
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? '✕ Tutup Form' : '+ Tambah Aset Valas / Investasi'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Form Buat Holding Baru */}
      {showCreate && (
        <div className="card form-card">
          <h3>Tambah Aset Tracking Baru</h3>
          <form onSubmit={handleCreateHolding} className="form-grid">
            <div className="form-group">
              <label>Jenis Aset</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as AssetType)}
              >
                <option value="forex">Valas (Forex - USD, SGD, JPY, AUD...)</option>
                <option value="gold">Emas (Gold)</option>
                <option value="stock">Saham (Stock)</option>
                <option value="mutual_fund">Reksadana (Mutual Fund)</option>
                <option value="crypto">Kripto (Crypto)</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div className="form-group">
              <label>Simbol / Kode Mata Uang</label>
              <input
                type="text"
                placeholder="Contoh: USD, SGD,BBCA, XAU"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="form-group">
              <label>Nama Aset / Kantong Valas</label>
              <input
                type="text"
                placeholder="Contoh: Blu Valas USD"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Kurs / Harga Pasar Saat Ini (IDR)</label>
              <input
                type="number"
                step="any"
                placeholder="Contoh: 15850"
                value={currentRate}
                onChange={(e) => setCurrentRate(e.target.value)}
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={createPocket}
                  onChange={(e) => setCreatePocket(e.target.checked)}
                />
                <span>Otomatis buatkan Kantong khusus untuk aset ini</span>
              </label>
            </div>

            <div className="form-actions-full">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Menyimpan...' : 'Buat Aset Portofolio'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ringkasan Total Portofolio */}
      <div className="stats-grid stats-grid-4">
        <div className="stat-card">
          <span className="stat-label">Total Modal Diinvestasikan</span>
          <h3 className="stat-value">{formatCurrency(overview?.total_invested_idr)}</h3>
        </div>
        <div className="stat-card">
          <span className="stat-label">Nilai Pasar Sekarang</span>
          <h3 className="stat-value">{formatCurrency(overview?.total_market_value_idr)}</h3>
        </div>
        <div className="stat-card">
          <span className="stat-label">Unrealized Margin (P&L)</span>
          <h3 className={`stat-value ${totalUnrealized >= 0 ? 'text-success' : 'text-danger'}`}>
            {totalUnrealized >= 0 ? '+' : ''}
            {formatCurrency(totalUnrealized)} ({totalUnrealized >= 0 ? '+' : ''}
            {formatNumber(totalUnrealizedPct, 2)}%)
          </h3>
        </div>
        <div className="stat-card">
          <span className="stat-label">Realized P&L (Sudah Dicairkan)</span>
          <h3
            className={`stat-value ${
              Number(overview?.total_realized_pnl_idr || 0) >= 0 ? 'text-success' : 'text-danger'
            }`}
          >
            {formatCurrency(overview?.total_realized_pnl_idr)}
          </h3>
        </div>
      </div>

      <div className="portfolio-layout">
        {/* Daftar Holdings */}
        <div className="card">
          <h3>Daftar Aset Valas & Investasi</h3>
          {loading ? (
            <div className="loading-state">Memuat portofolio...</div>
          ) : !overview?.holdings || overview.holdings.length === 0 ? (
            <div className="empty-box">
              <p>Belum ada aset Valas atau Investasi. Klik tombol di atas untuk mulai melacak.</p>
            </div>
          ) : (
            <div className="holdings-grid">
              {overview.holdings.map((item) => {
                const uPnl = Number(item.unrealized_pnl_idr || 0);
                const uPct = Number(item.unrealized_pnl_percent || 0);
                const isSelected = selectedHolding?.holding.id === item.holding.id;

                return (
                  <div
                    key={item.holding.id}
                    className={`holding-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => openHoldingDetail(item.holding.id)}
                  >
                    <div className="holding-header">
                      <div>
                        <span className="badge">{item.holding.asset_type.toUpperCase()}</span>
                        <h4>{item.holding.name}</h4>
                      </div>
                      <div className="holding-units">
                        {formatNumber(item.holding.total_units, 4)} {item.holding.symbol}
                      </div>
                    </div>

                    <div className="holding-metrics">
                      <div>
                        <span className="meta-label">Avg Kurs Beli</span>
                        <strong>{formatCurrency(item.holding.average_buy_rate_idr)}</strong>
                      </div>
                      <div>
                        <span className="meta-label">Kurs Pasar</span>
                        <strong>{formatCurrency(item.current_rate_idr)}</strong>
                      </div>
                      <div>
                        <span className="meta-label">Modal IDR</span>
                        <strong>{formatCurrency(item.holding.total_cost_idr)}</strong>
                      </div>
                      <div>
                        <span className="meta-label">Nilai Pasar IDR</span>
                        <strong>{formatCurrency(item.market_value_idr)}</strong>
                      </div>
                    </div>

                    <div className="holding-footer">
                      <span className={uPnl >= 0 ? 'text-success font-bold' : 'text-danger font-bold'}>
                        Margin: {uPnl >= 0 ? '+' : ''}
                        {formatCurrency(uPnl)} ({uPnl >= 0 ? '+' : ''}
                        {formatNumber(uPct, 2)}%)
                      </span>
                      <span className="btn-link">Detail & Transaksi →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel Detail, Simulasi Kurs, Beli / Jual */}
        {selectedHolding && (
          <div className="card detail-panel">
            <div className="card-header">
              <div>
                <span className="badge">{selectedHolding.holding.symbol}</span>
                <h3>{selectedHolding.holding.name}</h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setSelectedHolding(null)}
                title="Tutup Detail"
              >
                ✕
              </button>
            </div>

            {/* Simulasi & Update Kurs */}
            <div className="sim-box">
              <label>Simulasi / Update Kurs Pasar Saat Ini (IDR per {selectedHolding.holding.symbol})</label>
              <div className="input-row">
                <input
                  type="number"
                  step="any"
                  value={simRate}
                  onChange={(e) => setSimRate(e.target.value)}
                  placeholder="Masukkan kurs..."
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    openHoldingDetail(selectedHolding.holding.id, Number(simRate || 0))
                  }
                >
                  🔍 Simulasikan
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpdateRate}
                  disabled={submitting}
                >
                  💾 Simpan Kurs
                </button>
              </div>
            </div>

            {/* Action Buttons: Beli / Jual */}
            <div className="action-bar">
              <button
                type="button"
                className={`btn ${actionMode === 'buy' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setActionMode(actionMode === 'buy' ? 'none' : 'buy');
                  setRateIdr(String(Number(selectedHolding.current_rate_idr || 0)));
                }}
              >
                📥 Beli / Top-Up {selectedHolding.holding.symbol}
              </button>
              <button
                type="button"
                className={`btn ${actionMode === 'sell' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setActionMode(actionMode === 'sell' ? 'none' : 'sell');
                  setRateIdr(String(Number(selectedHolding.current_rate_idr || 0)));
                }}
              >
                📤 Jual / Cairkan {selectedHolding.holding.symbol}
              </button>
            </div>

            {(actionMode === 'buy' || actionMode === 'sell') && (
              <form onSubmit={handleBuyOrSell} className="subform-box">
                <h4>
                  {actionMode === 'buy'
                    ? `Beli ${selectedHolding.holding.symbol} (Tambah Unit)`
                    : `Jual ${selectedHolding.holding.symbol} (Cairkan ke IDR)`}
                </h4>

                <div className="form-group">
                  <label>
                    {actionMode === 'buy'
                      ? 'Potong Saldo dari Kantong IDR (Opsional)'
                      : 'Masukkan Hasil Pencairan ke Kantong IDR (Opsional)'}
                  </label>
                  <select value={pocketId} onChange={(e) => setPocketId(e.target.value)}>
                    <option value="">-- Jangan Potong / Tambah Kantong IDR --</option>
                    {idrPockets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatCurrency(p.balance, p.currency)})
                      </option>
                    ))}
                  </select>
                </div>

                {pocketId && (
                  <div className="form-group">
                    <label>Kategori Transaksi Kas (Opsional)</label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                      <option value="">-- Otomatis / Tanpa Kategori --</option>
                      {categories
                        .filter((c) =>
                          actionMode === 'buy' ? c.type === 'expense' : c.type === 'income'
                        )
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.icon} {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="input-row-2">
                  <div className="form-group">
                    <label>Jumlah Unit ({selectedHolding.holding.symbol})</label>
                    <input
                      type="number"
                      step="any"
                      min="0.000001"
                      placeholder="Contoh: 100"
                      value={units}
                      onChange={(e) => setUnits(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Kurs Transaksi (IDR / Unit)</label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      placeholder="Contoh: 15750"
                      value={rateIdr}
                      onChange={(e) => setRateIdr(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-row-2">
                  <div className="form-group">
                    <label>Biaya Admin / Fee (IDR)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={feeIdr}
                      onChange={(e) => setFeeIdr(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Catatan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Tabungan Valas Bulan Ini"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                {units && rateIdr && (
                  <div className="calc-preview">
                    Estimasi Total Rupiah:{' '}
                    <strong>
                      {formatCurrency(
                        Number(units) * Number(rateIdr) +
                          (actionMode === 'buy' ? Number(feeIdr || 0) : -Number(feeIdr || 0))
                      )}
                    </strong>
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                  {submitting
                    ? 'Memproses...'
                    : actionMode === 'buy'
                    ? 'Konfirmasi Pembelian'
                    : 'Konfirmasi Penjualan'}
                </button>
              </form>
            )}

            {/* Riwayat Lot Beli / Jual */}
            <div className="history-section">
              <h4>Riwayat Pembelian & Penjualan ({history.length})</h4>
              {history.length === 0 ? (
                <p className="text-muted">Belum ada riwayat transaksi untuk aset ini.</p>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Tipe</th>
                        <th>Unit</th>
                        <th>Kurs (IDR)</th>
                        <th>Total (IDR)</th>
                        <th>Realized P&L</th>
                        <th>Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h) => (
                        <tr key={h.id}>
                          <td>{formatDate(h.transaction_date)}</td>
                          <td>
                            <span
                              className={`badge ${
                                h.type === 'BUY' ? 'badge-tx-income' : 'badge-tx-expense'
                              }`}
                            >
                              {h.type}
                            </span>
                          </td>
                          <td>
                            {formatNumber(h.units, 4)} {selectedHolding.holding.symbol}
                          </td>
                          <td>{formatCurrency(h.rate_idr)}</td>
                          <td>{formatCurrency(h.total_idr)}</td>
                          <td
                            className={
                              Number(h.realized_pnl_idr) > 0
                                ? 'text-success'
                                : Number(h.realized_pnl_idr) < 0
                                ? 'text-danger'
                                : ''
                            }
                          >
                            {h.type === 'SELL' ? formatCurrency(h.realized_pnl_idr) : '-'}
                          </td>
                          <td>{h.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

