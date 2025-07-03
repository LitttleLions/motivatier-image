
# 🐳 Docker Setup für Plesk - Image Storage Service

## Voraussetzungen
- ✅ Plesk Obsidian mit Docker-Extension
- ✅ Docker-Container bereits erstellt
- ✅ SSH-Zugang zum Container

## 🚀 Installation im Docker-Container

### Schritt 1: Code in Container laden

**Via GitHub Clone:**
```bash
# Im Docker-Container
cd /app
git clone https://github.com/LitttleLions/motivatier-image.git .
```

**Oder via File-Upload:**
- Alle Dateien per FTP in Container-Volume hochladen

### Schritt 2: Dependencies installieren

```bash
# Im Container
pip install --no-cache-dir --upgrade pip
pip install --no-cache-dir -r requirements.txt
```

### Schritt 3: Verzeichnisse erstellen

```bash
mkdir -p images logs static templates
chmod 755 images logs
```

### Schritt 4: Environment konfigurieren

Erstellen Sie `.env` im Container:
```bash
BASE_PATH=images
MAX_SIZE_MB=10
ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp
SESSION_SECRET=change-this-secure-key-in-production
FLASK_ENV=production
PLESK_DOCKER=1
```

### Schritt 5: App starten

**Manuell testen:**
```bash
python main.py
```

**Mit Gunicorn (Production):**
```bash
gunicorn --bind 0.0.0.0:5000 --workers 2 main:app
```

### Schritt 6: Plesk-Integration

1. **Port-Weiterleitung konfigurieren:**
   - Docker-Container → Port 5000
   - Plesk Domain → Container Port

2. **Nginx Proxy (falls nötig):**
```nginx
location / {
    proxy_pass http://container-ip:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 🔄 Deployment-Workflow

### Code-Updates
```bash
# Im Container
cd /app
git pull origin main
# Container neu starten über Plesk Interface
```

### Service neu starten
```bash
# Über Plesk Docker-Interface
# Oder im Container:
pkill -f gunicorn
gunicorn --bind 0.0.0.0:5000 --workers 2 main:app
```

## 📞 Troubleshooting

### App startet nicht
```bash
# Logs prüfen
tail -f logs/app.log
python main.py  # Direkter Test
```

### Port-Probleme
```bash
# Ports prüfen
netstat -tulpn | grep :5000
ss -tulpn | grep :5000
```

### Plesk-Container-Verbindung
```bash
# Container-IP ermitteln
docker inspect container-name | grep IPAddress
```

## 📋 Wichtige Befehle

```bash
# App starten
gunicorn --bind 0.0.0.0:5000 --workers 2 main:app

# Dependencies aktualisieren
pip install --upgrade -r pyproject.toml

# Logs ansehen
tail -f logs/app.log

# Container-Status
docker ps
docker logs container-name
```

Das Docker-Setup ist ideal für Plesk, da es isoliert läuft und einfach zu verwalten ist!
