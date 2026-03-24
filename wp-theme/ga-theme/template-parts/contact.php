<?php
/**
 * Contact section
 *
 * @package GA_Theme
 */
?>

<section class="section section-alt" id="contact">
  <div class="container">
    <div class="section-header fade-in">
      <h2 class="section-title" data-en="Contact" data-tr="İletişim">Contact</h2>
    </div>

    <div class="contact-grid fade-in">
      <p class="contact-intro" data-en="Let's connect. Whether it's about technology, open data, or collaboration opportunities — I'd love to hear from you." data-tr="İletişime geçelim. Teknoloji, açık veri veya iş birliği fırsatları hakkında olsun — sizden haber almak isterim.">Let's connect. Whether it's about technology, open data, or collaboration opportunities — I'd love to hear from you.</p>

      <div class="contact-items">
        <a href="mailto:gatabay@tederga.com" class="contact-item">
          <div class="contact-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <div>
            <span class="contact-label">Email</span>
            <span class="contact-value">gatabay@tederga.com</span>
          </div>
        </a>

        <a href="https://www.linkedin.com/in/gurkan-atabay/" target="_blank" rel="noopener noreferrer" class="contact-item">
          <div class="contact-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
          </div>
          <div>
            <span class="contact-label">LinkedIn</span>
            <span class="contact-value">linkedin.com/in/gurkan-atabay</span>
          </div>
        </a>

        <div class="contact-item">
          <div class="contact-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>
          </div>
          <div>
            <span class="contact-label" data-en="Company" data-tr="Şirket">Company</span>
            <span class="contact-value">Tederga Bilişim</span>
          </div>
        </div>

        <div class="contact-item">
          <div class="contact-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div>
            <span class="contact-label" data-en="Location" data-tr="Konum">Location</span>
            <span class="contact-value" data-en="Istanbul, Turkey | GOSB Teknopark" data-tr="İstanbul, Türkiye | GOSB Teknopark">Istanbul, Turkey | GOSB Teknopark</span>
          </div>
        </div>

      </div>

      <?php if ( shortcode_exists( 'contact-form-7' ) ) : ?>
        <div class="contact-form" style="margin-top: 40px;">
          <?php echo do_shortcode( '[contact-form-7]' ); ?>
        </div>
      <?php endif; ?>
    </div>
  </div>
</section>
