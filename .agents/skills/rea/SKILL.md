---
name: rea
description: Reverse engineer, inspect, decompile, and analyze native binaries (PE, ELF, Mach-O), Android APKs, JavaScript/Electron bundles, WebAssembly, and SQLite databases using the REA MCP server and CLI. Use when the user wants to inspect compiled software, extract strings or symbols, analyze app architectures, decompile functions, or investigate binary behavior.
---

# REA (Reverse Engineer Anything) Skill

REA connects AI coding agents to reverse engineering, static analysis, and runtime inspection tools. It provides structured evidence (pseudocode, call graphs, cross-references, memory inspections) for binaries, web/Electron apps, Android packages, and firmware.

## Quick CLI Reference

```bash
# Verify REA status and tool catalog
rea mcp doctor

# Inspect binaries and extract symbols / strings
rea inspect-binary <path>
rea search <path> [pattern]
rea xrefs <path> [address]

# Decompile and disassemble
rea decompile <path> [address]
rea disassemble <path> [address]
rea instructions <path> [address]

# Recover JavaScript from Electron or web apps
rea recover-javascript-sources <path> <outputDirectory>

# Android APK analysis
rea search-android-classes <path> <query>
rea trace-android-references <path> <className>

# SQLite snapshot inspection
rea inspect-sqlite-database <path>
```

## MCP Integration Details

- **MCP Identifier:** `rea`
- **Transport:** Stdio
- **Tool Inventory:** 207 tools, 6 prompts
- **Configuration:** Registered in `~/.gemini/config/mcp_config.json`
- **Executable:** `node "C:\Users\HARIKANTH S S\AppData\Roaming\npm\node_modules\rea-agents\scripts\rea.mjs" --mcp`
