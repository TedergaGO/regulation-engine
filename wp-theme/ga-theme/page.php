<?php
/**
 * Generic page template
 *
 * @package GA_Theme
 */

get_header();
?>

<main class="site-main" style="padding-top: calc(var(--nav-height) + 40px);">
  <div class="container">
    <?php while ( have_posts() ) : the_post(); ?>
      <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
        <h1 class="page-title"><?php the_title(); ?></h1>
        <div class="page-content">
          <?php the_content(); ?>
        </div>
      </article>
    <?php endwhile; ?>
  </div>
</main>

<?php
get_footer();
