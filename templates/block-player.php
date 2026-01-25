<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<div class="sticky sm:fixed bottom-0 inset-x-0 z-50 bg-slate-950/95/80 backdrop-blur border-t border-slate-900/80"
    aria-label="<?php esc_attr_e('Global audio player', 'wp-corbidev-songs-player-theme'); ?>">
    <div class="w-full px-3 md:px-4 lg:px-6 py-3">
        <div
            class="w-full max-w-6xl mx-auto rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 shadow-[0_-6px_24px_rgba(0,0,0,0.9)] px-3 md:px-4 lg:px-5 py-2 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
            <div class="min-w-0 flex-1 flex items-center gap-3">
                <div class="relative h-11 w-11 rounded-lg overflow-hidden bg-slate-900/80 border border-slate-800 shadow-md shadow-black/50 flex-shrink-0"
                    data-corbi-footer-artwork
                    data-corbi-artwork-placeholder="<?php echo esc_url(get_template_directory_uri() . '/assets/images/no-audio.svg'); ?>">
                    <img src="<?php echo esc_url(get_template_directory_uri() . '/assets/images/no-audio.svg'); ?>"
                        alt="<?php esc_attr_e('No audio selected', 'wp-corbidev-songs-player-theme'); ?>"
                        class="h-full w-full object-cover" loading="lazy" />
                </div>
                <button type="button"
                    class="hidden sm:inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/80 text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    data-corbi-toggle-player
                    aria-label="<?php esc_attr_e('Show or hide player', 'wp-corbidev-songs-player-theme'); ?>">
                    <img src="<?php echo esc_url(get_template_directory_uri() . '/assets/images/icon-toggle.svg'); ?>"
                        alt="" class="h-5 w-5" aria-hidden="true" />
                </button>
                <div class="min-w-0 flex-1">
                    <p id="corbidev-footer-title" class="text-sm font-semibold text-slate-50 truncate"
                        data-corbi-footer-title>
                        <?php esc_html_e('Nothing playing', 'wp-corbidev-songs-player-theme'); ?>
                    </p>
                    <p id="corbidev-footer-sub" class="text-[11px] text-slate-400 truncate" data-corbi-footer-sub>
                        <?php esc_html_e('Select a track to start listening.', 'wp-corbidev-songs-player-theme'); ?>
                    </p>
                    <div class="mt-2 flex flex-col gap-1">
                        <div class="flex items-center justify-between text-[11px] text-slate-400">
                            <span id="corbidev-time-current" data-corbi-time-current>0:00</span>
                            <span id="corbidev-time-total" data-corbi-time-total>0:00</span>
                        </div>
                        <button type="button"
                            class="group relative h-1.5 w-full rounded-full bg-slate-800/90 overflow-hidden"
                            data-corbi-seek-bar
                            aria-label="<?php esc_attr_e('Seek in track', 'wp-corbidev-songs-player-theme'); ?>">
                            <span class="absolute inset-y-0 left-0 w-0 bg-indigo-500 group-hover:bg-indigo-400"
                                data-corbi-seek-fill></span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="flex flex-row md:flex-col  justify-between   items-center gap-4 md:gap-6">
                <div class=" mt-2 md:mt-0 flex items-center gap-3 justify-center">
                    <button type="button"
                        class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/70 border border-slate-700/80 text-slate-200 shadow-sm shadow-black/60 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        data-corbi-prev
                        aria-label="<?php esc_attr_e('Previous track', 'wp-corbidev-songs-player-theme'); ?>">
                        <img src="<?php echo esc_url(get_template_directory_uri() . '/assets/images/icon-prev.svg'); ?>"
                            alt="" class="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button type="button"
                        class="inline-flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-full bg-gradient-to-b from-slate-800 to-slate-950 text-slate-50 shadow-[0_0_0_4px_rgba(15,23,42,0.9)] border border-slate-600/80 hover:from-slate-700 hover:to-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        data-corbi-toggle-play
                        aria-label="<?php esc_attr_e('Play or pause', 'wp-corbidev-songs-player-theme'); ?>">
                        <img src="<?php echo esc_url(get_template_directory_uri() . '/assets/images/icon-play.svg'); ?>"
                            alt="" class="h-5 w-5" aria-hidden="true" data-corbi-icon-play />
                        <img src="<?php echo esc_url(get_template_directory_uri() . '/assets/images/icon-pause.svg'); ?>"
                            alt="" class="h-5 w-5 hidden" aria-hidden="true" data-corbi-icon-pause />
                    </button>
                    <button type="button"
                        class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/70 border border-slate-700/80 text-slate-200 shadow-sm shadow-black/60 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        data-corbi-next
                        aria-label="<?php esc_attr_e('Next track', 'wp-corbidev-songs-player-theme'); ?>">
                        <img src="<?php echo esc_url(get_template_directory_uri() . '/assets/images/icon-next.svg'); ?>"
                            alt="" class="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
                <div class="mt-2 md:mt-0 flex items-center gap-4 justify-between md:justify-start flex-wrap">
                    <div class="flex items-center gap-3">
                        <button type="button"
                            class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/70 border border-slate-700/80 text-slate-200 shadow-sm shadow-black/60 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            data-corbi-favorite-toggle
                            aria-label="<?php esc_attr_e('Toggle favorite', 'wp-corbidev-songs-player-theme'); ?>">
                            <img src="<?php echo esc_url(get_template_directory_uri() . '/assets/images/icon-heart-off.svg'); ?>"
                                alt="" class="h-5 w-5" aria-hidden="true" data-corbi-icon-fav-off />
                            <img src="<?php echo esc_url(get_template_directory_uri() . '/assets/images/icon-heart-on.svg'); ?>"
                                alt="" class="h-5 w-5 hidden" aria-hidden="true" data-corbi-icon-fav-on />
                        </button>
                        <button type="button"
                            class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/70 border border-slate-700/80 text-slate-200 shadow-sm shadow-black/60 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            data-corbi-download-current
                            aria-label="<?php esc_attr_e('Download current track', 'wp-corbidev-songs-player-theme'); ?>">
                            <img src="<?php echo esc_url(get_template_directory_uri() . '/assets/images/icon-download.svg'); ?>"
                                alt="" class="h-5 w-5" aria-hidden="true" />
                        </button>
                        <div class="flex items-center gap-1 w-28">
                            <img src="<?php echo esc_url(get_template_directory_uri() . '/assets/images/icon-volume.svg'); ?>"
                                alt="" class="w-5 h-5 text-slate-300" aria-hidden="true" />
                            <input type="range" min="0" max="1" step="0.01" value="1"
                                class="w-full cursor-pointer accent-indigo-500" data-corbi-volume
                                aria-label="<?php esc_attr_e('Volume', 'wp-corbidev-songs-player-theme'); ?>">
                        </div>
                    </div>
                </div>
            </div>
            <audio id="corbidev-audio" data-corbi-audio class="hidden" preload="metadata"></audio>
        </div>
    </div>
</div>