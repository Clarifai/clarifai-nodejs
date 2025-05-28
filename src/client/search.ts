import {
  DEFAULT_SEARCH_ALGORITHM,
  DEFAULT_SEARCH_METRIC,
  DEFAULT_TOP_K,
} from "../constants/search";
import { Lister } from "./lister";
import { AuthConfig } from "../utils/types";
import resources_pb from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
const {
  Annotation,
  Audio,
  Concept,
  Data,
  Filter,
  Geo,
  GeoLimit,
  GeoPoint,
  Input: GrpcInput,
  Image,
  Query,
  Rank,
  Text,
  Video,
  Search: GrpcSearch,
} = resources_pb;
import { Input } from "./input";
import { UserError } from "../errors";
import { getSchema } from "../schema/search";
import { z } from "zod";
import struct_pb from "google-protobuf/google/protobuf/struct_pb.js";
const { Struct } = struct_pb;
import { promisifyGrpcCall } from "../utils/misc";
import status_pb from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_pb";
const { Status } = status_pb;
import clarifai_nodejs_grpc from "clarifai-nodejs-grpc";
import service_pb from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb";
const {
  Pagination,
  PostAnnotationsSearchesRequest,
  PostInputsSearchesRequest,
} = service_pb;
import status_code_pb from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb";
const { StatusCode } = status_code_pb;

type FilterType = z.infer<ReturnType<typeof getSchema>>;
type SupportedAlgorithm = "nearest_neighbor" | "brute_force";
type SupportedMetric = "cosine" | "euclidean";

/**
 * @noInheritDoc
 */
export class Search extends Lister {
  private topK: number;
  private metricDistance: "COSINE_DISTANCE" | "EUCLIDEAN_DISTANCE";
  private dataProto: resources_pb.Data;
  private inputProto: resources_pb.Input;
  private algorithm: SupportedAlgorithm;

  constructor({
    topK = DEFAULT_TOP_K,
    metric = DEFAULT_SEARCH_METRIC,
    authConfig,
    algorithm = DEFAULT_SEARCH_ALGORITHM,
  }: {
    topK?: number;
    metric?: SupportedMetric;
    authConfig?: AuthConfig;
    algorithm?: SupportedAlgorithm;
  }) {
    super({ pageSize: 1000, authConfig });

    if (metric !== "cosine" && metric !== "euclidean") {
      throw new UserError("Metric should be either cosine or euclidean");
    }

    if (algorithm !== "nearest_neighbor" && algorithm !== "brute_force") {
      throw new UserError(
        "Algorithm should be either nearest_neighbor or brute_force",
      );
    }

    this.topK = topK;
    this.algorithm = algorithm;
    this.metricDistance = (
      {
        cosine: "COSINE_DISTANCE",
        euclidean: "EUCLIDEAN_DISTANCE",
      } as const
    )[metric];
    this.dataProto = new Data();
    this.inputProto = new GrpcInput();
  }

