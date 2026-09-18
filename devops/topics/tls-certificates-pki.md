# Deep Dive: TLS, Certificates & PKI — HTTPS Ke Andar Ka Jadoo

> **Kaha ka hai:** Day 5 (networking) + Day 26/49 (security). Internet pe **encrypted kya se guarantee hoti** — TLS certificate + PKI se. mTLS (Istio), Let's Encrypt, kubectl certificate, sb. Ye concept bina samjhe senior DevOps nahi bante.

---

## 1. Problem: Internet = Public Highway

Bina encryption ke:
- Data open (man-in-the-middle padhe)
- Fake server impersonate kar sake
- Tamper ho sakta hai

**TLS (Transport Layer Security)** — HTTPS ka S — teen guarantees:
1. **Confidentiality** — encryption
2. **Integrity** — tamper detect
3. **Authentication** — server prove karta `main hu` via certificate

---

## 2. Asymmetric Cryptography — 3 Chhote La, 1 Bada

- **Private key (`key.pem`)** — sirf owner ke paas (secret)
- **Public key (`cert.pem`)** — duniya ko di ja sakti hai
- Ek se encrypt → doosre se decrypt

```
Alice certificate public se encrypt → Bob private se decrypt  (data)
Bob private se sign → Alice public se verify (signature)
```

**Use:** TLS me public cert encrypt channel; private sign. `openssl` se demo:

```bash
# generate keypair
openssl genrsa -out key.pem 2048
openssl rsa -in key.pem -pubout -out pub.pem
```

---

## 3. Certificate = Public Key + Identity Ka "ID card"

Certificate me:
- Subject (domain/org)
- Public key
- Issuer (kaunne sign kiya)
- Validity (notBefore/notAfter)
- **Signature** (issuer private se)

```bash
# Kisi site ka cert dekho
echo | openssl s_client -connect google.com:443 -servername google.com 2>/dev/null | openssl x509 -noout -text
# fields: Issuer, Subject, Subject Alternative Name, Validity
```

**SAN (Subject Alternative Name)** — domains list; modern browsers **SAN hi maante hain** (CN ignore hota).

---

## 4. Chain of Trust — CA (Certificate Authority)

```
Root CA (browser ke paas trusted) 
   └── signs → Intermediate CA
          └── signs → example.com cert (leaf)
```

Browser **pre-installed root trusts** me chain verify karta hai.

**Self-signed?** = Chain root par nahi (browser 404 `NET::ERR_CERT_AUTHORITY_INVALID`). Dev ke liye chalta (trust manually), **production me nahi**.

**Trusted CA options:** Let's Encrypt (free), ZeroSSL, DigiCert, GlobalSign, Sectigo.

---

## 5. TLS Handshake — 2 RTT Ka Highway

```
1. Client: ClientHello (TLS 1.3, cipher list, SNI hostname)
2. Server: ServerHello + Certificate (incl chain)
3. Client: verifies chain + checks expiry/hostname; exchanges keys -> session keys
4. Aage: encrypted symmetric communication (fast)
```

```bash
# Handshake detect + cipher + timing
echo | openssl s_client -connect example.com:443 -servername example.com -brief 2>/dev/null
```

**Practically:**
- Cert expiry check karo — **sabse common prod incident = cert expire**
- TLS 1.3 = faster (1 RTT), modern default
- Cipher suites — `TLS_AES_128_GCM_SHA256` (TLS1.3) hi allow karo

---

## 6. Certificates Kab Kahan Use Hote Hain — DevSecOps View

| Jagah | Kya | Sign/Managed |
|-------|-----|--------------|
| Public site | let's encrypt / CDN cert | Automated (LetsEncrypt ACME) |
| Internal service | k8s-mesh | Istio auto mTLS |
| kubectl | kubeconfig client cert | Cluster CA |
| Container registry | docker login TLS | Registry |
| Azure Key Vault | Central store | Auto-rotate |

**Certificate lifecycle:**
```
enroll → install → monitor expiry (alert!) → renew → rotate
```

**Never:**
- Cert me secrets
- Expiry manual calendar se (alert automated: `openssl`/cert-manager)
- `verify=false`/`-k` production mai

---

## 7. mTLS — Mutual TLS (Service Mesh Backbone)

Normal TLS: client **verifies** server. mTLS: **dono** verify (client ka cert bhi server check kare).

```
Service A ⇆ mTLS ⇆ Service B
(sidecar certs)   (identity = pod/serviceaccount)
```

- Identity-based security (IP nahi, cert=identity)
- Bina mTLS ke: network ko trust karna padta — internal me impersonation risk
- Istio/Linkerd: auto-mTLS + rotation (detail: [Service Mesh](../topics/service-mesh-explained.md))

---

## 8. Automation — Let's Encrypt / cert-manager / Azure

