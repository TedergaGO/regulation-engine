<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo( 'charset' ); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<!-- Navigation -->
<nav class="navbar" id="navbar">
  <div class="nav-container">
    <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="nav-logo">
      <?php if ( has_custom_logo() ) : ?>
        <?php the_custom_logo(); ?>
      <?php else : ?>
        <span class="logo-text"><?php echo esc_html( get_theme_mod( 'ga_logo_text', 'GA' ) ); ?></span>
      <?php endif; ?>
    </a>

    <ul class="nav-menu" id="navMenu">
      <li><a href="#about" class="nav-link" data-en="About" data-tr="Hakkımda">About</a></li>
      <li><a href="#services" class="nav-link" data-en="Services" data-tr="Hizmetler">Services</a></li>
      <li><a href="#projects" class="nav-link" data-en="Projects" data-tr="Projeler">Projects</a></li>
      <li><a href="#opendata" class="nav-link" data-en="Open Data" data-tr="Açık Veri">Open Data</a></li>
      <li><a href="#contact" class="nav-link" data-en="Contact" data-tr="İletişim">Contact</a></li>
    </ul>

    <div class="nav-actions">
      <button class="lang-toggle" id="langToggle" aria-label="<?php esc_attr_e( 'Switch language', 'ga-theme' ); ?>">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        <span id="langLabel">TR</span>
      </button>
      <button class="nav-toggle" id="navToggle" aria-label="<?php esc_attr_e( 'Toggle menu', 'ga-theme' ); ?>">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </div>
</nav>
