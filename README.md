# Pinata NFT CLI

A modern, TypeScript-driven command-line interface (CLI) for managing NFT assets with Pinata. The tooling orchestrates hashing, CID generation, bulk uploads, and download reconciliation while embracing SOLID design, reusable option groups, and structured logging.

## Table of Contents

- [Pinata NFT CLI](#pinata-nft-cli)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Features](#features)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Build \& Run](#build--run)
  - [CLI Command Reference](#cli-command-reference)
    - [Global Flags](#global-flags)
    - [`hash`](#hash)
    - [`cid`](#cid)
    - [`upload files`](#upload-files)
    - [`upload folder`](#upload-folder)
    - [`download`](#download)
  - [Workflow Examples](#workflow-examples)
  - [Developer Tooling](#developer-tooling)
  - [Troubleshooting](#troubleshooting)

## Overview

`pinata-cli` wraps complex NFT processing flows into focused commands:

- Calculate and persist deterministic file hashes or IPFS CIDs.
- Upload individual assets or whole folders with rate limiting and metadata support.
- Reconcile remote Pinata states by downloading status-filtered CID maps.
- Produce auditable logs using the structured observability pipeline baked into the CLI.

## Features

- Built with Commander for consistent UX and nested sub-commands.
- Shared option groups ensure every command honours the same folder and output conventions.
- Declarative rate limiting (concurrency plus pacing) keeps uploads resilient against API quotas.
- Fully typed processors and utilities with dedicated unit tests.
- Batteries-included developer scripts for linting, formatting, duplication checks, and dependency surfacing.

## Requirements

- Node.js 18.0 or newer (LTS recommended).
- npm 9 or newer (ships with Node LTS releases).
- A Pinata account with API Key and API Secret.
- Optional: a `.env` file at the project root for local development.

## Installation

```bash
# Clone the repository
git clone https://github.com/Coderrob/pinata-nft-cli.git
cd pinata-nft-cli

# Install dependencies
npm install
```

## Configuration

Create a `.env` file at the repository root (the CLI auto-loads environment variables through dotenv).

```ini
PINATA_API_KEY="<your-api-key>"
PINATA_API_SECRET="<your-api-secret>"
LOG_LEVEL="info"        # optional: trace|debug|info|warn|error
```

> Tip: never commit secrets. Use environment-specific stores for CI/CD (for example GitHub Actions secrets or AWS Parameter Store).

## Build & Run

```bash
# Compile TypeScript to ./dist
npm run build

# Run the compiled CLI
node dist/cli.js --help

# Or run directly with ts-node during development
npm run dev -- --help
```

You can also expose the CLI via npm scripts:

```bash
# Parse arguments after the double dash
npm run cli -- upload files --folder ./files
```

Choose `npm run dev -- --help` or `node dist/cli.js --help` at any point to inspect the latest CLI surface.

## CLI Command Reference

The root command is named `pinata-cli`. Commands can be combined with the global flags listed below.

### Global Flags

- `--verbose` - enable verbose logging (forces `NODE_ENV=development`).
- `--dry-run` - output the work that would be performed without executing it.

Run `pinata-cli <command> --help` to see command-specific flags and defaults.

### `hash`

Calculate SHA-256 hashes for every file in a folder (with an optional hash-of-hashes manifest).

| Flag | Description | Default |
| --- | --- | --- |
| `-f, --folder <path>` | Folder containing files to hash | `files` |
| `-o, --output <path>` | Output JSON path for the file->hash map | `./output/file-hashes.json` |
| `--final-output <path>` | Optional output path for the hash of hashes manifest | `./output/file-hashOfHashes.json` |
| `-c, --concurrent <number>` | Concurrent hashing workers (1-10) | `5` |

### `cid`

Generate IPFS CIDs for each file within a folder using the local hashing algorithm that mirrors Pinata.

| Flag | Description | Default |
| --- | --- | --- |
| `-f, --folder <path>` | Folder containing assets to hash | `files` |
| `-o, --output <path>` | Output JSON path for the file->CID map | `./output/file-cids.json` |
| `-c, --concurrent <number>` | Concurrent hashing workers (1-10) | `5` |

### `upload files`

Upload individual files from a folder to Pinata. Each file is pinned separately; rate limiting prevents API saturation.

| Flag | Description | Default |
| --- | --- | --- |
| `-f, --folder <path>` | Folder containing files to upload | `files` |
| `-o, --output <path>` | Output JSON for uploaded file->CID map | `./output/uploaded-files.json` |
| `-c, --concurrent <number>` | Concurrent upload requests (1-10) | `1` |
| `--min-time <number>` | Minimum delay between requests in milliseconds (>= 100) | `3000` |

### `upload folder`

Upload an entire folder structure as a single Pinata directory, optionally providing a display name.

| Flag | Description | Default |
| --- | --- | --- |
| `-f, --folder <path>` | Metadata folder to upload | `metadata` |
| `-o, --output <path>` | Output JSON containing the folder CID | `./output/folder-cid.json` |
| `-n, --name <name>` | Display name for the folder within Pinata | _undefined_ |

### `download`

Fetch pinned item metadata from Pinata and persist the resulting CID map locally.

| Flag | Description | Default |
| --- | --- | --- |
| `-o, --output <path>` | Output JSON containing the remote CID map | `./output/downloaded-cids.json` |
| `-s, --status <status>` | Pin status filter (`all`, `pinned`, `unpinned`) | `all` |

## Workflow Examples

```bash
# 1. Calculate CIDs for local artwork
pinata-cli cid --folder ./assets/images --output ./output/artwork-cids.json

# 2. Upload metadata JSON files with throttled concurrency
pinata-cli upload files --folder ./metadata --output ./output/metadata-upload.json --concurrent 3 --min-time 750

# 3. Upload the metadata folder as a single directory with a custom display name
pinata-cli upload folder --folder ./metadata --name "Genesis Metadata" --output ./output/folder-cid.json

# 4. Download the list of currently pinned files for auditing
pinata-cli download --status pinned --output ./output/pinned-cids.json

# 5. Calculate hashes plus a hash-of-hashes manifest for provenance
pinata-cli hash --folder ./assets/images --final-output ./output/artwork-hash-of-hashes.json
```

## Developer Tooling

The project contains a set of scripts to maintain code quality.

| Command | Description |
| --- | --- |
| `npm run build` | Compile TypeScript sources to `dist/`. |
| `npm run dev -- <args>` | Execute the CLI with ts-node (ideal for rapid iteration). |
| `npm test` | Run the unit test suite (Jest). |
| `npm run lint` | Execute ESLint with the project configuration. |
| `npm run format:check` / `npm run format` | Validate or auto-format with Prettier. |
| `npm run complexity` | Enforce cyclomatic complexity budgets. |
| `npm run duplication` | Detect copy and paste duplication using jscpd. |
| `npm run knip` | Surface unused files and exports. |
| `npm run validate` | Run the full lint, style, duplication, dependency, and test pipeline. |

## Troubleshooting

- **Missing API credentials** - both `PINATA_API_KEY` and `PINATA_API_SECRET` must be set; commands will exit with a descriptive error otherwise.
- **EADDRINUSE or EMFILE errors** - reduce `--concurrent` or increase `--min-time` to relieve pressure on the Pinata API.
- **Permission denied on output files** - ensure the `./output` directory exists and you have write permissions (the CLI creates files but does not create the directory).
- **Verbose debugging** - pass `--verbose` for expanded logs or set `LOG_LEVEL=debug` in your environment.

---

If you discover a bug or have an idea for an enhancement, please open an issue or pull request at <https://github.com/Coderrob/pinata-nft-cli>.