**Local demo (openssl/locally):**
```bash
# Self-signed (testing):
openssl req -x509 -newkey rsa:2048 -nodes -days 90 \
  -keyout key.pem -out cert.pem -subj "/CN=localhost"

# Combine for nginx:
cat cert.pem key.pem > bundle.pem
```

**K8s cert-manager (production pattern):**
```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata: { name: app-tls }
spec:
  secretName: app-tls-secret
  dnsNames: [app.example.com]
  issuerRef: { name: letsencrypt-prod, kind: ClusterIssuer }
```

```bash
az keyvault certificate create --vault-name devclo-kv --policy ... 
# cloud CA/env: auto-expiry alert + auto-rotate
```

---

## 9. Real-World Scenarios & Fixes

| Scenario | Problem | Fix |
|----------|---------|-----|
| **"Your connection is not private"** | Expired/untrusted/mismatch | Check expiry (`openssl x509 -enddate`), hostname/SAN, chain |
| **Cert valid but handshake fails** | missing intermediate/chain | Send full chain; `openssl s_client -showcerts` verify |
| **Multi-domain cert restore pe salah** | One leaf cert se | SAN cert me saare dnsNames; wildcard `*.example.com` |
| **kubectl cert error "x509"** | kubeconfig expired/often rotated | rotate cluster CA; `kubectl config get-contexts` |
| **mTLS broken pod-to-pod** | Client cert mismatch | Istio: peer certificate rotation/validity; serviceaccount identity |
| **Browser rejects but curl works** | Browser = strict SAN/chain | Use SAN leaf, full chain, valid issuer |
| **Internal API self-signed** | app requests ke liye | Add to trust store (JAVA cacerts), NOT `-k` skips |

**Quick expiry check script:**
```bash
DOMAIN=app.example.com
echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null \
  | openssl x509 -noout -enddate
```

---

## 10. Interview Questions — TLS & PKI

| Question | Strong Answer |
|----------|---------------|
| "TLS kya guarantee deta?" | Confidentiality (encryption), integrity (no tamper), authentication (identity via cert/CA). |
| "How trust works?" | Chain: client → intermediate → root CA; root in browser/system trust store; verify chain + expiry + hostname/SAN. |
| "Self-signed kab ok?" | Internal testing; production = trusted CA ya internal CA (auto-rotate). Never `-k` bypass in prod. |
| "mTLS vs TLS?" | mTLS = both sides verify; identity = cert not IP. Service mesh default. |
| "Cert kab banaenge?" | Registration: freshness; CI: verify + expiry alert; rotation before expiry (renew in advance). |
| "`-k` kyun harmful?" | Disables cert verify → man-in-the-middle possible. Only debugging local. |
| "SNI kya?" | Client hello me hostname — server ek IP pe multiple certs serve karta. |
| "Chain send karna kyun zaroori?" | Server full chain bhejta; intermediate missing = client trust chain break. |

---

## 11. Hands-On Lab

```bash
# 1. Web server + self-signed TLS banavo
mkdir -p ~/tlslab && cd ~/tlslab
openssl req -x509 -newkey rsa:2048 -nodes -days 30 \
  -keyout key.pem -out cert.pem -subj "/CN=localhost"
ls -la key.pem cert.pem

# 2. Python quick server with TLS
cat > srv.py <<'EOF'
import http.server, ssl
httpd = http.server.HTTPServer(("localhost",8443), http.server.SimpleHTTPRequestHandler)
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain("cert.pem","key.pem")
httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)
print("https://localhost:8443")
httpd.serve_forever()
EOF
python3 srv.py & sleep 1

# 3. curl verify true (reject self-signed)
curl -s https://localhost:8443/ && echo "NO — should fail"
curl -k -s https://localhost:8443/ | head -1   # -k = skip verify (dev only!)

# 4. Certificate details
echo | openssl s_client -connect localhost:8443 2>/dev/null | openssl x509 -noout -subject -issuer -dates
kill %1

# 5. Public site ka chain
openssl s_client -showcerts -connect example.com:443 -servername example.com < /dev/null 2>/dev/null | grep -cE "BEGIN CERTIFICATE"   # 3 = full chain
```

---

## 12. Summary | Yaad Rakho

1. TLS = encrypt + integrity + identity (CA-verified)
2. Chain = leaf → intermediate → **root (trust store)**
3. Cert = SAN domains + issuer + validity — expiry sabse common incident
4. Handshake → symmetric session (fast)
5. mTLS = dono side verify (mesh/zero-trust)
6. Automation: cert-manager / Let's Encrypt / Key Vault auto-rotate
7. Kabhi `-k`/`verify=false` production mai
8. Full chain bhejo; SAN use karo; expiry alerts automated

---
**Related:** [Day 5](../day-05-networking-fundamentals.md) · [Service Mesh](../topics/service-mesh-explained.md) · [HTTP & REST](../topics/http-rest-api-fundamentals.md) · [Cloud Security](../topics/cloud-network-security.md) · [Secret Management](../topics/secret-management.md)