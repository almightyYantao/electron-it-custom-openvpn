@echo off
rem Add a new TAP virtual ethernet adapter
%1\tapinstall.exe install %1\driver\OemVista.inf tap0901
