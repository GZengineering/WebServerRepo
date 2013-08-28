::rmdumpfile.bat
@echo off
IF "%1"=="" GOTO end1

IF exist %1 GOTO rm
GOTO end4

:rm
DEL ".\dump\%1*" /s /q
IF not exist %1* GOTO end2
GOTO end3

:end1
echo file name expected for removal
GOTO final

:end2
echo %1 successfully removed
GOTO final

:end3
echo failure to remove archived backups
GOTO final

:end4
echo %1 not found

:final