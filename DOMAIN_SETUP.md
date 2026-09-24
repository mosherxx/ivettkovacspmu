# Domains and GitHub Pages

Repository: https://github.com/mosherxx/ivettkovacspmu
Primary address: https://www.ivettkovacspmu.hu
Secondary address: https://www.ivettkovacspmu.com (redirect to the primary address).

In the repository's Settings → Pages, select GitHub Actions as the source. Set the custom domain to `www.ivettkovacspmu.hu` before pointing DNS at GitHub. The supplied workflow publishes the brochure on pushes to main and can also be run manually. Enable Enforce HTTPS once the certificate is ready.

At the DNS provider for ivettkovacspmu.hu, configure:

| Type | Name | Value |
| --- | --- | --- |
| CNAME | www | mosherxx.github.io |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

Replace conflicting website records only; retain email and verification records. With both hostnames configured, GitHub redirects the bare .hu domain to www. A custom Actions workflow uses the domain configured in Pages settings; no CNAME file is required.

Configure a permanent HTTP 301 redirect for both `ivettkovacspmu.com` and `www.ivettkovacspmu.com` to `https://www.ivettkovacspmu.hu`, using a registrar forwarding service that supports HTTPS, or a separate redirect host. DNS alone does not perform an HTTP redirect. Exact controls depend on the domain provider. Domain changes have not been applied by this document.

The Pages version has services, prices, photos, FAQ and contact details. Online reservations and admin editing run only in the full Sites/Docker version. See SELF_HOSTING.md.

Source: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
