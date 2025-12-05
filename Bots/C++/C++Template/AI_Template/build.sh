#!/bin/bash

# ============================================
# Build Script for AI Tank C++ Bot
# Platform: macOS / Linux
# ============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="AI_Template"
SRC_FILE="src/main.cpp"
INCLUDE_DIR="./include"
LIB_DIR="./lib"
OUTPUT_FILE="AI_Template"

# Build type (default: debug)
BUILD_TYPE="${1:-debug}"

# ============================================
# Functions
# ============================================

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  AI Tank C++ Bot - Build Script${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  WARNING: This script may NOT work on macOS/Linux${NC}"
    echo -e "${YELLOW}   The .lib files are Windows static libraries (COFF format)${NC}"
    echo -e "${YELLOW}   and are NOT compatible with macOS/Linux linkers.${NC}"
    echo ""
    echo -e "${YELLOW}   Recommended: Build on Windows with Visual Studio${NC}"
    echo -e "${YELLOW}   Alternative: Use JavaScript bot template instead${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

detect_compiler() {
    if command -v g++ &> /dev/null; then
        COMPILER="g++"
        print_success "Detected compiler: g++"
    elif command -v clang++ &> /dev/null; then
        COMPILER="clang++"
        print_success "Detected compiler: clang++"
    else
        print_error "No C++ compiler found (g++ or clang++)"
        exit 1
    fi
}

clean_build() {
    print_info "Cleaning build files..."
    rm -f "$OUTPUT_FILE"
    rm -f *.o
    print_success "Clean completed"
}

build_project() {
    local build_type=$1
    
    print_info "Build type: $build_type"
    
    # Determine library to use
    if [ "$build_type" == "release" ]; then
        LIB_NAME="AI_2015"
        OPTIMIZATION="-O2"
        print_info "Using Release library: $LIB_NAME.lib"
    else
        LIB_NAME="AId_2015"
        OPTIMIZATION="-g"
        print_info "Using Debug library: $LIB_NAME.lib"
    fi
    
    # Check if library exists
    if [ ! -f "$LIB_DIR/$LIB_NAME.lib" ]; then
        print_error "Library not found: $LIB_DIR/$LIB_NAME.lib"
        print_info "Trying alternative library..."
        
        # Try other versions
        for alt_lib in "AId_2013" "AId_2012" "AI_2015" "AI_2013" "AI_2012"; do
            if [ -f "$LIB_DIR/$alt_lib.lib" ]; then
                LIB_NAME="$alt_lib"
                print_success "Using alternative library: $LIB_NAME.lib"
                break
            fi
        done
        
        if [ ! -f "$LIB_DIR/$LIB_NAME.lib" ]; then
            print_error "No compatible library found in $LIB_DIR"
            exit 1
        fi
    fi
    
    # Build command
    print_info "Compiling $SRC_FILE..."
    
    # Link directly with .lib file (macOS/Linux compatible)
    BUILD_CMD="$COMPILER -std=c++11 \
        $OPTIMIZATION \
        -I$INCLUDE_DIR \
        -o $OUTPUT_FILE \
        $SRC_FILE \
        $LIB_DIR/$LIB_NAME.lib \
        -lpthread"
    
    # Show build command
    print_info "Build command:"
    echo "$BUILD_CMD"
    echo ""
    
    # Execute build
    if $BUILD_CMD; then
        print_success "Build completed successfully!"
        print_success "Output: $OUTPUT_FILE"
        
        # Make executable
        chmod +x "$OUTPUT_FILE"
        
        # Show file info
        echo ""
        print_info "File information:"
        ls -lh "$OUTPUT_FILE"
        
        echo ""
        print_success "You can now run: ./$OUTPUT_FILE -h 127.0.0.1 -p 3011 -k 30"
    else
        print_error "Build failed!"
        exit 1
    fi
}

show_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  (none)      Build in debug mode (default)"
    echo "  debug       Build in debug mode"
    echo "  release     Build in release mode"
    echo "  clean       Clean build files"
    echo "  rebuild     Clean and build"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0              # Build debug"
    echo "  $0 release      # Build release"
    echo "  $0 clean        # Clean"
    echo "  $0 rebuild      # Clean and rebuild"
}

# ============================================
# Main
# ============================================

print_header

# Check if we're in the right directory
if [ ! -f "$SRC_FILE" ]; then
    print_error "Source file not found: $SRC_FILE"
    print_info "Please run this script from the AI_Template directory"
    exit 1
fi

# Parse command
case "$BUILD_TYPE" in
    "clean")
        clean_build
        ;;
    "rebuild")
        clean_build
        detect_compiler
        build_project "debug"
        ;;
    "debug")
        detect_compiler
        build_project "debug"
        ;;
    "release")
        detect_compiler
        build_project "release"
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        detect_compiler
        build_project "debug"
        ;;
esac

echo ""
print_header
