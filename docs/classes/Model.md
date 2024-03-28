[clarifai-nodejs](../README.md) / [Exports](../modules.md) / Model

# Class: Model

Model is a class that provides access to Clarifai API endpoints related to Model information.

## Hierarchy

- `Lister`

  ↳ **`Model`**

## Table of contents

### Constructors

- [constructor](Model.md#constructor)

### Properties

- [STUB](Model.md#stub)
- [appId](Model.md#appid)
- [authHelper](Model.md#authhelper)
- [base](Model.md#base)
- [defaultPageSize](Model.md#defaultpagesize)
- [id](Model.md#id)
- [metadata](Model.md#metadata)
- [modelInfo](Model.md#modelinfo)
- [modelVersion](Model.md#modelversion)
- [pat](Model.md#pat)
- [trainingParams](Model.md#trainingparams)
- [userAppId](Model.md#userappid)

### Methods

- [convertStringToTimestamp](Model.md#convertstringtotimestamp)
- [createVersion](Model.md#createversion)
- [deleteVersion](Model.md#deleteversion)
- [getParamInfo](Model.md#getparaminfo)
- [getParams](Model.md#getparams)
- [grpcRequest](Model.md#grpcrequest)
- [listPagesData](Model.md#listpagesdata)
- [listPagesGenerator](Model.md#listpagesgenerator)
- [listTrainingTemplates](Model.md#listtrainingtemplates)
- [listVersions](Model.md#listversions)
- [loadInfo](Model.md#loadinfo)
- [overrideModelVersion](Model.md#overridemodelversion)
- [predict](Model.md#predict)
- [predictByBytes](Model.md#predictbybytes)
- [predictByFilepath](Model.md#predictbyfilepath)
- [predictByUrl](Model.md#predictbyurl)
- [updateParams](Model.md#updateparams)

## Constructors

### constructor

• **new Model**(`«destructured»`): [`Model`](Model.md)

Initializes a Model object.

### Example
```ts
import { Model } from "clarifai-nodejs";

export const model = new Model({
  modelId: "face-detection",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | \{ `authConfig?`: `AuthConfig` ; `modelId?`: `undefined` ; `modelVersion?`: \{ `id`: `string`  } ; `url`: `ClarifaiUrl`  } \| \{ `authConfig?`: `AuthConfig` ; `modelId`: `string` ; `modelVersion?`: \{ `id`: `string`  } ; `url?`: `undefined`  } |

#### Returns

[`Model`](Model.md)

#### Overrides

Lister.constructor

#### Defined in

[client/model.ts:65](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/model.ts#L65)

## Properties

### STUB

• `Protected` **STUB**: `V2Stub`

#### Inherited from

Lister.STUB

#### Defined in

[client/base.ts:26](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/base.ts#L26)

___

### appId

• `Private` **appId**: `string`

#### Defined in

[client/model.ts:46](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/model.ts#L46)

___

### authHelper

• `Protected` **authHelper**: `ClarifaiAuthHelper`

#### Inherited from

Lister.authHelper

#### Defined in

[client/base.ts:25](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/base.ts#L25)

___

### base

• `Protected` **base**: `string`

#### Inherited from

Lister.base

#### Defined in

[client/base.ts:30](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/base.ts#L30)

___

### defaultPageSize

• **defaultPageSize**: `number`

#### Inherited from

Lister.defaultPageSize

#### Defined in

[client/lister.ts:9](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/lister.ts#L9)

___

### id

• `Private` **id**: `string`

#### Defined in

[client/model.ts:47](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/model.ts#L47)

___

### metadata

• `Protected` **metadata**: [`string`, `string`][]

#### Inherited from

Lister.metadata

#### Defined in

[client/base.ts:27](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/base.ts#L27)

___

### modelInfo

• `Private` **modelInfo**: `Model`

#### Defined in

[client/model.ts:49](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/model.ts#L49)

___

### modelVersion

• `Private` **modelVersion**: `undefined` \| \{ `id`: `string`  }

#### Defined in

[client/model.ts:48](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/model.ts#L48)

___

### pat

• `Protected` **pat**: `string`

#### Inherited from

Lister.pat

#### Defined in

[client/base.ts:28](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/base.ts#L28)

___

### trainingParams

• `Private` **trainingParams**: `Record`\<`string`, `unknown`\>

#### Defined in

[client/model.ts:50](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/model.ts#L50)

___

### userAppId

• `Protected` **userAppId**: `UserAppIDSet`

#### Inherited from

Lister.userAppId

#### Defined in

[client/base.ts:29](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/base.ts#L29)

## Methods

### convertStringToTimestamp

▸ **convertStringToTimestamp**(`dateStr`): `Timestamp`

Converts a string to a Timestamp object.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `dateStr` | `string` | The string to convert. |

#### Returns

`Timestamp`

A Timestamp object representing the given date string.

#### Inherited from

Lister.convertStringToTimestamp

#### Defined in

[client/base.ts:95](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/base.ts#L95)

___

### createVersion

▸ **createVersion**(`modelVersion`): `Promise`\<`undefined` \| `AsObject`\>

Creates a model version for the Model.

### Example
```ts
import { Model } from "clarifai-nodejs";
import {
  ModelVersion,
  OutputInfo,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { Struct } from "google-protobuf/google/protobuf/struct_pb";

export const model = new Model({
  modelId: "margin-100-image-cropper",
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
| `modelVersion` | `ModelVersion` |

#### Returns

`Promise`\<`undefined` \| `AsObject`\>

#### Defined in

[client/model.ts:394](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/model.ts#L394)

___

### deleteVersion

▸ **deleteVersion**(`versionId`): `Promise`\<`void`\>

Deletes a model version for the Model.

### Example
```ts
import { Model } from "clarifai-nodejs";

export const model = new Model({
  modelId: "face-detection",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

model.deleteVersion("version_id");
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `versionId` | `string` | The version ID to delete. |

#### Returns

`Promise`\<`void`\>

#### Defined in

[client/model.ts:369](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/model.ts#L369)

___

### getParamInfo

▸ **getParamInfo**(`param`): `Promise`\<`Record`\<`string`, `any`\>\>

Returns the param info for the model.

### Example
```ts
import { Model } from "clarifai-nodejs";

export const model = new Model({
  modelId: "face-detection",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

model.getParamInfo("template");
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `param` | `string` |

#### Returns

`Promise`\<`Record`\<`string`, `any`\>\>

#### Defined in

[client/model.ts:307](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/model.ts#L307)

___

### getParams

▸ **getParams**(`template?`, `saveTo?`): `Promise`\<`Record`\<`string`, `any`\>\>

Returns the model params for the model type as object & also writes to a yaml file

### Example
```ts
import { Model } from "clarifai-nodejs";

export const model = new Model({
  modelId: "face-detection",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

const modelParams = await model.getParams("face-detection", "params.yml");
console.log(modelParams);
```

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `template` | ``null`` \| `string` | `null` | The training template to use for the model type. |
| `saveTo` | `string` | `"params.yaml"` | The file path to save the yaml file. |

#### Returns

`Promise`\<`Record`\<`string`, `any`\>\>

- A promise that resolves to the model params for the model type.

#### Defined in

[client/model.ts:203](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/model.ts#L203)

___

### grpcRequest

▸ **grpcRequest**\<`TRequest`, `TResponseObject`, `TResponse`\>(`endpoint`, `requestData`): `Promise`\<`TResponse`\>

Makes a gRPC request to the API.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TRequest` | extends `Message` |
| `TResponseObject` | extends `Object` |
| `TResponse` | extends `Object` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpoint` | (`request`: `TRequest`, `metadata`: `Metadata`, `options`: `Partial`\<`CallOptions`\>) => `Promise`\<`TResponse`\> |
| `requestData` | `TRequest` |

#### Returns

`Promise`\<`TResponse`\>

A Promise resolving to the result of the gRPC method call.

#### Inherited from

Lister.grpcRequest

#### Defined in

[client/base.ts:72](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/base.ts#L72)

___

### listPagesData

▸ **listPagesData**\<`TRequest`, `TResponseObject`, `TResponse`\>(`endpoint`, `requestData`, `pageNo?`, `perPage?`): `Promise`\<`TResponse`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TRequest` | extends `Message` |
| `TResponseObject` | extends `Object` |
| `TResponse` | extends `Object` |

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `endpoint` | (`request`: `TRequest`, `metadata`: `Metadata`, `options`: `Partial`\<`CallOptions`\>) => `Promise`\<`TResponse`\> | `undefined` |
| `requestData` | `TRequest` | `undefined` |
| `pageNo` | `number` | `1` |
| `perPage` | `number` | `undefined` |

#### Returns

`Promise`\<`TResponse`\>

#### Inherited from

Lister.listPagesData

#### Defined in

[client/lister.ts:86](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/lister.ts#L86)

___

### listPagesGenerator

▸ **listPagesGenerator**\<`TRequest`, `TResponseObject`, `TResponse`\>(`endpoint`, `requestData`, `pageNo?`, `perPage?`): `AsyncGenerator`\<`TResponse`, `void`, `unknown`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TRequest` | extends `Message` |
| `TResponseObject` | extends `Object` |
| `TResponse` | extends `Object` |

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `endpoint` | (`request`: `TRequest`, `metadata`: `Metadata`, `options`: `Partial`\<`CallOptions`\>) => `Promise`\<`TResponse`\> | `undefined` |
| `requestData` | `TRequest` | `undefined` |
| `pageNo` | `number` | `1` |
| `perPage` | `number` | `undefined` |

#### Returns

`AsyncGenerator`\<`TResponse`, `void`, `unknown`\>

#### Inherited from

Lister.listPagesGenerator

#### Defined in

[client/lister.ts:22](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/lister.ts#L22)

___

### listTrainingTemplates

▸ **listTrainingTemplates**(): `Promise`\<`string`[]\>

Lists all the training templates for the model type.

### Example
```ts
import { Model } from "clarifai-nodejs";

export const model = new Model({
  modelId: "face-detection",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

const trainingTemplates = await model.listTrainingTemplates();
console.log(trainingTemplates);
```

#### Returns

`Promise`\<`string`[]\>

- A promise that resolves to a list of training templates for the model type.

#### Defined in

[client/model.ts:162](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/model.ts#L162)

___

### listVersions

▸ **listVersions**(`«destructured»?`): `AsyncGenerator`\<`AsObject`[], `void`, `void`\>

Lists all the versions for the model.

### Example
```ts
import { Model } from "clarifai-nodejs";

export const model = new Model({
  modelId: "face-detection",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

const versions = await model.listVersions().next();
console.log(versions);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `pageNo?` | `number` |
| › `perPage?` | `number` |

#### Returns

`AsyncGenerator`\<`AsObject`[], `void`, `void`\>

**`Remarks`**

Defaults to 16 per page if pageNo is not specified

#### Defined in

[client/model.ts:432](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/model.ts#L432)

___

### loadInfo

▸ **loadInfo**(): `Promise`\<`void`\>

Loads the current model info.
Usually called internally by other methods, to ensure the model info is loaded with latest data.

#### Returns

`Promise`\<`void`\>

#### Defined in

[client/model.ts:123](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/model.ts#L123)

___

### overrideModelVersion

▸ **overrideModelVersion**(`«destructured»`): `void`

Overrides the model version.

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `inferenceParams?` | `Record`\<`string`, `JavaScriptValue`\> |
| › `outputConfig?` | `OutputConfig` |

#### Returns

`void`

#### Defined in

[client/model.ts:696](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/model.ts#L696)

___

### predict

▸ **predict**(`«destructured»`): `Promise`\<`AsObject`[]\>

Predicts the model based on the given inputs.
Use the `Input` module to create the input objects.

### Example
```ts
import { Model, Input } from "clarifai-nodejs";

export const model = new Model({
  modelId: "multimodal-clip-embed",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

const input = Input.getInputFromBytes({
  inputId: "intro-text",
  textBytes: Buffer.from("Hi my name is Jim."),
});

const textPrediction = await model.predict({
  inputs: [input],
});

console.log(textPrediction);

const imageInput = Input.getInputFromUrl({
  inputId: "test-image",
  imageUrl:
    "https://goldenglobes.com/wp-content/uploads/2023/10/17-tomcruiseag.jpg",
});

const imagePrediction = await model.predict({
  inputs: [imageInput],
});

console.log(imagePrediction);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `inferenceParams?` | `Record`\<`string`, `JavaScriptValue`\> |
| › `inputs` | `Input`[] |
| › `outputConfig?` | `OutputConfig` |

#### Returns

`Promise`\<`AsObject`[]\>

- A promise that resolves to the model prediction.

#### Defined in

[client/model.ts:479](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/model.ts#L479)

___

### predictByBytes

▸ **predictByBytes**(`«destructured»`): `Promise`\<`AsObject`[]\>

Predicts the model based on the given inputs.
Inputs can be provided as a Buffer.

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `inferenceParams?` | `Record`\<`string`, `JavaScriptValue`\> |
| › `inputBytes` | `Buffer` |
| › `inputType` | ``"image"`` \| ``"text"`` \| ``"video"`` \| ``"audio"`` |
| › `outputConfig?` | `OutputConfig` |

#### Returns

`Promise`\<`AsObject`[]\>

- A promise that resolves to the model prediction.

#### Defined in

[client/model.ts:637](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/model.ts#L637)

___

### predictByFilepath

▸ **predictByFilepath**(`«destructured»`): `Promise`\<`AsObject`[]\>

Predicts the model based on the given inputs.
Inputs can be provided as a filepath which can be read.

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `filepath` | `string` |
| › `inferenceParams?` | `Record`\<`string`, `JavaScriptValue`\> |
| › `inputType` | ``"image"`` \| ``"text"`` \| ``"video"`` \| ``"audio"`` |
| › `outputConfig?` | `OutputConfig` |

#### Returns

`Promise`\<`AsObject`[]\>

- A promise that resolves to the model prediction.

#### Defined in

[client/model.ts:603](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/model.ts#L603)

___

### predictByUrl

▸ **predictByUrl**(`«destructured»`): `Promise`\<`AsObject`[]\>

Predicts the model based on the given inputs.
Inputs can be provided as a URL.

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `inferenceParams?` | `Record`\<`string`, `JavaScriptValue`\> |
| › `inputType` | ``"image"`` \| ``"text"`` \| ``"video"`` \| ``"audio"`` |
| › `outputConfig?` | `OutputConfig` |
| › `url` | `string` |

#### Returns

`Promise`\<`AsObject`[]\>

- A promise that resolves to the model prediction.

#### Defined in

[client/model.ts:561](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/model.ts#L561)

___

### updateParams

▸ **updateParams**(`modelParams`): `void`

Updates the model params for the model.

### Example
```ts
import { Model } from "clarifai-nodejs";

export const model = new Model({
  modelId: "face-detection",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

model.updateParams({
  batchSize: 8,
  datasetVersion: "version_id",
});
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `modelParams` | `Record`\<`string`, `unknown`\> | The model params to update. |

#### Returns

`void`

#### Defined in

[client/model.ts:276](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/model.ts#L276)
