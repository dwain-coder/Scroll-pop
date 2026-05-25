<?php
/**
 * Core ScrollPop class — singleton bootstrap
 */

if ( ! defined( 'ABSPATH' ) ) exit;

class ScrollPop {

    private static ?ScrollPop $instance = null;

    public static function instance(): self {
        if ( null === self::$instance ) {
            self::$instance = new self();
            self::$instance->init();
        }
        return self::$instance;
    }

    private function __construct() {}

    private function init(): void {
        // Load admin settings page
        if ( is_admin() ) {
            new ScrollPop_Admin();
        }

        // Inject snippet on front-end
        $snippet = new ScrollPop_Snippet();
        $snippet->init();

        // Register activation/deactivation hooks
        register_activation_hook( SCROLLPOP_PLUGIN_FILE, [ $this, 'activate' ] );
        register_deactivation_hook( SCROLLPOP_PLUGIN_FILE, [ $this, 'deactivate' ] );
        register_uninstall_hook( SCROLLPOP_PLUGIN_FILE, [ 'ScrollPop', 'uninstall' ] );
    }

    public function activate(): void {
        // Nothing to do on activation — settings stored in wp_options
    }

    public function deactivate(): void {
        // Nothing to do on deactivation
    }

    public static function uninstall(): void {
        delete_option( 'scrollpop_public_key' );
        delete_option( 'scrollpop_enabled' );
    }

    /**
     * Get the configured public key (empty string if not set)
     */
    public static function get_public_key(): string {
        return sanitize_text_field( get_option( 'scrollpop_public_key', '' ) );
    }

    /**
     * Is ScrollPop enabled?
     */
    public static function is_enabled(): bool {
        return (bool) get_option( 'scrollpop_enabled', true );
    }
}
