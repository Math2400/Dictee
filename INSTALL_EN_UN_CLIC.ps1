# INSTALLATEUR_DICTEE.ps1
# Version ULTRA-STABLE utilisant WinForms (Compatible tous Windows)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# --- Creation de la Fenetre ---
$Form = New-Object System.Windows.Forms.Form
$Form.Text = "Installateur Dictee Intelligente"
$Form.Size = New-Object System.Drawing.Size(600, 500)
$Form.StartPosition = "CenterScreen"
$Form.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#110c1d")
$Form.FormBorderStyle = "FixedDialog"
$Form.MaximizeBox = $false

# --- Police ---
$FontTitle = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Bold)
$FontLabel = New-Object System.Drawing.Font("Segoe UI", 10)
$FontButton = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)

# --- Titre ---
$LblTitle = New-Object System.Windows.Forms.Label
$LblTitle.Text = "Dictee Intelligente - Setup"
$LblTitle.ForeColor = [System.Drawing.Color]::White
$LblTitle.Font = $FontTitle
$LblTitle.AutoSize = $true
$LblTitle.Location = New-Object System.Drawing.Point(30, 20)
$Form.Controls.Add($LblTitle)

# --- Sous-titre ---
$LblSub = New-Object System.Windows.Forms.Label
$LblSub.Text = "Installation et mise a jour automatique"
$LblSub.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#8b80f9")
$LblSub.Font = $FontLabel
$LblSub.AutoSize = $true
$LblSub.Location = New-Object System.Drawing.Point(30, 60)
$Form.Controls.Add($LblSub)

# --- Label Dossier ---
$LblPath = New-Object System.Windows.Forms.Label
$LblPath.Text = "Dossier d'installation :"
$LblPath.ForeColor = [System.Drawing.Color]::White
$LblPath.Font = $FontLabel
$LblPath.AutoSize = $true
$LblPath.Location = New-Object System.Drawing.Point(30, 110)
$Form.Controls.Add($LblPath)

# --- Input Dossier ---
$TxtPath = New-Object System.Windows.Forms.TextBox
$TxtPath.Size = New-Object System.Drawing.Size(400, 30)
$TxtPath.Location = New-Object System.Drawing.Point(30, 135)
$TxtPath.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#1e1b2e")
$TxtPath.ForeColor = [System.Drawing.Color]::White
$TxtPath.Text = Join-Path $env:USERPROFILE "Desktop\Dictee"
$Form.Controls.Add($TxtPath)

# --- Bouton Parcourir ---
$BtnBrowse = New-Object System.Windows.Forms.Button
$BtnBrowse.Text = "Parcourir"
$BtnBrowse.Size = New-Object System.Drawing.Size(100, 28)
$BtnBrowse.Location = New-Object System.Drawing.Point(440, 133)
$BtnBrowse.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#3f3a5f")
$BtnBrowse.ForeColor = [System.Drawing.Color]::White
$BtnBrowse.FlatStyle = "Flat"
$Form.Controls.Add($BtnBrowse)

# --- Bouton Installer ---
$BtnAction = New-Object System.Windows.Forms.Button
$BtnAction.Text = "INSTALLER / METTRE A JOUR"
$BtnAction.Size = New-Object System.Drawing.Size(510, 45)
$BtnAction.Location = New-Object System.Drawing.Point(30, 180)
$BtnAction.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#8b80f9")
$BtnAction.ForeColor = [System.Drawing.Color]::White
$BtnAction.Font = $FontButton
$BtnAction.FlatStyle = "Flat"
$Form.Controls.Add($BtnAction)

# --- Checkbox Raccourci ---
$ChkShortcut = New-Object System.Windows.Forms.CheckBox
$ChkShortcut.Text = "Créer un raccourci sur le bureau"
$ChkShortcut.ForeColor = [System.Drawing.Color]::White
$ChkShortcut.Location = New-Object System.Drawing.Point(30, 230)
$ChkShortcut.AutoSize = $true
$ChkShortcut.Checked = $true
$Form.Controls.Add($ChkShortcut)

