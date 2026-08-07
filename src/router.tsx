import { createRouter } from "@tanstack/react-router";
import { createHashHistory } from "@tanstack/history";
import { routeTree } from "./routeTree.gen";

export const getRouter = () =>
  createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    ...(typeof window !== "undefined" && window.location.protocol === "file:"
      ? { history: createHashHistory() }
      : {}),
  });
