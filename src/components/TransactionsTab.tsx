import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type {
  Category,
  Pocket,
  Transaction,
  TransactionSummaryResponse,
  TransactionType,
} from '../types/api';
import { formatCurrency, formatDate, parseDecimalInput } from '../utils/format';

export const TransactionsTab: React.FC = () => {
  const [summary, setSummary] = useState<TransactionSummaryResponse | null>(null);
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterPocket, setFilterPocket] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Create / Edit Modal / Form
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [pocketId, setPocketId] = useState('');
  const [relatedPocketId, setRelatedPocketId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [txDate, setTxDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  const loadInitialData = async () => {
    try {
      const [pList, cList] = await Promise.all([api.listPockets(), api.listCategories()]);
      setPockets(pList);
      setCategories(cList);
      if (pList.length > 0 && !pocketId) {
        setPocketId(pList[0].id);
      }
    } catch {
      // ignore initial dropdown error
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.listTransactions({
        pocket_id: filterPocket || undefined,
        category_id: filterCategory || undefined,
        type: filterType || undefined,
        start_date: filterStartDate || undefined,
        end_date: filterEndDate || undefined,
      });
      setSummary(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar transaksi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [filterPocket, filterCategory, filterType, filterStartDate, filterEndDate]);

  const filteredCategories = categories.filter((c) =>
    txType === 'transfer' ? false : c.type === txType
  );

  const resetForm = () => {
    setEditingTx(null);
    setAmount('');
    setDescription('');
    setTxDate(new Date().toISOString().slice(0, 10));
    setShowForm(false);
  };

  const startEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setTxType(tx.type);
    setPocketId(tx.pocket_id);
    setRelatedPocketId(tx.related_pocket_id || '');
    setCategoryId(tx.category_id || '');
    setAmount(String(Number(tx.amount)));
    setDescription(tx.description || '');
    setTxDate(
      tx.transaction_date ? tx.transaction_date.slice(0, 10) : new Date().toISOString().slice(0, 10)
    );
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pocketId) {
      setError('Pilih kantong terlebih dahulu!');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const isoDate = txDate ? new Date(`${txDate}T12:00:00Z`).toISOString() : undefined;
      const payload = {
        pocket_id: pocketId,
        related_pocket_id: txType === 'transfer' && relatedPocketId ? relatedPocketId : null,
        category_id: txType !== 'transfer' && categoryId ? categoryId : null,
        type: txType,
        amount: parseDecimalInput(amount),
        description,
        transaction_date: isoDate,
      };

      if (editingTx) {
        await api.updateTransaction(editingTx.id, payload);
      } else {
        await api.createTransaction(payload);
      }

      resetForm();
      await Promise.all([loadTransactions(), loadInitialData()]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan transaksi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus transaksi ini? Saldo kantong akan otomatis dikembalikan.')) return;
    try {
      await api.deleteTransaction(id);
      await Promise.all([loadTransactions(), loadInitialData()]);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus transaksi');
    }
  };

  const resetFilters = () => {
    setFilterPocket('');
    setFilterCategory('');
    setFilterType('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  return (
    <div className="tab-content">
      <div className="page-header">
        <div>
          <h2>Riwayat & Pencatatan Transaksi</h2>
          <p className="text-muted">
            Catat pemasukan, pengeluaran, atau transfer antar kantong dengan pembaruan saldo otomatis
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? '✕ Tutup Form' : '+ Tambah Transaksi'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Form Tambah / Edit Transaksi */}
      {showForm && (
        <div className="card form-card">
          <div className="card-header" style={{ marginBottom: 0 }}>
            <h3>{editingTx ? 'Edit Transaksi' : 'Catat Transaksi Baru'}</h3>
            {editingTx && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>
                Batal Edit
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Jenis Transaksi</label>
              <div className="segmented-control">
                <button
                  type="button"
                  className={txType === 'expense' ? 'active expense' : ''}
                  onClick={() => {
                    setTxType('expense');
                    setCategoryId('');
                  }}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  className={txType === 'income' ? 'active income' : ''}
                  onClick={() => {
                    setTxType('income');
                    setCategoryId('');
                  }}
                >
                  Pemasukan
                </button>
                <button
                  type="button"
                  className={txType === 'transfer' ? 'active transfer' : ''}
                  onClick={() => {
                    setTxType('transfer');
                    setCategoryId('');
                  }}
                >
                  Transfer Kantong
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>{txType === 'transfer' ? 'Dari Kantong (Sumber)' : 'Pilih Kantong'}</label>
              <select value={pocketId} onChange={(e) => setPocketId(e.target.value)} required>
                <option value="">-- Pilih Kantong --</option>
                {pockets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatCurrency(p.balance, p.currency)})
                  </option>
                ))}
              </select>
            </div>

            {txType === 'transfer' ? (
              <div className="form-group">
                <label>Ke Kantong (Tujuan)</label>
                <select
                  value={relatedPocketId}
                  onChange={(e) => setRelatedPocketId(e.target.value)}
                  required
                >
                  <option value="">-- Pilih Kantong Tujuan --</option>
                  {pockets
                    .filter((p) => p.id !== pocketId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatCurrency(p.balance, p.currency)})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label>Kategori</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">-- Tanpa Kategori --</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon ? `${c.icon} ` : ''}
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Nominal</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Contoh: 150000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Tanggal Transaksi</label>
              <input
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Catatan / Deskripsi</label>
              <input
                type="text"
                placeholder="Contoh: Makan siang, Gaji bulanan, dll."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-actions-full">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting
                  ? 'Menyimpan...'
                  : editingTx
                  ? 'Simpan Perubahan'
                  : 'Simpan Transaksi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Banner */}
      <div className="stats-grid stats-grid-3">
        <div className="stat-card">
          <span className="stat-label">Total Pemasukan (Filter)</span>
          <h3 className="stat-value text-success">{formatCurrency(summary?.total_income)}</h3>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Pengeluaran (Filter)</span>
          <h3 className="stat-value text-danger">{formatCurrency(summary?.total_expense)}</h3>
        </div>
        <div className="stat-card">
          <span className="stat-label">Selisih Arus Kas (Net)</span>
          <h3
            className={`stat-value ${
              Number(summary?.net_cashflow || 0) >= 0 ? 'text-success' : 'text-danger'
            }`}
          >
            {formatCurrency(summary?.net_cashflow)}
          </h3>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card filter-bar">
        <div className="filter-grid">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">Semua Jenis</option>
            <option value="income">Pemasukan (Income)</option>
            <option value="expense">Pengeluaran (Expense)</option>
            <option value="transfer">Transfer</option>
          </select>

          <select value={filterPocket} onChange={(e) => setFilterPocket(e.target.value)}>
            <option value="">Semua Kantong</option>
            {pockets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            title="Dari Tanggal"
          />

          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            title="Sampai Tanggal"
          />

          <button type="button" className="btn btn-secondary" onClick={resetFilters}>
            Reset Filter
          </button>
        </div>
      </div>

      {/* Tabel Daftar Transaksi */}
      <div className="card">
        {loading ? (
          <div className="loading-state">Memuat transaksi...</div>
        ) : !summary?.transactions || summary.transactions.length === 0 ? (
          <div className="empty-box">
            <p>Belum ada transaksi yang sesuai filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Jenis</th>
                  <th>Kantong</th>
                  <th>Kategori</th>
                  <th>Deskripsi</th>
                  <th>Nominal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {summary.transactions.map((tx) => {
                  const pocketCurrency = tx.pocket?.currency || 'IDR';
                  return (
                    <tr key={tx.id}>
                      <td>{formatDate(tx.transaction_date)}</td>
                      <td>
                        <span className={`badge badge-tx-${tx.type}`}>{tx.type.toUpperCase()}</span>
                      </td>
                      <td>
                        <strong>{tx.pocket?.name || '-'}</strong>
                        {tx.type === 'transfer' && tx.related_pocket && (
                          <span className="text-muted"> → {tx.related_pocket.name}</span>
                        )}
                      </td>
                      <td>
                        {tx.category ? (
                          <span>
                            {tx.category.icon ? `${tx.category.icon} ` : ''}
                            {tx.category.name}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>{tx.description || '-'}</td>
                      <td
                        className={
                          tx.type === 'income'
                            ? 'text-success font-bold'
                            : tx.type === 'expense'
                            ? 'text-danger font-bold'
                            : 'font-bold'
                        }
                      >
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                        {formatCurrency(tx.amount, pocketCurrency)}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => startEditTx(tx)}
                            title="Edit Transaksi"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="btn-icon btn-danger-ghost"
                            onClick={() => handleDelete(tx.id)}
                            title="Hapus & Kembalikan Saldo"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
