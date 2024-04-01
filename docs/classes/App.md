[clarifai-nodejs](../README.md) / [Exports](../modules.md) / App

# Class: App

App is a class that provides access to Clarifai API endpoints related to App information.

## Hierarchy

- `Lister`

  ↳ **`App`**

## Table of contents

### Constructors

- [constructor](App.md#constructor)

### Properties

- [appInfo](App.md#appinfo)

### Methods

- [createDataset](App.md#createdataset)
- [createModel](App.md#createmodel)
- [createModule](App.md#createmodule)
- [createWorkflow](App.md#createworkflow)
- [dataset](App.md#dataset)
- [deleteDataset](App.md#deletedataset)
- [deleteModel](App.md#deletemodel)
- [deleteModule](App.md#deletemodule)
- [deleteWorkflow](App.md#deleteworkflow)
- [listConcepts](App.md#listconcepts)
- [listDataSets](App.md#listdatasets)
- [listInstalledModuleVersions](App.md#listinstalledmoduleversions)
- [listModels](App.md#listmodels)
- [listModules](App.md#listmodules)
- [listTrainableModelTypes](App.md#listtrainablemodeltypes)
- [listWorkflows](App.md#listworkflows)
- [model](App.md#model)
- [workflow](App.md#workflow)

## Constructors

### constructor

• **new App**(`config`): [`App`](App.md)

Initializes an App object.

### Example
```ts
import { App } from "clarifai-nodejs";

export const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `config` | [`AppConfig`](../modules.md#appconfig) | The configuration object for the App. |

#### Returns

[`App`](App.md)

#### Overrides

Lister.constructor

#### Defined in

[client/app.ts:98](https://github.com/Clarifai/clarifai-nodejs/blob/a140e93/src/client/app.ts#L98)

## Properties

### appInfo

• `Private` **appInfo**: `App`

#### Defined in

[client/app.ts:83](https://github.com/Clarifai/clarifai-nodejs/blob/a140e93/src/client/app.ts#L83)

## Methods

### createDataset

▸ **createDataset**(`«destructured»`): `Promise`\<`AsObject`\>

Creates a dataset for the app.

### Example
```ts
import { Input, App } from "clarifai-nodejs";

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

const dataset = await app.createDataset({
  datasetId: "dog-image-collection",
});

// Dataset is created, now let's build an image input that uses the new dataset id
const inputProto = Input.getInputFromUrl({
  datasetId: dataset.id,
  inputId: "dog-tiff",
  imageUrl: "https://samples.clarifai.com/dog.tiff",
  labels: ["dog"],
  geoInfo: {
    latitude: 40,
    longitude: -30,
  },
  metadata: { Breed: "Saint Bernard" },
});

const input = new Input({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

// upload the input by using instance of the Input class
// this input will be stored under the newly created dataset
const inputJobId = await input.uploadInputs({
  inputs: [inputProto],
});

console.log(inputJobId); // job id of the input upload
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `datasetId` | `string` |
| › `params?` | [`CreateDatasetParam`](../modules.md#createdatasetparam) |

#### Returns

`Promise`\<`AsObject`\>

A Dataset object for the specified dataset ID.

#### Defined in

[client/app.ts:420](https://github.com/Clarifai/clarifai-nodejs/blob/a140e93/src/client/app.ts#L420)

___

### createModel

▸ **createModel**(`«destructured»`): `Promise`\<`AsObject`\>

Creates a model for the app.

### Example
```ts
import { Model, App } from "clarifai-nodejs";
import {
  ModelVersion,
  OutputInfo,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { Struct } from "google-protobuf/google/protobuf/struct_pb";

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

// Creating a new image crop model
const newModelObject = await app.createModel({
  modelId: "margin-100-image-cropper",
  params: {
    modelTypeId: "image-crop",
    description: "Custom crop model with 100px margin",
  },
});

// Initializing the newly created model
const model = new Model({
  modelId: newModelObject.id,
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

// Creating a GRPC compatible outputInfo object with custom margin parameters
const outputInfo = new OutputInfo().setParams(
  Struct.fromJavaScript({ margin: 1.5 }),
);
// GRPC compatible ModelVersion object with previously created output info config
const modelVersion = new ModelVersion()
  .setDescription("Setting output info margin parameters to 1.5")
  .setOutputInfo(outputInfo);

// Creating a new version of the model with previously created output info config
const modelObjectWithVersion = await model.createVersion(modelVersion);

console.log(modelObjectWithVersion);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `modelId` | `string` |
| › `params?` | [`CreateModelParam`](../modules.md#createmodelparam) |

#### Returns

`Promise`\<`AsObject`\>

A Model object for the specified model ID.

#### Defined in

[client/app.ts:462](https://github.com/Clarifai/clarifai-nodejs/blob/a140e93/src/client/app.ts#L462)

___

### createModule

▸ **createModule**(`«destructured»`): `Promise`\<`AsObject`\>

Creates a module for the app.

### Example
```ts
import { App } from "clarifai-nodejs";

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

const module = await app.createModule({
  moduleId: "new-module",
  description: "New module",
});

console.log(module);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `description` | `string` |
| › `moduleId` | `string` |

#### Returns

`Promise`\<`AsObject`\>

A Module object for the specified module ID.

#### Defined in

[client/app.ts:501](https://github.com/Clarifai/clarifai-nodejs/blob/a140e93/src/client/app.ts#L501)

___

### createWorkflow

▸ **createWorkflow**(`«destructured»`): `Promise`\<`AsObject`\>

Creates a workflow for the app.

### Example
```ts
import { App } from "clarifai-nodejs";
import path from "path";

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});
const workflowFile = path.resolve(__dirname, "workflow/moderation.yml");
const workflow = await app.createWorkflow({ configFilePath: workflowFile });
console.log(workflow);

/**
 * Workflow config file in the path `workflow/moderation.yml`:
 */
/*
workflow:
  id: test-mbmn
  nodes:
    - id: detector
      model:
          modelId: face-detection
          modelVersionId: 45fb9a671625463fa646c3523a3087d5
    - id: cropper
      model:
          modelId: margin-110-image-crop
          modelVersionId: b9987421b40a46649566826ef9325303
      nodeInputs:
        - nodeId: detector
    - id: face-sentiment
      model:
          modelId: face-sentiment-recognition
          modelVersionId: a5d7776f0c064a41b48c3ce039049f65
      nodeInputs:
        - nodeId: cropper
    - id: moderation
      model:
          modelId: moderation-recognition
          modelVersionId: 7cde8e92896340b0998b8260d47f1502
*/
```

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `configFilePath` | `string` | `undefined` |
| › `display?` | `boolean` | `true` |
| › `generateNewId?` | `boolean` | `false` |

#### Returns

`Promise`\<`AsObject`\>

A Workflow object for the specified workflow config.

#### Defined in

[client/app.ts:537](https://github.com/Clarifai/clarifai-nodejs/blob/a140e93/src/client/app.ts#L537)

___

### dataset

▸ **dataset**(`dataset_id`): `Promise`\<`undefined` \| `AsObject`\>

Returns a Dataset object for the existing dataset ID.

### Example
```ts
import { App } from "clarifai-nodejs";

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});
const dataset = await app.dataset({
  datasetId: "dataset-id",
});
console.log(dataset);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `dataset_id` | `Object` | The dataset ID for the dataset to interact with. |
| `dataset_id.datasetId` | `string` | - |

#### Returns

`Promise`\<`undefined` \| `AsObject`\>

A Dataset object for the existing dataset ID.

#### Defined in

[client/app.ts:727](https://github.com/Clarifai/clarifai-nodejs/blob/a140e93/src/client/app.ts#L727)

___

### deleteDataset

▸ **deleteDataset**(`datasetId`): `Promise`\<`void`\>

Deletes a dataset for the user.

### Example
```ts
import { App } from "clarifai-nodejs";

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

await app.deleteDataset({ datasetId: "dataset-id" });
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `datasetId` | `Object` | The dataset ID for the app to delete. |
| `datasetId.datasetId` | `string` | - |

#### Returns

`Promise`\<`void`\>

#### Defined in

[client/app.ts:754](https://github.com/Clarifai/clarifai-nodejs/blob/a140e93/src/client/app.ts#L754)

___

### deleteModel

▸ **deleteModel**(`modelId`): `Promise`\<`void`\>

Deletes a model for the user.

### Example
```ts
import { App } from "clarifai-nodejs";

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

await app.deleteModel({ modelId: "modelId" });
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `modelId` | `Object` | The model ID for the model to delete. |
| `modelId.modelId` | `string` | - |

#### Returns

`Promise`\<`void`\>

#### Defined in

[client/app.ts:777](https://github.com/Clarifai/clarifai-nodejs/blob/a140e93/src/client/app.ts#L777)

___

### deleteModule

▸ **deleteModule**(`moduleId`): `Promise`\<`void`\>

Deletes a module for the user.

### Example
```ts
import { App } from "clarifai-nodejs";

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

await app.deleteModule({ moduleId: "moduleId" });
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `moduleId` | `Object` | The module ID for the module to delete. |
| `moduleId.moduleId` | `string` | - |

#### Returns

`Promise`\<`void`\>

#### Defined in

[client/app.ts:823](https://github.com/Clarifai/clarifai-nodejs/blob/a140e93/src/client/app.ts#L823)

___

### deleteWorkflow

▸ **deleteWorkflow**(`workflowId`): `Promise`\<`void`\>

Deletes a workflow for the user.

### Example
```ts
import { App } from "clarifai-nodejs";

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

await app.deleteWorkflow({ workflowId: "workflowId" });
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `workflowId` | `Object` | The workflow ID for the workflow to delete. |
| `workflowId.workflowId` | `string` | - |

#### Returns

`Promise`\<`void`\>

#### Defined in

[client/app.ts:800](https://github.com/Clarifai/clarifai-nodejs/blob/a140e93/src/client/app.ts#L800)

___

### listConcepts

▸ **listConcepts**(`«destructured»?`): `AsyncGenerator`\<`AsObject`[], `void`, `unknown`\>

Lists all the concepts for the app.

### Example
```ts
import { App } from "clarifai-nodejs";

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});
const list = await app.listConcepts().next();
const concepts = list.value;
console.log(concepts);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `pageNo?` | `number` |
| › `perPage?` | `number` |

#### Returns

`AsyncGenerator`\<`AsObject`[], `void`, `unknown`\>

**`Yields`**

Concepts in the app.

#### Defined in

[client/app.ts:382](https://github.com/Clarifai/clarifai-nodejs/blob/a140e93/src/client/app.ts#L382)

___

### listDataSets

▸ **listDataSets**(`«destructured»?`): `AsyncGenerator`\<`AsObject`[], `void`, `unknown`\>

Lists all the datasets for the app.

### Example
```ts
import { App } from "clarifai-nodejs";

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});
const list = await app.listDataSets().next();
const datasets = list.value;
console.log(datasets);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `pageNo?` | `number` |
| › `params?` | [`ListDatasetsParam`](../modules.md#listdatasetsparam) |
| › `perPage?` | `number` |

#### Returns

`AsyncGenerator`\<`AsObject`[], `void`, `unknown`\>

**`Yields`**

Dataset - Dataset objects for the datasets in the app.

**`Remarks`**

Defaults to 16 per page

#### Defined in

[client/app.ts:131](https://github.com/Clarifai/clarifai-nodejs/blob/a140e93/src/client/app.ts#L131)

___

### listInstalledModuleVersions

▸ **listInstalledModuleVersions**(`«destructured»?`): `AsyncGenerator`\<`AsObject`[], `void`, `unknown`\>

Lists all installed module versions in the app.

### Example
```ts
import { App } from "clarifai-nodejs";

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});
const list = await app.listInstalledModuleVersions().next();
const moduleVersions = list.value;
console.log(moduleVersions);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `pageNo?` | `number` |
| › `params?` | [`ListInstalledModuleVersionsParam`](../modules.md#listinstalledmoduleversionsparam) |
| › `perPage?` | `number` |

#### Returns

`AsyncGenerator`\<`AsObject`[], `void`, `unknown`\>

**`Yields`**

Module - Module objects for the installed module versions in the app.

**`Remarks`**

Defaults to 16 per page

#### Defined in

[client/app.ts:337](https://github.com/Clarifai/clarifai-nodejs/blob/a140e93/src/client/app.ts#L337)

___

### listModels

▸ **listModels**(`«destructured»?`): `AsyncGenerator`\<`AsObject`[], `void`, `unknown`\>

Lists all the available models for the user.

### Example
```ts
import { App } from "clarifai-nodejs";

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});
const list = await app.listModels().next();
const models = list.value;
console.log(models);
```

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `{}` |
| › `onlyInApp?` | `boolean` | `true` |
| › `pageNo?` | `number` | `undefined` |
| › `params?` | [`ListModelsParam`](../modules.md#listmodelsparam) | `{}` |
| › `perPage?` | `number` | `undefined` |

#### Returns

`AsyncGenerator`\<`AsObject`[], `void`, `unknown`\>

**`Remarks`**

Defaults to 16 per page

#### Defined in

[client/app.ts:175](https://github.com/Clarifai/clarifai-nodejs/blob/a140e93/src/client/app.ts#L175)

___

### listModules

▸ **listModules**(`«destructured»?`): `AsyncGenerator`\<`AsObject`[], `void`, `unknown`\>

Lists all the available modules for the user.

### Example
```ts
import { App } from "clarifai-nodejs";

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});
const list = await app.listModules().next();
const modules = list.value;
console.log(modules);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `onlyInApp?` | `boolean` |
| › `pageNo?` | `number` |
| › `params?` | [`ListModulesParam`](../modules.md#listmodulesparam) |
| › `perPage?` | `number` |

#### Returns

`AsyncGenerator`\<`AsObject`[], `void`, `unknown`\>

**`Yields`**

Module - Module objects for the modules in the app.

**`Remarks`**

Defaults to 16 per page

#### Defined in

[client/app.ts:286](https://github.com/Clarifai/clarifai-nodejs/blob/a140e93/src/client/app.ts#L286)

___

### listTrainableModelTypes

▸ **listTrainableModelTypes**(): `string`[]

#### Returns

`string`[]

#### Defined in

[client/app.ts:406](https://github.com/Clarifai/clarifai-nodejs/blob/a140e93/src/client/app.ts#L406)

___

### listWorkflows

▸ **listWorkflows**(`«destructured»?`): `AsyncGenerator`\<`AsObject`[], `void`, `unknown`\>

Lists all the available workflows for the user.

### Example
```ts
import { App } from "clarifai-nodejs";

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});
const list = await app.listWorkflows().next();
const workflows = list.value;
console.log(workflows);
```

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `{}` |
| › `onlyInApp?` | `boolean` | `true` |
| › `pageNo?` | `number` | `undefined` |
| › `params?` | [`ListWorkflowsParam`](../modules.md#listworkflowsparam) | `{}` |
| › `perPage?` | `number` | `undefined` |

#### Returns

`AsyncGenerator`\<`AsObject`[], `void`, `unknown`\>

**`Yields`**

Workflow - Workflow objects for the workflows in the app.

**`Remarks`**

Defaults to 16 per page

#### Defined in

[client/app.ts:233](https://github.com/Clarifai/clarifai-nodejs/blob/a140e93/src/client/app.ts#L233)

___

### model

▸ **model**(`«destructured»`): `Promise`\<`undefined` \| `AsObject`\>

Returns a Model object for the existing model ID.

### Example
```ts
import { App } from "clarifai-nodejs";

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});
const model = await app.model({
  modelId: "custom-crop-model",
  modelVersionId: "0.0.1",
});
console.log(model);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `modelId` | `string` |
| › `modelVersionId?` | `string` |

#### Returns

`Promise`\<`undefined` \| `AsObject`\>

A model object for the specified model ID.

#### Defined in

[client/app.ts:666](https://github.com/Clarifai/clarifai-nodejs/blob/a140e93/src/client/app.ts#L666)

___

### workflow

▸ **workflow**(`workflowId`): `Promise`\<`undefined` \| `AsObject`\>

Returns a Workflow object for the existing workflow ID.

### Example
```ts
import { App } from "clarifai-nodejs";

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

const workflow = await app.workflow({ workflowId: "workflowId" });
console.log(workflow);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `workflowId` | `Object` | The workflow ID for a existing workflow. |
| `workflowId.workflowId` | `string` | - |

#### Returns

`Promise`\<`undefined` \| `AsObject`\>

A workflow object for the specified workflow ID.

#### Defined in

[client/app.ts:699](https://github.com/Clarifai/clarifai-nodejs/blob/a140e93/src/client/app.ts#L699)
