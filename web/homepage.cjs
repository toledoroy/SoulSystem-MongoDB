function renderHomepage({ mongo }) {
  const isAvailable = mongo.available === true;
  const label = isAvailable ? "Available" : "Unavailable";
  const statusClass = isAvailable ? "status--available" : "status--unavailable";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SoulSystem MongoDB Migration</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f7f5ef;
      color: #1f2933;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
    }

    main {
      width: min(760px, calc(100vw - 32px));
    }

    h1 {
      margin: 0 0 12px;
      font-size: clamp(2rem, 6vw, 4.5rem);
      line-height: 0.95;
      letter-spacing: 0;
    }

    p {
      margin: 0;
      color: #52616b;
      font-size: 1rem;
      line-height: 1.6;
    }

    .status {
      margin-top: 32px;
      border: 1px solid #d6d3c8;
      border-radius: 8px;
      background: #fffdf7;
      padding: 20px;
      display: grid;
      gap: 12px;
    }

    .status__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .status__name {
      font-size: 0.95rem;
      color: #52616b;
    }

    .status__badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 32px;
      border-radius: 999px;
      padding: 0 12px;
      font-weight: 700;
      font-size: 0.9rem;
      white-space: nowrap;
    }

    .status__badge::before {
      content: "";
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: currentColor;
    }

    .status--available .status__badge {
      background: #e7f8ef;
      color: #11643c;
    }

    .status--unavailable .status__badge {
      background: #fff0e6;
      color: #9a3412;
    }

    code {
      color: #1f2933;
      background: #ebe7dc;
      border-radius: 4px;
      padding: 2px 5px;
    }
  </style>
</head>
<body>
  <main>
    <h1>SoulSystem MongoDB Migration</h1>
    <p>The Web2 data layer is coming online. This page checks whether the application can reach MongoDB.</p>

    <section class="status ${statusClass}" aria-label="MongoDB availability">
      <div class="status__header">
        <div>
          <div class="status__name">MongoDB</div>
          <strong>${escapeHtml(mongo.status)}</strong>
        </div>
        <span class="status__badge">${label}</span>
      </div>
      <p>${escapeHtml(mongo.message)}</p>
      <p>Configure <code>MONGODB_URI</code> and <code>MONGODB_DB</code> to connect the migration service.</p>
    </section>
  </main>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

module.exports = {
  renderHomepage,
};
