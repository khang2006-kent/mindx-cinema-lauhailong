const TMDB_API_KEYS = [
  "fb7bb23f03b6994dafc674c074d01761",
  "e55425032d3d0f371fc776f302e7c09b",
  "8301a21598f8b45668d5711a814f01f6",
  "8cf43ad9c085135b9479ad5cf6bbcbda",
  "da63548086e399ffc910fbc08526df05",
  "13e53ff644a8bd4ba37b3e1044ad24f3",
  "269890f657dddf4635473cf4cf456576",
  "a2f888b27315e62e471b2d587048f32e",
  "8476a7ab80ad76f0936744df0430e67c",
  "5622cafbfe8f8cfe358a29c53e19bba0",
  "ae4bd1b6fce2a5648671bfc171d15ba4",
  "257654f35e3dff105574f97fb4b97035",
  "2f4038e83265214a0dcd6ec2eb3276f5",
  "9e43f45f94705cc8e1d5a0400d19a7b7",
  "af6887753365e14160254ac7f4345dd2",
  "06f10fc8741a672af455421c239a1ffc",
  "fb7bb23f03b6994dafc674c074d01761",
  "09ad8ace66eec34302943272db0e8d2c",
];

let keyIndex = 0;
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

async function tmdbFetch(path) {
  const tries = TMDB_API_KEYS.length;
  for (let i = 0; i < tries; i++) {
    const key = TMDB_API_KEYS[(keyIndex + i) % TMDB_API_KEYS.length];
    const sep = path.includes('?') ? '&' : '?';
    const url = `https://api.themoviedb.org/3${path}${sep}api_key=${key}&language=vi-VN`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        keyIndex = (keyIndex + i) % TMDB_API_KEYS.length;
        return await res.json();
      }
      // rotate on 401/429 or server errors and try next key
      if (res.status === 401 || res.status === 429 || res.status >= 500) {
        continue;
      }
      // other client errors: return parsed error
      const err = await res.text();
      throw new Error(`TMDB error ${res.status}: ${err}`);
    } catch (e) {
      // network error -> try next key
      if (i === tries - 1) throw e;
    }
  }
  throw new Error('All TMDB keys failed');
}

function createMovieCard(movie) {
  const el = document.createElement('div');
  el.className = 'movie-card';

  const img = document.createElement('img');
  img.className = 'poster';
  img.alt = movie.title || movie.name;
  img.src = movie.poster_path ? IMAGE_BASE + movie.poster_path : '';
  img.onerror = () => { img.src = 'https://via.placeholder.com/300x450?text=No+Image'; };

  const info = document.createElement('div');
  info.className = 'movie-info';
  const title = document.createElement('h3');
  title.className = 'movie-title';
  title.textContent = movie.title || movie.name;

  const meta = document.createElement('div');
  meta.className = 'movie-meta';
  meta.innerHTML = `<span class="rating">${(movie.vote_average||0).toFixed(1)}</span><span>${(movie.release_date||movie.first_air_date||'')}</span>`;

  info.appendChild(title);
  info.appendChild(meta);

  el.appendChild(img);
  el.appendChild(info);

  el.addEventListener('click', () => {
    const url = `https://www.themoviedb.org/movie/${movie.id}`;
    window.open(url, '_blank');
  });

  return el;
}

async function renderSection(containerId, path, opts = {}) {
  const container = document.getElementById(containerId);
  container.innerHTML = 'Loading...';
  try {
    const data = await tmdbFetch(path);
    const list = data.results || [];
    container.innerHTML = '';
    list.forEach(m => container.appendChild(createMovieCard(m)));
    if (opts.onFirst && list[0]) opts.onFirst(list[0]);
  } catch (e) {
    container.innerHTML = `<div style="color:#f88">Không lấy được dữ liệu</div>`;
    console.error(e);
  }
}

async function doSearch(q) {
  if (!q) return;
  const container = document.getElementById('popular');
  container.innerHTML = 'Tìm kiếm...';
  try {
    const data = await tmdbFetch(`/search/movie?query=${encodeURIComponent(q)}&page=1`);
    const list = data.results || [];
    container.innerHTML = '';
    if (list.length === 0) container.innerHTML = '<div style="color:var(--muted)">Không tìm thấy kết quả</div>';
    list.forEach(m => container.appendChild(createMovieCard(m)));
  } catch (e) {
    container.innerHTML = `<div style="color:#f88">Lỗi tìm kiếm</div>`;
    console.error(e);
  }
}

function setHero(movie) {
  const hero = document.getElementById('hero');
  if (!movie) return;
  hero.style.backgroundImage = movie.backdrop_path ? `url(${IMAGE_BASE + movie.backdrop_path})` : '';
  document.getElementById('heroTitle').textContent = movie.title || movie.name;
  document.getElementById('heroOverview').textContent = movie.overview || '';
}

function init() {
  renderSection('nowPlaying', '/movie/now_playing?page=1', { onFirst: setHero });
  renderSection('popular', '/movie/popular?page=1');
  renderSection('topRated', '/movie/top_rated?page=1');

  document.getElementById('searchBtn').addEventListener('click', () => {
    const q = document.getElementById('searchInput').value.trim();
    doSearch(q);
  });
  document.getElementById('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch(e.target.value.trim());
  });
}

window.addEventListener('DOMContentLoaded', init);
