/// <reference types="node" />
import { beforeAll } from "vitest";

beforeAll(() => {
  process.env.NODE_ENV = "test";
});

