clarifai-nodejs / [Exports](modules.md)

![Clarifai logo](https://www.clarifai.com/hubfs/Clarifai-logo-dark.svg)

[![npm](https://img.shields.io/npm/v/clarifai-nodejs)](https://www.npmjs.com/package/clarifai-nodejs)
[![Build](https://github.com/Clarifai/clarifai-nodejs/workflows/Run%20tests/badge.svg)](https://github.com/Clarifai/clarifai-nodejs/actions)

# Clarifai Node.js SDK

This is the official Clarifai Node.js SDK for interacting with our [API](https://docs.clarifai.com).
Clarifai provides a platform for data scientists, developers, researchers and enterprises to master the entire artificial intelligence lifecycle. Gather valuable business insights from images, video and text using computer vision and natural language processing.

- Try the Clarifai demo at: https://clarifai.com/demo
- Sign up for a free account at: https://portal.clarifai.com/signup
- Read the documentation at: https://docs.clarifai.com/

## Installation

```sh
npm install clarifai-nodejs
```

### Next.js Server Components

To use Clarifai Node.js in Next.js App Directory with server components, you will need to add [clarifai-nodejs-grpc](https://github.com/Clarifai/clarifai-nodejs-grpc) package (which is one of the primary dependency of Clarifai Node.js SDK) to the [serverComponentsExternalPackages](https://nextjs.org/docs/app/api-reference/next-config-js/serverComponentsExternalPackages) config of `next.config.js`

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@acme/ui'],
  },
}

module.exports = nextConfig
```

## Usage

```ts
import { User } from "clarifai-nodejs";

export const user = new User({
  pat: process.env.CLARIFAI_PAT!,
  userId: process.env.CLARIFAI_USER_ID!,
  appId: process.env.CLARIFAI_APP_ID!,
});

const list = await user
  .listApps({
    pageNo: 1,
    perPage: 20,
    params: {
      sortAscending: true,
    },
  })
  .next();

const apps = list.value;
console.log(apps);
```

For full usage details, checkout API Reference: 

## Versioning

This library doesn't use semantic versioning. The first two version numbers (`X.Y` out of `X.Y.Z`) follow the API (backend) versioning, and whenever the API gets updated, this library follows it.

The third version number (`Z` out of `X.Y.Z`) is used by this library for any independent releases of library-specific improvements and bug fixes.
