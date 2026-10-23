@echo off
set LOGDIR=D:\Kirti\InternAiNew\INTERN_AI\_verify\logs
cd /d "D:\Kirti\InternAiNew\INTERN_AI\frontend"

echo Running next lint... > "%LOGDIR%\frontend-lint.log"
call npm run lint >> "%LOGDIR%\frontend-lint.log" 2>&1
echo EXITCODE=%ERRORLEVEL% >> "%LOGDIR%\frontend-lint.log"

echo Running tsc --noEmit... > "%LOGDIR%\frontend-tsc.log"
call npx --no-install tsc --noEmit -p tsconfig.json >> "%LOGDIR%\frontend-tsc.log" 2>&1
echo EXITCODE=%ERRORLEVEL% >> "%LOGDIR%\frontend-tsc.log"

echo Running production build... > "%LOGDIR%\frontend-build.log"
call npm run build >> "%LOGDIR%\frontend-build.log" 2>&1
echo EXITCODE=%ERRORLEVEL% >> "%LOGDIR%\frontend-build.log"

echo done > "D:\Kirti\InternAiNew\INTERN_AI\_verify\DONE_2"
