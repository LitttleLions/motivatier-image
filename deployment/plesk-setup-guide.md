
# 🔧 Plesk Setup-Anleitung für Image Storage Service

## Voraussetzungen
- ✅ IONOS Plesk-Server
- ✅ Python 3.9+ verfügbar
- ✅ SSH-Zugang (optional)
- ✅ Domain oder Subdomain konfiguriert

## 🚀 Installation via GitHub

### Schritt 1: Plesk Git-Integration aktivieren

1. **Plesk Panel öffnen**
   - Login: https://ihre-domain.de:8443
   - Oder: https://server-ip:8443

2. **Git-Repository hinzufügen**
   - Website auswählen
   - "Git" → "Repository hinzufügen"
   - Repository URL: `https://github.com/ihr-username/image-storage-service.git`
   - Branch: `main`
   - Deployment-Pfad: `httpdocs/image-storage`

3. **Auto-Deploy aktivieren**
   - ✅ "Automatisches Deployment aktivieren"
   - ✅ "Pull bei Push-Events"

### Schritt 2: Python-App konfigurieren

1. **Python-App erstellen**
   - "Websites & Domains" → Domain auswählen
   - "Python" → "Python-App erstellen"
   - Python-Version: 3.9+
   - App-Pfad: `/httpdocs/image-storage`
   - App-URL: `/images` oder `/`

2. **Startup-Datei setzen**
   - Startup-Datei: `passenger_wsgi.py`
   - Application Entry Point: `application`

### Schritt 3: Abhängigkeiten installieren

**Via Plesk Interface:**
```bash
# Im App-Verzeichnis
pip install -r deployment/plesk-requirements.txt
```

**Oder via SSH:**
```bash
cd /var/www/vhosts/ihre-domain.de/httpdocs/image-storage
source bin/activate
pip install -r deployment/plesk-requirements.txt
```

### Schritt 4: Environment konfigurieren

1. **Environment-Datei erstellen**
   ```bash
   cp deployment/plesk-env .env
   ```

2. **.env anpassen**
   ```bash
   DOMAIN=ihre-domain.de
   SESSION_SECRET=IHR_SICHERER_64_ZEICHEN_SCHLUESSEL
   ```

3. **Verzeichnisse erstellen**
   ```bash
   mkdir -p httpdocs/images
   mkdir -p logs
   chmod 755 httpdocs/images
   chmod 755 logs
   ```

### Schritt 5: SSL aktivieren

1. **Let's Encrypt aktivieren**
   - Plesk → "SSL/TLS-Zertifikate"
   - "Let's Encrypt" auswählen
   - Domain eingeben
   - "Kostenloses Zertifikat beziehen"

2. **HTTPS-Umleitung aktivieren**
   - ✅ "HTTP auf HTTPS umleiten"

## 🔄 Deployment-Workflow

### Automatisches Update
```bash
# Lokale Entwicklung (Replit)
git add .
git commit -m "Update: neue Features"
git push origin main

# Plesk holt automatisch Updates
```

### Manuelles Update
```bash
# In Plesk Git-Interface
# "Pull" Button klicken
```

### Service neu starten
```bash
# Via Plesk
# Python-App → "Neustart"

# Via SSH
touch /var/www/vhosts/ihre-domain.de/httpdocs/image-storage/tmp/restart.txt
```

## 📁 Verzeichnisstruktur auf Plesk

```
/var/www/vhosts/ihre-domain.de/
├── httpdocs/
│   ├── image-storage/          # App-Code
│   │   ├── app.py
│   │   ├── main.py
│   │   ├── passenger_wsgi.py   # Plesk Entry Point
│   │   ├── .env                # Environment Config
│   │   └── ...
│   └── images/                 # Bild-Storage
│       ├── 2025/
│       └── custom-folders/
└── logs/                       # Log-Dateien
```

## 🌐 URL-Struktur

```
https://ihre-domain.de/images/               # Web-Interface
https://ihre-domain.de/images/api/upload     # Upload-API
https://ihre-domain.de/images/2025/07/02/bild.jpg  # Direkter Bild-Zugriff
```

## ⚠️ Troubleshooting

### Problem: App startet nicht
```bash
# Logs prüfen
tail -f /var/www/vhosts/ihre-domain.de/logs/error_log

# Python-App neu starten
touch tmp/restart.txt
```

### Problem: Images nicht erreichbar
```bash
# Berechtigungen prüfen
ls -la httpdocs/images/
chmod -R 755 httpdocs/images/
```

### Problem: Git-Updates funktionieren nicht
```bash
# Git-Status prüfen
cd httpdocs/image-storage
git status
git pull origin main
```

## 📞 Support

**Plesk-spezifische Probleme:**
- Plesk-Logs: `/var/log/plesk/`
- Python-App-Logs: Plesk Panel → Python → Logs
- Fehler-Logs: Website → Logs

**App-spezifische Probleme:**
- App-Logs: `logs/app.log`
- Nginx-Logs: Plesk Panel → Apache & Nginx
