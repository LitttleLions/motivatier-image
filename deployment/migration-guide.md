# 🚀 VPS Migration Guide - Image Storage Service

## Schritt-für-Schritt Anleitung für Hetzner/IONOS

### ✅ Voraussetzungen prüfen

**Was Sie brauchen:**
- [ ] VPS bei Hetzner oder IONOS (mindestens 1GB RAM, 10GB Disk)
- [ ] Ubuntu 22.04 LTS installiert
- [ ] Root-Zugang per SSH
- [ ] Domain oder Subdomain (z.B. `images.meinedomain.de`)

### 🏗️ Schritt 1: Server vorbereiten (5 Minuten)

**Bei Hetzner:**
1. Cloud Console öffnen: `console.hetzner.cloud`
2. "Server erstellen" → Ubuntu 22.04 LTS auswählen
3. Kleinste Größe: CX11 (€3.29/Monat)
4. SSH-Key hochladen oder erstellen lassen
5. Server-IP notieren (z.B. `95.217.123.45`)

**Bei IONOS:**
1. Cloud Panel öffnen: `cloud.ionos.de`
2. "Server erstellen" → Ubuntu 22.04 auswählen
3. S-1 (€1/Monat) oder M-1 (€4/Monat)
4. SSH-Key konfigurieren
5. Server-IP notieren

### 🌐 Schritt 2: Domain konfigurieren (2 Minuten)

**DNS-Einstellungen bei Ihrem Domain-Provider:**
```
Type: A
Name: images (oder gewünschter Subdomain-Name)
Value: [Server-IP]
TTL: 300
```

**Beispiel:**
- Domain: `meinedomain.de`
- Subdomain: `images.meinedomain.de`
- Server-IP: `95.217.123.45`

### 📡 Schritt 3: SSH-Verbindung testen

**Windows (CMD/PowerShell):**
```bash
ssh root@[SERVER-IP]
```

**Mac/Linux Terminal:**
```bash
ssh root@[SERVER-IP]
```

**Bei erfolgreichem Login:**
```
Welcome to Ubuntu 22.04.x LTS
```

### 🔧 Schritt 4: Setup-Script ausführen (10 Minuten)

**1. Script herunterladen:**
```bash
curl -O https://[ihre-replit-url]/deployment/vps-setup.sh
chmod +x vps-setup.sh
```

**2. Setup starten:**
```bash
./vps-setup.sh images.meinedomain.de admin@meinedomain.de
```

**Das Script installiert automatisch:**
- ✅ Python 3.11 + alle Pakete
- ✅ Nginx Webserver  
- ✅ SSL-Zertifikat (Let's Encrypt)
- ✅ Firewall-Konfiguration
- ✅ Automatische Backups
- ✅ Service-Monitoring

### 📊 Schritt 5: Installation überwachen

**Während der Installation sehen Sie:**
```
🚀 Image Storage Service - VPS Setup wird gestartet...
[2025-07-03 10:30:15] System wird aktualisiert...
[2025-07-03 10:30:45] Installiere erforderliche Pakete...
[2025-07-03 10:31:20] Erstelle Python Virtual Environment...
[2025-07-03 10:31:50] Erstelle SSL-Zertifikat...
```

**Bei erfolgreichem Abschluss:**
```
🎉 Setup erfolgreich abgeschlossen!
✅ Image Storage Service ist bereit!
🌐 Website: https://images.meinedomain.de
```

### 🔍 Schritt 6: Funktionstest

**1. Website aufrufen:**
```
https://images.meinedomain.de
```

**2. Upload testen:**
- Ein Bild hochladen
- URL kopieren
- Bild in externem Browser/Website testen

**3. Service-Status prüfen:**
```bash
systemctl status image-storage
systemctl status nginx
```

### 📦 Schritt 7: Daten von Replit migrieren

**Existing Images übertragen:**
```bash
# Auf dem Server:
cd /var/www/imgsvc
mkdir -p images/backup-replit

# Replit-Images per SCP übertragen (von lokalem Computer):
scp -r [local-path-to-replit-images]/* root@[server-ip]:/var/www/imgsvc/images/

# Berechtigungen korrigieren:
chown -R imgsvc:imgsvc /var/www/imgsvc/images
```

### 🛠️ Wartung & Monitoring

**Nützliche Befehle:**

```bash
# Service neu starten
systemctl restart image-storage

# Logs anzeigen
journalctl -u image-storage -f

# Backup erstellen
/usr/local/bin/backup-images.sh

# Disk-Space prüfen
df -h

# Service-Status
systemctl status image-storage nginx
```

**Automatische Features:**
- 🔄 Service-Monitoring alle 5 Minuten
- 💾 Tägliche Backups um 02:00 Uhr
- 🔒 Automatische SSL-Erneuerung
- 🛡️ Firewall aktiv (nur SSH + HTTP/HTTPS)

### ⚠️ Troubleshooting

**Problem: Website nicht erreichbar**
```bash
# DNS prüfen
nslookup images.meinedomain.de

# Nginx-Status
systemctl status nginx
nginx -t

# Firewall prüfen
ufw status
```

**Problem: SSL-Fehler**
```bash
# SSL-Zertifikat erneuern
certbot renew --dry-run
```

**Problem: Service läuft nicht**
```bash
# Logs prüfen
journalctl -u image-storage -n 50

# Service neu starten
systemctl restart image-storage
```

### 💰 Kosten-Übersicht

**Hetzner CX11:**
- Server: €3.29/Monat
- Traffic: 20TB included
- **Gesamt: €3.29/Monat**

**IONOS S-1:**
- Server: €1/Monat
- Traffic: unlimited
- **Gesamt: €1/Monat**

**Zusätzliche Kosten:**
- Domain: ca. €10/Jahr
- **Jährliche Gesamtkosten: €12-50**

### 🎯 Nach der Migration

**Vorteile:**
✅ **100% permanente Datenspeicherung**
✅ **Eigene Server-Kontrolle**
✅ **Sehr günstig (€1-3/Monat)**
✅ **Automatische Backups**
✅ **SSL-Verschlüsselung**
✅ **Unbegrenzter Traffic**

**Ihre Images sind jetzt:**
- Permanent gespeichert (verschwinden NIE)
- Über https://images.meinedomain.de erreichbar
- Für externe Verlinkung optimiert
- Automatisch gesichert

### 📞 Support

**Bei Problemen:**
1. Logs prüfen: `journalctl -u image-storage -f`
2. Service neu starten: `systemctl restart image-storage nginx`
3. DNS-Propagation prüfen (kann bis 24h dauern)

**Server-Management:**
- Monatliche Updates: `apt update && apt upgrade`
- Backup-Monitoring: `/var/backups/imgsvc/`
- Log-Rotation: automatisch konfiguriert