# Architecture

## Overview

This project is a small Express backend that computes one of the fastest routes for the Millennium Falcon to reach a target planet before the deadline implied by the input problem.

The application is organized in layers:

- `src/server.ts`
  Bootstraps the application: loads configuration, initializes the database connection, creates the repository and services, then starts Express.
- `src/config/`
  Loads and validates startup configuration from the Millennium Falcon JSON file.
- `src/database-entities/`
  Contains the TypeORM entities that map database tables.
- `src/repositories/`
  Contains data-access classes that read persisted route data through TypeORM.
- `src/domaine-entities/`
  Contains the in-memory domain model used by the pathfinding logic.
- `src/services/`
  Contains application services and the pathfinding algorithm.
- `src/handlers/`
  Contains HTTP request handlers and API request/response types.

The general flow is:

1. Load app configuration from `FALCON_CONFIG`
2. Resolve the SQLite database path
3. Initialize TypeORM
4. Load route data through `RouteRepository`
5. Build an in-memory graph
6. Run Dijkstra's algorithm on that graph
7. Return the resulting `{ duration, route }` payload from `/compute`

## Request Flow

At runtime, the request path is:

1. `POST /compute` hits `createComputeHandler`
2. The handler validates the request body
3. The handler calls `PathEvaluationService.evaluate(arrival)`
4. `PathEvaluationService` loads all routes and builds a `UniverseGraph`
5. `DijkstraPathFinder` computes the shortest path
6. The handler returns the result as JSON

That separation keeps responsibilities clear:

- handlers deal with HTTP and validation
- repositories deal with persistence
- domain entities model graph/search concepts
- services orchestrate use cases and algorithms

## Domain Model

The pathfinding logic does not work directly on database rows. It converts them into in-memory domain objects:

- `RouteEntity`
  Database representation of one row in the `ROUTES` table
- `PlanetNode`
  Represents a planet and its outgoing connections
- `UniverseGraph`
  Represents the graph of planets and routes
- `PathState`
  Represents one search state during pathfinding
- `BestDurationByState`
  Tracks the best known duration for a `(planet, remainingAutonomy)` state
- `PathStatePriorityQueue`
  Priority queue used by Dijkstra to always expand the cheapest pending state first

The important design choice is that the search state is not only the current planet. It is:

```text
(planetName, remainingAutonomy)
```

That is necessary because arriving at the same planet with different remaining fuel can change the cost of future jumps.

Example:

- reaching `Hoth` with `0` autonomy left may require refueling before the next jump
- reaching `Hoth` with `3` autonomy left may allow immediate travel

Those are different search states, even though the planet is the same.

## Dijkstra's Algorithm in This Project

The project uses Dijkstra's algorithm because every move has a non-negative cost:

- `travelTime` days for the jump itself
- `+1` day if the Falcon must refuel before taking that jump

Dijkstra is a good fit when:

- we need the shortest path
- all edge costs are non-negative
- greedy expansion of the currently cheapest state is safe

In this implementation, the algorithm works on an expanded state graph:

- node: `(planet, remainingAutonomy)`
- edge: a jump to a neighboring planet
- edge cost:
  - `travelTime` if enough autonomy remains
  - `travelTime + 1` if a refuel day is required first

The high-level algorithm is:

1. Start at `(departure, autonomy)` with duration `0`
2. Put that state into a priority queue
3. Repeatedly pop the cheapest pending state
4. If it is the arrival planet, return it
5. Otherwise expand all reachable neighbor states
6. Skip states that are already known with a better or equal duration
7. Continue until a route is found or no states remain

The key pruning rule is:

- if the same `(planet, remainingAutonomy)` state was already reached in fewer or equal days, the current state is useless and can be discarded

That avoids re-exploring inferior paths.

## The Min-Heap

`PathStatePriorityQueue` implements a min-heap.

A min-heap is a tree structure where the smallest item is always at the root. In this project, "smallest" means:

```text
the PathState with the lowest accumulated duration
```

That matters because Dijkstra must always expand the cheapest pending state first.

Example heap:

```text
        3
      /   \
     5     7
    / \   / \
   12  8 10  9
```

Here, `3` is at the root because it is the smallest duration.

### Why use a min-heap

The earlier implementation used an array that was sorted every time a new state was pushed. That works, but it is inefficient because it repeatedly sorts the whole collection.

The min-heap improves that:

- `push` inserts one item and restores heap order with `bubbleUp`
- `pop` removes the cheapest item and restores heap order with `bubbleDown`

This keeps queue operations efficient and matches the needs of Dijkstra much better than repeated full-array sorting.

### bubbleUp

When a new item is inserted, it is appended at the end of the heap. If it is cheaper than its parent, it must move upward.

Example:

```text
Before:
        3
      /   \
     5     7
    / \   / \
   12  8 10  9
          /
         4

After bubbleUp:
        3
      /   \
     5     7
    / \   / \
   12  8  4  9
         /
        10
```

The smaller value climbs until the heap property is restored.

### bubbleDown

When the root is removed, the last item is moved to the root position. If it is larger than one of its children, it must move downward.

Example:

```text
After moving the last item to the root:
        9
      /   \
     5     7
    / \   /
   12  8 10
```

This is not a valid min-heap because `9 > 5`.

After one bubbleDown step:

```text
        5
      /   \
     9     7
    / \   /
   12  8 10
```

`9` is still larger than `8`, so it continues:

```text
        5
      /   \
     8     7
    / \   /
   12  9 10
```

Now every parent is less than or equal to its children, so the heap is valid again.

## Database and Persistence

The persistence layer is intentionally simple.

- `RouteEntity`
  Maps the `ROUTES` table through TypeORM
- `RouteRepository`
  Loads route records for the pathfinding flow

At startup:

- `loadAppConfig` loads and validates the JSON config
- `createAppDataSource` creates the TypeORM `DataSource`
- `RouteRepository` reads route rows from SQLite

The pathfinding algorithm then works entirely on in-memory objects. That means the path search itself is not coupled to SQL or TypeORM.

## How Everything Fits Together

The project works as a pipeline:

1. Configuration layer
   Reads `autonomy`, `departure`, and `routes_db`
2. Persistence layer
   Loads `ROUTES` from SQLite through TypeORM
3. Domain layer
   Converts route rows into a graph of `PlanetNode` objects
4. Algorithm layer
   Uses `DijkstraPathFinder` with a min-heap priority queue and best-known-state tracking
5. Service layer
   Coordinates data loading and pathfinding
6. Handler layer
   Validates HTTP input and returns HTTP output

In short:

- `PathEvaluationService` orchestrates the use case
- `UniverseGraph` models the route network
- `DijkstraPathFinder` computes the fastest path
- `PathStatePriorityQueue` makes the cheapest-state lookup efficient
- `BestDurationByState` prevents useless re-exploration
- `computeHandler` turns the result into the API response

This keeps the project modular:

- changing persistence should not require changing the algorithm
- changing the HTTP layer should not require changing the graph logic
- changing the algorithm should not require changing TypeORM entities
