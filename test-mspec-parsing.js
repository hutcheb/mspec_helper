#!/usr/bin/env node

/**
 * Comprehensive test script to parse all PLC4X mspec files and identify parsing issues
 */

const fs = require('fs');
const path = require('path');

// Import the parser components
const { Lexer } = require('./server/out/parser/lexer');
const { MSpecParser } = require('./server/out/parser/parser');

// Test files to parse
const testFiles = [
    'test-files/s7.mspec',
    'test-files/modbus.mspec', 
    'test-files/ads.mspec',
    'examples/simple-example.mspec',
    'examples/s7-excerpt.mspec'
];

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

function parseFile(filePath) {
    console.log(colorize(`\n📄 Parsing: ${filePath}`, 'cyan'));
    console.log('='.repeat(60));
    
    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.log(colorize(`❌ File not found: ${filePath}`, 'red'));
            return { success: false, error: 'File not found' };
        }
        
        // Read file content
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(colorize(`📊 File size: ${content.length} characters`, 'blue'));
        
        // Tokenize
        console.log(colorize('🔍 Tokenizing...', 'yellow'));
        const lexer = new Lexer(content);
        const tokens = lexer.tokenize();
        console.log(colorize(`✅ Tokenization successful: ${tokens.length} tokens`, 'green'));
        
        // Show token summary
        const tokenTypes = {};
        tokens.forEach(token => {
            tokenTypes[token.type] = (tokenTypes[token.type] || 0) + 1;
        });
        
        console.log(colorize('📈 Token summary:', 'blue'));
        Object.entries(tokenTypes)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10) // Show top 10 token types
            .forEach(([type, count]) => {
                console.log(`  ${type}: ${count}`);
            });
        
        // Parse
        console.log(colorize('🔧 Parsing...', 'yellow'));
        const parser = new MSpecParser();
        const ast = parser.parse(tokens);
        console.log(colorize(`✅ Parsing successful: ${ast.definitions.length} definitions`, 'green'));
        
        // Show definition summary
        const defTypes = {};
        ast.definitions.forEach(def => {
            defTypes[def.type] = (defTypes[def.type] || 0) + 1;
        });
        
        console.log(colorize('📋 Definition summary:', 'blue'));
        Object.entries(defTypes).forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`);
        });
        
        // Show definition names
        console.log(colorize('📝 Definitions found:', 'blue'));
        ast.definitions.slice(0, 20).forEach((def, index) => {
            const name = def.name || 'unnamed';
            console.log(`  ${index + 1}. ${def.type}: ${name}`);
        });
        
        if (ast.definitions.length > 20) {
            console.log(`  ... and ${ast.definitions.length - 20} more`);
        }
        
        return { 
            success: true, 
            tokens: tokens.length, 
            definitions: ast.definitions.length,
            tokenTypes,
            defTypes,
            ast
        };
        
    } catch (error) {
        console.log(colorize(`❌ Error: ${error.message}`, 'red'));
        if (error.stack) {
            console.log(colorize('Stack trace:', 'red'));
            console.log(error.stack);
        }
        return { success: false, error: error.message };
    }
}

function main() {
    console.log(colorize('🚀 MSpec Parser Test Suite', 'magenta'));
    console.log(colorize('Testing PLC4X mspec files for parsing issues\n', 'magenta'));
    
    const results = [];
    let totalSuccess = 0;
    let totalFailures = 0;
    
    for (const filePath of testFiles) {
        const result = parseFile(filePath);
        results.push({ filePath, ...result });
        
        if (result.success) {
            totalSuccess++;
        } else {
            totalFailures++;
        }
    }
    
    // Summary
    console.log(colorize('\n📊 SUMMARY', 'magenta'));
    console.log('='.repeat(60));
    console.log(colorize(`✅ Successful parses: ${totalSuccess}`, 'green'));
    console.log(colorize(`❌ Failed parses: ${totalFailures}`, 'red'));
    console.log(colorize(`📁 Total files tested: ${testFiles.length}`, 'blue'));
    
    if (totalFailures > 0) {
        console.log(colorize('\n🔍 FAILURES:', 'red'));
        results.filter(r => !r.success).forEach(result => {
            console.log(colorize(`  ${result.filePath}: ${result.error}`, 'red'));
        });
    }
    
    if (totalSuccess > 0) {
        console.log(colorize('\n📈 STATISTICS:', 'green'));
        const successfulResults = results.filter(r => r.success);
        const totalTokens = successfulResults.reduce((sum, r) => sum + r.tokens, 0);
        const totalDefinitions = successfulResults.reduce((sum, r) => sum + r.definitions, 0);
        
        console.log(`  Total tokens parsed: ${totalTokens}`);
        console.log(`  Total definitions parsed: ${totalDefinitions}`);
        console.log(`  Average tokens per file: ${Math.round(totalTokens / totalSuccess)}`);
        console.log(`  Average definitions per file: ${Math.round(totalDefinitions / totalSuccess)}`);
    }
    
    // Exit with appropriate code
    process.exit(totalFailures > 0 ? 1 : 0);
}

if (require.main === module) {
    main();
}

module.exports = { parseFile, testFiles };
