#!/bin/sh
# Start the local Supabase stack, working with both Docker and rootless Podman.
set -eu

cd "$(dirname "$0")/.."

# No DOCKER_HOST and no Docker socket: fall back to the user's Podman socket.
if [ -z "${DOCKER_HOST:-}" ] && [ ! -S /var/run/docker.sock ]; then
  podman_sock="/run/user/$(id -u)/podman/podman.sock"
  if [ ! -S "$podman_sock" ] && command -v systemctl >/dev/null 2>&1; then
    systemctl --user start podman.socket || true
  fi
  if [ ! -S "$podman_sock" ]; then
    echo "No Docker or Podman socket found. Start Docker, or run: systemctl --user enable --now podman.socket" >&2
    exit 1
  fi
  export DOCKER_HOST="unix://$podman_sock"
fi

# Podman needs these bind-mount dirs to exist; git does not keep empty directories.
mkdir -p supabase/snippets supabase/functions

# Analytics/helper services need a real Docker socket; login does not use them.
exec supabase start -x vector,logflare,edge-runtime,imgproxy "$@"
