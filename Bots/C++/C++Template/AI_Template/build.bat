@echo off
REM ============================================
REM Build Script for AI Tank C++ Bot
REM Platform: Windows
REM ============================================

setlocal enabledelayedexpansion

REM Configuration
set PROJECT_NAME=AI_Template
set SRC_FILE=src\main.cpp
set INCLUDE_DIR=.\include
set LIB_DIR=.\lib
set OUTPUT_FILE=AI_Template.exe

REM Build type (default: debug)
set BUILD_TYPE=%1
if "%BUILD_TYPE%"=="" set BUILD_TYPE=debug

REM ============================================
REM Main
REM ============================================

echo ========================================
echo   AI Tank C++ Bot - Build Script
echo ========================================
echo.

REM Check if source file exists
if not exist "%SRC_FILE%" (
    echo [ERROR] Source file not found: %SRC_FILE%
    echo Please run this script from the AI_Template directory
    exit /b 1
)

REM Parse command
if /i "%BUILD_TYPE%"=="clean" goto :clean
if /i "%BUILD_TYPE%"=="rebuild" goto :rebuild
if /i "%BUILD_TYPE%"=="debug" goto :build_debug
if /i "%BUILD_TYPE%"=="release" goto :build_release
if /i "%BUILD_TYPE%"=="help" goto :show_usage
if /i "%BUILD_TYPE%"=="-h" goto :show_usage
if /i "%BUILD_TYPE%"=="--help" goto :show_usage

REM Default: build debug
goto :build_debug

:clean
echo [INFO] Cleaning build files...
if exist "%OUTPUT_FILE%" del /q "%OUTPUT_FILE%"
if exist "*.obj" del /q "*.obj"
echo [SUCCESS] Clean completed
goto :end

:rebuild
call :clean
echo.
goto :build_debug

:build_debug
echo [INFO] Build type: Debug
set LIB_NAME=AId_2015
set OPTIMIZATION=/Od /Zi
goto :build

:build_release
echo [INFO] Build type: Release
set LIB_NAME=AI_2015
set OPTIMIZATION=/O2
goto :build

:build
REM Check if library exists
if not exist "%LIB_DIR%\%LIB_NAME%.lib" (
    echo [ERROR] Library not found: %LIB_DIR%\%LIB_NAME%.lib
    echo [INFO] Trying alternative libraries...
    
    REM Try other versions
    if exist "%LIB_DIR%\AId_2013.lib" (
        set LIB_NAME=AId_2013
        echo [SUCCESS] Using alternative library: !LIB_NAME!.lib
    ) else if exist "%LIB_DIR%\AId_2012.lib" (
        set LIB_NAME=AId_2012
        echo [SUCCESS] Using alternative library: !LIB_NAME!.lib
    ) else (
        echo [ERROR] No compatible library found in %LIB_DIR%
        exit /b 1
    )
)

echo [INFO] Using library: %LIB_NAME%.lib
echo.

REM Try to find Visual Studio
call :find_vs_compiler
if errorlevel 1 (
    echo [ERROR] Visual Studio compiler not found
    echo Please run this from "Developer Command Prompt for VS"
    echo Or install Visual Studio with C++ support
    exit /b 1
)

REM Build command
echo [INFO] Compiling %SRC_FILE%...
echo.

cl /EHsc /std:c++14 ^
   %OPTIMIZATION% ^
   /I%INCLUDE_DIR% ^
   /D_CRT_SECURE_NO_WARNINGS ^
   /DWIN32 ^
   %SRC_FILE% ^
   /link ^
   /LIBPATH:%LIB_DIR% ^
   %LIB_NAME%.lib ^
   ws2_32.lib ^
   /OUT:%OUTPUT_FILE%

if errorlevel 1 (
    echo.
    echo [ERROR] Build failed!
    exit /b 1
)

echo.
echo [SUCCESS] Build completed successfully!
echo [SUCCESS] Output: %OUTPUT_FILE%
echo.
echo You can now run: %OUTPUT_FILE% -h 127.0.0.1 -p 3011 -k 30
goto :end

:find_vs_compiler
REM Check if cl.exe is available
where cl.exe >nul 2>&1
if %errorlevel%==0 (
    echo [SUCCESS] Found Visual Studio compiler
    exit /b 0
)

REM Try to find and setup VS environment
if exist "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars32.bat" (
    call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars32.bat"
    exit /b 0
)
if exist "C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Auxiliary\Build\vcvars32.bat" (
    call "C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Auxiliary\Build\vcvars32.bat"
    exit /b 0
)
if exist "C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\VC\Auxiliary\Build\vcvars32.bat" (
    call "C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\VC\Auxiliary\Build\vcvars32.bat"
    exit /b 0
)

exit /b 1

:show_usage
echo Usage: %~nx0 [command]
echo.
echo Commands:
echo   (none)      Build in debug mode (default)
echo   debug       Build in debug mode
echo   release     Build in release mode
echo   clean       Clean build files
echo   rebuild     Clean and build
echo   help        Show this help message
echo.
echo Examples:
echo   %~nx0              # Build debug
echo   %~nx0 release      # Build release
echo   %~nx0 clean        # Clean
echo   %~nx0 rebuild      # Clean and rebuild
goto :end

:end
echo.
echo ========================================
endlocal
