<h1 align="center">
  <a href="https://www.clarifai.com/"><img alt="Clarifai" title="Clarifai" src="https://upload.wikimedia.org/wikipedia/commons/b/bc/Clarifai_Logo_FC_Web.png"></a>
</h1>

<h2 align="center">
Clarifai Node.js SDK</a>
</h2>

[![npm](https://img.shields.io/npm/v/clarifai-nodejs)](https://www.npmjs.com/package/clarifai-nodejs)
[![Build](https://github.com/Clarifai/clarifai-nodejs/actions/workflows/build.yml/badge.svg)](https://github.com/Clarifai/clarifai-nodejs/actions/workflows/build.yml)
[![Discord](https://img.shields.io/discord/1145701543228735582)](https://discord.com/invite/26upV8Y4Nd)

> This library is currently in developer preview, any improvements & feedback welcome!

# Clarifai Node.js SDK

This is the official Node.js client for interacting with our powerful [API](https://docs.clarifai.com). The Clarifai Node.js SDK offers a comprehensive set of tools to integrate Clarifai's AI platform to leverage computer vision capabilities like classification, detection, segmentation and natural language capabilities like classification, summarisation, generation, Q&A, etc into your applications. With just a few lines of code, you can leverage cutting-edge artificial intelligence to unlock valuable insights from visual and textual content.

[Website](https://www.clarifai.com/) | [Schedule Demo](https://www.clarifai.com/company/schedule-demo) | [Signup for a Free Account](https://clarifai.com/signup) | [API Docs](https://docs.clarifai.com/) | [Clarifai Community](https://clarifai.com/explore) | [Node.js SDK Docs](https://docs.clarifai.com/nodejs-sdk/api-reference) | [Examples](https://github.com/Clarifai/clarifai-nodejs/tree/main/examples) | [Discord](https://discord.gg/XAPE3Vtg)

Give the repo a star ⭐

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

Clarifai uses **Personal Access Tokens(PATs)** to validate requests. You can create and manage PATs under your Clarifai account security settings.

* 🔗 [Create PAT:](https://docs.clarifai.com/clarifai-basics/authentication/personal-access-tokens/) ***Log into Portal &rarr; Profile Icon &rarr; Security Settings &rarr; Create Personal Access Token &rarr; Set the scopes &rarr; Confirm***

Export your PAT as an environment variable. Then, import and initialize the API Client.

Set PAT as environment variable through terminal:

```cmd
export CLARIFAI_PAT={your personal access token}
```

or use [dotenv](https://www.npmjs.com/package/dotenv) to load environment variables via a `.env` file

### Using Models

Using the celebrity face recognition model to predict the celebrity in a given picture. For list of all available models visit [clarifai models page](https://clarifai.com/explore/models).

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

Using a custom workflow built on [clarifai.com](https://docs.clarifai.com/portal-guide/workflows/) to analyze sentiment of a given image. For list of all available workflows visit [clarifai workflows page](https://clarifai.com/explore/workflows)

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

On Clarifai, apps act as a central repository for models, datasets, inputs and other resources and information. Checkout how to create apps on [clarifai portal](https://docs.clarifai.com/clarifai-basics/applications/create-an-application/).

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

For full usage details, checkout our [API Reference docs](https://docs.clarifai.com/nodejs-sdk/installation-guide/modules)
