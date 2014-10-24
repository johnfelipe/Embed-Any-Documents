<?php
/*
  Plugin Name: Embed Any Docs
  Plugin URI: https://awsm.in/embed-any-documents
  Description: An object oriented boilerplate for developing a WordPress plugin.
  Version: 1.0.0
  Author: Adhun Anand 
  Author URI: http://www.codelikeaboss.com
  License: GPL V3
 */
require_once( dirname( __FILE__ ) . '/inc/functions.php');
class Awsm_embed {
	private static $instance = null;
	private $plugin_path;
	private $plugin_url;
	private $plugin_file;
    private $text_domain = 'awsm';
	/**
	 * Creates or returns an instance of this class.
	 */
	public static function get_instance() {
		// If an instance hasn't been created and set to $instance create an instance and set it to $instance.
		if ( null == self::$instance ) {
			self::$instance = new self;
		}
		return self::$instance;
	}

	/**
	 * Initializes the plugin by setting localization, hooks, filters, and administrative functions.
	 */
	private function __construct() {

		$this->plugin_path 	= plugin_dir_path( __FILE__ );
		$this->plugin_url  	= plugin_dir_url( __FILE__ );
		$this->plugin_file  =  __FILE__  ;

		load_plugin_textdomain( $this->text_domain, false, 'lang' );

		add_action( 'media_buttons', array( $this, 'embedbutton' ),1000);

		add_shortcode( 'embedall', array( $this, 'embed_shortcode'));

		//Admin Settings menu
		add_action('admin_menu', array($this, 'admin_menu'));
		add_action( 'admin_init', array($this, 'register_eadsettings'));
		//ajax validate file url
		add_action( 'wp_ajax_validateurl',array( $this, 'validateurl' ));
 
		//add_action( 'admin_enqueue_scripts', array( $this, 'register_scripts' ) );
		//add_action( 'admin_enqueue_scripts', array( $this, 'register_styles' ) );

		//add_action( 'wp_enqueue_scripts', array( $this, 'register_scripts' ) );
		//add_action( 'wp_enqueue_scripts', array( $this, 'register_styles' ) );

		$this->run_plugin();
	}

	/**
	 * Embed any Docs Button
	 */
	public function embedbutton( $args = array() ) {
		// Check user previlage  
		if ( !current_user_can( 'edit_posts' )) return;
		// Prepares button target
		$target = is_string( $args ) ? $args : 'content';
		// Prepare args
		$args = wp_parse_args( $args, array(
				'target'    => $target,
				'text'      => __( 'Embed Any Doc',  $this->text_domain),
				'class'     => 'awsm-embed button',
				'icon'      => plugins_url( 'images/ead-button.png', __FILE__ ),
				'echo'      => true,
				'shortcode' => false
			) );
		// Prepare EAD icon
		if ( $args['icon'] ) $args['icon'] = '<img src="' . $args['icon'] . '" /> ';
		// Print button in media column
		$button = '<a href="javascript:void(0);" class="' . $args['class'] . '" title="' . $args['text'] . '" data-mfp-src="#embed-popup-wrap" data-target="' . $args['target'] . '" >' . $args['icon'] . $args['text'] . '</a>';
		// Show generator popup
		//add_action( 'wp_footer',    array( $this, 'embedpopup' ) );
		add_action( 'admin_footer', array($this, 'embedpopup' ) );
		// Request assets
		wp_enqueue_media();
		//Loads Support css and js
		$this->embed_helper();
		// Print/return result
		if ( $args['echo'] ) echo $button;
		return $button;
	}
	/**
	 * Embed Form popup
	 */ 
	function embedpopup(){
		include('inc/popup.php');
	}
	/**
     * Register admin scripts
     */
	function embed_helper(){
		wp_register_style( 'magnific-popup', plugins_url( 'css/magnific-popup.css', $this->plugin_file ), false, '0.9.9', 'all' );
		wp_register_style( 'embed-css', plugins_url( 'css/embed.css', $this->plugin_file ), false, '1.0', 'all' );
		wp_register_script( 'magnific-popup', plugins_url( 'js/magnific-popup.js', $this->plugin_file ), array( 'jquery' ), '0.9.9', true );
		wp_register_script( 'embed', plugins_url( 'js/embed.js', $this->plugin_file ), array( 'jquery' ), '0.9.9', true );
		wp_localize_script( 'magnific-popup', 'magnific_popup', array(
				'close'   => __( 'Close (Esc)', $this->text_domain ),
				'loading' => __( 'Loading...',$this->text_domain ),
				'prev'    => __( 'Previous (Left arrow key)', $this->text_domain),
				'next'    => __( 'Next (Right arrow key)', $this->text_domain ),
				'counter' => sprintf( __( '%s of %s', $this->text_domain ), '%curr%', '%total%' ),
				'error'   => sprintf( __( 'Failed to load this link. %sOpen link%s.', $this->text_domain ), '<a href="%url%" target="_blank"><u>', '</u></a>' )
			) );
		wp_localize_script('embed','emebeder', array(
				'mimeurl' => plugins_url('inc/mimes.php',$this->plugin_file),
				'default_height'=> get_option('ead_height', '100%' ),
				'default_width' =>  get_option('ead_width', '100%' ),
				'download' =>  get_option('ead_download', 'none' ),
				'ajaxurl' => admin_url( 'admin-ajax.php' ),
			) );
		wp_enqueue_style('magnific-popup');
		wp_enqueue_script( 'magnific-popup' );
		wp_enqueue_style('embed-css');
		wp_enqueue_script( 'embed' );
	}
	/**
     * Shortcode Functionality
     */
	function embed_shortcode( $atts){
		$embedcode ="";
		extract(shortcode_atts( array(
			'url' => '',
			'width' => '100%',
			'height' => '100%',
			'language' => 'en'
		), $atts ) );

		if ( $url ) {
			$iframe = getprovider($atts);
			$provider = getprovider(get_option('ead_provider','google'));
			$durl = getdownloadlink($url);
			$embedcode = $iframe.$durl;
		}
	
		return $embedcode;
	}
 
	/**
     * Admin menu setup
     */
	public function admin_menu() {
        add_options_page('EAD Settings', 'Ead Settings', 'manage_options', 'ead-settings', array($this, 'settings_page'));
    }
    public function settings_page() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }
        include('inc/settings.php');
    }
    /**
     * Register Settings
     */
    function register_eadsettings() {
   	register_setting( 'ead-settings-group', 'ead_theme');
    register_setting( 'ead-settings-group', 'ead_width' );
    register_setting( 'ead-settings-group', 'ead_height' );
    register_setting( 'ead-settings-group', 'ead_download' );
    register_setting( 'ead-settings-group', 'ead_provider' );
	}
	/**
     * Ajax validate file url
    */
	function validateurl(){
		$fileurl =  $_POST['furl'];
		echo json_encode(validateurl($fileurl));
		die(0);
	}
	/**
     * Place code for your plugin's functionality here.
     */
    function check_mime(){

    }
    /**
     * Place code for your plugin's functionality here.
     */
    private function run_plugin() {

	}

}

Awsm_embed::get_instance();
