Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strRoot = fso.GetParentFolderName(WScript.ScriptFullName)
strWidgetDir = strRoot & "\widget"
electronExe = strRoot & "\node_modules\electron\dist\electron.exe"
mainJs = strWidgetDir & "\widget-main.js"

WshShell.CurrentDirectory = strWidgetDir
If fso.FileExists(electronExe) Then
    WshShell.Run """" & electronExe & """ """ & mainJs & """", 0, False
Else
    WshShell.Run "cmd /c npx electron """ & mainJs & """", 0, False
End If
