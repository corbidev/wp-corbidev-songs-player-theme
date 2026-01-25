<?php
if (!defined('ABSPATH')) {
    exit;
}

get_header();

// Même layout que la page player, mais directement sur l'index (racine du thème)
$albums = function_exists('corbidev_theme_get_albums_for_front')
    ? corbidev_theme_get_albums_for_front()
    : [];

$library_albums = [];
$playlists      = [];
$all_tracks     = [];

foreach ($albums as $album) {
    $target = !empty($album['is_playlist']) ? 'playlists' : 'library_albums';
    ${$target}[] = $album;

    if (!empty($album['tracks']) && is_array($album['tracks'])) {
        foreach ($album['tracks'] as $track) {
            $all_tracks[] = [
                'album_id'   => $album['id'],
                'album_name' => $album['name'],
                'cover'      => $album['cover'] ?? '',
                'id'         => $track['id'],
                'title'      => $track['title'],
                'duration'   => $track['duration'] ?? 0,
                'duration_f' => $track['duration_f'] ?? '',
                'url'        => $track['url'] ?? '',
                'created_at' => $track['created_at'] ?? '',
            ];
        }
    }
}

// Trie les pistes globales par date de création décroissante pour l’onglet "All"
usort($all_tracks, static function (array $a, array $b): int {
    return strcmp($b['created_at'] ?? '', $a['created_at'] ?? '');
});
?>
<div class="w-full px-4 md:px-8 lg:px-10 py-6 md:py-10 lg:py-12">
    <header class="mb-4 md:mb-6 flex items-center justify-between gap-4">
        <div>
            <p class="hidden md:inline text-xs md:text-sm text-slate-400">
                <?php esc_html_e('Browse your albums, playlists and tracks, then control playback from the global player.', 'wp-corbidev-songs-player-theme'); ?>
            </p>
        </div>
        <div>
            <div class="flex md:hidden items-center justify-end gap-2 text-[11px] text-slate-200">
                <div class="inline-flex items-center gap-1 rounded-full bg-slate-900/90 px-1 py-1 shadow-sm shadow-black/40 border border-slate-800/80">
                    <button type="button"
                        class="px-2 py-0.5 rounded-full data-[active="1"]:bg-slate-950 data-[active="1"]:text-white"
                        data-corbi-mobile-tab="albums"
                        data-active="1">
                        <?php esc_html_e('Albums', 'wp-corbidev-songs-player-theme'); ?>
                    </button>
                    <button type="button"
                        class="px-2 py-0.5 rounded-full data-[active="1"]:bg-slate-950 data-[active="1"]:text-white"
                        data-corbi-mobile-tab="tracks"
                        data-active="0">
                        <?php esc_html_e('Tracks', 'wp-corbidev-songs-player-theme'); ?>
                    </button>
                    <button type="button"
                        class="px-2 py-0.5 rounded-full data-[active="1"]:bg-slate-950 data-[active="1"]:text-white"
                        data-corbi-mobile-tab="now"
                        data-active="0">
                        <?php esc_html_e('Now playing', 'wp-corbidev-songs-player-theme'); ?>
                    </button>
                    <button type="button"
                        class="px-2 py-0.5 rounded-full data-[active="1"]:bg-slate-950 data-[active="1"]:text-white"
                        data-corbi-mobile-tab="all"
                        data-active="0">
                        <?php esc_html_e('All', 'wp-corbidev-songs-player-theme'); ?>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <?php if (empty($albums)) : ?>
    <p class="mt-6 text-sm text-slate-400">
        <?php esc_html_e('No albums or tracks are available yet. Make sure the Corbidev Songs Player plugin is active and configured.', 'wp-corbidev-songs-player-theme'); ?>
    </p>
    <?php else : ?>
    <section
        class="grid grid-cols-1 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)_minmax(0,0.9fr)] gap-4 md:gap-5 lg:gap-6 h-[min(80vh,640px)] md:h-[480px] lg:h-[560px]"
        data-corbi-layout-root
        data-corbi-all-tracks='<?php echo wp_json_encode($all_tracks, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?>'>
        <div class="md:block" data-corbi-layout-column="albums">
            <?php get_template_part('templates/block', 'albums'); ?>
        </div>

        <div class="md:block" data-corbi-layout-column="tracks">
            <?php get_template_part('templates/block', 'tracks'); ?>
        </div>

        <div class="md:block" data-corbi-layout-column="now">
            <?php get_template_part('templates/block', 'lyrics'); ?>
        </div>
<?php get_template_part('templates/block', 'player'); ?>
    </section>
    <?php endif; ?>
</div>
<?php
get_footer();