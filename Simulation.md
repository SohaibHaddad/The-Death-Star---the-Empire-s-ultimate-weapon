# Simulation

## Goal

This document explains how the route evaluation algorithm works step by step.

The application computes the fastest route by:

1. loading routes from the database
2. converting them into a graph
3. running Dijkstra's algorithm on search states of the form:

```text
(planetName, remainingAutonomy)
```

The important point is that the algorithm does not only track the current planet. It also tracks how much autonomy is left after reaching that planet.

## Example Input

The example from the README uses:

```json
{
  "autonomy": 6,
  "departure": "Tatooine"
}
```

and the following routes:

| Origin | Destination | Travel Time |
| ------ | ----------- | ----------- |
| Tatooine | Dagobah | 6 |
| Dagobah | Endor | 4 |
| Dagobah | Hoth | 1 |
| Hoth | Endor | 1 |
| Tatooine | Hoth | 6 |

Target:

```json
{
  "arrival": "Endor"
}
```

## Graph View

The route table becomes an undirected graph:

```text
            Dagobah
         /    |     \
      6 /     |1     \ 4
       /      |       \
Tatooine--6- Hoth --1- Endor
```

A cleaner layout:

```text
Tatooine --6-- Dagobah --4-- Endor
    |
    6
    |
   Hoth --1-- Endor
     |
     1
     |
   Dagobah
```

This means:

- `Tatooine -> Dagobah` costs `6`
- `Dagobah -> Endor` costs `4`
- `Dagobah -> Hoth` costs `1`
- `Tatooine -> Hoth` costs `6`
- `Hoth -> Endor` costs `1`

## Search State

The algorithm does not only store planets. It stores:

```text
(planet, remainingAutonomy, durationSoFar, routeSoFar)
```

Examples:

```text
(Tatooine, 6, 0, [Tatooine])
(Hoth, 0, 6, [Tatooine, Hoth])
(Endor, 5, 8, [Tatooine, Hoth, Endor])
```

Why keep `remainingAutonomy`?

Because reaching the same planet with different fuel levels changes what happens next.

For example:

```text
Hoth:0  -> next jump may require refueling
Hoth:3  -> next jump may be possible immediately
```

So these are different states.

## Initial State

At the beginning:

```text
Queue:
  [(Tatooine, 6, 0, [Tatooine])]

BestDurationByState:
  {}
```

The queue is a min-heap ordered by `duration`.

Visual heap:

```text
        (Tatooine,6,0)
```

## Step 1: Pop the First State

The algorithm pops the cheapest state from the heap:

```text
Current state:
  (Tatooine, 6, 0, [Tatooine])
```

This is not the destination, so the algorithm expands its neighbors.

Neighbors of `Tatooine`:

```text
Tatooine --6-- Dagobah
Tatooine --6-- Hoth
```

### Expand Tatooine -> Dagobah

Current autonomy: `6`
Travel time: `6`

No refuel needed because:

```text
6 >= 6
```

New state:

```text
(Dagobah, 0, 6, [Tatooine, Dagobah])
```

Explanation:

- duration becomes `0 + 6 = 6`
- remaining autonomy becomes `6 - 6 = 0`

### Expand Tatooine -> Hoth

Current autonomy: `6`
Travel time: `6`

No refuel needed.

New state:

```text
(Hoth, 0, 6, [Tatooine, Hoth])
```

### State After Step 1

```text
BestDurationByState:
  Tatooine:6 -> 0

Queue:
  [(Dagobah, 0, 6), (Hoth, 0, 6)]
```

Heap view:

```text
        6:Dagobah:0
        /
    6:Hoth:0
```

Both have the same duration, so either one may appear first depending on heap ordering.

## Step 2: Pop One Cheapest State

Assume the heap pops:

```text
(Dagobah, 0, 6, [Tatooine, Dagobah])
```

This is not the destination, so expand neighbors of `Dagobah`.

Graph around `Dagobah`:

