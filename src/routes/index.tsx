import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Control de Renta y Servicios" },
      {
        name: "description",
        content:
          "Lleva el control de tu renta y servicios: montos, abonos, saldos pendientes y estatus de pago.",
      },
      { property: "og:title", content: "Control de Renta y Servicios" },
      {
        property: "og:description",
        content:
          "Lleva el control de tu renta y servicios: montos, abonos, saldos pendientes y estatus de pago.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type BillItem = {
  id: number;
  name: string;
  amount: number;
  paid: number;
  dueDate: string;
};

const defaultData: BillItem[] = [
  { id: 1, name: "Renta", amount: 2550, paid: 0, dueDate: "N/A" },
  { id: 2, name: "Seguro de la Casa", amount: 25, paid: 0, dueDate: "Día 22" },
  { id: 3, name: "Agua", amount: 80, paid: 0, dueDate: "Variable" },
  { id: 4, name: "Luz", amount: 100, paid: 0, dueDate: "Variable" },
];

const STORAGE_KEY = "my_bills_data";

function loadItems(): BillItem[] {
  if (typeof window === "undefined") return defaultData;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BillItem[]) : defaultData;
  } catch {
    return defaultData;
  }
}

function formatCurrency(val: number) {
  return "$" + val.toFixed(2);
}

function Index() {
  const [items, setItems] = useState<BillItem[]>(defaultData);
  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

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
          prev.map((i) => (i.id === id ? { ...i, paid: i.paid + payment } : i)),
        );
      }
    }
  };

  const removeItem = (id: number) => {
    if (window.confirm("¿Seguro que deseas eliminar este concepto?")) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const getStatus = (item: BillItem) => {
    if (item.paid >= item.amount && item.amount > 0)
      return { key: "pagado", label: "Pagado" };
    if (item.paid > 0) return { key: "parcial", label: "Parcial" };
    return { key: "pendiente", label: "Pendiente" };
  };

  return (
    <div className="min-h-screen bg-background px-5 py-5">
      <div className="mx-auto max-w-[900px]">
        <h1 className="mb-6 text-center text-2xl font-bold sm:text-3xl">
          Control de Renta y Servicios
        </h1>

        {/* Resumen */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-[10px] border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-2 text-sm uppercase text-muted-foreground">
              Total Gastado / Pagado
            </h3>
            <p className="m-0 text-[28px] font-bold text-success">
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <div className="rounded-[10px] border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-2 text-sm uppercase text-muted-foreground">
              Total Pendiente Global
            </h3>
            <p className="m-0 text-[28px] font-bold text-danger">
              {formatCurrency(totalPending)}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <div className="mb-6 rounded-[10px] border border-border bg-card p-5">
          <h3 className="mb-4 mt-0 text-base font-semibold">
            Agregar o Actualizar Servicio
          </h3>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-[13px] font-semibold">
                Concepto
              </label>
              <input
                id="name"
                type="text"
                placeholder="Ej. Luz, Agua"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-md border border-input bg-card px-2.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="amount" className="text-[13px] font-semibold">
                Monto Total ($)
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-md border border-input bg-card px-2.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="dueDate" className="text-[13px] font-semibold">
                Fecha Límite (Opcional)
              </label>
              <input
                id="dueDate"
                type="text"
                placeholder="Ej. Día 22"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-md border border-input bg-card px-2.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
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

        {/* Tabla */}
        <div className="overflow-x-auto rounded-[10px] border border-border bg-card">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border-b border-border px-4 py-3 text-left text-[13px] text-muted-foreground">
                  Concepto
                </th>
                <th className="border-b border-border px-4 py-3 text-left text-[13px] text-muted-foreground">
                  Fecha Límite
                </th>
                <th className="border-b border-border px-4 py-3 text-left text-[13px] text-muted-foreground">
                  Monto Total
                </th>
                <th className="border-b border-border px-4 py-3 text-left text-[13px] text-muted-foreground">
                  Pagado
                </th>
                <th className="border-b border-border px-4 py-3 text-left text-[13px] text-muted-foreground">
                  Restante
                </th>
                <th className="border-b border-border px-4 py-3 text-left text-[13px] text-muted-foreground">
                  Estatus
                </th>
                <th className="border-b border-border px-4 py-3 text-left text-[13px] text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const remaining = Math.max(item.amount - item.paid, 0);
                const status = getStatus(item);
                return (
                  <tr key={item.id}>
                    <td className="border-b border-border px-4 py-3">
                      <strong>{item.name}</strong>
                    </td>
                    <td className="border-b border-border px-4 py-3">
                      {item.dueDate || "N/A"}
                    </td>
                    <td className="border-b border-border px-4 py-3">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="border-b border-border px-4 py-3">
                      {formatCurrency(item.paid)}
                    </td>
                    <td className="border-b border-border px-4 py-3">
                      {formatCurrency(remaining)}
                    </td>
                    <td className="border-b border-border px-4 py-3">
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
                    </td>
                    <td className="border-b border-border px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => addPayment(item.id)}
                        className="mr-1 rounded-md bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-border"
                      >
                        + Abonar
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="rounded-md bg-danger-bg px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger-hover-bg"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
