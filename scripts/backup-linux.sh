#!/usr/bin/env bash
set -Eeuo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
backup_dir="${BACKUP_DIR:-$project_dir/backups}"
retention_days="${RETENTION_DAYS:-14}"
mkdir -p "$backup_dir"
backup_dir="$(cd "$backup_dir" && pwd)"
name="ivett-data-$(date +%Y%m%d-%H%M%S)-$(od -An -N4 -tx1 /dev/urandom | tr -d ' \n').tar.gz"
partial="$backup_dir/$name.part"
archive="$backup_dir/$name"
compose=(docker compose -p ivett -f "$project_dir/compose.yaml")
was_running=false
if "${compose[@]}" ps --status running --services | grep -qx web; then was_running=true; fi
cleanup() {
  if [[ "$was_running" == true ]]; then "${compose[@]}" start web; fi
  rm -f -- "$partial"
}
trap cleanup EXIT
if [[ "$was_running" == true ]]; then "${compose[@]}" stop web; fi
"${compose[@]}" run --rm --no-deps -T -v "$backup_dir:/backup" --entrypoint sh web -c "tar -czf /backup/$name.part -C /data ."
tar -tzf "$partial" >/dev/null
mv -- "$partial" "$archive"
(cd "$backup_dir" && sha256sum "$name" >"$name.sha256")
echo "Verified backup: $archive"
find "$backup_dir" -maxdepth 1 -type f -name 'ivett-data-*.tar.gz' -mtime +"$retention_days" -print0 |
  while IFS= read -r -d '' old; do rm -f -- "$old" "$old.sha256"; done
