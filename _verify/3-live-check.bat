@echo off
cd /d "D:\Kirti\InternAiNew\INTERN_AI\backend"
echo Running live integration check... > "D:\Kirti\InternAiNew\INTERN_AI\_verify\logs\live-check.log"
call node "D:\Kirti\InternAiNew\INTERN_AI\_verify\live-check.js" >> "D:\Kirti\InternAiNew\INTERN_AI\_verify\logs\live-check.log" 2>&1
echo EXITCODE=%ERRORLEVEL% >> "D:\Kirti\InternAiNew\INTERN_AI\_verify\logs\live-check.log"
echo done > "D:\Kirti\InternAiNew\INTERN_AI\_verify\DONE_3"
