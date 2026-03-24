<?php
/**
 * 404 page template
 *
 * @package GA_Theme
 */

get_header();
?>

<main class="site-main" style="padding-top: calc(var(--nav-height) + 80px); min-height: 60vh; display: flex; align-items: center;">
  <div class="container" style="text-align: center;">
    <h1 class="text-gradient" style="font-size: 6rem; font-weight: 800; margin-bottom: 16px;">404</h1>
    <h2 style="margin-bottom: 16px;" data-en="Page Not Found" data-tr="Sayfa Bulunamadı">Page Not Found</h2>
    <p style="color: var(--color-text-secondary); margin-bottom: 32px; max-width: 500px; margin-left: auto; margin-right: auto;" data-en="The page you're looking for doesn't exist or has been moved." data-tr="Aradığınız sayfa mevcut değil veya taşınmış olabilir.">The page you're looking for doesn't exist or has been moved.</p>
    <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="btn btn-primary" data-en="Back to Home" data-tr="Ana Sayfaya Dön">Back to Home</a>
  </div>
</main>

<?php
get_footer();
