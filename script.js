// ------------------------------------------------
// 1) KONFIGURATION & API-ENDPOINTS
// ------------------------------------------------
const STANDINGS_API_URL =
  "https://api.sportsdata.io/v4/soccer/scores/json/Standings/44/2025?key=43b0e10aa4ff4968893ae7e8afb3caa3";
const SCHEDULE_API_URL =
  "https://api.sportsdata.io/v4/soccer/scores/json/Schedule/44/2025?key=43b0e10aa4ff4968893ae7e8afb3caa3";

// Mapping mellem TeamId og logo-URL'er
const teamLogos = {
  742: "https://www.fck.dk/sites/default/files/FCK_Logo.png",
  563: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/FC_Midtjylland_logo.png/600px-FC_Midtjylland_logo.png",
  2380: "https://upload.wikimedia.org/wikipedia/en/thumb/a/ac/AGF_Aarhus_logo.svg/1200px-AGF_Aarhus_logo.svg.png",
  730: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b5/Brondby_IF_logo.svg/1200px-Brondby_IF_logo.svg.png",
  830: "https://brandlogos.net/wp-content/uploads/2013/09/randers-fc-vector-logo.png",
  1472: "https://upload.wikimedia.org/wikipedia/en/thumb/2/23/FC_Nordsj%C3%A6lland_logo.svg/1200px-FC_Nordsj%C3%A6lland_logo.svg.png",
  2579: "https://silkeborgif.dk/wp-content/uploads/SIF-725x725-1.png",
  2581: "https://www.vff.dk/images/Logo/VFF_primaerlogo_cmyk_compr_med.png",
  2577: "https://aabsport.dk/media/14091/aab_logo_originalt_3000x3000.png?anchor=center&mode=crop&width=1200&height=1200&rnd=132042915090000000",
  1047: "https://upload.wikimedia.org/wikipedia/en/thumb/e/e9/SonderjyskE_logo.svg/1200px-SonderjyskE_logo.svg.png",
  1152: "https://img.sofascore.com/api/v1/team/1756/image",
  2580: "https://img.sofascore.com/api/v1/team/4872/image",
};

// ------------------------------------------------
// 2) FUNKTION: HENT STILLINGER & VIS I TABELLEN
// ------------------------------------------------
async function fetchStandings() {
  try {
    const response = await fetch(STANDINGS_API_URL);
    if (!response.ok) {
      throw new Error("Fejl ved hentning af standings: " + response.statusText);
    }
    const data = await response.json();

    // Find "Regular Season" og filtrer "Total" standings
    const regularSeason = data.find((round) => round.Name === "Regular Season");
    if (!regularSeason) {
      console.error("Regular Season blev ikke fundet i JSON dataen.");
      return;
    }
    const totalStandings = regularSeason.Standings.filter(
      (s) => s.Scope === "Total"
    );

    renderStandings(totalStandings);
  } catch (err) {
    console.error("Fejl i fetchStandings():", err);
  }
}

// ------------------------------------------------
// 3) RENDER STILLINGER I TABELLEN
// ------------------------------------------------
function renderStandings(standings) {
  const tbody = document.getElementById("standingsTable");
  tbody.innerHTML = "";

  standings.forEach((team) => {
    const logoUrl =
      teamLogos[team.TeamId] || "https://example.com/logos/default.png";
    const row = document.createElement("tr");
    row.innerHTML = `
          <td class="px-4 py-2 text-center">${team.Order}</td>
          <td class="px-4 py-2 text-left">
            <div class="flex items-center space-x-2">
              <img src="${logoUrl}" alt="${team.Name} logo" class="h-8 w-8 object-contain" />
              <span>${team.Name}</span>
            </div>
          </td>
          <td class="px-4 py-2 text-center">${team.Games}</td>
          <td class="px-4 py-2 text-center">${team.Wins}</td>
          <td class="px-4 py-2 text-center">${team.Draws}</td>
          <td class="px-4 py-2 text-center">${team.Losses}</td>
          <td class="px-4 py-2 text-center">${team.GoalsScored}</td>
          <td class="px-4 py-2 text-center">${team.GoalsAgainst}</td>
          <td class="px-4 py-2 text-center">${team.GoalsDifferential}</td>
          <td class="px-4 py-2 text-center">${team.Points}</td>
        `;
    tbody.appendChild(row);
  });
}

