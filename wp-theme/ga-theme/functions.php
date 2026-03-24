<?php
/**
 * GA Theme functions and definitions
 *
 * @package GA_Theme
 */

if ( ! defined( 'GA_THEME_VERSION' ) ) {
    define( 'GA_THEME_VERSION', '1.0.0' );
}

/**
 * Theme setup
 */
function ga_theme_setup() {
    // Text domain for translations
    load_theme_textdomain( 'ga-theme', get_template_directory() . '/languages' );

    // Theme supports
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'custom-logo', array(
        'height'      => 80,
        'width'       => 250,
        'flex-height' => true,
        'flex-width'  => true,
    ) );
    add_theme_support( 'html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
        'style',
        'script',
    ) );

    // Register navigation menus
    register_nav_menus( array(
        'primary' => esc_html__( 'Primary Menu', 'ga-theme' ),
        'footer'  => esc_html__( 'Footer Menu', 'ga-theme' ),
    ) );

    // Featured image sizes
    add_image_size( 'ga-project-thumb', 600, 400, true );
    add_image_size( 'ga-hero', 1920, 1080, false );
}
add_action( 'after_setup_theme', 'ga_theme_setup' );

/**
 * Include theme files
 */
require get_template_directory() . '/inc/enqueue.php';
require get_template_directory() . '/inc/customizer.php';
require get_template_directory() . '/inc/custom-post-types.php';
require get_template_directory() . '/inc/bilingual.php';
