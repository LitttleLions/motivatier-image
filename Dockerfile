
# Stage 1: Builder - Installiert Abhängigkeiten und baut die Python-Pakete
FROM python:3.11-slim AS builder

# System-Abhängigkeiten für den Build installieren
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libjpeg-dev \
    libpng-dev \
    libfreetype6-dev \
    && rm -rf /var/lib/apt/lists/*

# Arbeitsverzeichnis
WORKDIR /app

# Pip aktualisieren
RUN pip install --no-cache-dir --upgrade pip

# Anforderungen installieren
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Final Image - Das eigentliche Laufzeit-Image
FROM python:3.11-slim

# Einen unprivilegierten Benutzer erstellen
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Arbeitsverzeichnis erstellen und Berechtigungen setzen
WORKDIR /app

# Notwendige Laufzeit-Abhängigkeiten installieren (z.B. für den Healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Installierte Pakete aus dem Builder-Stage kopieren
COPY --from=builder /install /usr/local

# App-Code kopieren
COPY . .

# Berechtigungen für den App-Benutzer setzen
# Wichtig: Die Daten- und Log-Verzeichnisse sollten per Volume gemountet werden
RUN chown -R appuser:appuser /app
USER appuser

# Port freigeben
EXPOSE 5000

# Environment-Variablen
ENV FLASK_APP=main.py
ENV FLASK_ENV=production
ENV PYTHONPATH=/app

# Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/ || exit 1

# App starten
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "wsgi:application"]
