#!/bin/bash
set -e

DIST="dist"
ZIP_NAME="inflearn-subtitle-downloader.zip"

rm -rf "$DIST"
mkdir -p "$DIST/icons"

if ! command -v terser &> /dev/null; then
  echo "terser 설치 중..."
  npm install -g terser
fi

terser content-interceptor.js -o "$DIST/content-interceptor.js" --compress --mangle
terser content-ui.js -o "$DIST/content-ui.js" --compress --mangle

cp manifest.json "$DIST/"
cp icons/icon16.png icons/icon32.png icons/icon48.png icons/icon128.png "$DIST/icons/"

rm -f "$ZIP_NAME"
cd "$DIST" && zip -r "../$ZIP_NAME" . && cd ..

echo "완료: $ZIP_NAME ($(du -h "$ZIP_NAME" | cut -f1))"
