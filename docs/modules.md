[clarifai-nodejs](README.md) / Exports

# clarifai-nodejs

## Table of contents

### Classes

- [App](classes/App.md)
- [Dataset](classes/Dataset.md)
- [Input](classes/Input.md)
- [Model](classes/Model.md)
- [RAG](classes/RAG.md)
- [Search](classes/Search.md)
- [User](classes/User.md)
- [Workflow](classes/Workflow.md)

### Type Aliases

- [AppConfig](modules.md#appconfig)
- [AuthAppConfig](modules.md#authappconfig)
- [CreateDatasetParam](modules.md#createdatasetparam)
- [CreateModelParam](modules.md#createmodelparam)
- [InputBulkUpload](modules.md#inputbulkupload)
- [ListAppsRequestParams](modules.md#listappsrequestparams)
- [ListDatasetsParam](modules.md#listdatasetsparam)
- [ListInstalledModuleVersionsParam](modules.md#listinstalledmoduleversionsparam)
- [ListModelsParam](modules.md#listmodelsparam)
- [ListModulesParam](modules.md#listmodulesparam)
- [ListRunnersRequestParams](modules.md#listrunnersrequestparams)
- [ListWorkflowsParam](modules.md#listworkflowsparam)
- [UserConfig](modules.md#userconfig)

## Type Aliases

### AppConfig

Ƭ **AppConfig**: \{ `authConfig`: [`AuthAppConfig`](modules.md#authappconfig) ; `url`: `ClarifaiAppUrl`  } \| \{ `authConfig`: `AuthConfig` ; `url?`: `undefined`  }

#### Defined in

[src/client/app.ts:55](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/app.ts#L55)

___

### AuthAppConfig

Ƭ **AuthAppConfig**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `appId?` | `undefined` |
| `base` | `undefined` \| `string` |
| `pat` | `string` |
| `rootCertificatesPath` | `undefined` \| `string` |
| `token` | `undefined` \| `string` |
| `ui` | `undefined` \| `string` |
| `userId?` | `undefined` |

#### Defined in

[src/client/app.ts:50](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/app.ts#L50)

___

### CreateDatasetParam

Ƭ **CreateDatasetParam**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `appId` | `undefined` \| `string` |
| `bookmarkOrigin` | `undefined` \| `AsObject` |
| `createdAt` | `undefined` \| `AsObject` |
| `defaultAnnotationFilter` | `undefined` \| `AsObject` |
| `defaultProcessingInfo` | `undefined` \| `AsObject` |
| `description` | `undefined` \| `string` |
| `image` | `undefined` \| `AsObject` |
| `isStarred` | `undefined` \| `boolean` |
| `metadata` | `undefined` \| `AsObject` |
| `modifiedAt` | `undefined` \| `AsObject` |
| `notes` | `undefined` \| `string` |
| `starCount` | `undefined` \| `number` |
| `userId` | `undefined` \| `string` |
| `version` | `undefined` \| `AsObject` |
| `visibility` | `undefined` \| `AsObject` |

#### Defined in

[src/client/app.ts:75](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/app.ts#L75)

___

### CreateModelParam

Ƭ **CreateModelParam**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `appId` | `undefined` \| `string` |
| `billingType` | `undefined` \| `BillingType` |
| `bookmarkOrigin` | `undefined` \| `AsObject` |
| `checkConsentsList` | `undefined` \| `string`[] |
| `createdAt` | `undefined` \| `AsObject` |
| `creator` | `undefined` \| `string` |
| `defaultEvalInfo` | `undefined` \| `AsObject` |
| `description` | `undefined` \| `string` |
| `displayName` | `undefined` \| `string` |
| `featuredOrder` | `undefined` \| `AsObject` |
| `image` | `undefined` \| `AsObject` |
| `isStarred` | `undefined` \| `boolean` |
| `languagesFullList` | `undefined` \| `AsObject`[] |
| `languagesList` | `undefined` \| `string`[] |
| `licenseType` | `undefined` \| `LicenseType` |
| `metadata` | `undefined` \| `AsObject` |
| `modelTypeId` | `undefined` \| `string` |
| `modelVersion` | `undefined` \| `AsObject` |
| `modifiedAt` | `undefined` \| `AsObject` |
| `name` | `undefined` \| `string` |
| `notes` | `undefined` \| `string` |
| `outputInfo` | `undefined` \| `AsObject` |
| `presets` | `undefined` \| `AsObject` |
| `source` | `undefined` \| `Source` |
| `starCount` | `undefined` \| `number` |
| `task` | `undefined` \| `string` |
| `toolkitsList` | `undefined` \| `string`[] |
| `useCasesList` | `undefined` \| `string`[] |
| `userId` | `undefined` \| `string` |
| `versionCount` | `undefined` \| `number` |
| `visibility` | `undefined` \| `AsObject` |
| `workflowRecommended` | `undefined` \| `AsObject` |

#### Defined in

[src/client/app.ts:79](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/app.ts#L79)

___

### InputBulkUpload

Ƭ **InputBulkUpload**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `[captureRejectionSymbol]` | `undefined` \| \<K\>(`error`: `Error`, `event`: `string` \| `symbol`, ...`args`: `AnyRest`) => `void` |
| `addListener` | \<K\>(`eventName`: `string` \| `symbol`, `listener`: (...`args`: `any`[]) => `void`) => `this` |
| `emit` | \<K\>(`eventName`: `string` \| `symbol`, ...`args`: `AnyRest`) => `boolean` & \<K\>(`event`: `K`, `payload`: `UploadEvents`[`K`]) => `boolean` |
| `eventNames` | () => (`string` \| `symbol`)[] |
| `getMaxListeners` | () => `number` |
| `listenerCount` | \<K\>(`eventName`: `string` \| `symbol`, `listener?`: `Function`) => `number` |
| `listeners` | \<K\>(`eventName`: `string` \| `symbol`) => `Function`[] |
| `off` | \<K\>(`eventName`: `string` \| `symbol`, `listener`: (...`args`: `any`[]) => `void`) => `this` |
| `on` | \<K\>(`eventName`: `string` \| `symbol`, `listener`: (...`args`: `any`[]) => `void`) => `this` & \<K\>(`event`: `K`, `listener`: (`payload`: `UploadEvents`[`K`]) => `void`) => `void` |
| `once` | \<K\>(`eventName`: `string` \| `symbol`, `listener`: (...`args`: `any`[]) => `void`) => `this` |
| `prependListener` | \<K\>(`eventName`: `string` \| `symbol`, `listener`: (...`args`: `any`[]) => `void`) => `this` |
| `prependOnceListener` | \<K\>(`eventName`: `string` \| `symbol`, `listener`: (...`args`: `any`[]) => `void`) => `this` |
| `rawListeners` | \<K\>(`eventName`: `string` \| `symbol`) => `Function`[] |
| `removeAllListeners` | (`eventName?`: `string` \| `symbol`) => `this` |
| `removeListener` | \<K\>(`eventName`: `string` \| `symbol`, `listener`: (...`args`: `any`[]) => `void`) => `this` |
| `setMaxListeners` | (`n`: `number`) => `this` |

#### Defined in

[src/client/input.ts:80](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/input.ts#L80)

___

### ListAppsRequestParams

Ƭ **ListAppsRequestParams**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `additionalFieldsList` | `undefined` \| `string`[] |
| `featuredOnly` | `undefined` \| `boolean` |
| `id` | `undefined` \| `string` |
| `name` | `undefined` \| `string` |
| `page` | `undefined` \| `number` |
| `query` | `undefined` \| `string` |
| `search` | `undefined` \| `string` |
| `sortAscending` | `undefined` \| `boolean` |
| `sortByCreatedAt` | `undefined` \| `boolean` |
| `sortById` | `undefined` \| `boolean` |
| `sortByModifiedAt` | `undefined` \| `boolean` |
| `sortByName` | `undefined` \| `boolean` |
| `sortByStarCount` | `undefined` \| `boolean` |
| `starredOnly` | `undefined` \| `boolean` |
| `templateOnly` | `undefined` \| `boolean` |

#### Defined in

[src/client/user.ts:22](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/user.ts#L22)

___

### ListDatasetsParam

Ƭ **ListDatasetsParam**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `additionalFieldsList` | `undefined` \| `string`[] |
| `bookmark` | `undefined` \| `boolean` |
| `id` | `undefined` \| `string` |
| `page` | `undefined` \| `number` |
| `search` | `undefined` \| `string` |
| `sortAscending` | `undefined` \| `boolean` |
| `sortByCreatedAt` | `undefined` \| `boolean` |
| `sortById` | `undefined` \| `boolean` |
| `sortByModifiedAt` | `undefined` \| `boolean` |
| `sortByStarCount` | `undefined` \| `boolean` |
| `starredOnly` | `undefined` \| `boolean` |

#### Defined in

[src/client/app.ts:65](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/app.ts#L65)

___

### ListInstalledModuleVersionsParam

Ƭ **ListInstalledModuleVersionsParam**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `page` | `undefined` \| `number` |

#### Defined in

[src/client/app.ts:73](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/app.ts#L73)

___

### ListModelsParam

Ƭ **ListModelsParam**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `additionalFieldsList` | `undefined` \| `string`[] |
| `bookmark` | `undefined` \| `boolean` |
| `creator` | `undefined` \| `string` |
| `dontFetchFromMain` | `undefined` \| `boolean` |
| `featuredOnly` | `undefined` \| `boolean` |
| `filterByUserId` | `undefined` \| `boolean` |
| `inputFieldsList` | `undefined` \| `string`[] |
| `languagesList` | `undefined` \| `string`[] |
| `license` | `undefined` \| `string` |
| `licenseType` | `undefined` \| `LicenseType` |
| `minReplicas` | `undefined` \| `number` |
| `modelTypeId` | `undefined` \| `string` |
| `modelVersionIdsList` | `undefined` \| `string`[] |
| `name` | `undefined` \| `string` |
| `outputFieldsList` | `undefined` \| `string`[] |
| `page` | `undefined` \| `number` |
| `query` | `undefined` \| `string` |
| `search` | `undefined` \| `string` |
| `sortAscending` | `undefined` \| `boolean` |
| `sortByCreatedAt` | `undefined` \| `boolean` |
| `sortByModifiedAt` | `undefined` \| `boolean` |
| `sortByName` | `undefined` \| `boolean` |
| `sortByNumInputs` | `undefined` \| `boolean` |
| `sortByStarCount` | `undefined` \| `boolean` |
| `source` | `undefined` \| `number` |
| `starredOnly` | `undefined` \| `boolean` |
| `toolkitsList` | `undefined` \| `string`[] |
| `trainedOnly` | `undefined` \| `boolean` |
| `useCasesList` | `undefined` \| `string`[] |

#### Defined in

[src/client/app.ts:67](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/app.ts#L67)

___

### ListModulesParam

Ƭ **ListModulesParam**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `additionalFieldsList` | `undefined` \| `string`[] |
| `bookmark` | `undefined` \| `boolean` |
| `filterByUserId` | `undefined` \| `boolean` |
| `name` | `undefined` \| `string` |
| `page` | `undefined` \| `number` |
| `search` | `undefined` \| `string` |
| `sortAscending` | `undefined` \| `boolean` |
| `sortByCreatedAt` | `undefined` \| `boolean` |
| `sortById` | `undefined` \| `boolean` |
| `sortByModifiedAt` | `undefined` \| `boolean` |
| `sortByStarCount` | `undefined` \| `boolean` |
| `starredOnly` | `undefined` \| `boolean` |

#### Defined in

[src/client/app.ts:71](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/app.ts#L71)

___

### ListRunnersRequestParams

Ƭ **ListRunnersRequestParams**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `computeClusterId` | `undefined` \| `string` |
| `minReplicas` | `undefined` \| `number` |
| `nodepoolId` | `undefined` \| `string` |
| `page` | `undefined` \| `number` |

#### Defined in

[src/client/user.ts:24](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/user.ts#L24)

___

### ListWorkflowsParam

Ƭ **ListWorkflowsParam**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `additionalFieldsList` | `undefined` \| `string`[] |
| `bookmark` | `undefined` \| `boolean` |
| `featuredOnly` | `undefined` \| `boolean` |
| `id` | `undefined` \| `string` |
| `page` | `undefined` \| `number` |
| `query` | `undefined` \| `string` |
| `search` | `undefined` \| `string` |
| `searchTerm` | `undefined` \| `string` |
| `sortAscending` | `undefined` \| `boolean` |
| `sortByCreatedAt` | `undefined` \| `boolean` |
| `sortById` | `undefined` \| `boolean` |
| `sortByModifiedAt` | `undefined` \| `boolean` |
| `sortByStarCount` | `undefined` \| `boolean` |
| `starredOnly` | `undefined` \| `boolean` |

#### Defined in

[src/client/app.ts:69](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/app.ts#L69)

___

### UserConfig

Ƭ **UserConfig**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `appId` | `string` |
| `base` | `undefined` \| `string` |
| `pat` | `string` |
| `rootCertificatesPath` | `undefined` \| `string` |
| `token` | `undefined` \| `string` |
| `ui` | `undefined` \| `string` |
| `userId` | `string` |

#### Defined in

[src/client/user.ts:21](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/user.ts#L21)
