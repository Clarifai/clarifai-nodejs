[clarifai-nodejs](../README.md) / [Exports](../modules.md) / Input

# Class: Input

Inputs is a class that provides access to Clarifai API endpoints related to Input information.

## Hierarchy

- `Lister`

  ↳ **`Input`**

## Table of contents

### Constructors

- [constructor](Input.md#constructor)

### Methods

- [patchInputs](Input.md#patchinputs)
- [uploadAnnotations](Input.md#uploadannotations)
- [uploadFromBytes](Input.md#uploadfrombytes)
- [uploadFromFile](Input.md#uploadfromfile)
- [uploadFromUrl](Input.md#uploadfromurl)
- [uploadInputs](Input.md#uploadinputs)
- [uploadText](Input.md#uploadtext)
- [getBboxProto](Input.md#getbboxproto)
- [getImageInputsFromFolder](Input.md#getimageinputsfromfolder)
- [getInputFromBytes](Input.md#getinputfrombytes)
- [getInputFromFile](Input.md#getinputfromfile)
- [getInputFromUrl](Input.md#getinputfromurl)
- [getInputsFromCsv](Input.md#getinputsfromcsv)
- [getMaskProto](Input.md#getmaskproto)
- [getMultimodalInput](Input.md#getmultimodalinput)
- [getProto](Input.md#getproto)
- [getTextInput](Input.md#gettextinput)
- [getTextInputsFromFolder](Input.md#gettextinputsfromfolder)

## Constructors

### constructor

• **new Input**(`params`): [`Input`](Input.md)

Initializes an input object.

### Example
```ts
import { Input } from "clarifai-nodejs";

export const input = new Input({
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
| `params` | `Object` | The parameters for the Input object. |
| `params.authConfig?` | `AuthConfig` | - |

#### Returns

[`Input`](Input.md)

#### Overrides

Lister.constructor

#### Defined in

[client/input.ts:64](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/input.ts#L64)

## Methods

### patchInputs

▸ **patchInputs**(`«destructured»`): `Promise`\<`string`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `action?` | `string` | `"merge"` |
| › `inputs` | `Input`[] | `undefined` |

#### Returns

`Promise`\<`string`\>

#### Defined in

[client/input.ts:923](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/input.ts#L923)

___

### uploadAnnotations

▸ **uploadAnnotations**(`«destructured»`): `Promise`\<`Annotation`[]\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `batchAnnot` | `Annotation`[] | `undefined` |
| › `showLog?` | `boolean` | `true` |

#### Returns

`Promise`\<`Annotation`[]\>

#### Defined in

[client/input.ts:959](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/input.ts#L959)

___

### uploadFromBytes

▸ **uploadFromBytes**(`«destructured»`): `Promise`\<`string`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `audioBytes?` | ``null`` \| `Uint8Array` | `null` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `geoInfo?` | ``null`` \| `AsObject` | `null` |
| › `imageBytes?` | ``null`` \| `Uint8Array` | `null` |
| › `inputId` | `string` | `undefined` |
| › `labels?` | ``null`` \| `string`[] | `null` |
| › `metadata?` | ``null`` \| `Record`\<`string`, `JavaScriptValue`\> | `null` |
| › `textBytes?` | ``null`` \| `Uint8Array` | `null` |
| › `videoBytes?` | ``null`` \| `Uint8Array` | `null` |

#### Returns

`Promise`\<`string`\>

#### Defined in

[client/input.ts:871](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/input.ts#L871)

___

### uploadFromFile

▸ **uploadFromFile**(`«destructured»`): `Promise`\<`string`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `audioFile?` | ``null`` \| `string` | `null` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `geoInfo?` | ``null`` \| `AsObject` | `null` |
| › `imageFile?` | ``null`` \| `string` | `null` |
| › `inputId` | `string` | `undefined` |
| › `labels?` | ``null`` \| `string`[] | `null` |
| › `metadata?` | ``null`` \| `Record`\<`string`, `JavaScriptValue`\> | `null` |
| › `textFile?` | ``null`` \| `string` | `null` |
| › `videoFile?` | ``null`` \| `string` | `null` |

#### Returns

`Promise`\<`string`\>

#### Defined in

[client/input.ts:836](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/input.ts#L836)

___

### uploadFromUrl

▸ **uploadFromUrl**(`«destructured»`): `Promise`\<`string`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `audioUrl?` | ``null`` \| `string` | `null` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `geoInfo?` | ``null`` \| `AsObject` | `null` |
| › `imageUrl?` | ``null`` \| `string` | `null` |
| › `inputId` | `string` | `undefined` |
| › `labels?` | ``null`` \| `string`[] | `null` |
| › `metadata?` | ``null`` \| `Record`\<`string`, `JavaScriptValue`\> | `null` |
| › `textUrl?` | ``null`` \| `string` | `null` |
| › `videoUrl?` | ``null`` \| `string` | `null` |

#### Returns

`Promise`\<`string`\>

#### Defined in

[client/input.ts:801](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/input.ts#L801)

___

### uploadInputs

▸ **uploadInputs**(`«destructured»`): `Promise`\<`string`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `inputs` | `Input`[] | `undefined` |
| › `showLog?` | `boolean` | `true` |

#### Returns

`Promise`\<`string`\>

#### Defined in

[client/input.ts:760](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/input.ts#L760)

___

### uploadText

▸ **uploadText**(`«destructured»`): `Promise`\<`string`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `inputId` | `string` | `undefined` |
| › `rawText` | `string` | `undefined` |

#### Returns

`Promise`\<`string`\>

#### Defined in

[client/input.ts:906](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/input.ts#L906)

___

### getBboxProto

▸ **getBboxProto**(`«destructured»`): `Annotation`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `bbox` | `number`[] |
| › `inputId` | `string` |
| › `label` | `string` |

#### Returns

`Annotation`

#### Defined in

[client/input.ts:679](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/input.ts#L679)

___

### getImageInputsFromFolder

▸ **getImageInputsFromFolder**(`«destructured»`): `Input`[]

Upload image inputs from folder.

### Example
```ts
import { Input, Model } from "clarifai-nodejs";
import path from "path";

// Generate a new GRPC compatible Input object from buffer
const imageInputs = Input.getImageInputsFromFolder({
  // Ensure the directory contains a list of images
  folderPath: path.resolve(__dirname, "path/to/imageFolder"),
});

// The input can now be used as an input for a model prediction methods
const model = new Model({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
  modelId: "multimodal-clip-embed",
});
const prediction = await model.predict({
  inputs: imageInputs,
});
console.log(prediction);
```

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `folderPath` | `string` | `undefined` |
| › `labels?` | `boolean` | `false` |

#### Returns

`Input`[]

#### Defined in

[client/input.ts:396](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/input.ts#L396)

___

### getInputFromBytes

▸ **getInputFromBytes**(`«destructured»`): `Input`

Creates an input proto from bytes.

### Example
```ts
import { Input, Model } from "clarifai-nodejs";
import * as fs from "fs";

const imageBuffer = fs.readFileSync("path/to/image.jpg");

// Generate a new GRPC compatible Input object from buffer
const imageInput = Input.getInputFromBytes({
  inputId: "demo",
  imageBytes: imageBuffer,
});

// The input can now be used as an input for a model prediction methods
const model = new Model({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
  modelId: "multimodal-clip-embed",
});
const prediction = await model.predict({
  inputs: [imageInput],
});
console.log(prediction);
```

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `audioBytes?` | ``null`` \| `Uint8Array` | `null` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `geoInfo?` | ``null`` \| `AsObject` | `null` |
| › `imageBytes?` | ``null`` \| `Uint8Array` | `null` |
| › `inputId` | `string` | `undefined` |
| › `labels?` | ``null`` \| `string`[] | `null` |
| › `metadata?` | ``null`` \| `Record`\<`string`, `JavaScriptValue`\> | `null` |
| › `textBytes?` | ``null`` \| `Uint8Array` | `null` |
| › `videoBytes?` | ``null`` \| `Uint8Array` | `null` |

#### Returns

`Input`

An `Input` object for the specified input ID.

#### Defined in

[client/input.ts:194](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/input.ts#L194)

___

### getInputFromFile

▸ **getInputFromFile**(`«destructured»`): `Input`

Create input proto from files.

### Example
```ts
import { Input, Model } from "clarifai-nodejs";
import path from "path";

// Generate a new GRPC compatible Input object from buffer
const imageInput = Input.getInputFromFile({
  inputId: "demo",
  imageFile: path.resolve(__dirname, "path/to/image.jpg"),
});

// The input can now be used as an input for a model prediction methods
const model = new Model({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
  modelId: "multimodal-clip-embed",
});
const prediction = await model.predict({
  inputs: [imageInput],
});
console.log(prediction);
```

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `audioFile?` | ``null`` \| `string` | `null` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `geoInfo?` | ``null`` \| `AsObject` | `null` |
| › `imageFile?` | ``null`` \| `string` | `null` |
| › `inputId` | `string` | `undefined` |
| › `labels?` | ``null`` \| `string`[] | `null` |
| › `metadata?` | ``null`` \| `Record`\<`string`, `JavaScriptValue`\> | `null` |
| › `textFile?` | ``null`` \| `string` | `null` |
| › `videoFile?` | ``null`` \| `string` | `null` |

#### Returns

`Input`

- An Input object for the specified input ID.

#### Defined in

[client/input.ts:258](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/input.ts#L258)

___

### getInputFromUrl

▸ **getInputFromUrl**(`«destructured»`): `Input`

Upload input from URL.

### Example
```ts
import { Input, Model } from "clarifai-nodejs";

// Generate a new GRPC compatible Input object from buffer
const imageInput = Input.getInputFromUrl({
  inputId: "demo",
  imageUrl: "https://samples.clarifai.com/dog2.jpeg",
});

// The input can now be used as an input for a model prediction methods
const model = new Model({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
  modelId: "multimodal-clip-embed",
});
const prediction = await model.predict({
  inputs: [imageInput],
});
console.log(prediction);
```

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `audioUrl?` | ``null`` \| `string` | `null` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `geoInfo?` | ``null`` \| `AsObject` | `null` |
| › `imageUrl?` | ``null`` \| `string` | `null` |
| › `inputId` | `string` | `undefined` |
| › `labels?` | ``null`` \| `string`[] | `null` |
| › `metadata?` | ``null`` \| `Record`\<`string`, `JavaScriptValue`\> | `null` |
| › `textUrl?` | ``null`` \| `string` | `null` |
| › `videoUrl?` | ``null`` \| `string` | `null` |

#### Returns

`Input`

- Job ID for the upload request.

#### Defined in

[client/input.ts:322](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/input.ts#L322)

___

### getInputsFromCsv

▸ **getInputsFromCsv**(`«destructured»`): `Promise`\<`Input`[]\>

Create Input proto from CSV File. Supported columns are:
'inputid', 'input', 'concepts', 'metadata', 'geopoints'

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `csvPath` | `string` | `undefined` |
| › `csvType` | ``"url"`` \| ``"raw"`` \| ``"file"`` | `"raw"` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `inputType` | ``"image"`` \| ``"text"`` \| ``"video"`` \| ``"audio"`` | `"text"` |
| › `labels` | `boolean` | `true` |

#### Returns

`Promise`\<`Input`[]\>

- An array of Input objects for the specified input ID.

#### Defined in

[client/input.ts:533](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/input.ts#L533)

___

### getMaskProto

▸ **getMaskProto**(`inputId`, `label`, `polygons`): `Annotation`

#### Parameters

| Name | Type |
| :------ | :------ |
| `inputId` | `string` |
| `label` | `string` |
| `polygons` | `number`[][][] |

#### Returns

`Annotation`

#### Defined in

[client/input.ts:720](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/input.ts#L720)

___

### getMultimodalInput

▸ **getMultimodalInput**(`«destructured»`): `Input`

Create input proto for text and image from bytes or url

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `imageBytes?` | ``null`` \| `Uint8Array` | `null` |
| › `imageUrl?` | ``null`` \| `string` | `null` |
| › `inputId` | `string` | `undefined` |
| › `rawText?` | ``null`` \| `string` | `null` |
| › `textBytes?` | ``null`` \| `Uint8Array` | `null` |

#### Returns

`Input`

- An Input object for the specified input ID.

#### Defined in

[client/input.ts:476](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/input.ts#L476)

___

### getProto

▸ **getProto**(`«destructured»`): `Input`

Create input proto for image data type.

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `audioPb?` | ``null`` \| \{ `base64`: `string`  } | `null` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `geoInfo?` | ``null`` \| `AsObject` | `null` |
| › `imagePb?` | ``null`` \| \{ `base64`: `string` ; `url?`: `undefined`  } \| \{ `base64?`: `undefined` ; `url`: `string`  } | `null` |
| › `inputId` | `string` | `undefined` |
| › `labels?` | ``null`` \| `string`[] | `null` |
| › `metadata?` | ``null`` \| `Record`\<`string`, `JavaScriptValue`\> | `null` |
| › `textPb?` | ``null`` \| \{ `raw`: `string`  } | `null` |
| › `videoPb?` | ``null`` \| \{ `base64`: `string`  } | `null` |

#### Returns

`Input`

- An Input object for the specified input ID.

#### Defined in

[client/input.ts:82](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/input.ts#L82)

___

### getTextInput

▸ **getTextInput**(`«destructured»`): `Input`

Create input proto for text data type from raw text.

### Example
```ts
import { Input, Model } from "clarifai-nodejs";

// Generate a new GRPC compatible Input object from buffer
const textInput = Input.getTextInput({
  inputId: "demo",
  rawText: "Sample text for input generation",
});

// The input can now be used as an input for a model prediction methods
const model = new Model({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
  modelId: "multimodal-clip-embed",
});
const prediction = await model.predict({
  inputs: [textInput],
});
console.log(prediction);
```

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `geoInfo?` | ``null`` \| `AsObject` | `null` |
| › `inputId` | `string` | `undefined` |
| › `labels?` | ``null`` \| `string`[] | `null` |
| › `metadata?` | ``null`` \| `Record`\<`string`, `JavaScriptValue`\> | `null` |
| › `rawText` | `string` | `undefined` |

#### Returns

`Input`

- An Input object for the specified input ID.

#### Defined in

[client/input.ts:439](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/input.ts#L439)

___

### getTextInputsFromFolder

▸ **getTextInputsFromFolder**(`«destructured»`): `Input`[]

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `datasetId` | ``null`` \| `string` | `null` |
| › `folderPath` | `string` | `undefined` |
| › `labels` | `boolean` | `false` |

#### Returns

`Input`[]

#### Defined in

[client/input.ts:648](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/input.ts#L648)
