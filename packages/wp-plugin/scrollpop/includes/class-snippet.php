<?php
/**
 * Handles wp_head snippet injection
 */

if ( ! defined( 'ABSPATH' ) ) exit;

class ScrollPop_Snippet {

    public function init(): void {
        add_action( 'wp_head', [ $this, 'inject_snippet' ], 1 );
    }

    public function inject_snippet(): void {
        if ( ! ScrollPop::is_enabled() ) return;

        $public_key = ScrollPop::get_public_key();
        if ( empty( $public_key ) ) return;

        // Sanitize: only allow hex characters (16-byte hex = 32 chars)
        if ( ! preg_match( '/^[a-f0-9]{32}$/', $public_key ) ) return;

        $cdn_url = esc_url( SCROLLPOP_CDN_URL );
        ?>
<!-- ScrollPop -->
<script>
(function(w,d,s){
  var p=w.__sp=w.__sp||{q:[],identify:function(v){p.q.push(['identify',v])},loaded:false};
  if(p.loaded)return; p.loaded=true;
  var el=d.createElement(s); el.async=true; el.defer=true;
  el.src='<?php echo $cdn_url; ?>/v1/<?php echo esc_js( $public_key ); ?>/p.js';
  d.head.appendChild(el);
})(window,document,'script');
</script>
<!-- End ScrollPop -->
        <?php
    }
}
