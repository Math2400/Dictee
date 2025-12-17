# Script d'installation automatique pour la Dictée Intelligente
# Ce script installe Git, Node.js et prépare le projet.

Write-Host "--- Installation de la Dictée Intelligente ---" -ForegroundColor Cyan

# 1. Vérification de Winget
if (!(Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Host "ERREUR: Winget n'est pas installé sur ce PC. Veuillez mettre à jour Windows ou installer Winget." -ForegroundColor Red
    pause
    exit
}

# 2. Installation de Git
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Installation de Git en cours..." -ForegroundColor Yellow
    winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
} else {
    Write-Host "✓ Git est déjà installé." -ForegroundColor Green
}

# 3. Installation de Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Installation de Node.js en cours..." -ForegroundColor Yellow
    winget install --id OpenJS.NodeJS -e --source winget --accept-package-agreements --accept-source-agreements
} else {
    Write-Host "✓ Node.js est déjà installé." -ForegroundColor Green
}

# 4. Clonage ou Mise à jour du projet
$repoUrl = "https://github.com/Math2400/Dictee.git"
$projectDir = "Dictee"

if (!(Test-Path $projectDir)) {
    Write-Host "Téléchargement du projet depuis GitHub..." -ForegroundColor Yellow
    git clone $repoUrl
    cd $projectDir
} else {
    Write-Host "✓ Le dossier du projet existe déjà." -ForegroundColor Green
    cd $projectDir
    git pull origin master
}

# 5. Installation des dépendances NPM
Write-Host "Installation des composants du projet (NPM)..." -ForegroundColor Yellow
npm install

Write-Host "`n--- INSTALLATION TERMINÉE ! ---" -ForegroundColor Green
Write-Host "Vous pouvez maintenant lancer l'application avec 'LANCER_APP.bat'."
pause
