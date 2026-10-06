# Downloading the handover from private GitHub

The hosting company already has access to this private repository. The `handover-delivery/` folder contains a source snapshot, an encrypted data backup, checksums, and a manifest. The normal repository files are the current source; the snapshot ZIP is provided only for a single downloadable bundle. Start with `HOSTING_HANDOVER.md`, `HOSTING_ACCESS_TRANSFER.md`, and `HOSTING_TROUBLESHOOTING.md`.

## Get the files

Clone the private repository or download it as ZIP from GitHub while signed into the authorized account. Find `handover-delivery/`. Verify its SHA-256 checksums against `handover-delivery/MANIFEST.txt` after download. The data backup is a snapshot made on 2026-10-06; the owner must take and transfer a **new final backup during cutover** to include later reservations.

## Decrypt the data backup

The owner holds the key in a local file named `BACKUP_DECRYPTION_KEY.txt` in `handover-package/`. This key is **not in GitHub**. Request it via a password manager or another private channel. On a machine with Node.js 22 or newer, from the repository directory:

```sh
node scripts/handover-crypto.mjs decrypt \
  handover-delivery/ivett-data-20261006-130729-4e7009c7.tar.gz.aes \
  /secure/location/ivett-data-20261006-130729-4e7009c7.tar.gz \
  /secure/location/BACKUP_DECRYPTION_KEY.txt
sha256sum /secure/location/ivett-data-20261006-130729-4e7009c7.tar.gz
```

Compare the decrypted archive hash with `DECRYPTED_BACKUP_SHA256` in `handover-delivery/MANIFEST.txt`. Keep the key and decrypted backup restricted to the operators who need them, and remove temporary copies after the migration. The app's `.env`, admin password, Cloudflare account access, and Websupport account access are not in GitHub. Create a new `.env` from `provider.env.template` as explained in `HOSTING_ACCESS_TRANSFER.md`.
