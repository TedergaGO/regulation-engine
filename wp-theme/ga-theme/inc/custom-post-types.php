<?php
/**
 * Custom Post Types
 *
 * @package GA_Theme
 */

/**
 * Register Custom Post Types
 */
function ga_theme_register_cpts() {
    // Projects CPT
    register_post_type( 'ga_project', array(
        'labels' => array(
            'name'               => __( 'Projects', 'ga-theme' ),
            'singular_name'      => __( 'Project', 'ga-theme' ),
            'add_new'            => __( 'Add New Project', 'ga-theme' ),
            'add_new_item'       => __( 'Add New Project', 'ga-theme' ),
            'edit_item'          => __( 'Edit Project', 'ga-theme' ),
            'view_item'          => __( 'View Project', 'ga-theme' ),
            'all_items'          => __( 'All Projects', 'ga-theme' ),
            'search_items'       => __( 'Search Projects', 'ga-theme' ),
            'not_found'          => __( 'No projects found.', 'ga-theme' ),
            'not_found_in_trash' => __( 'No projects found in Trash.', 'ga-theme' ),
        ),
        'public'       => true,
        'has_archive'  => true,
        'menu_icon'    => 'dashicons-portfolio',
        'supports'     => array( 'title', 'editor', 'thumbnail', 'custom-fields' ),
        'rewrite'      => array( 'slug' => 'projects' ),
        'show_in_rest' => true,
    ) );

    // Project Categories
    register_taxonomy( 'project_category', 'ga_project', array(
        'labels' => array(
            'name'          => __( 'Project Categories', 'ga-theme' ),
            'singular_name' => __( 'Project Category', 'ga-theme' ),
        ),
        'hierarchical' => true,
        'show_in_rest' => true,
        'rewrite'      => array( 'slug' => 'project-category' ),
    ) );

    // Experience CPT
    register_post_type( 'ga_experience', array(
        'labels' => array(
            'name'               => __( 'Experience', 'ga-theme' ),
            'singular_name'      => __( 'Experience', 'ga-theme' ),
            'add_new'            => __( 'Add Experience', 'ga-theme' ),
            'add_new_item'       => __( 'Add New Experience', 'ga-theme' ),
            'edit_item'          => __( 'Edit Experience', 'ga-theme' ),
            'all_items'          => __( 'All Experience', 'ga-theme' ),
        ),
        'public'       => true,
        'has_archive'  => false,
        'menu_icon'    => 'dashicons-clock',
        'supports'     => array( 'title', 'editor', 'custom-fields' ),
        'show_in_rest' => true,
    ) );
}
add_action( 'init', 'ga_theme_register_cpts' );
