<?php
/**
 * The MIT License
 *
 * Copyright 2016 ismitka.
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
 */
$dir = getcwd() . "/data";
if (! is_dir($dir)) {
    mkdir($dir);
}
$dataFile = "{$dir}/data.json";

$dataRequest = $_REQUEST["lat"] . "/" . $_REQUEST["lon"];
$hash = md5($dataRequest);
$resultFile = "{$dir}/{$hash}.json";

$data = [];
if (file_exists($dataFile)) {
    $data = json_decode(file_get_contents($dataFile), true);
    if ($data[$hash] && file_exists($resultFile)) {
        if ($data[$hash] > (time() - (60 * 15))) { // cache for 15min
            print file_get_contents($resultFile);
            die();
        }
    }
}

$opts = [
    "http" => [
        "method" => "GET",
        'header' => "Accept-language: en\r\n" . // check function.stream-context-create on php.net
        "User-Agent: Mozilla/5.0 (iPad; U; CPU OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.10 (KHTML, like Gecko) Version/4.0.4 Mobile/7B334b Safari/531.21.102011-10-16 20:23:10\r\n"]];
$context = stream_context_create($opts);

if ($json = file_get_contents("https://api.met.no/weatherapi/locationforecast/2.0/complete?lat={$_REQUEST ["lat"]}&lon={$_REQUEST ["lon"]}", false, $context)) {
    file_put_contents($resultFile, $json);
    $data[$hash] = time();
    file_put_contents($dataFile, json_encode($data));
    print $json;
    die();
}


