(function () {
    if (typeof window === 'undefined') {
        return;
    }

    const data = window.CorbidevPlayerData || {};
    const albums = Array.isArray(data.albums) ? data.albums : [];
    const FAVORITES_KEY = 'corbidev_player_favorites_v1';
    const FAVORITES_TS_KEY = 'corbidev_player_favorites_ts_v1';
    const ajaxConfig = data.ajax || {};
    const userConfig = data.user || {};
    const isLoggedIn = !!userConfig.isLoggedIn;

    const state = {
        albums,
        currentAlbumId: null,
        currentTrackId: null,
        queue: [],
        index: -1,
        isPlaying: false,
        favorites: new Set(),
        allTracks: [],
        tracksMode: 'album',
        favoritesLastChanged: 0,
    };

    const els = {};

    function qs(sel, root = document) {
        return root.querySelector(sel);
    }

    function qsa(sel, root = document) {
        return Array.from(root.querySelectorAll(sel));
    }

    function initElements() {
        els.layoutRoot = qs('[data-corbi-layout-root]');
        els.albumsRoot = qs('[data-corbi-albums-root]');
        els.tracksRoot = qs('[data-corbi-tracks-root]');
        els.currentAlbumLabel = qs('[data-corbi-current-album]');
        els.artwork = qs('[data-corbi-artwork]');
        els.nowTitle = qs('[data-corbi-now-title]');
        els.nowSub = qs('[data-corbi-now-sub]');
        els.footerTitle = qs('[data-corbi-footer-title]');
        els.footerSub = qs('[data-corbi-footer-sub]');
        els.footerArtwork = qs('[data-corbi-footer-artwork]');
        els.audio = qs('[data-corbi-audio]');
        els.btnPrev = qs('[data-corbi-prev]');
        els.btnNext = qs('[data-corbi-next]');
        els.btnTogglePlay = qs('[data-corbi-toggle-play]');
        els.iconPlay = qs('[data-corbi-icon-play]');
        els.iconPause = qs('[data-corbi-icon-pause]');
        els.btnFooterFavorite = qs('[data-corbi-favorite-toggle]');
        els.iconFavOff = qs('[data-corbi-icon-fav-off]');
        els.iconFavOn = qs('[data-corbi-icon-fav-on]');
        els.seekBar = qs('[data-corbi-seek-bar]');
        els.seekFill = qs('[data-corbi-seek-fill]');
        els.timeCurrent = qs('[data-corbi-time-current]');
        els.timeTotal = qs('[data-corbi-time-total]');
        els.volume = qs('[data-corbi-volume]');
        els.mobileTabButtons = qsa('[data-corbi-mobile-tab]');
        els.layoutColumns = qsa('[data-corbi-layout-column]');
        els.tracksTabButtons = qsa('[data-corbi-tracks-tab]');
        els.artworkBlock = qs('[data-corbi-artwork-block]');
        els.artworkToggle = qs('[data-corbi-artwork-toggle]');
        els.artworkToggleIcon = qs('[data-corbi-artwork-toggle-icon]');
        els.artworkPlaceholder = els.artwork
            ? els.artwork.getAttribute('data-corbi-artwork-placeholder')
            : '';
        if (!els.artworkPlaceholder && els.footerArtwork) {
            els.artworkPlaceholder = els.footerArtwork.getAttribute('data-corbi-artwork-placeholder') || '';
        }
        els.nowTitleContainer = qs('[data-corbi-now-title-container]');
        els.lyricsBody = qs('[data-corbi-lyrics]');
    }

    function applyMobileTab(target) {
        if (!els.layoutColumns || !els.layoutColumns.length) return;

        els.layoutColumns.forEach(col => {
            const id = col.getAttribute('data-corbi-layout-column');
            if (!id) return;

            if (window.innerWidth < 768) {
                if (target === 'all') {
                    col.style.display = 'block';
                } else {
                    col.style.display = id === target ? 'block' : 'none';
                }
            } else {
                col.style.display = '';
            }
        });

        if (els.mobileTabButtons && els.mobileTabButtons.length) {
            els.mobileTabButtons.forEach(btn => {
                const tab = btn.getAttribute('data-corbi-mobile-tab');
                btn.setAttribute('data-active', tab === target ? '1' : '0');
            });
        }
    }

    function formatTime(seconds) {
        if (!Number.isFinite(seconds) || seconds < 0) {
            seconds = 0;
        }
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return m + ':' + String(s).padStart(2, '0');
    }

    function getAlbumById(id) {
        return state.albums.find(a => String(a.id) === String(id)) || null;
    }

    function isFavoriteId(id) {
        return state.favorites.has(String(id));
    }

    function getAllTracksSource() {
        if (Array.isArray(state.allTracks) && state.allTracks.length) {
            return state.allTracks.slice();
        }
        const flat = [];
        state.albums.forEach(album => {
            if (!Array.isArray(album.tracks)) return;
            album.tracks.forEach(t => {
                flat.push({
                    ...t,
                    album_id: album.id,
                    album_name: album.name,
                    cover: album.cover || '',
                    is_playlist: !!album.is_playlist,
                });
            });
        });
        return flat;
    }

    function getFavoriteTracks() {
        const all = getAllTracksSource();
        if (!state.favorites.size) {
            return [];
        }
        const byId = new Map();

        all.forEach(track => {
            if (!isFavoriteId(track.id)) return;
            const key = String(track.id);
            const existing = byId.get(key);
            if (!existing) {
                byId.set(key, track);
                return;
            }
            // Si le même mp3 existe à la fois dans un album et dans une playlist,
            // on préfère la version issue de l'album (is_playlist === false).
            if (existing.is_playlist && !track.is_playlist) {
                byId.set(key, track);
            }
        });

        return Array.from(byId.values());
    }

    function buildQueueFromAlbum(albumId) {
        const album = getAlbumById(albumId);
        if (!album || !Array.isArray(album.tracks)) {
            return;
        }
        state.queue = album.tracks.map(t => ({
            ...t,
            album_id: album.id,
            album_name: album.name,
            cover: album.cover || '',
        }));
        state.index = state.queue.length ? 0 : -1;
        state.currentAlbumId = album.id;
        state.currentTrackId = state.queue[0] ? state.queue[0].id : null;
        renderTracks('album');
        updateNowPlaying();
    }

    function buildQueueFromFavorites() {
        const favTracks = getFavoriteTracks();
        if (!favTracks.length) {
            return;
        }
        state.queue = favTracks;
        state.index = 0;
        state.currentAlbumId = null;
        state.currentTrackId = favTracks[0].id;
        renderTracks('album');
        updateNowPlaying();
    }

    function renderAlbums() {
        if (!els.albumsRoot) return;
        els.albumsRoot.innerHTML = '';

        const frag = document.createDocumentFragment();
        const groups = [
            {
                key: 'albums',
                label: (data.i18n && data.i18n.myAlbums) || 'My albums',
                filter: (a) => !a.is_playlist,
            },
            {
                key: 'playlists',
                label: (data.i18n && data.i18n.myPlaylists) || 'My playlists',
                filter: (a) => !!a.is_playlist,
            },
        ];

        groups.forEach(group => {
            const items = state.albums.filter(group.filter);
            if (!items.length) return;

            const section = document.createElement('div');
            section.className = 'space-y-2';

            const title = document.createElement('h3');
            title.className = 'text-[11px] font-semibold tracking-wide text-slate-400 uppercase';
            title.textContent = group.label;
            section.appendChild(title);

            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-3 lg:grid-cols-2 gap-3';

            items.forEach(album => {
                const isActive = state.currentAlbumId && String(state.currentAlbumId) === String(album.id);
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'group w-30 flex flex-col items-center gap-2 rounded-2xl border border-slate-800/60 bg-slate-900/70 px-2.5 pt-2.5 pb-2 text-center text-[11px] text-slate-100 hover:border-indigo-500/80 hover:bg-slate-900/90 focus-visible:ring-2 focus-visible:ring-indigo-500';
                if (isActive) {
                    btn.classList.add('border-indigo-500', 'bg-slate-900');
                }
                btn.dataset.albumId = album.id;

                btn.innerHTML = `
                    <span class="inline-flex h-20 w-20 mx-auto items-center justify-center rounded-xl bg-slate-800 overflow-hidden shadow-md shadow-black/50">
                        <img src="${album.cover || ''}" alt="" class="h-full w-full object-cover" loading="lazy" />
                    </span>
                    <span class="w-full min-w-0">
                        <span class="block truncate font-semibold leading-tight">${album.name}</span>
                        <span class="block text-[10px] text-slate-400 mt-0.5">${album.count || 0} tracks · ${album.duration || ''}</span>
                    </span>
                `;

                btn.addEventListener('click', () => {
                    // Sélectionne l'album et prépare la file, sans lancer la lecture
                    buildQueueFromAlbum(album.id);
                    // En mobile, on bascule automatiquement sur l'onglet "Tracks"
                    if (window.innerWidth < 768) {
                        applyMobileTab('tracks');
                    }
                });

                grid.appendChild(btn);
            });

            section.appendChild(grid);
            frag.appendChild(section);
        });

        // Groupe "favoris" en bas de la colonne, sous forme de playlist virtuelle
        const favoriteTracks = getFavoriteTracks();
        const favSection = document.createElement('div');
        favSection.className = 'space-y-2 pt-1 border-t border-slate-800/70 mt-2';

        const favTitle = document.createElement('h3');
        favTitle.className = 'text-[11px] font-semibold tracking-wide text-slate-400 uppercase';
        favTitle.textContent = (data.i18n && data.i18n.favoritesList) || 'Favorites';
        favSection.appendChild(favTitle);

        const favCard = document.createElement('button');
        favCard.type = 'button';
        favCard.className = 'w-full flex items-center gap-3 rounded-2xl border px-3 py-2 text-left text-[11px] transition-colors ' +
            (favoriteTracks.length
                ? 'border-rose-500/60 bg-slate-900/80 hover:bg-slate-900'
                : 'border-slate-800/70 bg-slate-900/40 text-slate-500 cursor-default');

        const favCount = favoriteTracks.length;
        favCard.innerHTML = `
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-400 text-white shadow-md shadow-black/40">
                ❤
            </span>
            <span class="flex-1 min-w-0">
                <span class="block truncate font-semibold">${(data.i18n && data.i18n.favoritesList) || 'Favorites'}</span>
                <span class="block text-[10px] text-slate-300 mt-0.5">${favCount} tracks</span>
            </span>
        `;

        if (favCount) {
            favCard.addEventListener('click', () => {
                // Charge la playlist de favoris sans démarrer la lecture
                buildQueueFromFavorites();
            });
        }

        favSection.appendChild(favCard);
        frag.appendChild(favSection);

        els.albumsRoot.appendChild(frag);
    }

    function renderTracks(mode) {
        if (!els.tracksRoot) return;
        els.tracksRoot.innerHTML = '';

        state.tracksMode = mode === 'all' ? 'all' : 'album';

        const tracks = mode === 'all'
            ? (window.CorbidevPlayerDataAllTracks || [])
            : state.queue;

        const frag = document.createDocumentFragment();

        tracks.forEach((track, idx) => {
            const tr = document.createElement('tr');
            const isActive = state.currentTrackId && String(state.currentTrackId) === String(track.id);
            const isFav = isFavoriteId(track.id);
            tr.className = 'group text-xs text-slate-100 hover:bg-slate-800/80 cursor-pointer' + (isActive ? ' bg-slate-800/90' : '');
            tr.dataset.trackId = track.id;
            tr.dataset.albumId = track.album_id || state.currentAlbumId || '';

            tr.innerHTML = `
                <td class="w-10 px-3 py-2 text-slate-500">${idx + 1}</td>
                <td class="px-3 py-2">
                    <div class="flex flex-col">
                        <div class="flex items-center justify-between gap-2">
                            <span class="truncate">${track.title}</span>
                            <button type="button" class="h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-slate-900 ${isFav ? 'text-rose-400' : 'text-slate-300'} md:hidden" data-corbi-action="favorite" aria-label="Favorite">
                                ${isFav ? '❤' : '♡'}
                            </button>
                        </div>
                        <span class="text-[11px] text-slate-400 truncate">${track.album_name || ''}</span>
                        <div class="mt-1 flex items-center gap-2 text-[11px] text-slate-300 md:hidden">
                            <button type="button" class="inline-flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5 hover:bg-slate-900" data-corbi-action="download" aria-label="Download">
                                <span class="text-xs">⬇</span>
                                <span>${(data.i18n && data.i18n.download) || 'Download'}</span>
                            </button>
                            <button type="button" class="inline-flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5 hover:bg-slate-900" data-corbi-action="share" aria-label="Share">
                                <span class="text-xs">🔗</span>
                                <span>${(data.i18n && data.i18n.share) || 'Share'}</span>
                            </button>
                        </div>
                    </div>
                </td>
                <td class="px-3 py-2 hidden lg:table-cell text-slate-400 text-right">${track.artist || ''}</td>
                <td class="w-16 px-3 py-2 text-right text-slate-400">${track.duration_f || formatTime(track.duration || 0)}</td>
                <td class="w-24 px-3 py-2 text-right hidden md:table-cell">
                    <div class="inline-flex items-center gap-1">
                        <button type="button" class="h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-slate-900 ${isFav ? 'text-rose-400' : 'text-slate-300'}" data-corbi-action="favorite" aria-label="Favorite">
                            ${isFav ? '❤' : '♡'}
                        </button>
                        <button type="button" class="h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-slate-900" data-corbi-action="download" aria-label="Download">
                            ⬇
                        </button>
                        <button type="button" class="h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-slate-900" data-corbi-action="share" aria-label="Share">
                            🔗
                        </button>
                    </div>
                </td>
            `;

            tr.addEventListener('click', (evt) => {
                const target = evt.target;
                const action = target && target.getAttribute('data-corbi-action');
                if (action) {
                    evt.stopPropagation();
                    if (action === 'favorite') {
                        toggleFavorite(track);
                    }
                    return;
                }
                // Sélectionne le mp3 et lance la lecture
                selectTrack(track.id, tracks);
                playCurrent();
            });

            frag.appendChild(tr);
        });

        els.tracksRoot.appendChild(frag);
    }

    function selectTrack(trackId, list) {
        const tracks = list || state.queue;
        const idx = tracks.findIndex(t => String(t.id) === String(trackId));
        if (idx === -1) return;
        state.queue = tracks;
        state.index = idx;
        state.currentTrackId = tracks[idx].id;
        updateNowPlaying();
    }

    function getCurrent() {
        if (!state.queue.length || state.index < 0 || state.index >= state.queue.length) {
            return null;
        }
        return state.queue[state.index];
    }

    function updateFooterFavoriteIcon() {
        if (!els.btnFooterFavorite || !els.iconFavOff || !els.iconFavOn) return;

        const current = getCurrent();
        if (!current) {
            els.btnFooterFavorite.disabled = true;
            els.btnFooterFavorite.classList.add('opacity-40', 'cursor-default');
            els.btnFooterFavorite.setAttribute('aria-pressed', 'false');
            els.iconFavOn.classList.add('hidden');
            els.iconFavOff.classList.remove('hidden');
            return;
        }

        els.btnFooterFavorite.disabled = false;
        els.btnFooterFavorite.classList.remove('opacity-40', 'cursor-default');

        const isFav = isFavoriteId(current.id);
        els.btnFooterFavorite.setAttribute('aria-pressed', isFav ? 'true' : 'false');
        if (isFav) {
            els.iconFavOn.classList.remove('hidden');
            els.iconFavOff.classList.add('hidden');
        } else {
            els.iconFavOn.classList.add('hidden');
            els.iconFavOff.classList.remove('hidden');
        }
    }

    function updateNowPlaying() {
        const current = getCurrent();
        if (!current) {
            if (els.footerTitle) {
                els.footerTitle.textContent = (data.i18n && data.i18n.nothingPlaying) || 'Nothing playing';
            }
            if (els.footerSub) {
                els.footerSub.textContent = '';
            }
            if (els.nowTitle) {
                els.nowTitle.textContent = '';
            }
            if (els.nowSub) {
                els.nowSub.textContent = '';
            }
            if (els.currentAlbumLabel) {
                els.currentAlbumLabel.textContent = '';
            }
            if (els.artwork) {
                if (els.artworkPlaceholder) {
                    els.artwork.innerHTML = `<img src="${els.artworkPlaceholder}" alt="" class="h-full w-full object-cover" loading="lazy" />`;
                } else {
                    els.artwork.innerHTML = '';
                }
            }
            if (els.footerArtwork) {
                if (els.artworkPlaceholder) {
                    els.footerArtwork.innerHTML = `<img src="${els.artworkPlaceholder}" alt="" class="h-full w-full object-cover" loading="lazy" />`;
                } else {
                    els.footerArtwork.innerHTML = '';
                }
            }
            updateFooterFavoriteIcon();
            return;
        }

        if (els.footerTitle) {
            els.footerTitle.textContent = current.title;
        }
        if (els.footerSub) {
            els.footerSub.textContent = current.album_name || '';
        }
        if (els.nowTitle) {
            els.nowTitle.textContent = current.title;
        }
        if (els.nowSub) {
            els.nowSub.textContent = current.album_name || '';
        }
        if (els.currentAlbumLabel) {
            els.currentAlbumLabel.textContent = current.album_name || '';
        }
        if (els.artwork) {
            els.artwork.innerHTML = current.cover
                ? `<img src="${current.cover}" alt="" class="h-full w-full object-cover" loading="lazy" />`
                : (els.artworkPlaceholder
                    ? `<img src="${els.artworkPlaceholder}" alt="" class="h-full w-full object-cover" loading="lazy" />`
                    : '');
        }
        if (els.footerArtwork) {
            els.footerArtwork.innerHTML = current.cover
                ? `<img src="${current.cover}" alt="" class="h-full w-full object-cover" loading="lazy" />`
                : (els.artworkPlaceholder
                    ? `<img src="${els.artworkPlaceholder}" alt="" class="h-full w-full object-cover" loading="lazy" />`
                    : '');
        }

        renderTracks('album');
        updateFooterFavoriteIcon();
    }

    function playCurrent() {
        const current = getCurrent();
        if (!current || !els.audio) return;
        if (els.audio.src !== current.url) {
            els.audio.src = current.url;
        }
        els.audio.play().then(() => {
            state.isPlaying = true;
            updatePlayButton();
        }).catch(() => {
            state.isPlaying = false;
            updatePlayButton();
        });
    }

    function pause() {
        if (!els.audio) return;
        els.audio.pause();
        state.isPlaying = false;
        updatePlayButton();
    }

    function togglePlay() {
        if (!els.audio) return;
        if (state.isPlaying) {
            pause();
        } else {
            if (!getCurrent()) {
                const firstAlbum = state.albums[0];
                if (firstAlbum) {
                    buildQueueFromAlbum(firstAlbum.id);
                }
            }
            playCurrent();
        }
    }

    function next() {
        if (!state.queue.length) return;
        state.index = (state.index + 1) % state.queue.length;
        state.currentTrackId = state.queue[state.index].id;
        updateNowPlaying();
        playCurrent();
    }

    function prev() {
        if (!state.queue.length) return;
        state.index = (state.index - 1 + state.queue.length) % state.queue.length;
        state.currentTrackId = state.queue[state.index].id;
        updateNowPlaying();
        playCurrent();
    }

    function updatePlayButton() {
        if (!els.btnTogglePlay || !els.iconPlay || !els.iconPause) return;
        if (state.isPlaying) {
            els.iconPlay.classList.add('hidden');
            els.iconPause.classList.remove('hidden');
        } else {
            els.iconPlay.classList.remove('hidden');
            els.iconPause.classList.add('hidden');
        }
    }

    function bindPlayerControls() {
        if (els.btnTogglePlay) {
            els.btnTogglePlay.addEventListener('click', togglePlay);
        }
        if (els.btnNext) {
            els.btnNext.addEventListener('click', next);
        }
        if (els.btnPrev) {
            els.btnPrev.addEventListener('click', prev);
        }
        if (els.btnFooterFavorite) {
            els.btnFooterFavorite.addEventListener('click', () => {
                const current = getCurrent();
                if (!current) return;
                toggleFavorite(current);
            });
        }
        if (els.audio) {
            els.audio.addEventListener('timeupdate', () => {
                const current = els.audio.currentTime || 0;
                const total = els.audio.duration || 0;
                if (els.timeCurrent) {
                    els.timeCurrent.textContent = formatTime(current);
                }
                if (els.timeTotal) {
                    els.timeTotal.textContent = formatTime(total);
                }
                if (els.seekFill && total > 0) {
                    const ratio = Math.min(1, Math.max(0, current / total));
                    els.seekFill.style.width = `${ratio * 100}%`;
                }
            });

            els.audio.addEventListener('ended', next);
        }
        if (els.seekBar && els.audio) {
            els.seekBar.addEventListener('click', (evt) => {
                const rect = els.seekBar.getBoundingClientRect();
                const ratio = (evt.clientX - rect.left) / rect.width;
                const total = els.audio.duration || 0;
                els.audio.currentTime = Math.max(0, Math.min(total, ratio * total));
            });
        }
        if (els.volume && els.audio) {
            els.volume.addEventListener('input', () => {
                const v = parseFloat(els.volume.value);
                if (!Number.isNaN(v)) {
                    els.audio.volume = v;
                }
            });
        }
    }

    function bindLayoutControls() {
        if (els.mobileTabButtons.length && els.layoutColumns.length) {
            els.mobileTabButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const target = btn.getAttribute('data-corbi-mobile-tab');
                    applyMobileTab(target || 'albums');
                });
            });
        }

        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768 && els.layoutColumns.length) {
                els.layoutColumns.forEach(col => {
                    col.style.display = '';
                });
            }
        });

        // Tabs "Album / All" de la liste de titres
        if (els.tracksTabButtons.length) {
            els.tracksTabButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const mode = btn.getAttribute('data-corbi-tracks-tab') || 'album';
                    els.tracksTabButtons.forEach(b => {
                        b.setAttribute('data-active', b === btn ? '1' : '0');
                    });
                    renderTracks(mode);
                });
            });
        }

        // Réduction / extension de la jaquette pour laisser plus de place aux paroles
        if (els.artworkToggle && els.artworkBlock && els.artwork && els.lyricsBody) {
            let collapsed = false;

            const updateArtworkState = () => {
                if (collapsed) {
                    // Mode "paroles agrandies" : jaquette encore plus petite et titre à droite
                    els.artworkBlock.classList.remove('flex-col', 'items-center', 'gap-4');
                    els.artworkBlock.classList.add('flex-row', 'items-start', 'gap-2');

                    els.artwork.classList.remove('w-40', 'h-40', 'md:w-48', 'md:h-48');
                    // ~40px
                    els.artwork.classList.add('w-10', 'h-10', 'md:w-10', 'md:h-10');

                    if (els.nowTitleContainer) {
                        els.nowTitleContainer.classList.remove('text-center');
                        els.nowTitleContainer.classList.add('text-left', 'ml-3', 'flex-1');
                    }

                    els.lyricsBody.classList.remove('max-h-64');
                    els.lyricsBody.classList.add('max-h-none');

                    els.artworkToggle.setAttribute('aria-expanded', 'false');
                    if (els.artworkToggleIcon) {
                        els.artworkToggleIcon.textContent = '∨'; // flèche vers le bas pour ré-agrandir la jaquette
                    }
                } else {
                    // Mode "normal" : jaquette plus grande, titre sous la jaquette
                    els.artworkBlock.classList.remove('flex-row', 'items-start', 'gap-2');
                    els.artworkBlock.classList.add('flex-col', 'items-center', 'gap-4');

                    els.artwork.classList.remove('w-10', 'h-10', 'md:w-10', 'md:h-10');
                    els.artwork.classList.add('w-40', 'h-40', 'md:w-48', 'md:h-48');

                    if (els.nowTitleContainer) {
                        els.nowTitleContainer.classList.remove('text-left', 'ml-3', 'flex-1');
                        els.nowTitleContainer.classList.add('text-center');
                    }

                    els.lyricsBody.classList.remove('max-h-none');
                    els.lyricsBody.classList.add('max-h-64');

                    els.artworkToggle.setAttribute('aria-expanded', 'true');
                    if (els.artworkToggleIcon) {
                        els.artworkToggleIcon.textContent = '∧'; // flèche vers le haut pour réduire la jaquette
                    }
                }
            };

            updateArtworkState();

            els.artworkToggle.addEventListener('click', () => {
                collapsed = !collapsed;
                updateArtworkState();
            });
        }
    }

    function hydrateAllTracksFromPage() {
        if (!els.layoutRoot) return;
        try {
            const payload = els.layoutRoot.getAttribute('data-corbi-all-tracks');
            if (!payload) return;
            const parsed = JSON.parse(payload);
            if (Array.isArray(parsed)) {
                window.CorbidevPlayerDataAllTracks = parsed;
                state.allTracks = parsed;
            }
        } catch (e) {
            // ignore
        }
    }

    function loadFavoritesFromStorage() {
        try {
            const raw = window.localStorage.getItem(FAVORITES_KEY);
            if (!raw) return;
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
                arr.forEach(id => state.favorites.add(String(id)));
            }
            const tsRaw = window.localStorage.getItem(FAVORITES_TS_KEY);
            if (tsRaw) {
                const parsedTs = parseInt(tsRaw, 10);
                if (!Number.isNaN(parsedTs)) {
                    state.favoritesLastChanged = parsedTs;
                }
            }
        } catch (e) {
            // ignore
        }
    }

    function saveFavoritesToStorage(explicitTs) {
        try {
            const arr = Array.from(state.favorites);
            const nowTs = typeof explicitTs === 'number' && explicitTs > 0
                ? explicitTs
                : Date.now();
            window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(arr));
            window.localStorage.setItem(FAVORITES_TS_KEY, String(nowTs));
            state.favoritesLastChanged = nowTs;
        } catch (e) {
            // ignore
        }
    }

    function fetchFavoritesFromServer() {
        if (!isLoggedIn || !ajaxConfig.url || !ajaxConfig.nonce) {
            return Promise.resolve(null);
        }

        const body = new URLSearchParams();
        body.set('action', 'corbidev_get_favorites');
        body.set('nonce', ajaxConfig.nonce);

        return fetch(ajaxConfig.url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
            body,
        })
            .then(res => res.ok ? res.json() : null)
            .then(json => {
                if (!json || !json.success || !json.data) return null;
                const data = json.data;
                const favorites = Array.isArray(data.favorites) ? data.favorites : [];
                const lastChanged = typeof data.last_changed === 'number' ? data.last_changed : 0;
                return { favorites, lastChanged };
            })
            .catch(() => null);
    }

    function pushFavoritesToServer() {
        if (!isLoggedIn || !ajaxConfig.url || !ajaxConfig.nonce) {
            return;
        }

        const favoritesArray = Array.from(state.favorites);
        const body = new URLSearchParams();
        body.set('action', 'corbidev_save_favorites');
        body.set('nonce', ajaxConfig.nonce);
        body.set('favorites', JSON.stringify(favoritesArray));
        body.set('last_changed', String(state.favoritesLastChanged || Date.now()));

        fetch(ajaxConfig.url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
            body,
        })
            .then(res => res.ok ? res.json() : null)
            .then(json => {
                if (!json || !json.success || !json.data) return;
                const data = json.data;
                const favorites = Array.isArray(data.favorites) ? data.favorites : [];
                const lastChanged = typeof data.last_changed === 'number' ? data.last_changed : 0;
                if (lastChanged) {
                    state.favorites = new Set(favorites.map(id => String(id)));
                    saveFavoritesToStorage(lastChanged);
                    renderAlbums();
                    renderTracks(state.tracksMode);
                    updateFooterFavoriteIcon();
                }
            })
            .catch(() => {
                // ignore network errors
            });
    }

    function toggleFavorite(track) {
        if (!track || typeof track.id === 'undefined') return;
        const id = String(track.id);
        if (state.favorites.has(id)) {
            state.favorites.delete(id);
        } else {
            state.favorites.add(id);
        }
        saveFavoritesToStorage();
        // Rafraîchit la colonne albums (playlist "Favoris") et la liste active
        renderAlbums();
        renderTracks(state.tracksMode);
        updateFooterFavoriteIcon();
        if (isLoggedIn) {
            pushFavoritesToServer();
        }
    }

    function init() {
        initElements();
        if (!els.layoutRoot || !els.audio) return;
        hydrateAllTracksFromPage();
        loadFavoritesFromStorage();
        renderAlbums();
        renderTracks('album');
        bindPlayerControls();
        bindLayoutControls();

        // Mise en place de l’onglet mobile par défaut
        if (els.mobileTabButtons && els.mobileTabButtons.length) {
            applyMobileTab('albums');
        }

        // Synchronisation favoris localStorage / BDD
        if (isLoggedIn) {
            fetchFavoritesFromServer().then(serverData => {
                if (!serverData) return;
                const localTs = state.favoritesLastChanged || 0;
                const remoteTs = serverData.lastChanged || 0;

                if (remoteTs > localTs) {
                    // La BDD est plus récente : on applique les favoris serveur
                    state.favorites = new Set(serverData.favorites.map(id => String(id)));
                    saveFavoritesToStorage(remoteTs);
                    renderAlbums();
                    renderTracks(state.tracksMode);
                    updateFooterFavoriteIcon();
                } else if (localTs > remoteTs) {
                    // Le local est plus récent : on pousse vers la BDD
                    pushFavoritesToServer();
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
