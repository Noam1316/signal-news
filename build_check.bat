@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d C:\Users\noamo\maof-project\signal-news-demo
call npx next build > build_output.txt 2>&1
