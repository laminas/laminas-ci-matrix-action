#!/bin/bash
# Test script for entrypoint.sh working-directory functionality
# This tests the git diff --relative behavior with working directories

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run a test
run_test() {
    local test_name="$1"
    local expected="$2"
    local actual="$3"

    if [[ "$expected" == "$actual" ]]; then
        echo -e "${GREEN}PASS${NC}: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}FAIL${NC}: $test_name"
        echo "  Expected: $expected"
        echo "  Actual:   $actual"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Create a temporary directory for testing
TEST_DIR=$(mktemp -d)
trap "rm -rf $TEST_DIR" EXIT

cd "$TEST_DIR"

# Initialize a git repo with a monorepo structure
git init -q
git config user.email "test@test.com"
git config user.name "Test User"
git config commit.gpgsign false

# Create monorepo structure
mkdir -p packages/package-a/src
mkdir -p packages/package-b/src
echo '{"require":{"php":"^8.1"}}' > packages/package-a/composer.json
echo '{"require":{"php":"^8.2"}}' > packages/package-b/composer.json
echo "<?php echo 'A';" > packages/package-a/src/ClassA.php
echo "<?php echo 'B';" > packages/package-b/src/ClassB.php
echo "Root file" > root.txt

# Initial commit
git add .
git commit -q -m "Initial commit"

# Create a branch and make changes
git checkout -q -b feature-branch

# Modify files in both packages and root
echo "<?php echo 'A modified';" > packages/package-a/src/ClassA.php
echo "<?php echo 'B modified';" > packages/package-b/src/ClassB.php
echo "Root modified" > root.txt
git add .
git commit -q -m "Modify files"

# Test 1: git diff --relative from root shows all files
DIFF_ROOT=$(git diff --relative --name-only main...HEAD 2>/dev/null || git diff --relative --name-only master...HEAD)
run_test "git diff from root shows all files" "3" "$(echo "$DIFF_ROOT" | wc -l | tr -d ' ')"

# Test 2: git diff --relative from package-a shows only package-a files
cd packages/package-a
DIFF_PKG_A=$(git diff --relative --name-only main...HEAD 2>/dev/null || git diff --relative --name-only master...HEAD)
run_test "git diff --relative from package-a shows only package-a files" "src/ClassA.php" "$DIFF_PKG_A"
cd "$TEST_DIR"

# Test 3: git diff --relative from package-b shows only package-b files
cd packages/package-b
DIFF_PKG_B=$(git diff --relative --name-only main...HEAD 2>/dev/null || git diff --relative --name-only master...HEAD)
run_test "git diff --relative from package-b shows only package-b files" "src/ClassB.php" "$DIFF_PKG_B"
cd "$TEST_DIR"

# Test 4: Verify INPUT_WORKING_DIRECTORY default behavior
INPUT_WORKING_DIRECTORY=""
WORKING_DIR="${INPUT_WORKING_DIRECTORY:-.}"
run_test "Default working directory is '.'" "." "$WORKING_DIR"

# Test 5: Verify INPUT_WORKING_DIRECTORY custom value
INPUT_WORKING_DIRECTORY="packages/package-a"
WORKING_DIR="${INPUT_WORKING_DIRECTORY:-.}"
run_test "Custom working directory is set correctly" "packages/package-a" "$WORKING_DIR"

# Print summary
echo ""
echo "================================"
echo "Tests passed: $TESTS_PASSED"
echo "Tests failed: $TESTS_FAILED"
echo "================================"

if [[ $TESTS_FAILED -gt 0 ]]; then
    exit 1
fi
