<?php
/**
 * Bilingual support helpers
 *
 * @package GA_Theme
 */

/**
 * Output bilingual text with data attributes
 *
 * @param string $en English text
 * @param string $tr Turkish text
 * @param string $tag HTML tag to wrap (default: span)
 */
function ga_bilingual( $en, $tr, $tag = 'span' ) {
    printf(
        '<%1$s data-en="%2$s" data-tr="%3$s">%2$s</%1$s>',
        esc_attr( $tag ),
        esc_html( $en ),
        esc_html( $tr )
    );
}

/**
 * Return bilingual attributes string
 *
 * @param string $en English text
 * @param string $tr Turkish text
 * @return string HTML attributes string
 */
function ga_bilingual_attrs( $en, $tr ) {
    return sprintf(
        'data-en="%s" data-tr="%s"',
        esc_attr( $en ),
        esc_attr( $tr )
    );
}