// ------------------------------------------------
// 4) FUNKTION: HENT KAMPE & FIND "DAGENS" ELLER NÆSTE KAMP
// ------------------------------------------------
async function fetchNextMatch() {
  try {
    const response = await fetch(SCHEDULE_API_URL);
    if (!response.ok) {
      throw new Error("Fejl ved hentning af kampe: " + response.statusText);
    }
    const data = await response.json();

    // Saml alle kampe på tværs af runder
    const allGames = data.flatMap((round) => round.Games);
    return findNextOrTodayGame(allGames);
  } catch (err) {
    console.error("Fejl i fetchNextMatch():", err);
    return null;
  }
}

// ------------------------------------------------
// 5) FIND DAGENS KAMP ELLER NÆSTE KAMP UD FRA DATO
// ------------------------------------------------
function findNextOrTodayGame(allGames) {
  const now = new Date();

  // Filtrer kampe, der er i dag eller fremtidige
  const upcoming = allGames
    .filter((game) => {
      if (!game.DateTime) return false;
      const gameDate = new Date(game.DateTime);
      return gameDate >= now || isSameDay(gameDate, now);
    })
    .sort((a, b) => new Date(a.DateTime) - new Date(b.DateTime));

  // Find kamp i dag, hvis findes
  const todayGame = upcoming.find((g) => isSameDay(new Date(g.DateTime), now));
  return todayGame ? todayGame : upcoming.length > 0 ? upcoming[0] : null;
}

// Hjælpefunktion til at tjekke om to datoer er på samme dag
function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// ------------------------------------------------
// 6) RENDER DAGENS/NÆSTE KAMP, CENTRERET & MED 64PX LOGOER
// ------------------------------------------------
function renderNextMatch(match) {
  const matchInfoDiv = document.getElementById("matchInfo");
  if (!match) {
    matchInfoDiv.textContent = "Ingen kommende kampe fundet.";
    return;
  }

  // Formater datoen
  const dateObj = new Date(match.DateTime);
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  const dateStr = dateObj.toLocaleString("da-DK", options);

  // Hent holdnavne og logoer
  const homeId = match.HomeTeamId;
  const awayId = match.AwayTeamId;
  const homeName = match.HomeTeamName || "Ukendt Hjemmehold";
  const awayName = match.AwayTeamName || "Ukendt Udehold";
  const homeLogo = teamLogos[homeId] || "https://example.com/logos/default.png";
  const awayLogo = teamLogos[awayId] || "https://example.com/logos/default.png";

  // Hvis kampen er færdig, vis scoren
  let scoreInfo = "";
  if (match.Status === "Final") {
    scoreInfo = `<div class="mb-1 font-bold">Score: ${match.HomeTeamScore} - ${match.AwayTeamScore}</div>`;
  }

  // Vis kampdata med logoer, dato og status
  const status = match.Status || "Ukendt status";
  matchInfoDiv.innerHTML = `
        <div class="flex items-center justify-center mb-4 space-x-8">
          <!-- Hjemmehold -->
          <div class="flex items-center space-x-2">
            <img src="${homeLogo}" alt="${homeName} logo" class="h-16 w-16 object-contain" />
            <span class="font-bold">${homeName}</span>
          </div>
          <span class="mx-2">vs.</span>
          <!-- Udehold (logo til højre for navnet) -->
          <div class="flex items-center space-x-2">
            <span class="font-bold">${awayName}</span>
            <img src="${awayLogo}" alt="${awayName} logo" class="h-16 w-16 object-contain" />
          </div>
        </div>
        <div class="mb-1">Dato/Tid: ${dateStr}</div>
        ${scoreInfo}
        <div>Status: ${status}</div>
      `;
}

// ------------------------------------------------
// 7) INIT-FUNKTION: HENT ALLE DATA & RENDER
// ------------------------------------------------
async function init() {
  // Hent og vis stillinger
  await fetchStandings();
  // Hent og vis dagens/næste kamp
  const match = await fetchNextMatch();
  renderNextMatch(match);

  // Opdater timestamp
  const timestampDiv = document.getElementById("timestamp");
  const now = new Date();
  timestampDiv.textContent = "Sidst opdateret: " + now.toLocaleString("da-DK");
}

// Kør init() ved side-load
init();

// Opdater automatisk hvert 6. time (21600000 ms)
setInterval(init, 21600000);
