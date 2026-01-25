<?php
/**
 * CorbiDev Songs Player Theme – FAST
 */

/* ==========================================================
 * Enqueue scripts & styles
 * ========================================================== */

add_action('wp_enqueue_scripts', function () {

  wp_enqueue_style(
    'corbidev-player-style',
    get_template_directory_uri() . '/assets/css/styles.css',
    [],
    null
  );

  // Player principal (layout complet basé sur templates/block-*.php)
  wp_enqueue_script(
    'corbidev-player-main',
    get_template_directory_uri() . '/assets/js/player.js',
    [],
    null,
    true
  );

  // Mini app simple utilisée sur la page "player" dédiée
  wp_enqueue_script(
    'corbidev-player-app',
    get_template_directory_uri() . '/assets/js/player-app.js',
    [],
    null,
    true
  );

  // Injection des données initiales pour le player principal (page d'accueil)
  if (function_exists('corbidev_theme_get_albums_for_front') && (is_front_page() || is_home())) {

    $albums = corbidev_theme_get_albums_for_front();

    $payload = [
      'albums' => [],
      'i18n'   => [
        'myAlbums'      => __('My albums', 'wp-corbidev-songs-player-theme-fast'),
        'myPlaylists'   => __('My playlists', 'wp-corbidev-songs-player-theme-fast'),
        'favoritesList' => __('Favorites', 'wp-corbidev-songs-player-theme-fast'),
        'download'      => __('Download', 'wp-corbidev-songs-player-theme-fast'),
        'share'         => __('Share', 'wp-corbidev-songs-player-theme-fast'),
        'nothingPlaying'=> __('Nothing playing', 'wp-corbidev-songs-player-theme-fast'),
      ],
      'ajax'  => [
        'url'   => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('corbidev_player_favorites'),
      ],
      'user'  => [
        'isLoggedIn' => is_user_logged_in(),
      ],
    ];

    foreach ($albums as $album) {
      $tracks = [];

      if (!empty($album['tracks']) && is_array($album['tracks'])) {
        foreach ($album['tracks'] as $track) {
          $tracks[] = [
            'id'          => (int) ($track['id'] ?? 0),
            'title'       => $track['title'] ?? '',
            'duration'    => (int) ($track['duration'] ?? 0),
            'duration_f'  => $track['duration_f'] ?? '',
            'url'         => $track['url'] ?? '',
            'album_id'    => (int) ($album['id'] ?? 0),
            'album_name'  => $album['name'] ?? '',
            'cover'       => $album['cover'] ?? '',
          ];
        }
      }

      $payload['albums'][] = [
        'id'          => (int) ($album['id'] ?? 0),
        'name'        => $album['name'] ?? '',
        'is_playlist' => !empty($album['is_playlist']),
        'cover'       => $album['cover'] ?? '',
        'count'       => (int) ($album['count'] ?? 0),
        'duration'    => (int) ($album['duration'] ?? 0),
        'duration_f'  => $album['duration_f'] ?? '',
        'tracks'      => $tracks,
      ];
    }

    wp_add_inline_script(
      'corbidev-player-main',
      'window.CorbidevPlayerData = ' . wp_json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . ';',
      'before'
    );
  }
});


/* ==========================================================
 * REST API – Player (publique)
 * ========================================================== */

add_action('rest_api_init', function () {

  register_rest_route('corbidev/v1', '/player', [
    'methods'             => 'GET',
    'callback'            => 'corbidev_player_data',
    'permission_callback' => '__return_true',
  ]);

});

function corbidev_player_data() {

  $cache_enabled = get_option('corbidev_player_cache_enabled', true);
  $ttl_minutes   = (int) get_option('corbidev_player_cache_ttl', 10);
  $ttl           = max(60, $ttl_minutes * 60);

  if ($cache_enabled) {
    $cache = get_transient('corbidev_player_fast_data');
    if ($cache !== false) {
      return rest_ensure_response($cache);
    }
  }

  // Données issues du plugin wp-corbidev-songs-player
  $data = [
    'track'  => function_exists('corbidev_get_current_track')
      ? corbidev_get_current_track()
      : null,
    'tracks' => function_exists('corbidev_get_tracks')
      ? corbidev_get_tracks()
      : [],
  ];

  if ($cache_enabled) {
    set_transient('corbidev_player_fast_data', $data, $ttl);
  }

  return rest_ensure_response($data);
}


/* ==========================================================
 * Helper front – Albums & pistes via l'API du plugin
 * ========================================================== */

