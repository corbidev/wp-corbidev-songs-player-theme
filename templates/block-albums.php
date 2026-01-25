<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<section
    class="h-full flex flex-col rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-950/80 to-slate-950/40 shadow-inner shadow-black/40"
    aria-label="<?php esc_attr_e('Albums and playlists', 'wp-corbidev-songs-player-theme'); ?>"
>
    <header class="flex items-center justify-between px-4 py-3 border-b border-slate-800/80">
        <h2 class="text-xs font-semibold tracking-wide text-slate-100 uppercase">
            <?php esc_html_e('Albums & Playlists', 'wp-corbidev-songs-player-theme'); ?>
        </h2>
    </header>
    <div class="flex-1 overflow-y-auto" data-corbi-library-scroll>
        <div class="px-3 py-3 space-y-5" id="corbidev-albums-root" data-corbi-albums-root>
            <!-- Items albums / playlists injectés par JS -->
        </div>
    </div>
</section>
