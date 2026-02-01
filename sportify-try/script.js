const songsEl = document.getElementById("songs");
const recentEl = document.getElementById("recent");
const audio = document.getElementById("audio");
const coverEl = document.getElementById("cover");
const titleEl = document.getElementById("title");
const artistEl = document.getElementById("artist");
const fillEl = document.getElementById("fill");
const currentEl = document.getElementById("current");
const totalEl = document.getElementById("total");

let songs = [];
let currentIndex = 0;
let isPlaying = false;

/* LOAD SONGS */
fetch("songs.json")
  .then(r => r.json())
  .then(data => {
    songs = data;
    renderSongs();
    renderRecentlyPlayed();
  });

/* SEARCH */
function handleSearch() {
  const q = document.getElementById("searchInput").value
    .toLowerCase().trim();

  if (!q) {
    renderSongs();
    return;
  }

  const filtered = songs.filter(s =>
    s.title.toLowerCase().startsWith(q)
  );

  renderFiltered(filtered);
}

function renderFiltered(list) {
  songsEl.innerHTML = "";
  if (!list.length) {
    songsEl.innerHTML = "<p>No songs found</p>";
    return;
  }

  list.forEach(song => {
    const i = songs.indexOf(song);
    songsEl.appendChild(songCard(song, i));
  });
}

/* TOP SONGS (7 DAYS) */
function renderSongs() {
  songsEl.innerHTML = "";

  let list = getTop7Days(5);
  if (!list.length) list = shuffle([...songs]).slice(0, 5);
  list = shuffle(list);

  list.forEach(song => {
    const i = songs.indexOf(song);
    songsEl.appendChild(songCard(song, i));
  });
}

function getTop7Days(limit) {
  const stats = JSON.parse(localStorage.getItem("stats"));
  if (!stats || !stats.history) return [];

  const now = Date.now();
  const week = 7 * 86400000;
  const count = {};

  stats.history.forEach(h => {
    if (now - new Date(h.time) <= week)
      count[h.song] = (count[h.song] || 0) + 1;
  });

  return Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([t]) => songs.find(s => s.title === t))
    .filter(Boolean);
}

/* PLAYER */
function playSong(i) {
  currentIndex = i;
  const s = songs[i];

  audio.src = s.audio;
  coverEl.src = `songs/${s.id}/cover.jpg`;
  titleEl.textContent = s.title;
  artistEl.textContent = s.artist;

  audio.play();
  isPlaying = true;

  updateStats(s);
  renderRecentlyPlayed();
}

function togglePlay() {
  isPlaying ? audio.pause() : audio.play();
  isPlaying = !isPlaying;
}

function nextSong() {
  playSong((currentIndex + 1) % songs.length);
}

function prevSong() {
  playSong((currentIndex - 1 + songs.length) % songs.length);
}

/* PROGRESS */
audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  fillEl.style.width =
    (audio.currentTime / audio.duration) * 100 + "%";
  currentEl.textContent = format(audio.currentTime);
  totalEl.textContent = format(audio.duration);
});

function seek(e) {
  const r = e.currentTarget.getBoundingClientRect();
  audio.currentTime =
    ((e.clientX - r.left) / r.width) * audio.duration;
}

/* RECENTLY PLAYED */
function renderRecentlyPlayed() {
  recentEl.innerHTML = "";
  const stats = JSON.parse(localStorage.getItem("stats"));
  if (!stats || !stats.history) return;

  const seen = new Set();

  stats.history.slice().reverse()
    .filter(h => {
      if (seen.has(h.song)) return false;
      seen.add(h.song);
      return true;
    })
    .slice(0, 8)
    .forEach(h => {
      const s = songs.find(x => x.title === h.song);
      if (!s) return;

      const div = document.createElement("div");
      div.className = "recent-card";
      div.innerHTML = `
        <img src="songs/${s.id}/cover.jpg">
        <div>
          <h4>${s.title}</h4>
          <p>${s.artist}</p>
        </div>
      `;
      div.onclick = () => playSong(songs.indexOf(s));
      recentEl.appendChild(div);
    });
}

/* STATS */
function getStats() {
  return JSON.parse(localStorage.getItem("stats")) ||
    { history: [] };
}

function updateStats(song) {
  const stats = getStats();
  stats.history.push({
    song: song.title,
    artist: song.artist,
    time: new Date().toISOString()
  });
  localStorage.setItem("stats", JSON.stringify(stats));
}

/* UTIL */
function shuffle(a) {
  return a.sort(() => Math.random() - 0.5);
}

function format(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function songCard(song, i) {
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <img src="songs/${song.id}/cover.jpg">
    <h4>${song.title}</h4>
    <p>${song.artist}</p>
  `;
  div.onclick = () => playSong(i);
  return div;
}

function resetData() {
  localStorage.clear();
  renderRecentlyPlayed();
}

function showWrapped() {
  alert("Wrapped coming soon 🔥");
}

