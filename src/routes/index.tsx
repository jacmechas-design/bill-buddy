import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Control de Renta y Servicios" },
      {
        name: "description",
        content:
          "Lleva el control de tu renta y servicios: montos, abonos con fecha, saldos pendientes y estatus de pago.",
      },
      { property: "og:title", content: "Control de Renta y Servicios" },
      {
        property: "og:description",
        content:
          "Lleva el control de tu renta y servicios: montos, abonos con fecha, saldos pendientes y estatus de pago.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Payment = { amount: number; date: string };

type BillItem = {
  id: number;
  name: string;
  amount: number;
  paid: number;
  dueDate: string;
  payments: Payment[];
};

const defaultData: BillItem[] = [
  { id: 1, name: "Renta", amount: 2550, paid: 0, dueDate: "N/A", payments: [] },
  { id: 2, name: "Seguro de la Casa", amount: 25, paid: 0, dueDate: "Día 22", payments: [] },
  { id: 3, name: "Agua", amount: 80, paid: 0, dueDate: "Variable", payments: [] },
  { id: 4, name: "Luz", amount: 100, paid: 0, dueDate: "Variable", payments: [] },
];

const STORAGE_KEY = "my_bills_data";

function loadItems(): BillItem[] {
  if (typeof window === "undefined") return defaultData;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw) as Array<Partial<BillItem>>;
    return parsed.map((i) => ({
      id: i.id ?? Date.now(),
      name: i.name ?? "",
      amount: i.amount ?? 0,
      paid: i.paid ?? 0,
      dueDate: i.dueDate ?? "",
      payments: Array.isArray(i.payments) ? i.payments : [],
    }));
  } catch {
    return defaultData;
  }
}

