@echo off
setlocal enabledelayedexpansion

REM Change directory to root Server directory for correct Docker Context
cd /d "%~dp0"
cd ../..

REM Define service names and their corresponding Dockerfiles
set services[0]=bluewaveuptime/uptime_client
set dockerfiles[0]=.\docker\coolify\client.Dockerfile

set services[1]=bluewaveuptime/uptime_database_mongo
set dockerfiles[1]=.\docker\coolify\mongoDB.Dockerfile

set services[2]=bluewaveuptime/uptime_redis
set dockerfiles[2]=.\docker\coolify\redis.Dockerfile

set services[3]=bluewaveuptime/uptime_server
set dockerfiles[3]=.\docker\coolify\server.Dockerfile

REM Loop through each service and build the corresponding image
for /L %%i in (0,1,2,3) do (
    set service=!services[%%i]!
    set dockerfile=!dockerfiles[%%i]!

    docker build -f "!dockerfile!" -t "!service!" .

    REM Check if the build succeeded
    if errorlevel 1 (
        echo Error building !service! image. Exiting...
        exit /b 1
    )
)

echo All images built successfully
exit /b 0
