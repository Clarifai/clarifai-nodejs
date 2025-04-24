# Changelog

## [0.0.4](https://github.com/Clarifai/clarifai-nodejs/compare/v0.0.3...v0.0.4) (2025-04-24)


### Bug Fixes

* vulnerable package versions ([#22](https://github.com/Clarifai/clarifai-nodejs/issues/22)) ([c84db94](https://github.com/Clarifai/clarifai-nodejs/commit/c84db9441722cac4a39486c6fd56800fb3b57b9e))

## [0.0.3](https://github.com/Clarifai/clarifai-nodejs/compare/v0.0.2...v0.0.3) (2024-07-02)


### Features

* custom root certificate support ([#19](https://github.com/Clarifai/clarifai-nodejs/issues/19)) ([8b517f4](https://github.com/Clarifai/clarifai-nodejs/commit/8b517f4b534d877ef8e6378b011a997de54e809c))
* RAG Module ([#9](https://github.com/Clarifai/clarifai-nodejs/issues/9)) ([7354e93](https://github.com/Clarifai/clarifai-nodejs/commit/7354e935ce24f86a2201dcca4c035218883df5ca))


### Bug Fixes

* updated methods to match docs ([#14](https://github.com/Clarifai/clarifai-nodejs/issues/14)) ([3d46b72](https://github.com/Clarifai/clarifai-nodejs/commit/3d46b72fc92cbb79f5d030c9855e3a463f30dc8d))

## [0.0.2](https://github.com/Clarifai/clarifai-nodejs/compare/v0.0.1...v0.0.2) (2024-05-07)


### Features

* search & datasets ([#8](https://github.com/Clarifai/clarifai-nodejs/issues/8)) ([39cd278](https://github.com/Clarifai/clarifai-nodejs/commit/39cd278b66ab70fa3993480044d3b1057c5b6a67))
  - A new `Dataset` class was added with several methods for handling datasets, including creating and deleting versions, listing versions, and uploading data from a folder or a CSV file.
  - Several new methods were added to the `Input` class for handling inputs, including methods for bulk uploading, waiting for inputs, deleting failed inputs, and retrying uploads.
  - Several new methods and properties were added to the `Search` class, including support for different search algorithms and metrics, and improved handling of queries and pagination.

### Miscellaneous Chores

* One of the dependencies, `uuidv4` has been deprecated in npm hence it has been replaced with the recommended `uuid` package.

## 0.0.1 (2024-04-02)


### Features
- First Release of the Clarifai Node.js SDK in developer preview
- Supports the following modules:
  - User APIs
  - App APIs
  - Workflow APIs
  - Model APIs
  - Search API
