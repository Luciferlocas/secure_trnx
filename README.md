# Secure Transaction Service

A monorepo containing a secure transaction service with envelope encryption, built with TurboRepo, Next.js, Fastify, and TypeScript.

## Structure

- **apps/web**: Next.js frontend for encrypting and decrypting payloads.
- **apps/api**: Fastify backend API handling encryption requests and storage.
- **packages/crypto**: Shared library implementing AES-256-GCM envelope encryption logic.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Installation

```bash
pnpm install
```

### Running Locally

```bash
pnpm build && pnpm dev
```

We run pnpm build before pnpm dev because shared packages (crypto, schema, api-client) are compiled TypeScript libraries. The apps depend on their compiled output in dist/.

- **Web App**: http://localhost:3000
- **API**: http://localhost:3001

### Testing

Run the crypto package tests:

```bash
pnpm test --filter @repo/crypto
```

## Architecture & Security

### Encryption Strategy (Envelope Encryption)

1.  **Data Encryption Key (DEK)**: A random 32-byte key is generated for each transaction.
2.  **Payload Encryption**: The JSON payload is encrypted using the DEK with AES-256-GCM.
3.  **Key Wrapping**: The DEK is encrypted (wrapped) using a Master Key (MK) with AES-256-GCM.
4.  **Storage**: The encrypted payload, wrapped DEK, and all initialization vectors (IVs) and authentication tags are stored.

### Security Features

- **Authenticated Encryption**: Uses AES-GCM for both confidentiality and integrity.
- **Unique IVs**: Random IVs generated for every encryption operation.
- **Strict Validation**: Checks for correct key lengths, IV lengths (12 bytes), and tag lengths (16 bytes) before decryption.
- **Tamper Resistance**: Any modification to the ciphertext or tags will cause decryption to fail.

## API Endpoints

- `POST /tx/encrypt`: Encrypts a payload.
- `GET /tx/:id`: Retrieves an encrypted record.
- `POST /tx/:id/decrypt`: Decrypts a stored record.