  private getAnnotProto(args: FilterType[0]): resources_pb.Annotation {
    if (Object.keys(args).length === 0) {
      return new Annotation();
    }

    this.dataProto = new Data();
    for (const [key, value] of Object.entries(args) as [
      keyof FilterType[0],
      FilterType[0][keyof FilterType[0]],
    ][]) {
      if (key === "imageBytes") {
        const imageProto = Input.getInputFromBytes({
          inputId: "",
          imageBytes: value as Uint8Array,
        })
          .getData()
          ?.getImage();
        this.dataProto.setImage(imageProto);
      } else if (key === "imageUrl") {
        const imageProto = Input.getInputFromUrl({
          inputId: "",
          imageUrl: value as string,
        })
          .getData()
          ?.getImage();
        this.dataProto.setImage(imageProto);
      } else if (key === "concepts") {
        if (value) {
          const conceptsList = [];
          for (const concept of (value as FilterType[0]["concepts"])!) {
            const conceptProto = new Concept();
            if (concept.id) conceptProto.setId(concept.id);
            if (concept.name) conceptProto.setName(concept.name);
            if (concept.value) conceptProto.setValue(concept.value);
            if (concept.language) conceptProto.setLanguage(concept.language);
            conceptsList.push(conceptProto);
          }
          this.dataProto.setConceptsList(conceptsList);
        }
      } else if (key === "textRaw") {
        const textProto = Input.getInputFromBytes({
          inputId: "",
          textBytes: Buffer.from(value as string, "utf-8"),
        })
          .getData()
          ?.getText();
        this.dataProto.setText(textProto);
      } else if (key === "metadata") {
        const metadataStruct = Struct.fromJavaScript(
          value as Record<string, struct_pb.JavaScriptValue>,
        );
        this.dataProto.setMetadata(metadataStruct);
      } else if (key === "geoPoint") {
        if (value) {
          const { longitude, latitude, geoLimit } =
            (value as FilterType[0]["geoPoint"])!;
          const geoPointProto = this.getGeoPointProto(
            longitude,
            latitude,
            geoLimit,
          );
          this.dataProto.setGeo(geoPointProto);
        }
      } else {
        throw new UserError(
          `arguments contain key that is not supported: ${key}`,
        );
      }
    }
    const annotation = new Annotation();
    annotation.setData(this.dataProto);
    return annotation;
  }

  private getInputProto(args: FilterType[0]): resources_pb.Input {
    if (Object.keys(args).length === 0) {
      return new GrpcInput();
    }

    this.inputProto = new GrpcInput();
    this.dataProto = new Data();
    for (const [key, value] of Object.entries(args) as [
      keyof FilterType[0],
      FilterType[0][keyof FilterType[0]],
    ][]) {
      if (key === "inputTypes") {
        for (const inputType of (value as FilterType[0]["inputTypes"])! ?? []) {
          if (inputType === "image") {
            this.dataProto.setImage(new Image());
          } else if (inputType === "text") {
            this.dataProto.setText(new Text());
          } else if (inputType === "audio") {
            this.dataProto.setAudio(new Audio());
          } else if (inputType === "video") {
            this.dataProto.setVideo(new Video());
          }
        }
        this.inputProto.setData(this.dataProto);
      } else if (key === "inputDatasetIds") {
        this.inputProto.setDatasetIdsList(value as string[]);
      } else if (key === "inputStatusCode") {
        const statusCode = new Status().setCode(value as number);
        this.inputProto.setStatus(statusCode);
      } else {
        throw new UserError(`args contain key that is not supported: ${key}`);
      }
    }
    return this.inputProto;
  }

  private getGeoPointProto(
    longitude: number,
    latitude: number,
    geoLimit: number,
  ): resources_pb.Geo {
    const geo = new Geo();
    const geoPoint = new GeoPoint();
    geoPoint.setLongitude(longitude);
    geoPoint.setLatitude(latitude);
    const geoLimitConstructor = new GeoLimit();
    geoLimitConstructor.setType("withinKilometers");
    geoLimitConstructor.setValue(geoLimit);
    geo.setGeoPoint(geoPoint);
    geo.setGeoLimit(geoLimitConstructor);
    return geo;
  }

