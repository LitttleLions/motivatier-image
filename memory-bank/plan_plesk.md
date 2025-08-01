# Plan: Manueller Workflow für Plesk-Docker-Bereitstellung (ohne SSH)

Dieses Dokument beschreibt den strategischen Plan zur Bereitstellung und Aktualisierung der "motivatier-image" Anwendung auf einem Plesk-Server, wenn kein direkter SSH-Zugang verfügbar ist. Der Plan nutzt ausschließlich die Plesk-eigenen Erweiterungen "Git" und "Docker".

## Übersicht des Workflows

Der Prozess ist manuell und erfordert nach jeder Code-Änderung zwei Aktionen in der Plesk-Weboberfläche.

1.  **Code-Änderung in GitHub**: Alle notwendigen Code-Änderungen (`Dockerfile`, Python-Code, etc.) werden in das GitHub-Repository gepusht. Dies kann lokal mit dem `push_to_github.sh`-Skript automatisiert werden.
2.  **Code auf Plesk aktualisieren**: In der Plesk "Git"-Erweiterung wird auf **"Jetzt Pull ausführen"** geklickt, um die neuesten Änderungen auf den Server herunterzuladen.
3.  **Docker-Container neu erstellen**: In der Plesk "Docker"-Erweiterung wird für den entsprechenden Container die Option **"Neu erstellen"** gewählt. Plesk baut dann das Image aus der aktualisierten `Dockerfile` neu und startet den Container.

## Detaillierte Konfigurationsschritte

### 1. Plesk-Konfiguration (Einmalig)

Diese Einstellungen müssen einmalig direkt in der Plesk-Weboberfläche vorgenommen werden.

*   **Repository-Verbindung**:
    *   In der Plesk **"Git"**-Erweiterung wird das GitHub-Repository (`https://github.com/LitttleLions/motivatie-image`) verbunden.
    *   Das Bereitstellungsverzeichnis wird auf `/httpdocs/motivatier-image` gesetzt.

*   **Docker-Container-Konfiguration**:
    *   Der Container wird initial aus dem geklonten Repository über die Plesk **"Docker"**-Erweiterung erstellt.
    *   **Volume-Mapping**: Um Datenverlust zu verhindern, wird ein Volume-Mapping konfiguriert:
        *   **Host-Pfad**: Ein persistentes Verzeichnis auf dem Server, z.B. `/var/www/vhosts/DEINE_DOMAIN/data/images`.
        *   **Container-Pfad**: `/app/images` (oder der in der App definierte `UPLOAD_FOLDER`).
    *   **Umgebungsvariablen**: Alle notwendigen Umgebungsvariablen (z.B. `APPLICATION_ROOT=/motivatier-image`, `FLASK_ENV=production`) werden direkt in der Plesk-Docker-UI für den Container gesetzt.
    *   **Port-Mapping**: Die Option **"Automatisches Port-Mapping"** wird **deaktiviert**. Stattdessen wird ein fester externer Port zugewiesen, z.B. `32777`. Der interne Port bleibt `5000`.

*   **Nginx Reverse Proxy für Unterverzeichnis**:
    *   In den **"Apache & nginx Einstellungen"** der Domain werden unter **"Zusätzliche nginx-Anweisungen"** die folgenden Regeln hinzugefügt, um Anfragen an `/motivatier-image/` an den Docker-Container weiterzuleiten:
    ```nginx
    location /motivatier-image/ {
        # Der Port (z.B. 32777) muss dem fest zugewiesenen externen Port entsprechen.
        proxy_pass http://localhost:32777/motivatier-image/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
    ```

### 2. Manueller Aktualisierungsprozess

Bei jeder gewünschten Aktualisierung der Anwendung werden die folgenden Schritte wiederholt:

1.  **Code in GitHub pushen**: Stellen Sie sicher, dass alle Änderungen im `main`-Branch (oder dem konfigurierten Branch) Ihres GitHub-Repositorys sind. Nutzen Sie das lokale Skript `push_to_github.sh` (`bash ./push_to_github.sh "Ihre Commit-Nachricht"`).
2.  **Pull in Plesk**: Gehen Sie zu **"Websites & Domains" > "Git"** und klicken Sie auf **"Jetzt Pull ausführen"**.
3.  **Rebuild in Plesk**: Gehen Sie zu **"Websites & Domains" > "Docker"**, suchen Sie Ihren Container, klicken Sie auf das Drei-Punkte-Menü und wählen Sie **"Neu erstellen"**.

Dieser Ansatz ist robust, einfach zu befolgen und vollständig über die Plesk-UI steuerbar, was ihn ideal für Umgebungen ohne SSH-Zugang macht.
