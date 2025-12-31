// Cargar changelog.json y renderizar versiones
fetch("changelog.json")
  .then(res => {
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  })
  .then(data => {
    console.log("Changelog cargado:", data);
    
    const changelogDiv = document.getElementById("changelog");
    const versionsContainer = document.getElementById("versions-container");

    if (!data.versions || data.versions.length === 0) {
      throw new Error("No hay versiones en el changelog");
    }

    // Renderizar versiones (en orden inverso para mostrar la más nueva primero)
    [...data.versions].reverse().forEach(v => {
      // Tarjeta de versión
      const card = document.createElement("div");
      card.className = "version-card";

      const statusBadge = v.status === "stable" 
        ? `<span class="status-badge status-stable">✓ Estable</span>`
        : `<span class="status-badge status-beta">🧪 Beta</span>`;

      card.innerHTML = `
        <h3>${v.version} ${statusBadge}</h3>
        <small>📅 ${formatDate(v.date)}</small>
        <ul>
          ${v.changes.map(c => `<li>${c}</li>`).join("")}
        </ul>
        <a href="${v.url}">Abrir versión →</a>
      `;

      versionsContainer.appendChild(card);

      // Changelog (duplicado para sección de changelog)
      const changelogCard = document.createElement("div");
      changelogCard.className = "version-card";
      changelogCard.style.marginBottom = "20px";

      changelogCard.innerHTML = `
        <h3>${v.version} ${statusBadge}</h3>
        <small>📅 ${formatDate(v.date)}</small>
        <ul>
          ${v.changes.map(c => `<li>${c}</li>`).join("")}
        </ul>
      `;

      changelogDiv.appendChild(changelogCard);
    });
  })
  .catch(err => {
    console.error("Error cargando changelog:", err);
    const versionsContainer = document.getElementById("versions-container");
    const changelogDiv = document.getElementById("changelog");
    
    const errorMsg = `<div style="padding: 20px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; color: #856404;">
      <strong>⚠️ Error:</strong> No se pudo cargar el changelog. Verifica que changelog.json esté en la raíz del proyecto.
    </div>`;
    
    versionsContainer.innerHTML = errorMsg;
    changelogDiv.innerHTML = errorMsg;
  });

// Función auxiliar para formatear fechas
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('es-ES', options);
}