<?php
/**
 * WordPress Customizer settings
 *
 * @package GA_Theme
 */

function ga_theme_customizer( $wp_customize ) {
    // GA Theme Options Panel
    $wp_customize->add_panel( 'ga_theme_options', array(
        'title'    => __( 'GA Theme Options', 'ga-theme' ),
        'priority' => 30,
    ) );

    // === Hero Section ===
    $wp_customize->add_section( 'ga_hero', array(
        'title' => __( 'Hero Section', 'ga-theme' ),
        'panel' => 'ga_theme_options',
    ) );

    $wp_customize->add_setting( 'ga_hero_badge', array(
        'default'           => 'Founder & CTO at Tederga Bilişim',
        'sanitize_callback' => 'sanitize_text_field',
    ) );
    $wp_customize->add_control( 'ga_hero_badge', array(
        'label'   => __( 'Hero Badge Text', 'ga-theme' ),
        'section' => 'ga_hero',
        'type'    => 'text',
    ) );

    $wp_customize->add_setting( 'ga_hero_name', array(
        'default'           => 'Gürkan Atabay',
        'sanitize_callback' => 'sanitize_text_field',
    ) );
    $wp_customize->add_control( 'ga_hero_name', array(
        'label'   => __( 'Hero Name', 'ga-theme' ),
        'section' => 'ga_hero',
        'type'    => 'text',
    ) );

    $wp_customize->add_setting( 'ga_hero_title', array(
        'default'           => 'Computer Engineer | Cloud & Open Data Expert | Global Project Leader',
        'sanitize_callback' => 'sanitize_text_field',
    ) );
    $wp_customize->add_control( 'ga_hero_title', array(
        'label'   => __( 'Hero Title', 'ga-theme' ),
        'section' => 'ga_hero',
        'type'    => 'text',
    ) );

    // === Contact Section ===
    $wp_customize->add_section( 'ga_contact', array(
        'title' => __( 'Contact Info', 'ga-theme' ),
        'panel' => 'ga_theme_options',
    ) );

    $wp_customize->add_setting( 'ga_contact_email', array(
        'default'           => 'gatabay@tederga.com',
        'sanitize_callback' => 'sanitize_email',
    ) );
    $wp_customize->add_control( 'ga_contact_email', array(
        'label'   => __( 'Email Address', 'ga-theme' ),
        'section' => 'ga_contact',
        'type'    => 'email',
    ) );

    $wp_customize->add_setting( 'ga_linkedin_url', array(
        'default'           => 'https://www.linkedin.com/in/gurkan-atabay/',
        'sanitize_callback' => 'esc_url_raw',
    ) );
    $wp_customize->add_control( 'ga_linkedin_url', array(
        'label'   => __( 'LinkedIn URL', 'ga-theme' ),
        'section' => 'ga_contact',
        'type'    => 'url',
    ) );

    $wp_customize->add_setting( 'ga_github_url', array(
        'default'           => 'https://github.com/gurkanatabay',
        'sanitize_callback' => 'esc_url_raw',
    ) );
    $wp_customize->add_control( 'ga_github_url', array(
        'label'   => __( 'GitHub URL', 'ga-theme' ),
        'section' => 'ga_contact',
        'type'    => 'url',
    ) );

    // === Footer ===
    $wp_customize->add_section( 'ga_footer', array(
        'title' => __( 'Footer', 'ga-theme' ),
        'panel' => 'ga_theme_options',
    ) );

    $wp_customize->add_setting( 'ga_footer_text', array(
        'default'           => 'Gürkan Atabay / Tederga Bilişim',
        'sanitize_callback' => 'sanitize_text_field',
    ) );
    $wp_customize->add_control( 'ga_footer_text', array(
        'label'   => __( 'Footer Copyright Text', 'ga-theme' ),
        'section' => 'ga_footer',
        'type'    => 'text',
    ) );

    $wp_customize->add_setting( 'ga_logo_text', array(
        'default'           => 'GA',
        'sanitize_callback' => 'sanitize_text_field',
    ) );
    $wp_customize->add_control( 'ga_logo_text', array(
        'label'   => __( 'Logo Text (when no logo image)', 'ga-theme' ),
        'section' => 'ga_footer',
        'type'    => 'text',
    ) );
}
add_action( 'customize_register', 'ga_theme_customizer' );
