::move.bat
@echo off
IF "%1"=="" GOTO end1

IF exist .\dump\%1 GOTO mv
GOTO end4

:mv
xcopy ".\dump\%1\GZ\*.*" ".\dump\%1.*" /s /y
GOTO end2

:end1
echo file name expected
GOTO final

:end2
echo %1 successfully moved
GOTO final

:end4
echo That file doesn't exist
GOTO final

:final