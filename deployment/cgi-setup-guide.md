
# 🔧 CGI Setup-Anleitung für Image Storage Service

## Voraussetzungen
- ✅ Plesk-Server mit CGI-Unterstützung
- ✅ Python 3.6+ verfügbar
- ✅ Schreibrechte im cgi-bin Verzeichnis

## 🚀 Installation für CGI

### Schritt 1: Dateien hochladen

**Per FTP/SFTP:**
```
/var/www/vhosts/ihre-domain.de/
├── httpdocs/
│   ├── images/                 # Upload-Verzeichnis (755)
│   ├── static/                 # CSS/JS Dateien
│   └── index.html             # Weiterleitung zu CGI
└── cgi-bin/                   # CGI-Skripte (755)
    ├── index.cgi              # Haupt-App (755)
    ├── upload.cgi             # Upload-Handler (755)
    └── app/                   # App-Code
        ├── app.py
        ├── config.py
        ├── services/
        └── templates/
```

### Schritt 2: Berechtigungen setzen

```bash
# CGI-Skripte ausführbar machen
chmod 755 cgi-bin/*.cgi
chmod 755 cgi-bin/app/*.py

# Upload-Verzeichnis beschreibbar
chmod 755 httpdocs/images
chown www-data:www-data httpdocs/images
```

### Schritt 3: Haupt-HTML-Seite

Erstellen Sie `httpdocs/index.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Image Storage Service</title>
    <meta http-equiv="refresh" content="0;url=/cgi-bin/index.cgi">
</head>
<body>
    <p><a href="/cgi-bin/index.cgi">Image Storage Service starten</a></p>
</body>
</html>
```

### Schritt 4: Environment-Variablen

In `cgi-bin/.env`:
```
CGI_MODE=1
BASE_PATH=../images
MAX_SIZE_MB=10
SESSION_SECRET=ihr-sicherer-schluessel
```

### Schritt 5: Python-Pfad anpassen

Falls Python nicht in `/usr/bin/python3`:
```bash
# Python-Pfad finden
which python3

# In CGI-Dateien anpassen:
#!/pfad/zu/python3
```

## 🔧 URLs nach Installation

```
https://ihre-domain.de/               # → /cgi-bin/index.cgi
https://ihre-domain.de/cgi-bin/index.cgi      # Haupt-Interface
https://ihre-domain.de/cgi-bin/upload.cgi     # Upload-API
https://ihre-domain.de/images/2025/bild.jpg   # Direkte Bild-URLs
```

## ⚠️ Troubleshooting

### Problem: 500 Internal Server Error
```bash
# Error-Log prüfen
tail -f /var/log/apache2/error.log

# Häufige Ursachen:
# - Falsche Shebang-Zeile (#!/usr/bin/python3)
# - Fehlende Berechtigungen (chmod 755)
# - Python-Module nicht gefunden
```

### Problem: Permission Denied
```bash
# Alle Berechtigungen setzen
find cgi-bin -name "*.cgi" -exec chmod 755 {} \;
find cgi-bin -name "*.py" -exec chmod 644 {} \;
```

### Problem: Module nicht gefunden
```bash
# Python-Pfad in CGI prüfen:
print(f"Python Path: {sys.path}")
print(f"Current Dir: {os.getcwd()}")
```

## 📞 Support

**CGI-spezifische Probleme:**
- Apache Error-Log: `/var/log/apache2/error.log`
- CGI-Debugging: `cgitb.enable()` ist aktiviert
- Test-URL: `/cgi-bin/index.cgi`
