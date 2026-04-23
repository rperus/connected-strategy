Set WshShell = CreateObject("WScript.Shell")
Set shortcut = WshShell.CreateShortcut(WshShell.SpecialFolders("Desktop") & "\Connected Strategy.lnk")

shortcut.TargetPath = "C:\dev\Connected_Strategy\Connected Strategy.bat"
shortcut.WorkingDirectory = "C:\dev\Connected_Strategy"
shortcut.Description = "Connected Strategy - Torre de Control Estratégica"
shortcut.WindowStyle = 1

' Use the generated icon if available, otherwise default
Dim iconPath
iconPath = "C:\dev\Connected_Strategy\assets\icons\icon.ico"
Dim fso
Set fso = CreateObject("Scripting.FileSystemObject")
If fso.FileExists(iconPath) Then
    shortcut.IconLocation = iconPath
End If

shortcut.Save

WScript.Echo "Shortcut 'Connected Strategy' creado en el Escritorio."
WScript.Echo "Haz doble click para abrir la plataforma."