function formatCurrency(val: number) {
  return "$" + val.toFixed(2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Index() {
  const [items, setItems] = useState<BillItem[]>(defaultData);
  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  useEffect(() => {
    setItems(loadItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, hydrated]);

  const totalSpent = items.reduce((sum, i) => sum + i.paid, 0);
  const totalPending = items.reduce(
    (sum, i) => sum + Math.max(i.amount - i.paid, 0),
    0,
  );

  const allPayments = items
    .flatMap((i) =>
      i.payments.map((p) => ({ concept: i.name, amount: p.amount, date: p.date })),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!name.trim() || isNaN(parsed)) return;
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: name.trim(),
        amount: parsed,
        paid: 0,
        dueDate: dueDate.trim(),
        payments: [],
      },
    ]);
    setName("");
    setAmount("");
    setDueDate("");
  };

  const addPayment = (id: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const remaining = item.amount - item.paid;
    const amountStr = window.prompt(
      `¿Cuánto vas a abonar a "${item.name}"?\nFalta por pagar: ${formatCurrency(Math.max(remaining, 0))}`,
      remaining > 0 ? String(remaining) : "",
    );
    if (amountStr !== null) {
      const payment = parseFloat(amountStr);
      if (!isNaN(payment) && payment > 0) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === id
              ? {
                  ...i,
                  paid: i.paid + payment,
                  payments: [
                    { amount: payment, date: new Date().toISOString() },
                    ...i.payments,
                  ],
                }
              : i,
          ),
        );
      }
    }
  };

  const removeItem = (id: number) => {
    if (window.confirm("¿Seguro que deseas eliminar este concepto?")) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const startEdit = (item: BillItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditAmount(String(item.amount));
    setEditDueDate(item.dueDate);
  };

  const saveEdit = (id: number) => {
    const parsed = parseFloat(editAmount);
    if (!editName.trim() || isNaN(parsed)) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, name: editName.trim(), amount: parsed, dueDate: editDueDate.trim() }
          : i,
      ),
    );
    setEditingId(null);
  };

  const getStatus = (item: BillItem) => {
    if (item.paid >= item.amount && item.amount > 0)
      return { key: "pagado", label: "Pagado" };
    if (item.paid > 0) return { key: "parcial", label: "Parcial" };
    return { key: "pendiente", label: "Pendiente" };
  };

  const inputClass =
    "w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-center text-2xl font-bold">
          Control de Renta y Servicios
        </h1>

        {/* Resumen */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-[10px] border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-1 text-xs uppercase text-muted-foreground">
              Total Pagado
            </h3>
            <p className="m-0 text-2xl font-bold text-success">
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <div className="rounded-[10px] border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-1 text-xs uppercase text-muted-foreground">
              Total Pendiente
            </h3>
            <p className="m-0 text-2xl font-bold text-danger">
              {formatCurrency(totalPending)}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <div className="mb-6 rounded-[10px] border border-border bg-card p-4">
          <h3 className="mb-3 mt-0 text-base font-semibold">
            Agregar Servicio
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              id="name"
              type="text"
              placeholder="Concepto (Ej. Luz, Agua)"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                id="amount"
                type="number"
                step="0.01"
                placeholder="Monto total ($)"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputClass}
              />
              <input
                id="dueDate"
                type="text"
                placeholder="Fecha límite (Ej. Día 22)"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Guardar Concepto
            </button>
          </form>
        </div>

        {/* Lista de servicios */}
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const remaining = Math.max(item.amount - item.paid, 0);
            const status = getStatus(item);
            const pct =
              item.amount > 0
                ? Math.min((item.paid / item.amount) * 100, 100)
                : 0;

            if (editingId === item.id) {
              return (
                <div
                  key={item.id}
                  className="rounded-[10px] border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Concepto"
                      className={inputClass}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        step="0.01"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        placeholder="Monto total ($)"
                        className={inputClass}
                      />
                      <input
                        type="text"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        placeholder="Fecha límite"
                        className={inputClass}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(item.id)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                      >
                        <Check size={16} /> Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center justify-center gap-1.5 rounded-md bg-muted px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-border"
                      >
                        <X size={16} /> Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className="rounded-[10px] border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="m-0 font-bold">{item.name}</p>
                    <p className="m-0 text-xs text-muted-foreground">
                      Fecha límite: {item.dueDate || "N/A"}
                    </p>
                  </div>
                  <span
                    className={`inline-block rounded-xl px-2 py-1 text-xs font-bold ${
                      status.key === "pagado"
                        ? "bg-success-bg text-success"
                        : status.key === "parcial"
                          ? "bg-warning-bg text-warning"
                          : "bg-danger-bg text-danger"
                    }`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <p className="m-0 text-sm text-muted-foreground">
                    Pagado:{" "}
                    <span className="font-semibold text-foreground">
                      {formatCurrency(item.paid)}
                    </span>{" "}
                    de {formatCurrency(item.amount)}
                  </p>
                  <p className="m-0 text-sm font-semibold text-danger">
                    Falta {formatCurrency(remaining)}
                  </p>
                </div>

                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${
                      status.key === "pagado" ? "bg-success" : "bg-primary"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => addPayment(item.id)}
                    className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                  >
                    + Abonar
                  </button>
                  <button
                    onClick={() => startEdit(item)}
                    aria-label={`Editar ${item.name}`}
                    className="rounded-md bg-muted px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-border"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label={`Eliminar ${item.name}`}
                    className="rounded-md bg-danger-bg px-3 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger-hover-bg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {item.payments.length > 0 && (
                  <div className="mt-3 border-t border-border pt-2">
                    <p className="m-0 mb-1 text-xs font-semibold uppercase text-muted-foreground">
                      Historial de abonos
                    </p>
                    {item.payments.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between py-0.5 text-xs text-muted-foreground"
                      >
                        <span>{formatDate(p.date)}</span>
                        <span className="font-semibold text-success">
                          +{formatCurrency(p.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Historial general de pagos */}
        {allPayments.length > 0 && (
          <div className="mt-6 rounded-[10px] border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-3 mt-0 text-base font-semibold">
              Historial de Pagos
            </h3>
            <div className="flex flex-col divide-y divide-border">
              {allPayments.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <div>
                    <p className="m-0 text-sm font-semibold">{p.concept}</p>
                    <p className="m-0 text-xs text-muted-foreground">
                      {formatDate(p.date)}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-success">
                    +{formatCurrency(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
