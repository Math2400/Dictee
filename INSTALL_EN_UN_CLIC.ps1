# INSTALLATEUR_DICTEE.ps1
# Version stable avec chargement robuste des bibliotheques Windows

# --- Chargement force des composants Windows ---
try {
    Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase, System.Xaml, System.Windows.Forms
} catch {
    Write-Host "Erreur de chargement des bibliotheques Windows UI."
    exit
}

# --- Définition de l'Interface (XAML) ---
# On utilise une version ultra-simple du XAML pour eviter les erreurs de parsing
$xamlData = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2000/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2000/xaml"
        Title="Dictee Intelligente - Installation" Height="500" Width="600" Background="#110c1d" WindowStartupLocation="CenterScreen">
    <StackPanel Margin="30">
        <TextBlock Text="Dictee Intelligente - Setup" FontSize="28" Foreground="White" FontWeight="Bold" Margin="0,0,0,10"/>
        <TextBlock Text="Installation et mise a jour automatique" Foreground="#8b80f9" Margin="0,0,0,30"/>
        
        <TextBlock Text="Dossier d'installation :" Foreground="White" Margin="0,0,0,5"/>
        <DockPanel Margin="0,0,0,20">
            <Button Name="btnBrowse" Content="Parcourir" Width="100" DockPanel.Dock="Right" Background="#3f3a5f" Foreground="White"/>
            <TextBox Name="txtPath" Height="30" VerticalContentAlignment="Center" Margin="0,0,10,0" Padding="5" Background="#1e1b2e" Foreground="White" BorderBrush="#3f3a5f"/>
        </DockPanel>

        <Button Name="btnAction" Content="INSTALLER / METTRE A JOUR" Height="45" Background="#8b80f9" Foreground="White" FontWeight="Bold"/>
        
        <TextBlock Text="Log d'installation :" Foreground="White" Margin="0,20,0,5"/>
        <Border Background="#0a0812" Height="150">
            <ScrollViewer VerticalScrollBarVisibility="Auto">
                <TextBlock Name="txtLog" Foreground="#bbbbbb" TextWrapping="Wrap" Padding="10" FontFamily="Consolas" FontSize="11"/>
            </ScrollViewer>
        </Border>
    </StackPanel>
</Window>
"@

$reader = [System.Xml.XmlReader]::Create([System.IO.StringReader] $xamlData)
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
    if ($Window.Dispatcher.CheckAccess()) {
        $txtLog.Text += "[$(Get-Date -Format 'HH:mm:ss')] $msg`n"
    } else {
        $Window.Dispatcher.Invoke([Action[string]]{ param($m) $txtLog.Text += "[$(Get-Date -Format 'HH:mm:ss')] $m`n" }, $msg)
    }
}

$btnBrowse.Add_Click({
    $Dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    if ($Dialog.ShowDialog() -eq "OK") { $txtPath.Text = $Dialog.SelectedPath }
})

$btnAction.Add_Click({
    $targetDir = $txtPath.Text
    $btnAction.IsEnabled = $false
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
            
            # 4. Dossier
            if (!(Test-Path $path)) {
                LocalLog "Creation du dossier..."
                New-Item -ItemType Directory -Path $path -Force | Out-Null
                $parent = Split-Path $path
                cd $parent
                git clone $repo $path
            } else {
                LocalLog "Mise a jour du dossier existant..."
                Set-Location $path
                git pull origin master
            }
            
            # 5. NPM
            Set-Location $path
            LocalLog "Installation des modules npm..."
            npm install
            
            return "SUCCES"
        } catch {
            return "ERREUR : $($_.Exception.Message)"
        }
    } -ArgumentList $targetDir, "https://github.com/Math2400/Dictee.git", $Window | Out-Null
    
    # Surveillance du job
    $timer = New-Object System.Windows.Threading.DispatcherTimer
    $timer.Interval = [TimeSpan]::FromSeconds(1)
    $timer.Add_Tick({
        $job = Get-Job | Select-Object -Last 1
        $data = Receive-Job $job
        foreach ($line in $data) {
            if ($line -eq "SUCCES") {
                Log "--- TERMINE AVEC SUCCES ---"
                $btnAction.Content = "PRÊT !"
                $timer.Stop()
            } elseif ($line -like "ERREUR*") {
                Log $line
                $btnAction.IsEnabled = $true
                $timer.Stop()
            } else {
                Log $line
            }
        }
    })
    $timer.Start()
})

$Window.ShowDialog() | Out-Null
