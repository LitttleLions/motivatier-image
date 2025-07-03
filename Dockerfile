
FROM python:3.11-slim

# System-Updates und Abhängigkeiten
RUN apt-get update && apt-get install -y \
    gcc \
    libjpeg-dev \
    libpng-dev \
    libfreetype6-dev \
    && rm -rf /var/lib/apt/lists/*

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Python-Abhängigkeiten kopieren und installieren
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# App-Code kopieren
COPY . .

# Verzeichnisse erstellen
RUN mkdir -p images logs static templates
RUN chmod 755 images logs

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
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "main:app"]
