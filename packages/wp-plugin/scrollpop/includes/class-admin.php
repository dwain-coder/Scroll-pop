<?php
/**
 * Admin Settings Page Registration
 */

if ( ! defined( 'ABSPATH' ) ) exit;

class ScrollPop_Admin {

    public function __construct() {
        add_action( 'admin_menu', [ $this, 'add_settings_page' ] );
        add_action( 'admin_init', [ $this, 'register_settings' ] );
    }

    public function add_settings_page(): void {
        add_options_page(
            __( 'ScrollPop Settings', 'scrollpop' ),
            __( 'ScrollPop', 'scrollpop' ),
            'manage_options',
            'scrollpop',
            [ $this, 'render_settings_page' ]
        );
    }

    public function register_settings(): void {
        register_setting( 'scrollpop_settings', 'scrollpop_public_key', [
            'type'              => 'string',
            'sanitize_callback' => [ $this, 'sanitize_public_key' ],
            'default'           => '',
        ] );

        register_setting( 'scrollpop_settings', 'scrollpop_enabled', [
            'type'              => 'boolean',
            'sanitize_callback' => 'rest_sanitize_boolean',
            'default'           => true,
        ] );

        add_settings_section(
            'scrollpop_general_section',
            __( 'General Settings', 'scrollpop' ),
            null,
            'scrollpop'
        );

        add_settings_field(
            'scrollpop_public_key',
            __( 'Site Public Key', 'scrollpop' ),
            [ $this, 'render_public_key_field' ],
            'scrollpop',
            'scrollpop_general_section'
        );

        add_settings_field(
            'scrollpop_enabled',
            __( 'Enable ScrollPop', 'scrollpop' ),
            [ $this, 'render_enabled_field' ],
            'scrollpop',
            'scrollpop_general_section'
        );
    }

    public function sanitize_public_key( $value ): string {
        $value = sanitize_text_field( $value );
        $value = trim( strtolower( $value ) );
        // Enforce 32 characters hex format
        if ( ! empty( $value ) && ! preg_match( '/^[a-f0-9]{32}$/', $value ) ) {
            add_settings_error(
                'scrollpop_public_key',
                'invalid_public_key',
                __( 'Error: Public Key must be exactly a 32-character hexadecimal string.', 'scrollpop' ),
                'error'
            );
        }
        return $value;
    }

    public function render_public_key_field(): void {
        $key = ScrollPop::get_public_key();
        ?>
        <input type="text" name="scrollpop_public_key" value="<?php echo esc_attr( $key ); ?>" class="regular-text code" placeholder="e.g. 5f4dcc3b5aa765d61d8327deb882cf99" />
        <p class="description"><?php esc_html_e( 'Copy your site\'s Public Key from the ScrollPop Dashboard settings page.', 'scrollpop' ); ?></p>
        <?php
    }

    public function render_enabled_field(): void {
        $enabled = ScrollPop::is_enabled();
        ?>
        <label>
            <input type="checkbox" name="scrollpop_enabled" value="1" <?php checked( $enabled, true ); ?> />
            <?php esc_html_e( 'Deliver popup campaigns to visitors on this WordPress site.', 'scrollpop' ); ?>
        </label>
        <?php
    }

    public function render_settings_page(): void {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }
        ?>
        <div class="wrap">
            <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
            <p><?php esc_html_e( 'Deliver Google-compliant popup campaigns to monetize your traffic with affiliate slots, lead gen, and donation cards.', 'scrollpop' ); ?></p>
            
            <form action="options.php" method="post">
                <?php
                settings_fields( 'scrollpop_settings' );
                do_settings_sections( 'scrollpop' );
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }
}