```text
Tatooine --6-- Dagobah --4-- Endor
                |
                1
                |
               Hoth
```

### Expand Dagobah -> Tatooine

Current autonomy: `0`
Travel time: `6`

Refuel is needed first:

```text
0 < 6
```

Cost of this move:

```text
1 refuel day + 6 travel days = 7
```

New duration:

```text
6 + 7 = 13
```

New state:

```text
(Tatooine, 0, 13, [Tatooine, Dagobah, Tatooine])
```

This state is worse than the already known state:

```text
Tatooine:6 -> 0
```

It may still differ in autonomy (`0` instead of `6`), but it is clearly much later in time and usually not useful.

### Expand Dagobah -> Endor

Current autonomy: `0`
Travel time: `4`

Refuel needed:

```text
0 < 4
```

Move cost:

```text
1 + 4 = 5
```

New state:

```text
(Endor, 2, 11, [Tatooine, Dagobah, Endor])
```

Explanation:

- refill to `6`
- spend `4`
- remaining autonomy becomes `2`
- duration becomes `6 + 1 + 4 = 11`

### Expand Dagobah -> Hoth

Current autonomy: `0`
Travel time: `1`

Refuel needed:

```text
0 < 1
```

Move cost:

```text
1 + 1 = 2
```

New state:

```text
(Hoth, 5, 8, [Tatooine, Dagobah, Hoth])
```

Explanation:

- refill to `6`
- spend `1`
- remaining autonomy becomes `5`
- duration becomes `6 + 1 + 1 = 8`

### State After Step 2

```text
BestDurationByState:
  Tatooine:6 -> 0
  Dagobah:0 -> 6

Queue:
  (Hoth, 0, 6)
  (Hoth, 5, 8)
  (Endor, 2, 11)
  (Tatooine, 0, 13)
```

Heap idea:

```text
           6:Hoth:0
         /           \
    8:Hoth:5      11:Endor:2
    /
13:Tatooine:0
```

## Step 3: Pop the Next Cheapest State

The cheapest remaining state is:

```text
(Hoth, 0, 6, [Tatooine, Hoth])
```

This is still not the destination, so expand neighbors of `Hoth`.

Graph around `Hoth`:

```text
Dagobah --1-- Hoth --1-- Endor
```

### Expand Hoth -> Dagobah

Current autonomy: `0`
Travel time: `1`

Refuel needed.

Move cost:

```text
1 + 1 = 2
```

New state:

```text
(Dagobah, 5, 8, [Tatooine, Hoth, Dagobah])
```

### Expand Hoth -> Endor

Current autonomy: `0`
Travel time: `1`

Refuel needed.

Move cost:

```text
1 + 1 = 2
```

New state:

```text
(Endor, 5, 8, [Tatooine, Hoth, Endor])
```

Explanation:

- refill to `6`
- travel for `1`
- remaining autonomy becomes `5`
- total duration becomes `6 + 1 + 1 = 8`

### State After Step 3

```text
BestDurationByState:
  Tatooine:6 -> 0
  Dagobah:0 -> 6
  Hoth:0 -> 6

Queue:
  (Hoth, 5, 8)
  (Dagobah, 5, 8)
  (Endor, 5, 8)
  (Endor, 2, 11)
  (Tatooine, 0, 13)
```

Heap sketch:

```text
                8:Endor:5
             /             \
       8:Hoth:5         8:Dagobah:5
       /      \
11:Endor:2  13:Tatooine:0
```

Any of the `duration = 8` states may be the root, but all are tied for cheapest.

## Step 4: Pop the Arrival State

One of the cheapest states is:

```text
(Endor, 5, 8, [Tatooine, Hoth, Endor])
```

This state reaches the destination.

Because the priority queue is a min-heap and always pops the cheapest duration first, this is guaranteed by Dijkstra's algorithm to be the optimal route.

Result:

```json
{
  "duration": 8,
  "route": ["Tatooine", "Hoth", "Endor"]
}
```

