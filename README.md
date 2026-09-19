# Bill Buddy

Genérame esta app usando este código <!DOCTYPE html>

<html lang="es">

<head>

  <meta charset="UTF-8">

  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Control de Renta y Servicios</title>

  <style>

    :root {

      --bg: #f4f6f8;

      --card: #ffffff;

      --text: #333333;

      --primary: #2563eb;

      --success: #16a34a;

      --danger: #dc2626;

      --warning: #d97706;

      --border: #e5e7eb;

    }

    body {

      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

      background-color: var(--bg);

      color: var(--text);

      margin: 0;

      padding: 20px;

    }

    .container {

      max-width: 900px;

      margin: 0 auto;

    }

    h1 {

      text-align: center;

      margin-bottom: 24px;

    }

    .stats-grid {

      display: grid;

      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));

      gap: 16px;

      margin-bottom: 24px;

    }

    .stat-card {

      background: var(--card);

      padding: 20px;

      border-radius: 10px;

      box-shadow: 0 2px 4px rgba(0,0,0,0.05);

      border: 1px solid var(--border);

    }

    .stat-card h3 {

      margin: 0 0 8px 0;

      font-size: 14px;

      color: #6b7280;

      text-transform: uppercase;

    }

    .stat-card p {

      margin: 0;

      font-size: 28px;

      font-weight: bold;

    }

    .stat-card.spent p { color: var(--success); }

    .stat-card.pending p { color: var(--danger); }

    .card-block {

      background: var(--card);

      padding: 20px;

      border-radius: 10px;

      border: 1px solid var(--border);

      margin-bottom: 24px;

    }

    form {

      display: grid;

      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)) auto;

      gap: 12px;

      align-items: end;

    }

    .input-group {

      display: flex;

      flex-direction: column;

      gap: 4px;

    }

    label {

      font-size: 13px;

      font-weight: 600;

    }

    input {

      padding: 10px;

      border: 1px solid var(--border);

      border-radius: 6px;

      font-size: 14px;

    }

    button {

      background: var(--primary);

      color: white;

      border: none;

      padding: 10px 16px;

      border-radius: 6px;

      cursor: pointer;

      font-weight: 600;

      transition: background 0.2s;

    }

    button:hover {

      background: #1d4ed8;

    }

    table {

      width: 100%;

      border-collapse: collapse;

      background: var(--card);

      border-radius: 10px;

      overflow: hidden;

      border: 1px solid var(--border);

    }

    th, td {

      padding: 12px 16px;

      text-align: left;

      border-bottom: 1px solid var(--border);

    }

    th {

      background: #f9fafb;

      font-size: 13px;

      color: #4b5563;

    }

    .badge {

      display: inline-block;

      padding: 4px 8px;

      border-radius: 12px;

      font-size: 12px;

      font-weight: bold;

    }

    .badge.pendiente { background: #fee2e2; color: var(--danger); }

    .badge.parcial { background: #fef3c7; color: var(--warning); }

    .badge.pagado { background: #dcfce7; color: var(--success); }

    .action-btn {

      background: #f3f4f6;

      color: var(--text);

      padding: 6px 12px;

      font-size: 12px;

      margin-right: 4px;

    }

    .action-btn.delete {

      background: #fee2e2;

      color: var(--danger);

    }

    .action-btn:hover {

      background: #e5e7eb;

    }

    

    .action-btn.delete:hover {

      background: #fca5a5;

    }

  </style>

</head>

<body>

  <div class="container">

    <h1>Control de Renta y Servicios</h1>

    <!-- Resumen -->

    <div class="stats-grid">

      <div class="stat-card spent">

        <h3>Total Gastado / Pagado</h3>

        <p id="total-spent">$0.00</p>

      </div>

      <div class="stat-card pending">

        <h3>Total Pendiente Global</h3>

        <p id="total-pending">$0.00</p>

      </div>

    </div>

    <!-- Formulario para agregar -->

    <div class="card-block">

      <h3 style="margin-top:0;">Agregar o Actualizar Servicio</h3>

      <form id="add-form">

        <div class="input-group">

          <label for="name">Concepto</label>

          <input type="text" id="name" placeholder="Ej. Luz, Agua" required>

        </div>

        <div class="input-group">

          <label for="amount">Monto Total ($)</label>

          <input type="number" id="amount" step="0.01" placeholder="0.00" required>

        </div>

        <div class="input-group">

          <label for="dueDate">Fecha Límite (Opcional)</label>

          <input type="text" id="dueDate" placeholder="Ej. Día 22">

        </div>

        <button type="submit">Guardar Concepto</button>

      </form>

    </div>

    <!-- Tabla -->

    <table>

      <thead>

        <tr>

          <th>Concepto</th>

          <th>Fecha Límite</th>

          <th>Monto Total</th>

          <th>Pagado</th>

          <th>Restante</th>

          <th>Estatus</th>

          <th>Acciones</th>

        </tr>

      </thead>

      <tbody id="services-list"></tbody>

    </table>

  </div>

  <script>

    // Datos iniciales si la app se abre por primera vez

    const defaultData = [

      { id: 1, name: 'Renta', amount: 2550, paid: 0, dueDate: 'N/A' },

      { id: 2, name: 'Seguro de la Casa', amount: 25, paid: 0, dueDate: 'Día 22' },

      { id: 3, name: 'Agua', amount: 80, paid: 0, dueDate: 'Variable' },

      { id: 4, name: 'Luz', amount: 100, paid: 0, dueDate: 'Variable' }

    ];

    let items = JSON.parse(localStorage.getItem('my_bills_data')) || defaultData;

    function saveData() {

      localStorage.setItem('my_bills_data', JSON.stringify(items));

    }

    function formatCurrency(val) {

      return '$' + parseFloat(val).toFixed(2);

    }

    function render() {

      const list = document.getElementById('services-list');

      list.innerHTML = '';

      let totalSpent = 0;

      let totalPending = 0;

      items.forEach(item => {

        const remaining = item.amount - item.paid;

        totalSpent += item.paid;

        totalPending += remaining > 0 ? remaining : 0;

        let status = 'pendiente';

        let statusLabel = 'Pendiente';

        

        if (item.paid >= item.amount && item.amount > 0) {

          status = 'pagado';

          statusLabel = 'Pagado';

        } else if (item.paid > 0) {

          status = 'parcial';

          statusLabel = 'Parcial';

        }

        const tr = document.createElement('tr');

        tr.innerHTML = `

          <td><strong>${item.name}</strong></td>

          <td>${item.dueDate || 'N/A'}</td>

          <td>${formatCurrency(item.amount)}</td>

          <td>${formatCurrency(item.paid)}</td>

          <td>${formatCurrency(remaining > 0 ? remaining : 0)}</td>

          <td><span class="badge ${status}">${statusLabel}</span></td>

          <td>

            <button class="action-btn" onclick="addPayment(${item.id})">+ Abonar</button>

            <button class="action-btn delete" onclick="removeItem(${item.id})">✕</button>

          </td>

        `;

        list.appendChild(tr);

      });

      document.getElementById('total-spent').innerText = formatCurrency(totalSpent);

      document.getElementById('total-pending').innerText = formatCurrency(totalPending);

      saveData();

    }

    document.getElementById('add-form').addEventListener('submit', (e) => {

      e.preventDefault();

      const name = document.getElementById('name').value;

      const amount = parseFloat(document.getElementById('amount').value);

      const dueDate = document.getElementById('dueDate').value;

      items.push({

        id: Date.now(),

        name,

        amount,

        paid: 0,

        dueDate

      });

      e.target.reset();

      render();

    });

    function addPayment(id) {

      const item = items.find(i => i.id === id);

      if (!item) return;

      const remaining = item.amount - item.paid;

      const amountStr = prompt(`¿Cuánto vas a abonar a "${item.name}"?\nFalta por pagar: ${formatCurrency(remaining > 0 ? remaining : 0)}`, remaining > 0 ? remaining : '');

      

      if (amountStr !== null) {

        const payment = parseFloat(amountStr);

        if (!isNaN(payment) && payment > 0) {

          item.paid += payment;

          render();

        }

      }

    }

    function removeItem(id) {

      if (confirm('¿Seguro que deseas eliminar este concepto?')) {

        items = items.filter(i => i.id !== id);

        render();

      }

    }

    // Inicializar app

    render();

  </script>

</body>

</html>

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e3ade087-002a-4bdd-8761-7f609f667ef9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