  private async *listAllPagesGenerator<
    T extends
      | service_pb.PostInputsSearchesRequest
      | service_pb.PostAnnotationsSearchesRequest,
  >({
    endpoint,
    requestData,
    page = 1,
    perPage,
  }: {
    endpoint: (
      request: T,
      metadata: clarifai_nodejs_grpc.grpc.Metadata,
      options: Partial<clarifai_nodejs_grpc.grpc.CallOptions>,
    ) => Promise<service_pb.MultiSearchResponse>;
    requestData: T;
    page?: number;
    perPage?: number;
  }): AsyncGenerator<service_pb.MultiSearchResponse.AsObject, void, void> {
    const maxPages = Math.ceil(this.topK / this.defaultPageSize);
    let totalHits = 0;
    while (page) {
      if (!perPage) {
        if (page === maxPages) {
          perPage = this.topK - totalHits;
        } else {
          perPage = this.defaultPageSize;
        }
      }

      const pagination = new Pagination();
      pagination.setPage(page);
      pagination.setPerPage(perPage);
      requestData.setPagination(pagination);

      // @ts-expect-error - endpoint type is a generic & causes type error here
      const response = await this.grpcRequest(endpoint, requestData);
      const responseObject = response.toObject();
      if (responseObject.status?.code !== StatusCode.SUCCESS) {
        if (
          responseObject.status?.details.includes(
            "page * perPage cannot exceed",
          )
        ) {
          const msg = `Your topK is set to ${this.topK}. The current pagination settings exceed the limit. Please reach out to support@clarifai.com to request an increase for your use case.\nreqId: ${responseObject.status?.reqId}`;
          throw new UserError(msg);
        } else {
          throw new Error(
            `Listing failed with response ${responseObject.status?.description}`,
          );
        }
      }

      if (
        !("hitsList" in responseObject) ||
        responseObject.hitsList.length === 0
      ) {
        yield responseObject;
        break;
      }
      page += 1;
      totalHits += perPage;
      yield responseObject;
    }
  }

  query({
    ranks = [{}],
    filters = [{}],
    page,
    perPage,
  }: {
    ranks?: FilterType;
    filters?: FilterType;
    page?: number;
    perPage?: number;
  }): AsyncGenerator<service_pb.MultiSearchResponse.AsObject, void, void> {
    try {
      getSchema().parse(ranks);
      getSchema().parse(filters);
    } catch (err) {
      throw new UserError(`Invalid rank or filter input: ${err}`);
    }

    const rankAnnotProto: resources_pb.Annotation[] = [];
    for (const rankObject of ranks) {
      rankAnnotProto.push(this.getAnnotProto(rankObject));
    }
    const allRanks = rankAnnotProto.map((rankAnnot) => {
      const rank = new Rank();
      rank.setAnnotation(rankAnnot);
      return rank;
    });

    if (
      filters.length &&
      Object.keys(filters[0]).some((k) => k.includes("input"))
    ) {
      const filtersInputProto: resources_pb.Input[] = [];
      for (const filterDict of filters) {
        filtersInputProto.push(this.getInputProto(filterDict));
      }
      const allFilters = filtersInputProto.map((filterInput) => {
        const filter = new Filter();
        filter.setInput(filterInput);
        return filter;
      });

      const query = new Query();
      query.setRanksList(allRanks);
      query.setFiltersList(allFilters);

      const search = new GrpcSearch();
      search.setQuery(query);
      search.setAlgorithm(this.algorithm);
      search.setMetric(GrpcSearch["Metric"][this.metricDistance]);

      const postInputsSearches = promisifyGrpcCall(
        this.STUB.client.postInputsSearches,
        this.STUB.client,
      );
      const request = new PostInputsSearchesRequest();
      request.setUserAppId(this.userAppId);
      request.setSearchesList([search]);

      return this.listAllPagesGenerator({
        endpoint: postInputsSearches,
        requestData: request,
        page,
        perPage,
      });
    }

    const filtersAnnotProto: resources_pb.Annotation[] = [];
    for (const filterDict of filters) {
      filtersAnnotProto.push(this.getAnnotProto(filterDict));
    }
    const allFilters = filtersAnnotProto.map((filterAnnot) => {
      const filter = new Filter();
      filter.setAnnotation(filterAnnot);
      return filter;
    });

    const query = new Query();
    query.setRanksList(allRanks);
    query.setFiltersList(allFilters);

    const search = new GrpcSearch();
    search.setQuery(query);
    search.setAlgorithm(this.algorithm);
    search.setMetric(GrpcSearch["Metric"][this.metricDistance]);

    const postAnnotationsSearches = promisifyGrpcCall(
      this.STUB.client.postAnnotationsSearches,
      this.STUB.client,
    );
    const request = new PostAnnotationsSearchesRequest();
    request.setUserAppId(this.userAppId);
    request.setSearchesList([search]);

    return this.listAllPagesGenerator({
      endpoint: postAnnotationsSearches,
      requestData: request,
      page,
      perPage,
    });
  }
}