# --- Log Box ---
$TxtLog = New-Object System.Windows.Forms.TextBox
$TxtLog.Multiline = $true
$TxtLog.ReadOnly = $true
$TxtLog.Size = New-Object System.Drawing.Size(510, 150)
$TxtLog.Location = New-Object System.Drawing.Point(30, 260)
$TxtLog.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#0a0812")
$TxtLog.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#bbbbbb")
$TxtLog.Font = New-Object System.Drawing.Font("Consolas", 9)
$TxtLog.ScrollBars = "Vertical"
$Form.Controls.Add($TxtLog)

# --- Fonctions ---
function Log($msg) {
    $timestamp = Get-Date -Format "HH:mm:ss"
    $TxtLog.AppendText("[$timestamp] $msg`r`n")
}

$BtnBrowse.Add_Click({
    $Dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    if ($Dialog.ShowDialog() -eq "OK") { $TxtPath.Text = $Dialog.SelectedPath }
})

$BtnAction.Add_Click({
    $targetDir = $TxtPath.Text
    $createShortcut = $ChkShortcut.Checked
    $BtnAction.Enabled = $false
    Log "Demarrage du processus pour : $targetDir"
    
    Start-Job -ScriptBlock {
        param($path, $repo)
        
        function LocalLog($m) { Write-Output $m }
        
        try {
            # 1. Verification Winget
            if (!(Get-Command winget -ErrorAction SilentlyContinue)) { return "ERREUR: Winget absente." }
            
            # 2. Git
            if (!(Get-Command git -ErrorAction SilentlyContinue)) {
                LocalLog "Installation de Git..."
                winget install --id Git.Git -e --source winget --silent --accept-package-agreements --accept-source-agreements
            }
            
            # 3. Node
            if (!(Get-Command node -ErrorAction SilentlyContinue)) {
                LocalLog "Installation de Node.js..."
                winget install --id OpenJS.NodeJS -e --source winget --silent --accept-package-agreements --accept-source-agreements
            }
            
            # 4. Dossier et Git
            if (!(Test-Path $path)) {
                LocalLog "Creation du dossier..."
                New-Item -ItemType Directory -Path $path -Force | Out-Null
            }

            Set-Location $path
            if (!(Test-Path ".git")) {
                LocalLog "Telechargement du projet (Clone)..."
                git init | Out-Null
                git remote add origin $repo | Out-Null
                git fetch origin | Out-Null
                git checkout -f master | Out-Null
            } else {
                LocalLog "Mise a jour du projet (Pull)..."
                git pull origin master | Out-Null
            }
            
            # 5. NPM
            if (!(Test-Path "package.json")) {
                return "ERREUR : package.json non trouve dans $path"
            }
            
            LocalLog "Installation des modules npm (cela peut prendre du temps)..."
            npm install --silent
            
            return "SUCCES"
        } catch {
            return "ERREUR : $($_.Exception.Message)"
        }
    } -ArgumentList $targetDir, "https://github.com/Math2400/Dictee.git" | Out-Null
    
    # Surveillance du job via Timer WinForms (pour ne pas bloquer l'UI)
    $Timer = New-Object System.Windows.Forms.Timer
    $Timer.Interval = 1000
    $Timer.Add_Tick({
        $job = Get-Job | Select-Object -Last 1
        $data = Receive-Job $job
        foreach ($line in $data) {
            if ($line -eq "SUCCES") {
                Log "--- TERMINE AVEC SUCCES ---"
                
                # --- Logique Shortcut ---
                if ($createShortcut) {
                    Log "Creation du raccourci sur le bureau..."
                    $desktopPath = [Environment]::GetFolderPath("Desktop")
                    $shortcutPath = Join-Path $desktopPath "Dictee Intelligente.bat"
                    $launcherPath = Join-Path $targetDir "LANCER_APP.bat"
                    "@echo off`ncd /d `"$targetDir`"`nstart LANCER_APP.bat" | Out-File $shortcutPath -Encoding ascii
                }
                
                Log "Lancement de l'application..."
                $BtnAction.Text = "PRET !"
                $this.Stop()
                
                # Lancement
                Set-Location $targetDir
                Start-Process "cmd.exe" "/c LANCER_APP.bat"
            } elseif ($line -like "ERREUR*") {
                Log $line
                $BtnAction.Enabled = $true
                $this.Stop()
            } else {
                Log $line
            }
        }
    })
    $Timer.Start()
})

$Form.ShowDialog() | Out-Null

$Form.ShowDialog() | Out-Null
