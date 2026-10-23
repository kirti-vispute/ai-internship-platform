@echo off
cd /d "D:\Kirti\InternAiNew\INTERN_AI\backend"
echo Running backend Jest suite... > "D:\Kirti\InternAiNew\INTERN_AI\_verify\logs\backend-test.log"
echo CWD: %CD% >> "D:\Kirti\InternAiNew\INTERN_AI\_verify\logs\backend-test.log"
call npm test >> "D:\Kirti\InternAiNew\INTERN_AI\_verify\logs\backend-test.log" 2>&1
echo EXITCODE=%ERRORLEVEL% >> "D:\Kirti\InternAiNew\INTERN_AI\_verify\logs\backend-test.log"
echo done > "D:\Kirti\InternAiNew\INTERN_AI\_verify\DONE_1"
