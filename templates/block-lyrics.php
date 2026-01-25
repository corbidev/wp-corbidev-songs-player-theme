<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<section
    class="h-full flex flex-col rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-950/80 to-slate-950/40"
    aria-label="<?php esc_attr_e('Artwork and lyrics', 'wp-corbidev-songs-player-theme'); ?>"
>
    <header class="flex items-center justify-between px-4 py-3 border-b border-slate-800/80">
        <h2 class="text-xs font-semibold tracking-wide text-slate-100 uppercase">
            <?php esc_html_e('Song lyrics', 'wp-corbidev-songs-player-theme'); ?>
        </h2>
        <button
            type="button"
            class="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 text-[11px] text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            data-corbi-artwork-toggle
            aria-label="<?php esc_attr_e('Toggle artwork size', 'wp-corbidev-songs-player-theme'); ?>"
            aria-expanded="true"
        >
            <span data-corbi-artwork-toggle-icon>^</span>
        </button>
    </header>
    <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4" data-corbi-lyrics-scroll>
        <div class="flex flex-col items-center gap-4 transition-all duration-300" data-corbi-artwork-block>
            <div class="relative w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden shadow-2xl shadow-black/70 bg-slate-800 transition-all duration-300"
                 id="corbidev-artwork"
                 data-corbi-artwork
                 data-corbi-artwork-placeholder="<?php echo esc_url( get_template_directory_uri() . '/assets/images/no-audio.svg' ); ?>">
                <img src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/no-audio.svg' ); ?>" alt="<?php esc_attr_e('No audio selected', 'wp-corbidev-songs-player-theme'); ?>" class="h-full w-full object-cover" loading="lazy" />
            </div>
            <div class="text-center transition-all duration-300" data-corbi-now-title-container>
                <p id="corbidev-now-title" class="text-sm font-semibold text-slate-50 truncate max-w-xs" data-corbi-now-title>
                    <!-- Titre courant -->
                </p>
            </div>
        </div>
        <div class="border-t border-slate-800/80 pt-4">
            <h3 class="text-[11px] font-semibold tracking-wide text-slate-400 uppercase mb-2">
                <?php esc_html_e('Lyrics', 'wp-corbidev-songs-player-theme'); ?>
            </h3>
            <div
                id="corbidev-lyrics"
                data-corbi-lyrics
                class="text-xs leading-relaxed text-slate-300 max-h-64 overflow-y-auto space-y-2 transition-all duration-300"
            >
                <p class="text-slate-500">
                    <?php esc_html_e('Lyrics will appear here when available.', 'wp-corbidev-songs-player-theme'); ?>
                </p>
            </div>
        </div>
    </div>
</section>
