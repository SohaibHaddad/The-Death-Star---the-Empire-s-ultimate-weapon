import type { PathState } from "./PathState.js";

// A min-heap is a tree-like structure where the smallest item is always kept
// at the root. Here "smallest" means the path state with the lowest duration,
// which lets Dijkstra fetch the cheapest pending state efficiently.
// PathStatePriorityQueue implements this min-heap tree structure so inserting
// and removing the cheapest pending path state stays efficient.
// Example: if the queue contains durations [12, 3, 7, 8, 5, 10, 9], the heap
// can look like:
//         3
//       /   \
//      5     7
//     / \   / \
//    12  8 10  9
// The root is 3, so popping the queue returns the 3-day state before the
// 5-day, 7-day, 8-day, 9-day, 10-day, and 12-day ones.
export class PathStatePriorityQueue {
  private readonly items: PathState[] = [];

  constructor(initialState: PathState) {
    this.push(initialState);
  }

  push(state: PathState): void {
    // Insert at the end, then move the new state upward until the heap
    // property is restored: every parent must be cheaper than its children.
    this.items.push(state);
    this.bubbleUp(this.items.length - 1);
  }

  pop(): PathState | undefined {
    // The root of the min-heap is always the cheapest state available.
    const firstItem = this.items[0];
    const lastItem = this.items.pop();

    if (!firstItem) {
      return undefined;
    }

    if (this.items.length === 0 || !lastItem) {
      return firstItem;
    }

    // Move the last item to the root, then push it downward until the heap
    // property is restored again.
    this.items[0] = lastItem;
    this.bubbleDown(0);

    return firstItem;
  }

  get isEmpty(): boolean {
    return this.items.length === 0;
  }

  private bubbleUp(startIndex: number): void {
    let currentIndex = startIndex;

    // bubbleUp moves a newly inserted item toward the root when it is cheaper
    // than its parent.
    //
    // Example, before restoring the heap:
    //         3
    //       /   \
    //      5     7
    //     / \   / \
    //    12  8 10  9
    //           /
    //          4
    //
    // Here 4 is under 10, but 4 is cheaper than 10, so the heap property is
    // broken on that branch.
    //
    // After bubbling up once:
    //         3
    //       /   \
    //      5     7
    //     / \   / \
    //    12  8  4  9
    //          /
    //         10
    //
    // If 4 were still cheaper than its new parent, it would continue climbing
    // until the tree becomes a valid min-heap again.
    while (currentIndex > 0) {
      const parentIndex = Math.floor((currentIndex - 1) / 2);

      // Stop once the parent is already cheaper than the current item.
      if (this.items[parentIndex].duration <= this.items[currentIndex].duration) {
        break;
      }

      this.swap(parentIndex, currentIndex);
      currentIndex = parentIndex;
    }
  }

  private bubbleDown(startIndex: number): void {
    let currentIndex = startIndex;

    // bubbleDown restores the heap after removing the root. We move the last
    // item to the top, then keep swapping it with the cheaper child until the
    // tree is valid again.
    //
    // Example, after removing the root 3 and moving the last item 9 to the top:
    //         9
    //       /   \
    //      5     7
    //     / \   /
    //    12  8 10
    //
    // This is no longer a valid min-heap because 9 is greater than 5.
    //
    // After bubbling down once:
    //         5
    //       /   \
    //      9     7
    //     / \   /
    //    12  8 10
    //
    // 9 is still greater than 8, so it must keep sinking.
    //
    // After bubbling down again:
    //         5
    //       /   \
    //      8     7
    //     / \   /
    //    12  9 10
    //
    // Now every parent is cheaper than its children, so the heap is balanced
    // again and the min-heap property is restored.
    while (true) {
      const leftChildIndex = currentIndex * 2 + 1;
      const rightChildIndex = currentIndex * 2 + 2;
      let smallestIndex = currentIndex;

      // Among the current item and its children, keep the cheapest one at the top.
      if (
        leftChildIndex < this.items.length &&
        this.items[leftChildIndex].duration < this.items[smallestIndex].duration
      ) {
        smallestIndex = leftChildIndex;
      }

      if (
        rightChildIndex < this.items.length &&
        this.items[rightChildIndex].duration < this.items[smallestIndex].duration
      ) {
        smallestIndex = rightChildIndex;
      }

      if (smallestIndex === currentIndex) {
        break;
      }

      this.swap(currentIndex, smallestIndex);
      currentIndex = smallestIndex;
    }
  }

  private swap(leftIndex: number, rightIndex: number): void {
    const leftValue = this.items[leftIndex];
    this.items[leftIndex] = this.items[rightIndex];
    this.items[rightIndex] = leftValue;
  }
}
