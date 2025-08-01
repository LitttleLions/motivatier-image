#!/bin/bash

# Standard-Commit-Nachricht definieren
commit_message="chore: update project files"

# Überprüfen, ob eine benutzerdefinierte Nachricht als Argument übergeben wurde
if [ -n "$1" ]; then
  commit_message="$1"
fi

# Git-Befehle ausführen
echo "1. Änderungen werden hinzugefügt (git add .)..."
git add .

echo "2. Änderungen werden committet (git commit)..."
git commit -m "$commit_message"

echo "3. Änderungen werden nach GitHub gepusht (git push)..."
git push

echo "Fertig! Änderungen wurden erfolgreich nach GitHub gepusht."
