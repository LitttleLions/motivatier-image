
# 🖼️ Image Storage Service

Ein professioneller Bildspeicher-Service mit Web-Interface und API, optimiert für Plesk-Server Deployment.

## ✨ Features

- 📤 **Drag & Drop Upload** - Intuitive Datei-Upload mit Fortschrittsanzeige
- 🌐 **REST API** - Vollständige API für programmatischen Zugriff
- 📁 **Ordner-Management** - Automatische Datums-Ordner oder benutzerdefinierte Pfade
- 🖼️ **Thumbnail-Generierung** - Automatische Vorschaubilder (150x150px)
- 📱 **Responsive Design** - Mobile-optimierte Benutzeroberfläche
- 🎨 **Dark Theme** - Moderne Bootstrap 5 Oberfläche
- 🔒 **Sichere Validierung** - Dateityp- und Größenprüfung
- 🗂️ **Ordner-Navigation** - Breadcrumb-Navigation für tiefe Strukturen

## 🛠️ Technologie-Stack

- **Backend**: Flask 3.1 (Python)
- **Bildverarbeitung**: Pillow 11
- **Frontend**: Bootstrap 5 + Font Awesome 6
- **Deployment**: Gunicorn + Nginx (Plesk-kompatibel)

## 📋 Unterstützte Formate

- **Bilder**: JPEG, PNG, GIF, WebP
- **Max. Dateigröße**: 10MB (konfigurierbar)
- **Thumbnail**: Automatisch generiert

## 🚀 Schnellstart (Entwicklung)

1. **Repository klonen:**
   ```bash
   git clone https://github.com/ihr-username/image-storage-service.git
   cd image-storage-service
   ```

2. **Abhängigkeiten installieren:**
   ```bash
   pip install -r pyproject.toml
   ```

3. **Starten:**
   ```bash
   python main.py
   ```

4. **Öffnen:** http://localhost:5000

## 🌐 Produktions-Deployment

### Plesk-Server (Empfohlen)

Detaillierte Anleitung: [`deployment/plesk-setup-guide.md`](deployment/plesk-setup-guide.md)

**Schnell-Setup:**
1. Plesk Git-Integration aktivieren
2. Repository URL eingeben
3. Python-App konfigurieren
4. Environment-Variablen setzen

### API-Endpunkte

- `POST /api/upload` - Bild hochladen
- `GET /api/folders` - Ordner auflisten  
- `GET /images/pfad/bild.jpg` - Bild abrufen

## 📁 Ordner-Struktur

```
├── app.py              # Flask-App Konfiguration
├── main.py             # Haupt-Anwendung
├── config.py           # Umgebungs-Konfiguration
├── blueprints/         # Flask Blueprints
├── services/           # Business Logic
├── templates/          # HTML Templates
├── static/             # CSS/JS Assets
└── deployment/         # Deployment-Dateien
```

## ⚙️ Konfiguration

Environment-Variablen in `.env`:

```bash
BASE_PATH=images
MAX_SIZE_MB=10
ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp
SESSION_SECRET=ihr-sicherer-schlüssel
```

## 📞 Support

- **Issues**: GitHub Issues für Bugs und Feature-Requests
- **Deployment**: Siehe `deployment/` Ordner für spezifische Anleitungen

## 📄 Lizenz

MIT License - Siehe [LICENSE](LICENSE) für Details.

---

**Entwickelt für professionelle Bildspeicherung mit Fokus auf Benutzerfreundlichkeit und Sicherheit.**
