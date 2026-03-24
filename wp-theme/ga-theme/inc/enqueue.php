<?php
/**
 * Enqueue scripts and styles
 *
 * @package GA_Theme
 */

function ga_theme_scripts() {
    // Google Fonts
    wp_enqueue_style(
        'ga-google-fonts',
        'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
        array(),
        null
    );

    // Theme styles
    wp_enqueue_style( 'ga-main', get_template_directory_uri() . '/assets/css/main.css', array(), GA_THEME_VERSION );
    wp_enqueue_style( 'ga-components', get_template_directory_uri() . '/assets/css/components.css', array( 'ga-main' ), GA_THEME_VERSION );
    wp_enqueue_style( 'ga-responsive', get_template_directory_uri() . '/assets/css/responsive.css', array( 'ga-components' ), GA_THEME_VERSION );

    // Theme scripts
    wp_enqueue_script( 'ga-main', get_template_directory_uri() . '/assets/js/main.js', array(), GA_THEME_VERSION, true );
    wp_enqueue_script( 'ga-language', get_template_directory_uri() . '/assets/js/language.js', array(), GA_THEME_VERSION, true );
    wp_enqueue_script( 'ga-animations', get_template_directory_uri() . '/assets/js/animations.js', array(), GA_THEME_VERSION, true );
}
add_action( 'wp_enqueue_scripts', 'ga_theme_scripts' );

/**
 * Add preconnect for Google Fonts
 */
function ga_theme_resource_hints( $urls, $relation_type ) {
    if ( 'preconnect' === $relation_type ) {
        $urls[] = array(
            'href' => 'https://fonts.googleapis.com',
            'crossorigin' => false,
        );
        $urls[] = array(
            'href' => 'https://fonts.gstatic.com',
            'crossorigin' => 'anonymous',
        );
    }
    return $urls;
}
add_filter( 'wp_resource_hints', 'ga_theme_resource_hints', 10, 2 );
