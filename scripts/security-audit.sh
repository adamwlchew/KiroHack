#!/bin/bash

echo "🔒 PageFlow Security Audit"
echo "=========================="

# Check for hardcoded secrets
echo "🔍 Checking for hardcoded secrets..."
SECRETS_FOUND=$(grep -r -i "password\|secret\|key\|token" --include="*.ts" --include="*.js" --include="*.json" src/ | grep -v "test\|mock\|example" | wc -l)
if [ $SECRETS_FOUND -gt 0 ]; then
    echo "⚠️  Found $SECRETS_FOUND potential hardcoded secrets"
    grep -r -i "password\|secret\|key\|token" --include="*.ts" --include="*.js" --include="*.json" src/ | grep -v "test\|mock\|example"
else
    echo "✅ No hardcoded secrets found"
fi

# Check for proper error handling
echo ""
echo "🔍 Checking for proper error handling..."
ERROR_HANDLING=$(grep -r "catch\|error" --include="*.ts" --include="*.js" src/ | wc -l)
echo "✅ Found $ERROR_HANDLING error handling instances"

# Check for authentication middleware
echo ""
echo "🔍 Checking for authentication middleware..."
AUTH_MIDDLEWARE=$(grep -r "authMiddleware\|authentication" --include="*.ts" --include="*.js" src/ | wc -l)
echo "✅ Found $AUTH_MIDDLEWARE authentication middleware instances"

# Check for rate limiting
echo ""
echo "🔍 Checking for rate limiting..."
RATE_LIMITING=$(grep -r "rateLimit\|rateLimiter" --include="*.ts" --include="*.js" src/ | wc -l)
echo "✅ Found $RATE_LIMITING rate limiting instances"

# Check for input validation
echo ""
echo "🔍 Checking for input validation..."
INPUT_VALIDATION=$(grep -r "validate\|validation" --include="*.ts" --include="*.js" src/ | wc -l)
echo "✅ Found $INPUT_VALIDATION input validation instances"

# Check for CORS configuration
echo ""
echo "🔍 Checking for CORS configuration..."
CORS_CONFIG=$(grep -r "cors\|CORS" --include="*.ts" --include="*.js" src/ | wc -l)
echo "✅ Found $CORS_CONFIG CORS configuration instances"

# Check for helmet security headers
echo ""
echo "🔍 Checking for security headers..."
SECURITY_HEADERS=$(grep -r "helmet" --include="*.ts" --include="*.js" src/ | wc -l)
echo "✅ Found $SECURITY_HEADERS security header instances"

echo ""
echo "🔒 Security Audit Complete"
echo "==========================" 