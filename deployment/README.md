# 🛡️ VPS Deployment - 100% Sichere Datenspeicherung

## Das Problem mit Replit Deployments

Replit Deployments sind **stateless** - bei jedem neuen Deployment wird ein frischer Container erstellt. Zur Laufzeit hochgeladene Dateien existieren nur im Development-Container und werden **NICHT** in das Production-Deployment übertragen.

**Resultat:** Alle hochgeladenen Bilder verschwinden bei jedem Deployment-Neustart.

## Die Lösung: Eigener VPS

Mit einem eigenen VPS haben Sie:
- ✅ **Permanente Datenspeicherung** (Dateien verschwinden NIE)
- ✅ **Vollständige Kontrolle** über Ihre Daten
- ✅ **Sehr günstig** (€1-3/Monat)
- ✅ **Automatische Backups**
- ✅ **SSL-Verschlüsselung**

## 📁 Dateien in diesem Verzeichnis

### `vps-setup.sh`
**Vollautomatisches Setup-Script für Ubuntu 22.04 LTS**
- Installiert Python 3.11, Flask, Nginx
- Konfiguriert SSL-Zertifikat (Let's Encrypt)
- Richtet Firewall ein
- Erstellt automatische Backups
- Installiert Service-Monitoring

**Verwendung:**
```bash
./vps-setup.sh images.meinedomain.de admin@meinedomain.de
```

### `migration-guide.md`
**Detaillierte Schritt-für-Schritt Anleitung**
- Komplette Migration von Replit zu VPS
- Screenshots und Beispiele
- Troubleshooting-Guide
- Wartungsanweisungen

### `quick-setup.txt`
**15-Minuten Schnellanleitung**
- Für erfahrene Benutzer
- Alle wichtigen Befehle auf einen Blick
- Checkliste zum Abhaken

## 🎯 Migration in 3 Schritten

### 1. Server bestellen (5 Minuten)
- **Hetzner:** CX11 für €3.29/Monat
- **IONOS:** S-1 für €1/Monat
- Ubuntu 22.04 LTS auswählen
- SSH-Key konfigurieren

### 2. DNS konfigurieren (2 Minuten)
```
Type: A
Name: images
Value: [Server-IP]
```

### 3. Setup ausführen (10 Minuten)
```bash
ssh root@[server-ip]
curl -O [replit-url]/deployment/vps-setup.sh
chmod +x vps-setup.sh
./vps-setup.sh images.meinedomain.de admin@meinedomain.de
```

## 💰 Kostenvergleich

| Platform | Monatlich | Features |
|----------|-----------|----------|
| **Replit Pro** | €7 | ❌ Datenverlust-Risiko |
| **Hetzner CX11** | €3.29 | ✅ Permanent Storage |
| **IONOS S-1** | €1 | ✅ Permanent Storage |

## 🔒 Sicherheitsfeatures

**Automatisch konfiguriert:**
- SSL/TLS Verschlüsselung (Let's Encrypt)
- UFW Firewall (nur SSH + HTTP/HTTPS)
- Automatische Security Updates
- Service-Monitoring alle 5 Minuten
- Tägliche Backups (30 Tage Aufbewahrung)

## 📊 Nach der Migration

**Ihre Image Storage wird:**
- Unter `https://images.meinedomain.de` erreichbar sein
- 100% zuverlässig funktionieren (keine Datenverluste)
- Für externe Verlinkung optimiert sein
- Automatisch überwacht und gesichert werden

**Bestehende URLs können gleich bleiben:**
```
Alt: https://replit-url/images/folder/image.jpg
Neu: https://images.meinedomain.de/images/folder/image.jpg
```

## 🛠️ Wartung

**Automatisch:**
- Service-Restarts bei Problemen
- SSL-Zertifikat-Erneuerung
- Backups und Log-Rotation
- Security Updates

**Manuell (monatlich):**
```bash
apt update && apt upgrade -y
```

## 📞 Support

**Service-Status prüfen:**
```bash
systemctl status image-storage nginx
```

**Logs anzeigen:**
```bash
journalctl -u image-storage -f
```

**Backup erstellen:**
```bash
/usr/local/bin/backup-images.sh
```

---

**Diese Migration löst das Datenverlust-Problem zu 100% und kostet weniger als Replit Pro!**