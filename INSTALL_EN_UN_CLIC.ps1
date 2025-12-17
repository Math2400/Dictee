# INSTALLATEUR_DICTEE.ps1
# Interface Graphique Professionnelle pour l'Installation et la Mise à Jour

Add-Type -AssemblyName PresentationFramework, System.Drawing, System.Windows.Forms

# --- Définition de l'Interface (XAML) ---
[xml]$XAML = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2000/xaml/presentation"
        Title="Installateur Dictée Intelligente" Height="500" Width="600" Background="#110c1d" WindowStartupLocation="CenterScreen">
    <StackPanel Margin="30">
        <TextBlock Text="Dictée Intelligente - Setup" FontSize="28" Foreground="White" FontWeight="Bold" Margin="0,0,0,10"/>
        <TextBlock Text="Synchronisation et Installation par Intelligence Artificielle" Foreground="#8b80f9" Margin="0,0,0,30"/>
        
        <TextBlock Text="Choisissez le dossier d'installation :" Foreground="White" Margin="0,0,0,5"/>
        <DockPanel Margin="0,0,0,20">
            <Button Name="btnBrowse" Content="Parcourir..." Width="100" DockPanel.Dock="Right" />
            <TextBox Name="txtPath" Height="30" VerticalContentAlignment="Center" Margin="0,0,10,0" Padding="5" Background="#1e1b2e" Foreground="White" BorderBrush="#3f3a5f"/>
        </DockPanel>

        <Button Name="btnAction" Content="INSTALLER / METTRE À JOUR" Height="45" Background="#8b80f9" Foreground="White" FontWeight="Bold" BorderThickness="0" Cursor="Hand"/>
        
        <TextBlock Text="Étapes de progression :" Foreground="White" Margin="0,20,0,5"/>
        <ScrollViewer Height="150" Background="#0a0812" MaxHeight="150">
            <TextBlock Name="txtLog" Foreground="#bbbbbb" TextWrapping="Wrap" Padding="10" FontFamily="Consolas" FontSize="11"/>
        </ScrollViewer>
    </StackPanel>
</Window>
"@

$reader = (New-Object System.Xml.XmlNodeReader $XAML)
$Window = [Windows.Markup.XamlReader]::Load($reader)

# --- Variables des éléments ---
$txtPath = $Window.FindName("txtPath")
$btnBrowse = $Window.FindName("btnBrowse")
$btnAction = $Window.FindName("btnAction")
$txtLog = $Window.FindName("txtLog")

# Valeur par défaut
$txtPath.Text = Join-Path $env:USERPROFILE "Desktop\Dictee"

# --- Fonctions ---
function Log($msg) {
    $txtLog.Text += "[$(Get-Date -Format 'HH:mm:ss')] $msg`n"
}

$btnBrowse.Add_Click({
    $Dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $Dialog.Description = "Sélectionnez le dossier pour l'application"
    if ($Dialog.ShowDialog() -eq "OK") {
        $txtPath.Text = $Dialog.SelectedPath
    }
})

$btnAction.Add_Click({
    $targetDir = $txtPath.Text
    $btnAction.IsEnabled = $false
    
    # Exécution asynchrone pour ne pas bloquer l'UI
    Start-Job -ScriptBlock {
        param($path, $repo)
        
        function InternalLog($m) { Write-Output $m }
        
        # 1. Vérification Dépendances
        if (!(Get-Command winget -ErrorAction SilentlyContinue)) {
            return "ERREUR: Winget manquant."
        }
        
        if (!(Get-Command git -ErrorAction SilentlyContinue)) {
            InternalLog "🔧 Installation de Git..."
            winget install --id Git.Git -e --source winget --silent --accept-package-agreements --accept-source-agreements
        }
        
        if (!(Get-Command node -ErrorAction SilentlyContinue)) {
            InternalLog "🔧 Installation de Node.js..."
            winget install --id OpenJS.NodeJS -e --source winget --silent --accept-package-agreements --accept-source-agreements
        }
        
        # 2. Gestion du dossier
        if (!(Test-Path $path)) {
            InternalLog "📂 Création du dossier et téléchargement (Clone)..."
            New-Item -ItemType Directory -Path $path -Force | Out-Null
            Set-Location $path
            cd ..
            git clone $repo $path
        } else {
            InternalLog "🔄 Dossier détecté, mise à jour (Pull)..."
            Set-Location $path
            git pull origin master
        }
        
        # 3. NPM Install
        InternalLog "📦 Installation des dépendances du projet..."
        npm install
        
        return "SUCCÈS"
    } -ArgumentList $targetDir, "https://github.com/Math2400/Dictee.git" | Out-Null
    
    # Polling pour le log (simplifié pour la démo)
    Log "Démarrage du processus..."
    
    # On surveille les résultats
    $timer = New-Object System.Windows.Threading.DispatcherTimer
    $timer.Interval = [TimeSpan]::FromSeconds(1)
    $timer.Add_Tick({
        $job = Get-Job | Where-Object { $_.State -eq "Running" -or $_.State -eq "Completed" } | Select-Object -Last 1
        if ($job) {
            $results = Receive-Job $job
            foreach ($res in $results) {
                if ($res -eq "SUCCÈS") {
                    Log "✅ TERMINÉ ! Vous pouvez fermer cette fenêtre."
                    $btnAction.Content = "PRÊT !"
                    $timer.Stop()
                } elseif ($res -like "ERREUR*") {
                    Log "❌ $res"
                    $btnAction.IsEnabled = $true
                    $timer.Stop()
                } else {
                    Log $res
                }
            }
        }
    })
    $timer.Start()
})

$Window.ShowDialog() | Out-Null