## Why the Dagobah Route Loses

The other main route is:

```text
Tatooine -> Dagobah -> Endor
```

Let us simulate it:

### First jump

```text
Tatooine -> Dagobah = 6 days
remaining autonomy = 0
```

### Second jump

```text
Dagobah -> Endor = 4 days
```

But autonomy is `0`, so refuel is required:

```text
1 refuel day + 4 travel days = 5
```

Total:

```text
6 + 5 = 11
```

So:

```text
Tatooine -> Dagobah -> Endor = 11 days
Tatooine -> Hoth -> Endor = 8 days
```

## Why the Algorithm Needs Fuel in the State

Suppose two different paths both reach `Hoth`:

```text
State A = (Hoth, 0, 6, ...)
State B = (Hoth, 5, 8, ...)
```

These are not the same state.

Visual idea:

```text
State A:
Hoth
fuel = 0
must refuel before a 1-day jump

State B:
Hoth
fuel = 5
can jump immediately
```

Even if they are on the same planet, their future costs are different.

That is why the algorithm tracks:

```text
planetName + remainingAutonomy
```

instead of only:

```text
planetName
```

## Why Worse States Are Discarded

The algorithm stores the best known duration for each `(planet, autonomy)` pair.

Example:

```text
Best known:
Hoth:5 -> 8 days
```

If later the algorithm finds:

```text
Hoth:5 -> 10 days
```

that state is discarded, because:

- it is the same planet
- it has the same remaining autonomy
- it arrives later

So it cannot improve any future route.

Illustration:

```text
Useful state:
  (Hoth, 5) at day 8

Worse duplicate:
  (Hoth, 5) at day 10

Decision:
  discard day 10 version
```

## Another Graph Example: Refuel vs Alternate Route

Consider this graph:

```text
Tatooine --4-- Hoth --4-- Endor
    \
     3
      \
     Dagobah --3-- Bespin --2-- Endor
```

Autonomy:

```text
6
```

### Direct-looking route

```text
Tatooine -> Hoth -> Endor
```

Simulation:

```text
Tatooine -> Hoth = 4
remaining autonomy = 2

Hoth -> Endor = 4
need refuel first
cost = 1 + 4 = 5

total = 4 + 5 = 9
```

### Longer alternate route

```text
Tatooine -> Dagobah -> Bespin -> Endor
```

Simulation:

```text
Tatooine -> Dagobah = 3
remaining autonomy = 3

Dagobah -> Bespin = 3
remaining autonomy = 0

Bespin -> Endor = 2
need refuel first
cost = 1 + 2 = 3

total = 3 + 3 + 3 = 9
```

In this example, both routes are equal.

If one route were even one day cheaper, Dijkstra would pick it automatically because the queue always explores the smallest accumulated duration first.

## How This Matches the Code

The main pieces in the code correspond to the simulation like this:

- `UniverseGraph`
  Builds the planet graph from route rows
- `PlanetNode`
  Stores a planet and its connections
- `PathState`
  Stores one search step: planet, remaining autonomy, duration, and route
- `PathStatePriorityQueue`
  Always returns the cheapest pending state
- `BestDurationByState`
  Prevents revisiting worse versions of the same state
- `DijkstraPathFinder`
  Runs the search
- `PathEvaluationService`
  Loads routes, builds the graph, and delegates to the pathfinder

## Final Summary

The simulation can be summarized like this:

```text
1. Build a graph from the route table
2. Start at (departure, full autonomy, 0 days)
3. Store pending states in a min-heap ordered by duration
4. Pop the cheapest state
5. If it is the destination, return it
6. Otherwise expand its neighbors
7. Add refuel cost when autonomy is insufficient
8. Skip worse duplicates of the same (planet, autonomy) state
9. Repeat until the destination is found
```

That is how the application produces:

```json
{
  "duration": 8,
  "route": ["Tatooine", "Hoth", "Endor"]
}
```
