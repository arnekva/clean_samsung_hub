#!/usr/bin/env bash
# Package Clean Hub with your Samsung certificate profile and install it on the TV.
#
#   TV_HOST=192.168.1.50 CERT_PROFILE=myprofile scripts/install.sh
#
# Needs the Tizen CLI (~/tizen-studio), Developer Mode on the TV with this
# computer's IP as Host PC IP, and a Samsung TV certificate profile that
# includes the TV's DUID. See README.md.
set -euo pipefail

: "${TV_HOST:?Set TV_HOST to the IP address of the TV}"
: "${CERT_PROFILE:?Set CERT_PROFILE to your Samsung certificate profile name}"
TIZEN_HOME="${TIZEN_HOME:-$HOME/tizen-studio}"
TIZEN="$TIZEN_HOME/tools/ide/bin/tizen"
SDB="$TIZEN_HOME/tools/sdb"
TARGET="$TV_HOST:26101"
APP_ID="CleanSHub1.Dashboard"

[ -x "$TIZEN" ] || { echo "Tizen CLI not found at $TIZEN (set TIZEN_HOME)" >&2; exit 1; }

repo="$(cd "$(dirname "$0")/.." && pwd)"
# The Tizen CLI fails on paths with spaces, so build in a temporary folder.
build="$(mktemp -d /tmp/cleanhub.XXXXXX)"
trap 'rm -rf "$build"' EXIT
cp -R "$repo/app/." "$build/"

echo "Connecting to $TARGET"
"$SDB" connect "$TARGET" >/dev/null
"$SDB" devices | grep -q "^$TARGET" || {
    echo "Could not connect. Is Developer Mode on, with this computer's IP as Host PC IP?" >&2
    exit 1
}

echo "Packaging with certificate profile '$CERT_PROFILE'"
(cd "$build" && "$TIZEN" package -t wgt -s "$CERT_PROFILE" -- "$build" >/dev/null)
wgt="$(ls "$build"/*.wgt)"
# Package file names with spaces fail to install.
mv "$wgt" "$build/CleanHub.wgt"

echo "Installing"
(cd "$build" && "$TIZEN" install -n CleanHub.wgt -s "$TARGET")

echo "Starting Clean Hub"
"$TIZEN" run -p "$APP_ID" -s "$TARGET" >/dev/null
echo "Done."
