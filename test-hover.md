# Testing Hover Functionality

## Steps to test hover in the VSIX extension:

1. **Install the VSIX**:
   - Open VSCode
   - Go to Extensions (Ctrl+Shift+X)
   - Click the "..." menu and select "Install from VSIX..."
   - Select the `mspec-language-support-1.0.0.vsix` file
   - **Important**: Reload VSCode after installation

2. **Verify extension activation**:
   - Check that "MSpec Language Support" appears in the Extensions list
   - Open the Command Palette (Ctrl+Shift+P) and verify "MSpec:" commands are
     available

3. **Open an MSpec file**:
   - Open `examples/simple-example.mspec`
   - Ensure the file is recognized as MSpec (check the language mode in the
     bottom right)
   - If not recognized, click on the language mode and select "MSpec"

4. **Enable verbose logging**:
   - Open Settings (Ctrl+,)
   - Search for "mspec.trace.server"
   - Set it to "verbose"
   - Reload VSCode

5. **Test hover on different elements**:
   - Hover over keywords like `type`, `simple`, `uint`, `const`
   - Hover over field names like `messageType`, `messageId`, `payloadLength`
   - Hover over data types like `uint`, `byte`, `string`

6. **Check the output**:
   - Open the Command Palette (Ctrl+Shift+P)
   - Run "MSpec: Show MSpec Output"
   - Look for hover-related log messages

## Expected behavior:

- Hovering over keywords should show documentation
- Hovering over data types should show type information
- Hovering over field names should show field details
- The output channel should show hover requests and responses

## Common issues to check:

1. **Server not starting**: Check if the server-bundled.js file exists in the
   extension
2. **Language not recognized**: Check if the file has .mspec extension
3. **No hover response**: Check the output channel for error messages
4. **Server path issues**: Verify the bundled server is included in the VSIX

## Debugging steps:

1. Enable verbose logging:

   ```json
   {
     "mspec.trace.server": "verbose"
   }
   ```

2. Check server capabilities in the output:
   - Should show "Hover Provider: true"

3. Look for hover request logs:
   - "Hover requested at line:character"
   - "Hover response received" or "No hover response"

4. Check for parsing errors:
   - Any lexer or parser errors in the output
