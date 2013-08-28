::rmdir.bat
::@echo off
IF "%1"=="" GOTO end1

IF exist ".\dump\%1" GOTO rm
GOTO end4

:rm
rmdir ".\dump\%1" /s /q
IF not exist ".\dump\%1" GOTO end2
GOTO end3

:end1
echo directory expected for removal
GOTO final

:end2
echo %1 successfully removed
GOTO final

:end3
echo Failed to remove %1
GOTO final

:end4
echo That file doesn't exist
GOTO final

:final