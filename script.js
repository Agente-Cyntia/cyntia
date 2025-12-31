fetch("changelog.json")
  .then(res => res.json())
  .then(data => {
    const changelogDiv = document.getElementById("changelog");
    const versionsUl = document.getElementById("versions");

    data.versions.forEach(v => {
      // Changelog
      const card = document.createElement("div");
      card.className = "version-card";

      card.innerHTML = `
        <h3>${v.version} ${v.status === "stable" ? "✅" : ""}</h3>
        <small>${v.date}</small>
        <ul>
          ${v.changes.map(c => `<li>${c}</li>`).join("")}
        </ul>
        <a href="${v.url}">Abrir versión</a>
      `;

      changelogDiv.appendChild(card);

      // Versiones anteriores
      if (v.url !== "latest/") {
        const li = document.createElement("li");
        li.innerHTML = `<a href="${v.url}">${v.version}</a>`;
        versionsUl.appendChild(li);
      }
    });
  });
