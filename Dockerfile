FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./

FROM base AS deps
RUN npm ci --legacy-peer-deps

FROM deps AS dev
COPY . .
RUN mkdir -p uploads
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM deps AS build
COPY . .
RUN npm run check
RUN npm prune --omit=dev --legacy-peer-deps
RUN mkdir -p uploads

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "start"]
