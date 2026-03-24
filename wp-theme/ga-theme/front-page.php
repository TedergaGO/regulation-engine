<?php
/**
 * Front page template
 *
 * @package GA_Theme
 */

get_header();

get_template_part( 'template-parts/hero' );
get_template_part( 'template-parts/about' );
get_template_part( 'template-parts/services' );
get_template_part( 'template-parts/projects' );
get_template_part( 'template-parts/opendata' );
get_template_part( 'template-parts/social-responsibility' );
get_template_part( 'template-parts/mission' );
get_template_part( 'template-parts/contact' );

get_footer();
