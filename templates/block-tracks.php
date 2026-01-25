<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<section
    class="h-full flex flex-col rounded-2xl border border-slate-800/80 bg-slate-950/70"
    aria-label="<?php esc_attr_e('Tracks list', 'wp-corbidev-songs-player-theme'); ?>"
>
    <header class="px-4 pt-3 pb-2 border-b border-slate-800/80">
        <div class="flex items-center justify-between gap-4">
            <h2 class="text-xs font-semibold tracking-wide text-slate-100 uppercase">
                <?php esc_html_e('Track list', 'wp-corbidev-songs-player-theme'); ?>
            </h2>
            <div class="inline-flex items-center gap-1 rounded-full bg-slate-900/90 px-1 py-1 text-[11px] font-medium text-slate-200">
            <button
                type="button"
                class="px-2 py-0.5 rounded-full data-[active="1"]:bg-slate-950 data-[active="1"]:text-white"
                data-corbi-tracks-tab="album"
                data-active="1"
            >
                <?php esc_html_e('Album', 'wp-corbidev-songs-player-theme'); ?>
            </button>
            <button
                type="button"
                class="px-2 py-0.5 rounded-full data-[active="1"]:bg-slate-950 data-[active="1"]:text-white"
                data-corbi-tracks-tab="all"
            >
                <?php esc_html_e('All', 'wp-corbidev-songs-player-theme'); ?>
            </button>
            </div>
        </div>
        <p class="mt-1 text-[11px] text-slate-400">
            <?php esc_html_e('Album:', 'wp-corbidev-songs-player-theme'); ?>
            <span class="text-sky-300" data-corbi-current-album></span>
        </p>
    </header>
    <div class="flex-1 overflow-y-auto" data-corbi-tracks-scroll>
        <table class="min-w-full text-xs text-left align-middle">
            <thead class="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-slate-800">
                <tr class="text-slate-400">
                    <th scope="col" class="w-10 px-3 py-2 font-medium">#</th>
                    <th scope="col" class="px-3 py-2 font-medium"><?php esc_html_e('Title', 'wp-corbidev-songs-player-theme'); ?></th>
                    <th scope="col" class="px-3 py-2 font-medium hidden lg:table-cell"><?php esc_html_e('Artist', 'wp-corbidev-songs-player-theme'); ?></th>
                    <th scope="col" class="w-16 px-3 py-2 font-medium text-right"><?php esc_html_e('Time', 'wp-corbidev-songs-player-theme'); ?></th>
                    <th scope="col" class="w-24 px-3 py-2 font-medium text-right"><?php esc_html_e('Actions', 'wp-corbidev-songs-player-theme'); ?></th>
                </tr>
            </thead>
            <tbody id="corbidev-tracks-root" data-corbi-tracks-root class="divide-y divide-slate-800/80">
                <!-- Lignes de pistes injectées par JS -->
            </tbody>
        </table>
    </div>
</section>
