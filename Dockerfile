FROM node:lts-alpine3.19 AS base

RUN corepack enable && pnpm -v

FROM base AS build

WORKDIR /build
COPY . /build
RUN pnpm i && pnpm build

FROM base

WORKDIR /app

EXPOSE 8080
ENV HASH_SECRET=Y2hhbmdlbWVkb2NrZXI=

COPY --from=build /build/release/online-server /app
RUN pnpm i
CMD ["node", "/app/server.js"]