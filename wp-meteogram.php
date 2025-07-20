<?php
/*
 * Plugin Name: Meteogram
 * Plugin URI: https://www.smitka.net/wp-meteogram
 * Update URI: https://www.smitka.net/wp-plugin/wp-meteogram
 * Description: Show forecast of given place at given day
 * Version: 1.4
 * Author: Ivan Smitka
 * Author URI: https://www.smitka.net
 * License: The MIT License
 *
 * Copyright 2020 Web4People Ivan Smitka <ivan at stimulus dot cz>.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 *
 */

/**
 * @author Ivan Smitka <ivan at stimulus dot cz>
 */
class WP_Meteogram {

	const UPDATE_URI = "https://www.smitka.net/wp-plugin/wp-meteogram";

	public static function init() {
		// Scripts
		if ( ! is_admin() ) { // show only in public area
			add_action( 'wp_enqueue_scripts', array(
				'WP_Meteogram',
				'enqueue_scripts'
			) );
			// shortcodes
			add_shortcode( 'meteogram', array(
				'WP_Meteogram',
				'meteogram'
			) );
		} else {
			/* SelfHosted Updater Section */
			add_filter( 'http_request_host_is_external', '__return_true' );
			add_filter( 'update_plugins_www.smitka.net', function ( $update, $plugin_data, $plugin_file, $locales ) {
				if ( $plugin_file === plugin_basename( __FILE__ ) ) {
					return self::getUpdate( $plugin_data['UpdateURI'] );
				}

				return false;
			}, 10, 4 );
			add_filter( 'plugins_api', static function ( $res, $action, $args ) {
				if ( plugin_basename( __DIR__ ) !== $args->slug ) {
					return $res;
				}

				if ( $action !== 'plugin_information' ) {
					return $res;
				}

				$res                = self::getUpdate( self::UPDATE_URI );
				$res->download_link = $res->package;

				return $res;

			}, 9999, 3 );
			/* End of SelfHosted Updater Section */
		}
	}

	/**
	 * @param $update_URI
	 *
	 * @return mixed
	 */
	private static function getUpdate( $update_URI ): mixed {
		try {
			$request = wp_remote_get( $update_URI, [
				'timeout' => 10,
				'headers' => [
					'Accept' => 'application/json'
				]
			] );
			if (
				is_wp_error( $request )
				|| wp_remote_retrieve_response_code( $request ) !== 200
				|| empty( $request_body = wp_remote_retrieve_body( $request ) )
			) {
				return false;
			}

			$update = json_decode( $request_body, false );
			if ( ! is_array( $update->sections ) && is_object( $update->sections ) ) {
				$update->sections = (array) $update->sections;
			}

			return $update;
		} catch ( Throwable $e ) {
			return false;
		}
	}

	public static function enqueue_scripts() {
		wp_enqueue_script( 'wp-meteogram', plugins_url( 'static/js/meteogram.js', __FILE__ ), array(
			'jquery'
		) );
		wp_enqueue_style( 'wp-meteogram', plugins_url( 'static/css/default.css', __FILE__ ), array() );
	}

	public static function meteogram( $args = array() ) {
		$id                = "meteogram" . uniqid("", false);
		$args              = array_merge( $args, compact( 'id' ) );
		$type              = array_key_exists("type", $args) ? $args["type"] : null;
		$lat               = array_key_exists("lat", $args) ? $args["lat"] : null;
		$lon               = array_key_exists("lon", $args) ? $args["lon"] : null;
		ob_start();
		switch ( $type ) {
			case "at-side" :
				if ( class_exists( "EM_Events" ) ) {
					$events = EM_Events::get();
					/* @var $event EM_Event */
					foreach ( $events as $event ) {
						/* @var $location EM_Location */
						if ( $location = $event->get_location() ) {
							if ( $location->location_attributes ) {
								foreach ( $location->location_attributes as $key => $value ) {
									if ( $key === "Place yr.no" ) {
										$link                 = $value;
										$place                = $location->location_name;
										$closestTurnamentDate = date( 'j. n. Y', $event->start );
										$config               = [
											"lat" => $location->location_latitude,
											"lon" => $location->location_longitude
										];
										?>
                                        <div <?= "id='{$id}'" ?> class="meteogram at-side" <?= "data-config='" . json_encode( $config ) . "'" ?>>
                                            <div class="bg">
                                                <div class="symbol">
                                                    <img data-symbol/> <span data-temp/>
                                                </div>
                                                <div class="content">
                                                    <h3><?= $place ?></h3>
													<?php if ( $closestTurnamentDate ) { ?>
                                                        <div class="event">Tady hrajeme už <?= $closestTurnamentDate ?></div>
													<?php } ?>
                                                    <a <?= "href='{$link}'" ?> target="_blank"> <img class="logo" src="http://www.yr.no/assets/images/logo-yr-50.png"/> právě teď je tu takhle <img
                                                                draggable="false" class="emoji" alt="😉" src="https://s.w.org/images/core/emoji/2.2.1/svg/1f609.svg"/>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
										<?php
										break 2;
									}
								}
							}
						}
					}
				}
				break;
			case "inline" :
				$link = $args["link"];
				$linkTitle = $args["linktitle"];
				?>
                <div <?= "id='{$id}'" ?> class="meteogram inline">
                    <div class="symbol">
						<?= $link ? "<a href='{$link}' title='{$linkTitle}' class='link'>" : "" ?>
                        <img data-symbol/> <span data-temp/>
						<?= $link ? "</a>" : "" ?>
                    </div>
                </div>
				<?php
				break;
			default :
				if ( $lat && $lon ) {
					?>
                    <div <?= "id='{$id}'" ?> class="meteogram daily"></div>
					<?php
				}
				break;
		}
		?>
        <script type="text/javascript">
            jQuery(document).ready(function ($) {
                meteogram(<?= json_encode( $args ) ?>);
            });
        </script>
		<?php
		return ob_get_clean();
	}

}

add_action( 'plugins_loaded', array(
	'WP_Meteogram',
	'init'
), 100 );
