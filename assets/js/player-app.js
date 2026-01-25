document.addEventListener('DOMContentLoaded', async () => {
  const app = document.getElementById('corbidev-player-app');
  if (!app) return;

  const API_BASE = '/wp-json/corbidev/v1';

  const renderError = (message) => {
    app.innerHTML = `<p class="text-sm text-red-500">${message}</p>`;
  };

  const renderLoading = () => {
    app.innerHTML = `
      <div class="player-skeleton">
        <div class="cover"></div>
        <div class="meta">
          <div class="line"></div>
          <div class="line short"></div>
        </div>
      </div>
    `;
  };

  const renderUI = (library, currentCollection, tracks) => {
    const favorites = library.favorites_summary || { count: 0, duration_f: '00:00' };

    const albumsHtml = (library.albums || [])
      .map(a => `
        <button type="button" class="cd-item" data-type="album" data-id="${a.id}">
          <span class="cd-item-title">${a.name}</span>
          <span class="cd-item-meta">${a.count} titres · ${a.duration_f}</span>
        </button>
      `)
      .join('');

    const playlistsHtml = (library.playlists || [])
      .map(p => `
        <button type="button" class="cd-item" data-type="playlist" data-id="${p.id}">
          <span class="cd-item-title">${p.name}</span>
          <span class="cd-item-meta">${p.count} titres · ${p.duration_f}</span>
        </button>
      `)
      .join('');

    const tracksHtml = (tracks || [])
      .map((t, index) => `
        <tr data-track-id="${t.id}">
          <td class="cd-col-index">${index + 1}</td>
          <td class="cd-col-title">
            <div class="cd-track-title">${t.title}</div>
            <div class="cd-track-album">${t.album || ''}</div>
          </td>
          <td class="cd-col-duration">${t.duration_f}</td>
        </tr>
      `)
      .join('');

    const currentTitle = currentCollection ? currentCollection.name : 'Aucun album sélectionné';

    app.innerHTML = `
      <div class="cd-player-layout">
        <aside class="cd-column cd-column-left">
          <h2 class="cd-heading">Albums</h2>
          <div class="cd-list" id="cd-albums-list">${albumsHtml || '<p class="cd-empty">Aucun album disponible.</p>'}</div>
          <h2 class="cd-heading">Playlists</h2>
          <div class="cd-list" id="cd-playlists-list">${playlistsHtml || '<p class="cd-empty">Aucune playlist disponible.</p>'}</div>
          <div class="cd-favorites-summary">
            <span>Favoris :</span>
            <span>${favorites.count} titres · ${favorites.duration_f}</span>
          </div>
        </aside>
        <main class="cd-column cd-column-right">
          <h2 class="cd-heading">Pistes – <span id="cd-current-collection">${currentTitle}</span></h2>
          <table class="cd-tracks-table">
            <thead>
              <tr>
                <th class="cd-col-index">#</th>
                <th class="cd-col-title">Titre</th>
                <th class="cd-col-duration">Durée</th>
              </tr>
            </thead>
            <tbody id="cd-tracks-body">
              ${tracksHtml || '<tr><td colspan="3" class="cd-empty">Sélectionnez un album ou une playlist.</td></tr>'}
            </tbody>
          </table>
          <div class="cd-audio-wrapper">
            <audio id="cd-audio" controls preload="metadata"></audio>
          </div>
        </main>
      </div>
    `;
  };

  const attachEvents = (library) => {
    const albumsList = app.querySelector('#cd-albums-list');
    const playlistsList = app.querySelector('#cd-playlists-list');
    const tracksBody = app.querySelector('#cd-tracks-body');
    const currentTitleEl = app.querySelector('#cd-current-collection');
    const audioEl = app.querySelector('#cd-audio');

    const loadTracksFor = async (id) => {
      try {
        const res = await fetch(`${API_BASE}/tracks/${id}`);
        if (!res.ok) return;
        const json = await res.json();
        const tracks = json.tracks || [];

        const html = tracks
          .map((t, index) => `
            <tr data-track-id="${t.id}" data-track-url="${t.media_id ? '' : ''}">
              <td class="cd-col-index">${index + 1}</td>
              <td class="cd-col-title">
                <div class="cd-track-title">${t.title}</div>
                <div class="cd-track-album">${t.album || ''}</div>
              </td>
              <td class="cd-col-duration">${t.duration_f}</td>
            </tr>
          `)
          .join('');

        tracksBody.innerHTML = html || '<tr><td colspan="3" class="cd-empty">Aucune piste.</td></tr>';

        tracksBody.querySelectorAll('tr[data-track-id]').forEach((row, index) => {
          row.addEventListener('click', () => {
            const track = tracks[index];
            if (!track || !audioEl) return;
            // L’URL réelle du fichier audio doit être dérivée côté plugin si besoin
            if (track.url) {
              audioEl.src = track.url;
              audioEl.play().catch(() => {});
            }
          });
        });
      } catch (e) {
        console.error(e);
      }
    };

    const handleCollectionClick = (event) => {
      const btn = event.target.closest('.cd-item');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const name = btn.querySelector('.cd-item-title')?.textContent || '';
      if (currentTitleEl) {
        currentTitleEl.textContent = name;
      }
      loadTracksFor(id);
    };

    if (albumsList) {
      albumsList.addEventListener('click', handleCollectionClick);
    }
    if (playlistsList) {
      playlistsList.addEventListener('click', handleCollectionClick);
    }
  };

  try {
    renderLoading();

    const res = await fetch(`${API_BASE}/library`);
    if (!res.ok) {
      renderError('Impossible de charger la bibliothèque.');
      return;
    }

    const library = await res.json();

    const firstAlbum = (library.albums && library.albums[0]) || null;
    const firstPlaylist = (library.playlists && library.playlists[0]) || null;
    const currentCollection = firstAlbum || firstPlaylist;

    let initialTracks = [];
    if (currentCollection) {
      try {
        const tracksRes = await fetch(`${API_BASE}/tracks/${currentCollection.id}`);
        if (tracksRes.ok) {
          const json = await tracksRes.json();
          initialTracks = json.tracks || [];
        }
      } catch (e) {
        console.error(e);
      }
    }

    renderUI(library, currentCollection, initialTracks);
    attachEvents(library);
  } catch (e) {
    console.error(e);
    renderError('Une erreur est survenue lors du chargement du player.');
  }
});
