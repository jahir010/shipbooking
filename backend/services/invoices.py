from __future__ import annotations

from datetime import datetime
from html import escape

from models import Booking, Payment


def build_invoice_number(booking: Booking, payment: Payment) -> str:
    payment_date = payment.updated_at or payment.created_at or booking.created_at or datetime.utcnow()
    return f"INV-{payment_date.strftime('%Y%m%d')}-{booking.id:05d}-{payment.id:04d}"


def build_invoice_filename(booking: Booking, payment: Payment) -> str:
    return f"{build_invoice_number(booking, payment)}.html"


def build_invoice_html(booking: Booking, payment: Payment) -> str:
    route = booking.route
    ship = route.ship
    customer = booking.user
    owner = ship.owner
    invoice_number = build_invoice_number(booking, payment)
    issued_at = (payment.updated_at or payment.created_at or booking.created_at or datetime.utcnow()).strftime(
        "%Y-%m-%d %H:%M"
    )

    item_rows = "".join(
        (
            "<tr>"
            f"<td>{escape(item.cabin_type)} ({escape(item.cabin_number)})</td>"
            f"<td>{item.quantity}</td>"
            f"<td>BDT {item.price_per_unit:.2f}</td>"
            f"<td>BDT {item.quantity * item.price_per_unit:.2f}</td>"
            "</tr>"
        )
        for item in booking.items
    )

    def passenger_name(passenger: dict[str, str]) -> str:
        first_name = passenger.get("first_name", "")
        last_name = passenger.get("last_name", "")
        full_name = f"{first_name} {last_name}".strip()
        return full_name or "Passenger"

    passenger_rows = "".join(
        (
            "<tr>"
            f"<td>{escape(passenger_name(passenger))}</td>"
            f"<td>{escape(passenger.get('email', '') or '-')}</td>"
            f"<td>{escape(passenger.get('phone', '') or '-')}</td>"
            f"<td>{escape(passenger.get('document_number', '') or '-')}</td>"
            "</tr>"
        )
        for passenger in booking.passengers
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{escape(invoice_number)}</title>
  <style>
    :root {{
      color-scheme: light;
      --text: #0f172a;
      --muted: #475569;
      --line: #dbe4f0;
      --panel: #f8fafc;
      --accent: #0f766e;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      padding: 32px;
      font-family: "Segoe UI", Arial, sans-serif;
      color: var(--text);
      background: white;
    }}
    .invoice {{
      max-width: 920px;
      margin: 0 auto;
      border: 1px solid var(--line);
      border-radius: 20px;
      overflow: hidden;
    }}
    .hero {{
      padding: 28px 32px;
      background: linear-gradient(135deg, #0f172a, #0f766e);
      color: white;
      display: flex;
      justify-content: space-between;
      gap: 24px;
      flex-wrap: wrap;
    }}
    .hero h1 {{
      margin: 0;
      font-size: 32px;
      letter-spacing: 0.04em;
    }}
    .hero p {{ margin: 6px 0 0; color: rgba(255,255,255,0.82); }}
    .section {{
      padding: 28px 32px;
      border-top: 1px solid var(--line);
    }}
    .grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 18px;
    }}
    .panel {{
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 18px;
    }}
    .label {{
      margin: 0 0 8px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
    }}
    .value {{
      margin: 0;
      line-height: 1.6;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
    }}
    th, td {{
      padding: 12px 10px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
    }}
    th {{
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
    }}
    .totals {{
      margin-left: auto;
      width: min(100%, 320px);
      border: 1px solid var(--line);
      border-radius: 16px;
      overflow: hidden;
    }}
    .totals-row {{
      display: flex;
      justify-content: space-between;
      padding: 14px 18px;
      background: white;
      border-bottom: 1px solid var(--line);
    }}
    .totals-row:last-child {{
      border-bottom: 0;
      background: #ecfeff;
      font-weight: 700;
      color: var(--accent);
    }}
    .footer {{
      color: var(--muted);
      font-size: 14px;
    }}
  </style>
</head>
<body>
  <main class="invoice">
    <section class="hero">
      <div>
        <h1>Booking Invoice</h1>
        <p>{escape(ship.name)} by {escape(ship.operator)}</p>
      </div>
      <div>
        <p><strong>Invoice:</strong> {escape(invoice_number)}</p>
        <p><strong>Booking:</strong> #{booking.id}</p>
        <p><strong>Issued:</strong> {escape(issued_at)}</p>
        <p><strong>Payment Ref:</strong> {escape(payment.transaction_id)}</p>
      </div>
    </section>

    <section class="section">
      <div class="grid">
        <div class="panel">
          <p class="label">Customer</p>
          <p class="value">{escape(f"{customer.first_name} {customer.last_name}".strip() or customer.email)}<br />{escape(customer.email)}</p>
        </div>
        <div class="panel">
          <p class="label">Shipowner</p>
          <p class="value">{escape(f"{owner.first_name} {owner.last_name}".strip() or owner.email)}<br />{escape(owner.email)}</p>
        </div>
        <div class="panel">
          <p class="label">Trip Details</p>
          <p class="value">{escape(route.departure_port)} to {escape(route.destination_port)}<br />{escape(route.date.isoformat())} at {escape(route.departure_time)}<br />Arrival {escape(route.arrival_time)}</p>
        </div>
      </div>
    </section>

    <section class="section">
      <p class="label">Cabins</p>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Line Total</th>
          </tr>
        </thead>
        <tbody>
          {item_rows}
        </tbody>
      </table>
    </section>

    <section class="section">
      <p class="label">Passengers</p>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Document</th>
          </tr>
        </thead>
        <tbody>
          {passenger_rows}
        </tbody>
      </table>
    </section>

    <section class="section">
      <div class="totals">
        <div class="totals-row">
          <span>Payment Method</span>
          <span>{escape(payment.method.upper())}</span>
        </div>
        <div class="totals-row">
          <span>Payment Status</span>
          <span>{escape(payment.status.upper())}</span>
        </div>
        <div class="totals-row">
          <span>Total Paid</span>
          <span>BDT {booking.total_price:.2f}</span>
        </div>
      </div>
    </section>

    <section class="section footer">
      This invoice was generated automatically after successful payment and can be downloaded by the customer, shipowner, or platform admin.
    </section>
  </main>
</body>
</html>
"""
