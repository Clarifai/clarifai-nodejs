import { Message, Map as ProtobufMap } from "google-protobuf";

type MessageConstructor<T extends Message> = new () => T;

type AsObject<T extends Message> = ReturnType<T["toObject"]>;

const enum PREFIX {
  SET = "set",
  GET = "get",
  CLEAR = "clear",
}

/**
 * Based on "from-protobuf-object" package - except accepts data with Partial keys
 */
export function fromPartialProtobufObject<T extends Message>(
  MessageType: MessageConstructor<T>,
  data: Partial<AsObject<T>>,
): T {
  const instance = new MessageType();
  validateMissingProps(instance, data);
  for (const [prop, value] of Object.entries(
    filterExtraProps(instance, data),
  )) {
    if (Array.isArray(value) && isProtobufMap(instance, prop)) {
      const mapMethod = getMethod(prop, PREFIX.GET);
      const map = callMethod(instance, mapMethod) as ProtobufMap<
        unknown,
        unknown
      >;
      const NestedType = retrieveNestedMapTypePatch(instance, prop);
      for (const [k, v] of value) {
        if (!isObject(v, prop)) {
          map.set(k, v);
          continue;
        }
        if (!NestedType) {
          throw new Error("Unable to retrieve nested type");
        }
        map.set(k, fromPartialProtobufObject(NestedType, v));
      }
      continue;
    }
    const result = getResult(instance, prop, value);
    validateType(instance, prop, value);
    const setter = getMethod(prop, PREFIX.SET);
    callMethod(instance, setter, result);
  }
  return instance;
}

function getResult<T extends Message>(
  instance: T,
  prop: string,
  value: unknown,
): unknown {
  if (value instanceof Uint8Array) {
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0 || !isArrayOfObjects(value, prop)) {
      return value;
    }
    const NestedType = retrieveNestedRepeatedTypePatch(instance, prop);
    if (!NestedType) {
      throw new Error("Unable to retrieve nested type");
    }
    return value.map((child) => fromPartialProtobufObject(NestedType, child));
  }
  if (isObject(value, prop)) {
    const NestedType = retrieveNestedTypePatch(instance, prop);
    if (!NestedType) {
      throw new Error("Unable to retrieve nested type");
    }
    return fromPartialProtobufObject(NestedType, value as object);
  }
  return value;
}

function callMethod<T extends object, R>(
  obj: T,
  key: string,
  value?: unknown,
): R {
  return (obj[key as keyof T] as (value: unknown) => R)(value);
}

function getProp(key: string, prefix: PREFIX): string {
  const prop = key.slice(prefix.length);
  return prop.slice(0, 1).toLowerCase() + prop.slice(1);
}

function getMethod(prop: string, prefix: PREFIX): string {
  return `${prefix}${prop[0].toUpperCase()}${prop.slice(1)}`;
}

function getInstancePropsFromKeys(keys: string[], prefix: PREFIX): string[] {
  return keys
    .filter((key) => key.startsWith(prefix))
    .map((key) => getProp(key, prefix));
}

function getInstanceProps<T extends Message>(instance: T): string[] {
  const keys = Object.keys(Object.getPrototypeOf(instance));
  const setters = getInstancePropsFromKeys(keys, PREFIX.SET);
  const maps = getInstancePropsFromKeys(keys, PREFIX.CLEAR).filter((prop) =>
    isProtobufMap(instance, prop),
  );
  return [...setters, ...maps];
}

function isProtobufMap<T extends Message>(instance: T, prop: string): boolean {
  return (
    callMethod(instance, getMethod(prop, PREFIX.GET)) instanceof ProtobufMap
  );
}

function isOptional<T extends Message>(instance: T, prop: string): boolean {
  const clearMethod = getMethod(prop, PREFIX.CLEAR);
  return clearMethod in instance;
}