if (!function_exists('corbidev_theme_get_albums_for_front')) {

  /**
   * Récupère les albums/playlists visibles pour l'utilisateur courant,
   * ainsi que leurs pistes, en réutilisant les callbacks REST du plugin
   * wp-corbidev-songs-player (ACL déjà appliquées côté plugin).
   */
  function corbidev_theme_get_albums_for_front(): array {

    if (!function_exists('corbidev_rest_get_library') || !function_exists('corbidev_rest_get_tracks')) {
      return [];
    }

    $albums_out = [];

    // 1) Bibliothèque (albums + playlists, avec stats)
    $library_request  = new WP_REST_Request('GET', '/corbidev/v1/library');
    $library_response = corbidev_rest_get_library($library_request);

    if (!($library_response instanceof WP_REST_Response)) {
      return [];
    }

    $library = $library_response->get_data();

    foreach (['albums', 'playlists'] as $kind) {
      if (empty($library[$kind]) || !is_array($library[$kind])) {
        continue;
      }

      $is_playlist = ($kind === 'playlists');

      foreach ($library[$kind] as $album) {
        $album_id = isset($album['id']) ? (int) $album['id'] : 0;
        if ($album_id <= 0) {
          continue;
        }

        // 2) Pistes pour cet album / playlist
        $tracks_request = new WP_REST_Request('GET', '/corbidev/v1/tracks/' . $album_id);
        $tracks_request->set_param('id', $album_id);
        $tracks_response = corbidev_rest_get_tracks($tracks_request);

        $tracks_data = $tracks_response instanceof WP_REST_Response
          ? $tracks_response->get_data()
          : ['tracks' => []];

        $tracks = [];

        if (!empty($tracks_data['tracks']) && is_array($tracks_data['tracks'])) {
          foreach ($tracks_data['tracks'] as $track) {
            $media_id = isset($track['media_id']) ? (int) $track['media_id'] : 0;
            $url      = $media_id > 0 ? wp_get_attachment_url($media_id) : '';

            $tracks[] = [
              'id'          => isset($track['id']) ? (int) $track['id'] : 0,
              'title'       => $track['title'] ?? '',
              'duration'    => isset($track['duration']) ? (int) $track['duration'] : 0,
              'duration_f'  => $track['duration_f'] ?? '',
              'url'         => $url,
              'created_at'  => '',
            ];
          }
        }

        $albums_out[] = [
          'id'          => $album_id,
          'name'        => $album['name'] ?? '',
          'is_playlist' => $is_playlist,
          'cover'       => $album['cover'] ?? '',
          'count'       => isset($album['count']) ? (int) $album['count'] : 0,
          'duration'    => isset($album['duration']) ? (int) $album['duration'] : 0,
          'duration_f'  => $album['duration_f'] ?? '',
          'tracks'      => $tracks,
        ];
      }
    }

    return $albums_out;
  }
}


/* ==========================================================
 * Cache – Options par défaut
 * ========================================================== */

add_action('after_setup_theme', function () {

  if (get_option('corbidev_player_cache_enabled') === false) {
    add_option('corbidev_player_cache_enabled', true);
  }

  if (get_option('corbidev_player_cache_ttl') === false) {
    add_option('corbidev_player_cache_ttl', 10); // minutes
  }

});


/* ==========================================================
 * Admin – Menu CorbiDev / Cache Player
 * ========================================================== */

add_action('admin_menu', function () {

  add_menu_page(
    'CorbiDev',
    'CorbiDev',
    'manage_options',
    'corbidev',
    'corbidev_cache_admin_page',
    'dashicons-admin-generic'
  );

  add_submenu_page(
    'corbidev',
    'Cache Player',
    'Cache Player',
    'manage_options',
    'corbidev-cache-player',
    'corbidev_cache_admin_page'
  );
});


/* ==========================================================
 * Admin – Page Cache Player
 * ========================================================== */

function corbidev_cache_admin_page() {

  if (!current_user_can('manage_options')) {
    return;
  }

  // Enregistrer les paramètres
  if (isset($_POST['corbidev_cache_save'])) {

    check_admin_referer('corbidev_cache_save');

    update_option(
      'corbidev_player_cache_enabled',
      isset($_POST['cache_enabled'])
    );

    update_option(
      'corbidev_player_cache_ttl',
      max(1, (int) $_POST['cache_ttl'])
    );

    echo '<div class="notice notice-success is-dismissible">
      <p>Paramètres du cache enregistrés.</p>
    </div>';
  }

  // Vider le cache
  if (isset($_POST['corbidev_cache_flush'])) {

    delete_transient('corbidev_player_fast_data');

    echo '<div class="notice notice-warning is-dismissible">
      <p>Cache vidé.</p>
    </div>';
  }

  $enabled = get_option('corbidev_player_cache_enabled', true);
  $ttl     = get_option('corbidev_player_cache_ttl', 10);
  ?>

  <div class="wrap">
    <h1>Cache Player – CorbiDev</h1>

    <form method="post">
      <?php wp_nonce_field('corbidev_cache_save'); ?>

      <table class="form-table">
        <tr>
          <th scope="row">Activer le cache</th>
          <td>
            <input type="checkbox" name="cache_enabled" <?php checked($enabled); ?>>
          </td>
        </tr>

        <tr>
          <th scope="row">Durée du cache (minutes)</th>
          <td>
            <input type="number" name="cache_ttl"
                   value="<?php echo esc_attr($ttl); ?>"
                   min="1">
          </td>
        </tr>
      </table>

      <p>
        <button type="submit"
                name="corbidev_cache_save"
                class="button button-primary">
          Enregistrer
        </button>
      </p>
    </form>

    <hr>

    <form method="post">
      <p>
        <button type="submit"
                name="corbidev_cache_flush"
                class="button">
          Vider le cache maintenant
        </button>
      </p>
    </form>
  </div>

<?php
}


/* ==========================================================
 * Front – Preload JSON REST
 * ========================================================== */

add_action('wp_head', function () {

  if (!is_page()) {
    return;
  }
  ?>
  <link rel="preload"
        href="<?php echo esc_url( rest_url('corbidev/v1/library') ); ?>"
        as="fetch"
        type="application/json"
        crossorigin="anonymous">
  <?php
}, 1);
