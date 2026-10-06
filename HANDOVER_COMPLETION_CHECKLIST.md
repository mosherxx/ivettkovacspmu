# Final hosting handover checklist

The source, deployment guide, troubleshooting guide, and an encrypted database snapshot are in this private repository. The snapshot is **not** the final cutover backup: bookings may have changed since it was made on 6 October 2026.

## Owner: grant access and agree on responsibility

- [ ] Invite the hosting company to Cloudflare for DNS, Tunnel, and redirect management. Keep owner and recovery access. The host should create a new tunnel token for its server; do not put the current token in GitHub.
- [ ] Arrange Websupport access for `ivettkovacspmu.hu` and `ivettkovacspmu.com`. Confirm renewal, billing, registrant details, and nameserver control. Websupport has no website runtime token.
- [ ] Give the host Resend access, or agree that it will use its own Resend account and verify the sending domain. Agree who will handle mail delivery failures.
- [ ] Transfer the website admin login through a password manager. Agree who controls the admin recovery inbox. Keep your own emergency recovery route.
- [ ] Provide the encrypted backup's decryption key through a separate private channel. The key is local at `handover-package/BACKUP_DECRYPTION_KEY.txt`; it is not in GitHub.
- [ ] Agree on a maintenance window, rollback window, on-call contact, ownership of credentials, and who may approve DNS changes.

## Hosting company: prepare the new service

- [ ] Review [HOSTING_HANDOVER.md](HOSTING_HANDOVER.md), [HOSTING_ACCESS_TRANSFER.md](HOSTING_ACCESS_TRANSFER.md), [HOSTING_TROUBLESHOOTING.md](HOSTING_TROUBLESHOOTING.md), and [GITHUB_HANDOVER.md](GITHUB_HANDOVER.md).
- [ ] Provision the server and Docker, then deploy a reviewed source commit. Create a private `.env` from [provider.env.template](provider.env.template) using provider-managed credentials and `PUBLIC_ORIGIN=https://www.ivettkovacspmu.hu`.
- [ ] Create a new Cloudflare tunnel in the owner's account. For a containerized tunnel, its service URL is `http://web:3000`. Preserve all existing email DNS records.
- [ ] Decrypt the sample backup, verify its checksum, and perform a restore drill on a disposable volume. Confirm reservations, settings, admin access, and uploaded images. Do not publish a blank database with the one-time default admin login.
- [ ] Configure automatic startup, external uptime checks, disk and backup monitoring, encrypted off-host backups, retention, and a tested restore procedure. Name the person to contact when an alert fires.

## Cutover and acceptance

1. Stop new bookings on the laptop before the final snapshot. Run `scripts/backup-windows.ps1`, then keep the old service from receiving new writes. Transfer the **new final backup** and checksum securely; the GitHub snapshot alone can miss newer reservations.
2. Restore the final backup on the new server. Compare reservation counts and recent entries with the old server. Keep the old volume and backup for the agreed rollback window.
3. Test the new site before switching public traffic: homepage, admin, images, availability, one controlled booking, its immediate receipt, and admin confirmation or rejection mail. Test both Hungarian and English booking emails and inspect Resend events if delivery is uncertain.
4. Switch the Cloudflare route to the new tunnel. Verify public HTTPS and `GET /api/catalog` returns JSON. Check the desired redirects from the bare `.hu` name and both `.com` names without disturbing mail DNS.
5. Owner and host sign off on the result. Retire the old laptop tunnel, revoke old tunnel/Resend keys and shared passwords, and document the deployed commit, final backup, monitoring, and support contacts.

The step-by-step recovery procedures are in [HOSTING_TROUBLESHOOTING.md](HOSTING_TROUBLESHOOTING.md). Never commit `.env`, admin passwords, the decryption key, or an unencrypted customer database backup.
