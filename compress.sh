#!/bin/bash
sass scss/default.scss static/css/default.css
VERSION=$(git tag -l)
echo "${VERSION}"
sed -i -E "s/^ \* Version\: .*$/ * Version: ${VERSION}/g" wp-meteogram.php
(cd ../ && zip -r wp-meteogram/${VERSION}.zip \
  wp-meteogram/proxy.php \
  wp-meteogram/wp-meteogram.php \
  wp-meteogram/LICENSE \
  wp-meteogram/README.md \
  wp-meteogram/static)