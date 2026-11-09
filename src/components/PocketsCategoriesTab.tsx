import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Category, CategoryType, Pocket, PocketType } from '../types/api';
import { formatCurrency } from '../utils/format';

export const PocketsCategoriesTab: React.FC = () => {
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pocket Form State
  const [editingPocket, setEditingPocket] = useState<Pocket | null>(null);
  const [pocketName, setPocketName] = useState('');
  const [pocketType, setPocketType] = useState<PocketType>('bank');
  const [pocketCurrency, setPocketCurrency] = useState('IDR');
  const [initialBalance, setInitialBalance] = useState('');

  // Category Form State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<CategoryType>('expense');
  const [catIcon, setCatIcon] = useState('💸');
  const [catColor, setCatColor] = useState('#3b82f6');

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [pList, cList] = await Promise.all([api.listPockets(), api.listCategories()]);
      setPockets(pList);
      setCategories(cList);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat kantong & kategori');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSavePocket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingPocket) {
        await api.updatePocket(editingPocket.id, {
          name: pocketName,
          type: pocketType,
          currency: pocketCurrency,
        });
      } else {
        await api.createPocket({
          name: pocketName,
          type: pocketType,
          currency: pocketCurrency,
          initial_balance: Number(initialBalance || 0),
        });
      }
      resetPocketForm();
      await loadAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan kantong');
    }
  };

  const resetPocketForm = () => {
    setEditingPocket(null);
    setPocketName('');
    setPocketType('bank');
    setPocketCurrency('IDR');
    setInitialBalance('');
  };

  const startEditPocket = (p: Pocket) => {
    setEditingPocket(p);
    setPocketName(p.name);
    setPocketType(p.type);
    setPocketCurrency(p.currency);
    setInitialBalance('');
  };

  const handleDeletePocket = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus kantong ini?')) return;
    try {
      await api.deletePocket(id);
      await loadAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus kantong');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, {
          name: catName,
          icon: catIcon,
          color: catColor,
        });
      } else {
        await api.createCategory({
          name: catName,
          type: catType,
          icon: catIcon,
          color: catColor,
        });
      }
      resetCategoryForm();
      await loadAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan kategori');
    }
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCatName('');
    setCatType('expense');
    setCatIcon('💸');
    setCatColor('#3b82f6');
  };

  const startEditCategory = (c: Category) => {
    setEditingCategory(c);
    setCatName(c.name);
    setCatType(c.type);
    setCatIcon(c.icon || '🏷️');
    setCatColor(c.color || '#3b82f6');
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Hapus kategori ini?')) return;
    try {
      await api.deleteCategory(id);
      await loadAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus kategori');
    }
  };

  return (
    <div className="tab-content">
      <div className="page-header">
        <div>
          <h2>Manajemen Kantong (Pockets) & Kategori</h2>
          <p className="text-muted">
            Kelola rekening bank, dompet digital, kas, kantong valas, serta kategori transaksi Anda
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-columns">
        {/* Bagian Kantong */}
        <div className="stack-col">
          <div className="card">
            <h3>{editingPocket ? `Edit Kantong: ${editingPocket.name}` : 'Tambah Kantong Baru'}</h3>
            <form onSubmit={handleSavePocket} className="form-stack">
              <div className="form-group">
                <label>Nama Kantong</label>
                <input
                  type="text"
                  placeholder="Contoh: Blu Utama, BCA, GoPay"
                  value={pocketName}
                  onChange={(e) => setPocketName(e.target.value)}
                  required
                />
              </div>

              <div className="input-row-2">
                <div className="form-group">
                  <label>Tipe Kantong</label>
                  <select
                    value={pocketType}
                    onChange={(e) => setPocketType(e.target.value as PocketType)}
                  >
                    <option value="bank">Bank</option>
                    <option value="ewallet">E-Wallet</option>
                    <option value="cash">Uang Tunai (Cash)</option>
                    <option value="forex">Valas (Forex)</option>
                    <option value="investment">Investasi</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Mata Uang</label>
                  <input
                    type="text"
                    placeholder="IDR, USD, SGD, JPY..."
                    value={pocketCurrency}
                    onChange={(e) => setPocketCurrency(e.target.value.toUpperCase())}
                    required
                  />
                </div>
              </div>

              {!editingPocket && (
                <div className="form-group">
                  <label>Saldo Awal</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Contoh: 5000000"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                  />
                </div>
              )}

              <div className="input-row">
                <button type="submit" className="btn btn-primary">
                  {editingPocket ? 'Simpan Perubahan' : '+ Buat Kantong'}
                </button>
                {editingPocket && (
                  <button type="button" className="btn btn-secondary" onClick={resetPocketForm}>
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="card">
            <h3>Daftar Kantong Anda ({pockets.length})</h3>
            {loading ? (
              <div className="loading-state">Memuat kantong...</div>
            ) : pockets.length === 0 ? (
              <div className="empty-box">Belum ada kantong.</div>
            ) : (
              <div className="list-group">
                {pockets.map((p) => (
                  <div key={p.id} className="list-item">
                    <div>
                      <div className="item-title">{p.name}</div>
                      <div className="item-meta">
                        <span className={`badge badge-${p.type}`}>{p.type.toUpperCase()}</span>
                        <span>{p.currency}</span>
                      </div>
                    </div>
                    <div className="item-right">
                      <div className="item-amount">{formatCurrency(p.balance, p.currency)}</div>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => startEditPocket(p)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn-icon btn-danger-ghost"
                          onClick={() => handleDeletePocket(p.id)}
                          title="Hapus"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bagian Kategori */}
        <div className="stack-col">
          <div className="card">
            <h3>
              {editingCategory ? `Edit Kategori: ${editingCategory.name}` : 'Tambah Kategori Baru'}
            </h3>
            <form onSubmit={handleSaveCategory} className="form-stack">
              <div className="form-group">
                <label>Nama Kategori</label>
                <input
                  type="text"
                  placeholder="Contoh: Makanan & Minuman, Gaji, Investasi"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  required
                />
              </div>

              <div className="input-row-3">
                {!editingCategory && (
                  <div className="form-group">
                    <label>Tipe</label>
                    <select
                      value={catType}
                      onChange={(e) => setCatType(e.target.value as CategoryType)}
                    >
                      <option value="expense">Pengeluaran</option>
                      <option value="income">Pemasukan</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Ikon (Emoji)</label>
                  <input
                    type="text"
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value)}
                    placeholder="🍔"
                  />
                </div>

                <div className="form-group">
                  <label>Warna Label</label>
                  <input
                    type="color"
                    value={catColor}
                    onChange={(e) => setCatColor(e.target.value)}
                    className="color-picker"
                  />
                </div>
              </div>

              <div className="input-row">
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? 'Simpan Perubahan' : '+ Buat Kategori'}
                </button>
                {editingCategory && (
                  <button type="button" className="btn btn-secondary" onClick={resetCategoryForm}>
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="card">
            <h3>Daftar Kategori ({categories.length})</h3>
            {loading ? (
              <div className="loading-state">Memuat kategori...</div>
            ) : categories.length === 0 ? (
              <div className="empty-box">Belum ada kategori.</div>
            ) : (
              <div className="list-group">
                {categories.map((c) => (
                  <div key={c.id} className="list-item">
                    <div className="item-row-icon">
                      <span
                        className="cat-icon-badge"
                        style={{ backgroundColor: c.color || '#3b82f6' }}
                      >
                        {c.icon || '🏷️'}
                      </span>
                      <div>
                        <div className="item-title">{c.name}</div>
                        <div className="item-meta">
                          <span
                            className={`badge ${
                              c.type === 'income' ? 'badge-tx-income' : 'badge-tx-expense'
                            }`}
                          >
                            {c.type === 'income' ? 'PEMASUKAN' : 'PENGELUARAN'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => startEditCategory(c)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="btn-icon btn-danger-ghost"
                        onClick={() => handleDeleteCategory(c.id)}
                        title="Hapus"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

