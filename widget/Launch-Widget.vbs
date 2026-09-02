Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)
strRoot = fso.GetParentFolderName(strDir)
electronExe = strRoot & "\node_modules\electron\dist\electron.exe"
mainJs = strDir & "\widget-main.js"

WshShell.CurrentDirectory = strDir
If fso.FileExists(electronExe) Then
    WshShell.Run """" & electronExe & """ """ & mainJs & """", 0, False
Else
    WshShell.Run "cmd /c npx electron """ & mainJs & """", 0, False
End If
