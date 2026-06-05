# Getting Started

## Running the API without Docker

Install dependencies:

```sh
npm install
```

Build the TypeScript application:

```sh
npm run build
```

Run the server with the sample configuration file:

```sh
FALCON_CONFIG=example/millennium-falcon.json npm start
```

The application reads its startup configuration from `FALCON_CONFIG` and resolves `routes_db` relative to that JSON file.

Call the API:

```sh
curl -X POST http://localhost:3000/compute \
  -H 'Content-Type: application/json' \
  -d '{"arrival":"Endor"}'
```

Run the test suite:

```sh
npm test
```

## Running the API with Docker

Build the image:

```sh
docker build -t animaj-technical-test .
```

Run the container:

```sh
docker run --rm -p 3000:3000 animaj-technical-test
```

The image defaults to:

```sh
FALCON_CONFIG=/app/example/millennium-falcon.json
```

Call the API:

```sh
curl -X POST http://localhost:3000/compute \
  -H 'Content-Type: application/json' \
  -d '{"arrival":"Endor"}'
```