function validateMissingProps<T extends Message>(
  instance: T,
  data: Partial<AsObject<T>>,
): void {
  const instanceProps = getInstanceProps(instance);
  const dataProps = Object.keys(data);
  for (const prop of instanceProps) {
    if (!dataProps.includes(prop) && !isOptional(instance, prop)) {
      //   throw new Error(`Missing property '${prop}'`);
    }
  }
}

function filterExtraProps<T extends Message>(
  instance: T,
  data: Partial<AsObject<T>>,
): Partial<AsObject<T>> {
  const instanceProps = getInstanceProps(instance);
  return Object.fromEntries(
    Object.entries(data).filter(
      ([key, value]) => instanceProps.includes(key) && value !== undefined,
    ),
  ) as Partial<AsObject<T>>;
}

function isObject(value: unknown, prop: string): boolean {
  if (value === null) {
    throw new Error(`Null value for key '${prop}'`);
  }
  return typeof value === "object";
}

function isArrayOfObjects(arr: unknown[], prop: string): boolean {
  if (arr.every((item) => isObject(item, prop))) {
    return true;
  }
  if (arr.every((item) => !isObject(item, prop))) {
    return false;
  }
  throw new Error(`Mixed array for '${prop}'`);
}

function validateType<T extends Message>(
  instance: T,
  prop: string,
  value: unknown,
): void {
  const getter = getMethod(prop, PREFIX.GET);
  const instanceValue = callMethod(instance, getter);
  const expectedType =
    instanceValue !== undefined ? typeof instanceValue : "object";
  const actualType = value instanceof Uint8Array ? "string" : typeof value;
  if (Array.isArray(instanceValue) && !Array.isArray(value)) {
    throw new Error(
      `Invalid type for '${prop}' (expected array, got '${actualType}')`,
    );
  }
  if (!Array.isArray(instanceValue) && Array.isArray(value)) {
    throw new Error(
      `Invalid type for '${prop}' (expected '${expectedType}', got array)`,
    );
  }
  if (expectedType !== actualType) {
    throw new Error(
      `Invalid type for '${prop}' (expected '${expectedType}', got '${actualType}')`,
    );
  }
}

function retrieveNestedTypePatch<T extends Message, N extends Message>(
  instance: T,
  prop: string,
): MessageConstructor<N> | null {
  const getWrapperField = Message.getWrapperField;
  let nestedType: MessageConstructor<Message> | null = null;
  Message.getWrapperField = function (msg, ctor, fieldNumber, required) {
    nestedType = ctor;
    return getWrapperField(msg, ctor, fieldNumber, required);
  };
  callMethod(instance, getMethod(prop, PREFIX.GET));
  Message.getWrapperField = getWrapperField;
  return nestedType;
}

function retrieveNestedRepeatedTypePatch<T extends Message, N extends Message>(
  instance: T,
  prop: string,
): MessageConstructor<N> | null {
  const getRepeatedWrapperField = Message.getRepeatedWrapperField;
  let nestedType: MessageConstructor<Message> | null = null;
  Message.getRepeatedWrapperField = function (msg, ctor, fieldNumber) {
    nestedType = ctor;
    return getRepeatedWrapperField(msg, ctor, fieldNumber);
  };
  callMethod(instance, getMethod(prop, PREFIX.GET));
  Message.getRepeatedWrapperField = getRepeatedWrapperField;
  return nestedType;
}

function retrieveNestedMapTypePatch<T extends Message, N extends Message>(
  instance: T,
  prop: string,
): MessageConstructor<N> | null {
  const getMapField = Message.getMapField;
  let nestedType: typeof Message | null = null;
  Message.getMapField = function (msg, fieldNumber, noLazyCreate, valueCtor) {
    nestedType = valueCtor ?? null;
    return getMapField(msg, fieldNumber, noLazyCreate, valueCtor);
  };
  callMethod(instance, getMethod(prop, PREFIX.GET));
  Message.getMapField = getMapField;
  return nestedType;
}
