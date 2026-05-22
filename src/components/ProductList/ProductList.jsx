// ============================================
//  ProductList.jsx — Mikael Barber
// ============================================

import { useState, useEffect } from "react";
import { productService } from "../../services/api";
import "./ProductList.css";

const CATEGORIES = ["todos", "shampoo", "pomada", "lâmina", "óleo", "outros"];
const UNITS = ["un", "ml", "g", "cx", "kt"];

// ── Badge de categoria ──────────────────────
function CategoryBadge({ category }) {
  const map = {
    shampoo: "badge--blue",
    pomada: "badge--amber",
    "lâmina": "badge--red",
    óleo: "badge--teal",
    outros: "badge--gray",
  };
  return (
    <span className={`product-badge ${map[category] || "badge--gray"}`}>
      {category}
    </span>
  );
}

// ── Modal de produto (criar/editar) ─────────
function ProductModal({ product, onClose, onSave }) {
  const isEdit = !!product?.id;

  const [form, setForm] = useState({
    name: product?.name || "",
    price: product?.price ?? "",
    unit: product?.unit || "un",
    stock: product?.stock ?? 0,
    category: product?.category || "outros",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Informe o nome";
    if (form.price === "" || isNaN(form.price) || Number(form.price) < 0)
      e.price = "Preço inválido";
    return e;
  };

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock) || 0,
      };
      const saved = isEdit
        ? await productService.update(product.id, payload)
        : await productService.create(payload);
      onSave(saved.product || saved);
    } catch (err) {
      setErrors({ name: err.message || "Erro ao salvar" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="prod-modal-title"
    >
      <div className="modal-card slide-up">
        <div className="modal-header">
          <div className="modal-header__icon" aria-hidden="true">
            <i className={`ti ${isEdit ? "ti-package" : "ti-circle-plus"}`} />
          </div>
          <div>
            <h2 className="modal-header__title" id="prod-modal-title">
              {isEdit ? "Editar produto" : "Novo produto"}
            </h2>
            <p className="modal-header__sub">
              {isEdit ? "Atualize os dados abaixo" : "Preencha os dados do produto"}
            </p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <div className="modal-divider" />

        <div className="modal-body">
          {/* Nome */}
          <div className={`modal-field${errors.name ? " modal-field--error" : ""}`}>
            <label className="modal-field__label" htmlFor="prod-name">Nome</label>
            <div className="modal-field__wrapper">
              <i className="ti ti-tag modal-field__icon" aria-hidden="true" />
              <input
                id="prod-name"
                className="modal-field__input"
                type="text"
                placeholder="Ex: Pomada Matte"
                value={form.name}
                onChange={set("name")}
                autoFocus
              />
            </div>
            {errors.name && <span className="modal-field__hint">{errors.name}</span>}
          </div>

          {/* Preço + Unidade */}
          <div className="prod-modal-row">
            <div className={`modal-field${errors.price ? " modal-field--error" : ""}`}>
              <label className="modal-field__label" htmlFor="prod-price">Preço (R$)</label>
              <div className="modal-field__wrapper">
                <i className="ti ti-currency-real modal-field__icon" aria-hidden="true" />
                <input
                  id="prod-price"
                  className="modal-field__input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.price}
                  onChange={set("price")}
                />
              </div>
              {errors.price && <span className="modal-field__hint">{errors.price}</span>}
            </div>

            <div className="modal-field">
              <label className="modal-field__label" htmlFor="prod-unit">Unidade</label>
              <div className="modal-field__wrapper">
                <i className="ti ti-ruler modal-field__icon" aria-hidden="true" />
                <select
                  id="prod-unit"
                  className="modal-field__input modal-field__select"
                  value={form.unit}
                  onChange={set("unit")}
                >
                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Estoque + Categoria */}
          <div className="prod-modal-row">
            <div className="modal-field">
              <label className="modal-field__label" htmlFor="prod-stock">Estoque</label>
              <div className="modal-field__wrapper">
                <i className="ti ti-box modal-field__icon" aria-hidden="true" />
                <input
                  id="prod-stock"
                  className="modal-field__input"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.stock}
                  onChange={set("stock")}
                />
              </div>
            </div>

            <div className="modal-field">
              <label className="modal-field__label" htmlFor="prod-category">Categoria</label>
              <div className="modal-field__wrapper">
                <i className="ti ti-category modal-field__icon" aria-hidden="true" />
                <select
                  id="prod-category"
                  className="modal-field__input modal-field__select"
                  value={form.category}
                  onChange={set("category")}
                >
                  {CATEGORIES.filter((c) => c !== "todos").map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn modal-btn--cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="modal-btn modal-btn--save"
            onClick={handleSave}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <><i className="ti ti-loader-2 spin" aria-hidden="true" /> Salvando…</>
            ) : (
              <><i className="ti ti-check" aria-hidden="true" /> {isEdit ? "Salvar" : "Criar produto"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal de confirmação de exclusão ────────
function DeleteModal({ product, onConfirm, onCancel }) {
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-card modal-card--sm slide-up">
        <div className="modal-header">
          <div className="modal-header__icon modal-header__icon--danger" aria-hidden="true">
            <i className="ti ti-alert-triangle" />
          </div>
          <div>
            <h2 className="modal-header__title">Excluir produto</h2>
            <p className="modal-header__sub">Essa ação não pode ser desfeita</p>
          </div>
          <button className="modal-close" onClick={onCancel} aria-label="Fechar">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>
        <div className="modal-divider" />
        <p className="modal-confirm__text">
          Deseja excluir <strong>{product.name}</strong> do estoque?
        </p>
        <div className="modal-footer">
          <button className="modal-btn modal-btn--cancel" onClick={onCancel}>Cancelar</button>
          <button className="modal-btn modal-btn--danger" onClick={onConfirm}>
            <i className="ti ti-trash" aria-hidden="true" /> Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────
export default function ProductList({ fireToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    productService
      .getAll()
      .then((data) => setProducts(data.products || []))
      .catch(() => fireToast?.("Erro ao carregar produtos."))
      .finally(() => setLoading(false));
  }, []);

  const visible = products.filter((p) => {
    const matchCat = filter === "todos" || p.category === filter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalItems = products.length;
  const lowStock = products.filter((p) => p.stock <= 2).length;
  const totalValue = products.reduce(
    (sum, p) => sum + parseFloat(p.price || 0) * (p.stock || 0),
    0
  );

  const openCreate = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (p) => { setEditTarget(p); setModalOpen(true); };

  const handleSaved = (product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = product;
        return updated;
      }
      return [product, ...prev];
    });
    setModalOpen(false);
    fireToast?.(editTarget ? "Produto atualizado!" : `"${product.name}" criado!`);
  };

  const handleDelete = async () => {
    try {
      await productService.remove(deleteTarget.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      fireToast?.(`"${deleteTarget.name}" excluído.`);
    } catch {
      fireToast?.("Erro ao excluir produto.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="product-list">
      {/* ── Cards de resumo ── */}
      <div className="product-stats">
        <div className="pstat">
          <i className="ti ti-package pstat__icon" aria-hidden="true" />
          <div>
            <span className="pstat__value">{totalItems}</span>
            <span className="pstat__label">Produtos</span>
          </div>
        </div>
        <div className={`pstat${lowStock > 0 ? " pstat--warn" : ""}`}>
          <i className="ti ti-alert-circle pstat__icon" aria-hidden="true" />
          <div>
            <span className="pstat__value">{lowStock}</span>
            <span className="pstat__label">Estoque baixo</span>
          </div>
        </div>
        <div className="pstat">
          <i className="ti ti-wallet pstat__icon" aria-hidden="true" />
          <div>
            <span className="pstat__value">R$ {totalValue.toFixed(0)}</span>
            <span className="pstat__label">Valor em estoque</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="product-toolbar">
        <div className="product-search-wrap">
          <i className="ti ti-search product-search-icon" aria-hidden="true" />
          <input
            className="product-search"
            type="text"
            placeholder="Buscar produto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="product-search-clear"
              onClick={() => setSearch("")}
              aria-label="Limpar busca"
            >
              <i className="ti ti-x" aria-hidden="true" />
            </button>
          )}
        </div>

        <button className="product-add-btn" onClick={openCreate}>
          <i className="ti ti-plus" aria-hidden="true" />
          <span>Novo produto</span>
        </button>
      </div>

      {/* ── Filtros de categoria ── */}
      <div className="product-filters" role="tablist" aria-label="Filtrar por categoria">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            role="tab"
            aria-selected={filter === cat}
            className={`product-filter-btn${filter === cat ? " active" : ""}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Tabela / lista ── */}
      {loading ? (
        <div className="product-empty">
          <i className="ti ti-loader-2 spin" aria-hidden="true" />
          Carregando produtos…
        </div>
      ) : visible.length === 0 ? (
        <div className="product-empty">
          <i className="ti ti-package-off" aria-hidden="true" />
          <span>Nenhum produto encontrado</span>
          {search && (
            <button className="product-empty-btn" onClick={() => setSearch("")}>
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <div className="product-table-wrap">
          <table className="product-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} className={p.stock <= 2 ? "row--low-stock" : ""}>
                  <td className="product-name-cell">
                    <span className="product-name">{p.name}</span>
                    <span className="product-unit">{p.unit}</span>
                  </td>
                  <td><CategoryBadge category={p.category} /></td>
                  <td className="product-price">R$ {parseFloat(p.price).toFixed(2)}</td>
                  <td>
                    <span className={`product-stock${p.stock <= 2 ? " product-stock--low" : ""}`}>
                      {p.stock <= 2 && (
                        <i className="ti ti-alert-triangle" aria-label="Estoque baixo" />
                      )}
                      {p.stock}
                    </span>
                  </td>
                  <td className="product-actions">
                    <button
                      className="product-action-btn"
                      onClick={() => openEdit(p)}
                      aria-label={`Editar ${p.name}`}
                      title="Editar"
                    >
                      <i className="ti ti-edit" aria-hidden="true" />
                    </button>
                    <button
                      className="product-action-btn product-action-btn--danger"
                      onClick={() => setDeleteTarget(p)}
                      aria-label={`Excluir ${p.name}`}
                      title="Excluir"
                    >
                      <i className="ti ti-trash" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modais ── */}
      {modalOpen && (
        <ProductModal
          product={editTarget}
          onClose={() => setModalOpen(false)}
          onSave={handleSaved}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          product={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}