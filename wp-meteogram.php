<?php
/*
 * Plugin Name: Meteogram
 * Plugin URI: http://www.smitka.net/meteogram
 * Description: Show forecast of given place at given day
 * Version: 3.2
 * Author: Ivan Smitka
 * Author URI: http://www.smitka.net
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

    public static function init() {
        // Scripts
        if (! is_admin()) { // show only in public area
            add_action('wp_enqueue_scripts', array(
                'WP_Meteogram',
                'enqueue_scripts'));
            // shortcodes
            add_shortcode('meteogram', array(
                'WP_Meteogram',
                'meteogram'));
        }
    }

    public static function enqueue_scripts() {
        wp_enqueue_script('wp-meteogram', plugins_url('static/js/meteogram.js', __FILE__), array(
            'jquery'));
        wp_enqueue_style('wp-meteogram', plugins_url('static/css/default.css', __FILE__), array());
    }

    public static function meteogram($args = array()) {
        $id = "meteogram" . uniqid();
        $args = array_merge($args, array(
            "id" => $id));
        $type = $args["type"];
        $lat = $args["lat"];
        $lon = $args["lon"];
        ob_start();
        switch ($type) {
            case "at-side" :
                if (class_exists("EM_Events")) {
                    $events = EM_Events::get();
                    /* @var $event EM_Event */
                    foreach ($events as $event) {
                        /* @var $location EM_Location */
                        if ($location = $event->get_location()) {
                            if ($location->location_attributes) {
                                foreach ($location->location_attributes as $key => $value) {
                                    if ($key === "Place yr.no") {
                                        $link = $value;
                                        $place = $location->location_name;
                                        $closestTurnamentDate = date('j. n. Y', $event->start);
                                        $config = [
                                            "lat" => $location->location_latitude,
                                            "lon" => $location->location_longitude];
                                        ?>
<div <?= "id='{$id}'" ?> class="meteogram at-side" <?= "data-config='" . json_encode($config) . "'" ?>>
    <div class="bg">
        <div class="symbol">
            <img data-symbol /> <span data-temp />
        </div>
        <div class="content">
            <h3><?= $place ?></h3>
			<?php if($closestTurnamentDate) { ?>
            <div class="event">Tady hrajeme už <?= $closestTurnamentDate ?></div>
            <?php } ?>
			<a <?= "href='{$link}'" ?> target="_blank"> <img class="logo" src="http://www.yr.no/assets/images/logo-yr-50.png" /> právě teď je tu takhle <img
                draggable="false" class="emoji" alt="😉" src="https://s.w.org/images/core/emoji/2.2.1/svg/1f609.svg" />
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
        <img data-symbol /> <span data-temp />
        <?= $link ? "</a>" : "" ?>
    </div>
</div>
<?php
                break;
            default :
                if ($lat && $lon) {
                    ?>
<div <?= "id='{$id}'" ?> class="meteogram daily"></div>
<?php
                }
                break;
        }
        ?>
<script src="https://browser.sentry-cdn.com/5.15.4/bundle.min.js" integrity="sha384-Nrg+xiw+qRl3grVrxJtWazjeZmUwoSt0FAVsbthlJ5OMpx0G08bqIq3b/v0hPjhB"
    crossorigin="anonymous"></script>
<script type="text/javascript">
jQuery(document).ready(function($) {
    Sentry.init({ dsn: 'https://2fea5fce4b5a49f6b4c8c749361c73e0@sentry.stimulus.com.au/23' });
    meteogram( <?= json_encode($args) ?> );
});
</script>
<?php
        return ob_get_clean();
    }

}
add_action('plugins_loaded', array(
    'WP_Meteogram',
    'init'), 100);
