<h1 align="center">
  <a href="https://www.clarifai.com/"><img alt="Clarifai" title="Clarifai" src="https://upload.wikimedia.org/wikipedia/commons/b/bc/Clarifai_Logo_FC_Web.png"></a>
</h1>

<h2 align="center">
Clarifai Node.js SDK</a>
</h2>

[![npm](https://img.shields.io/npm/v/clarifai-nodejs)](https://www.npmjs.com/package/clarifai-nodejs)
[![Build](https://github.com/Clarifai/clarifai-nodejs/actions/workflows/build.yml/badge.svg)](https://github.com/Clarifai/clarifai-nodejs/actions/workflows/build.yml)
[![Discord](https://img.shields.io/discord/1145701543228735582)](https://discord.com/invite/26upV8Y4Nd)

> This library is currently in Developer preview, any improvements & feedback welcome!

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
    serverComponentsExternalPackages: ['clarifai-nodejs-grpc'],
  },
}

module.exports = nextConfig
```

## Usage

### Using Models

Using the celebrity face recognition model to predict the celebrity in a given picture. For list of all available models visit [our models page](https://clarifai.com/explore/models).

```ts
import { Input, Model } from "clarifai-nodejs";

const input = Input.getInputFromUrl({
  inputId: "test-image",
  imageUrl:
    "https://samples.clarifai.com/celebrity.jpeg",
});

const model = new Model({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!
  },
  modelId: "celebrity-face-recognition",
});

model
  .predict({
    inputs: [input],
  })
  .then((response) => {
    const result = response?.[0].data?.conceptsList[0].name ?? "unrecognized";
    console.log(result);
  })
  .catch(console.error);
```

### Using Workflows

Using a custom workflow built on [clarifai.com](https://docs.clarifai.com/portal-guide/workflows/) to analyze sentiment of a given image. For list of all available workflows visit [our workflows page](https://clarifai.com/explore/workflows)

```ts
import { Input, Workflow } from "clarifai-nodejs";

const input = Input.getInputFromUrl({
  inputId: "test-image",
  imageUrl:
    "https://samples.clarifai.com/celebrity.jpeg",
});

const workflow = new Workflow({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!
  },
  workflowId: "workflow-238a93",
});

workflow
  .predict({
    inputs: [input],
  })
  .then((response) => {
    const result =
      response.resultsList[0].outputsList[0].data?.regionsList[0].data
        ?.conceptsList[0].name ?? "unrecognized";
    console.log(result);
  })
  .catch(console.error);
```

### Listing available apps in an user account

On Clarifai, apps act as a central repository for models, datasets, inputs and other resources and information. Checkout how to create apps on [our portal](https://docs.clarifai.com/clarifai-basics/applications/create-an-application/).

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

For full usage details, checkout our [API Reference docs](https://docs.clarifai.com/nodejs-sdk/api-reference)

## Versioning

This library doesn't use semantic versioning. The first two version numbers (`X.Y` out of `X.Y.Z`) follow the API (backend) versioning, and whenever the API gets updated, this library follows it.

The third version number (`Z` out of `X.Y.Z`) is used by this library for any independent releases of library-specific improvements and bug fixes.

The developer preview versions of the SDK will follow `0.0.V` format where `V` simply a bump from previous developer preview version update
