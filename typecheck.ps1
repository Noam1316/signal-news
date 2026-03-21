$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Set-Location "C:\Users\noamo\maof-project\signal-news-demo"
npx tsc --noEmit 2>&1
