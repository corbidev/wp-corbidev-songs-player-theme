<?php
if (!defined('ABSPATH')) {
    exit;
}
?><!DOCTYPE html>
<html <?php language_attributes(); ?> class="h-full">
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class('bg-slate-950 text-slate-50 min-h-full flex flex-col'); ?>>
<header class="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <a href="<?php echo esc_url(home_url('/')); ?>" class="flex items-center gap-2">
            <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">♪</span>
            <span class="text-sm font-semibold tracking-wide uppercase text-slate-100"><?php bloginfo('name'); ?></span>
        </a>
        <nav class="flex items-center gap-4 text-sm">
            <?php
            wp_nav_menu([
                'theme_location' => 'primary',
                'container'      => false,
                'fallback_cb'    => false,
                'depth'          => 1,
                'menu_class'     => 'flex items-center gap-4',
            ]);
            ?>
        </nav>
    </div>
</header>
<main id="primary" class="flex-1 flex flex-col bg-slate-950">
