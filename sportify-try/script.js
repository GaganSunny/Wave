const songsEl = document.getElementById("songs");
const recentEl = document.getElementById("recent");
const albumsEl = document.getElementById("albums");

const audio = document.getElementById("audio");
const coverEl = document.getElementById("cover");
const titleEl = document.getElementById("title");
const artistEl = document.getElementById("artist");
const fillEl = document.getElementById("fill");
const currentEl = document.getElementById("current");
const totalEl = document.getElementById("total");

let songs = [];
let albums = [];
let currentIndex = 0;
let isPlaying = false;

/* LOAD SONGS */
fetch("songs.json")
  .then(r => r.json())
  .then(data => {
    songs = data;
    renderSongs();
  });

/* LOAD ALBUMS */
fetch("albums.json")
  .then(r => r.json())
  .then(data => {
    albums = data;
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
    s.title.toLowerCase().includes(q)
  );

  renderFiltered(filtered);
}

function renderFiltered(list) {
  songsEl.innerHTML = "";
  list.forEach(song => {
    const i = songs.indexOf(song);
    songsEl.appendChild(songCard(song, i));
  });
}

/* RENDER SONGS */
function renderSongs() {
  songsEl.innerHTML = "";
  songs.forEach((song, i) => {
    songsEl.appendChild(songCard(song, i));
  });
}

/* TOP 5 ALBUMS */
function renderTopAlbums() {
  albumsEl.innerHTML = "";

  const stats = getStats();
  if (!stats.history.length) return;

  const albumCount = {};

  stats.history.forEach(h => {
    const song = songs.find(s => s.title === h.song);
    if (!song) return;

    const album = albums.find(a =>
      a.songs.includes(song.id)
    );
    if (!album) return;

    albumCount[album.id] =
      (albumCount[album.id] || 0) + 1;
  });

  const top = Object.entries(albumCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  top.forEach(([albumId]) => {
    const album = albums.find(a => a.id === albumId);

    const div = document.createElement("div");
    div.className = "album-card";
    div.innerHTML = `
      <img src="${album.cover}">
      <h4>${album.name}</h4>
      <p>${album.artist}</p>
    `;

    div.onclick = () => openAlbum(album);
    albumsEl.appendChild(div);
  });
}

/* OPEN ALBUM */
function openAlbum(album) {
  songsEl.innerHTML = "";

  album.songs.forEach(songId => {
    const song = songs.find(s => s.id === songId);
    if (!song) return;

    const i = songs.indexOf(song);
    songsEl.appendChild(songCard(song, i));
  });
}

/* PLAYER */
function playSong(i) {
  currentIndex = i;
  const s = songs[i];

  audio.src = `songs/${s.id}/audio.mp3`;
  coverEl.src = `songs/${s.id}/cover.jpg`;
  titleEl.textContent = s.title;
  artistEl.textContent = s.artist;

  audio.play();
  isPlaying = true;

  updateStats(s);
  renderRecentlyPlayed();
  renderTopAlbums();
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
  const stats = getStats();
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
    time: new Date().toISOString()
  });
  localStorage.setItem("stats", JSON.stringify(stats));
}

/* UTIL */
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
  renderTopAlbums();
}

function showWrapped() {
  alert("Wrapped coming soon 🔥");
}
