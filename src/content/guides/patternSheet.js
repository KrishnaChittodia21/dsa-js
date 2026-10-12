// "DSA Pattern Recognition Master Cheat Sheet" — the learner's own reference sheet, kept verbatim.
// sheetSections() splits it into its numbered sections so the app can show each section where it
// belongs (topic cheatsheets, the Pattern Finder page). Edit the text freely; keep the
// "====\nN. TITLE\n====" headers so the parser can find the sections.

export const PATTERN_SHEET = String.raw`
============================================================
1. MASTER DSA DECISION TREE
============================================================

START
 |
 |-- Is it an ARRAY / STRING?
 |      |
 |      |-- Sorted?
 |      |     |
 |      |     |-- Need pair/triplet relationship?
 |      |     |       → TWO POINTERS
 |      |     |
 |      |     |-- Need to search for a value?
 |      |     |       → BINARY SEARCH
 |      |     |
 |      |     |-- Need range/search boundary?
 |      |             → LOWER/UPPER BOUND
 |      |
 |      |-- Contiguous subarray / substring?
 |      |     |
 |      |     |-- Fixed size?
 |      |     |       → FIXED SLIDING WINDOW
 |      |     |
 |      |     |-- Variable size + monotonic condition?
 |      |     |       → VARIABLE SLIDING WINDOW
 |      |     |
 |      |     |-- Negative numbers / exact sum?
 |      |             → PREFIX SUM + HASHMAP
 |      |
 |      |-- Frequency / duplicates?
 |      |       → HASHMAP / SET
 |      |
 |      |-- Maximum subarray sum?
 |      |       → KADANE
 |      |
 |      |-- Values in range 1..n / misplaced indexes?
 |      |       → CYCLIC SORT / INDEX MAPPING
 |      |
 |      |-- In-place manipulation?
 |              → TWO POINTERS / INDEX MAPPING
 |
 |-- Is it a LINKED LIST?
 |      |
 |      |-- Middle / cycle?
 |      |       → FAST + SLOW POINTERS
 |      |
 |      |-- Reverse?
 |      |       → POINTER REVERSAL
 |      |
 |      |-- Reverse part?
 |      |       → PARTIAL REVERSAL
 |      |
 |      |-- Merge sorted lists?
 |      |       → TWO POINTERS
 |      |
 |      |-- Remove node / boundary handling?
 |              → DUMMY NODE
 |
 |-- Is it a STACK problem?
 |      |
 |      |-- Parentheses / nesting?
 |      |       → STACK
 |      |
 |      |-- Next greater/smaller?
 |      |       → MONOTONIC STACK
 |      |
 |      |-- Expression evaluation?
 |      |       → STACK
 |      |
 |      |-- Previous/next element relationship?
 |              → MONOTONIC STACK
 |
 |-- Is it TOP K / Kth / streaming?
 |      |
 |      |-- Need largest/smallest K?
 |      |       → HEAP
 |      |
 |      |-- Kth largest?
 |      |       → MIN HEAP SIZE K
 |      |
 |      |-- Kth smallest?
 |      |       → MAX HEAP SIZE K
 |      |
 |      |-- Streaming median?
 |              → TWO HEAPS
 |
 |-- Is it INTERVALS?
 |      |
 |      |-- Overlap?
 |      |       → SORT + MERGE
 |      |
 |      |-- Scheduling?
 |      |       → SORT + GREEDY / HEAP
 |      |
 |      |-- Sweep events?
 |              → SWEEP LINE
 |
 |-- Is it a TREE?
 |      |
 |      |-- Explore every node/path?
 |      |       → DFS
 |      |
 |      |-- Level / minimum depth?
 |      |       → BFS
 |      |
 |      |-- Sorted tree property?
 |      |       → BST
 |      |
 |      |-- Path/subtree optimization?
 |              → TREE DP
 |
 |-- Is it a GRAPH?
 |      |
 |      |-- Explore connectivity?
 |      |       → DFS / BFS
 |      |
 |      |-- Shortest path?
 |      |       |
 |      |       |-- Unweighted
 |      |       |     → BFS
 |      |       |
 |      |       |-- Non-negative weights
 |      |       |     → DIJKSTRA
 |      |       |
 |      |       |-- Negative weights
 |      |             → BELLMAN-FORD
 |      |
 |      |-- Dependencies/order?
 |      |       → TOPOLOGICAL SORT
 |      |
 |      |-- Dynamic connectivity?
 |              → UNION FIND / DSU
 |
 |-- Need ALL possible combinations?
 |      |
 |      |-- Subsets?
 |      |       → BACKTRACKING
 |      |
 |      |-- Permutations?
 |      |       → BACKTRACKING
 |      |
 |      |-- Combinations?
 |              → BACKTRACKING
 |
 |-- Optimization / count / minimum / maximum?
 |      |
 |      |-- Overlapping subproblems?
 |      |       → DYNAMIC PROGRAMMING
 |      |
 |      |-- Local choice always optimal?
 |              → GREEDY
 |
 |-- Prefix / autocomplete / dictionary?
 |      |
 |      |-- Prefix matching?
 |              → TRIE
 |
 |-- Range queries / updates?
 |      |
 |      |-- Prefix/static range?
 |      |       → PREFIX SUM
 |      |
 |      |-- Dynamic range updates/queries?
 |      |       → FENWICK / SEGMENT TREE
 |
 |-- XOR / bit states?
 |      |
 |              → BIT MANIPULATION
 |
END


============================================================
2. ARRAY PATTERN RECOGNITION
============================================================

ARRAY
 |
 |-- Sorted?
 |      |
 |      |-- Pair/triplet/target relationship
 |      |       → TWO POINTERS
 |      |
 |      |-- Search for target
 |      |       → BINARY SEARCH
 |      |
 |      |-- Find first/last valid position
 |              → LOWER/UPPER BOUND
 |
 |-- Unsorted?
 |      |
 |      |-- Need frequency?
 |      |       → HASHMAP
 |      |
 |      |-- Need duplicate detection?
 |      |       → SET
 |      |
 |      |-- Pair sum?
 |      |       → HASHMAP
 |      |
 |      |-- Contiguous range?
 |              → SLIDING WINDOW / PREFIX SUM
 |
 |-- Values are 1..n?
 |      |
 |              → CYCLIC SORT / INDEX MAPPING
 |
 |-- Need maximum contiguous sum?
 |      |
 |              → KADANE
 |
 |-- Need in-place modification?
        |
                → TWO POINTERS / INDEX MAPPING


============================================================
3. SORTED ARRAY CHEAT SHEET
============================================================

SORTED ARRAY
 |
 |-- "Find target"
 |       → BINARY SEARCH
 |
 |-- "Find first occurrence"
 |       → LOWER BOUND
 |
 |-- "Find last occurrence"
 |       → UPPER BOUND
 |
 |-- "Find pair with target sum"
 |       → TWO POINTERS
 |
 |-- "Find triplet with target"
 |       → SORT + TWO POINTERS
 |
 |-- "Closest pair/triplet"
 |       → TWO POINTERS
 |
 |-- "Remove duplicates in-place"
 |       → TWO POINTERS
 |
 |-- "Merge two sorted arrays"
 |       → TWO POINTERS
 |
 |-- "Intersection of sorted arrays"
 |       → TWO POINTERS
 |
 |-- "Median of two sorted arrays"
 |       → BINARY SEARCH
 |
 |-- "Minimum capacity / speed / answer"
         → BINARY SEARCH ON ANSWER


IMPORTANT:

Sorted ≠ automatically Two Pointers.

Use:

SORTED + SEARCH
→ Binary Search

SORTED + PAIR/RELATIONSHIP
→ Two Pointers


============================================================
4. TWO POINTERS CHEAT SHEET
============================================================

TWO POINTERS
 |
 |-- Opposite direction
 |      |
 |      |-- Sorted pair sum
 |      |-- Palindrome
 |      |-- Container/max area
 |      |-- Closest pair
 |      |-- Partitioning
 |
 |-- Same direction
 |      |
 |      |-- Remove duplicates
 |      |-- In-place filtering
 |      |-- Fast/slow style
 |
 |-- Two arrays
 |      |
 |      |-- Merge
 |      |-- Intersection
 |      |-- Compare elements
 |
 |-- Read/write indexes
        |
        |-- In-place modification
        |-- Remove elements
        |-- Move valid elements


SIGNALS:

"sorted"
"pair"
"triplet"
"target sum"
"left/right"
"closest"
"remove duplicates"
"in-place"
"palindrome"
"merge sorted"


============================================================
5. SLIDING WINDOW CHEAT SHEET
============================================================

CONTIGUOUS SUBARRAY / SUBSTRING
 |
 |-- Fixed size K?
 |       → FIXED WINDOW
 |
 |-- Variable size?
 |       |
 |       |-- Condition becomes monotonic when expanding/shrinking?
 |       |       → VARIABLE WINDOW
 |       |
 |       |-- Negative values break monotonicity?
 |               → Consider PREFIX SUM / HASHMAP / OTHER METHOD


FIXED WINDOW

"maximum sum of subarray of size K"
"minimum sum of window size K"
"average of every K elements"
"count elements in every K-length window"

→ Sliding Window


VARIABLE WINDOW

"longest substring with at most K..."
"smallest subarray with sum >= K"
"longest subarray satisfying condition"
"minimum window containing..."

→ Sliding Window


IMPORTANT:

Sliding Window works naturally when the window condition
can be maintained incrementally and moving the left pointer
restores validity.

Do NOT blindly use sliding window for exact-sum problems
with negative numbers.


============================================================
6. SUBARRAY / SUBSTRING DECISION TREE
============================================================

CONTIGUOUS?
 |
 YES
 |
 |-- Fixed length K?
 |       → SLIDING WINDOW
 |
 |-- Variable length?
 |      |
 |      |-- Positive / non-negative + monotonic condition?
 |      |       → SLIDING WINDOW
 |      |
 |      |-- Exact sum + negatives possible?
 |      |       → PREFIX SUM + HASHMAP
 |      |
 |      |-- Count subarrays with sum K?
 |      |       → PREFIX SUM + HASHMAP
 |      |
 |      |-- Divisible by K?
 |      |       → PREFIX SUM + REMAINDER
 |      |
 |      |-- Maximum subarray sum?
 |      |       → KADANE
 |
 NO
 |
 → Consider other patterns


============================================================
7. PREFIX SUM CHEAT SHEET
============================================================

PREFIX SUM
 |
 |-- Range sum queries
 |       → PREFIX SUM
 |
 |-- Subarray sum = K
 |       → PREFIX SUM + HASHMAP
 |
 |-- Count subarrays with sum K
 |       → PREFIX SUM + HASHMAP
 |
 |-- Negative numbers + exact sum
 |       → PREFIX SUM + HASHMAP
 |
 |-- Divisible by K
 |       → PREFIX SUM + REMAINDER MAP
 |
 |-- Range updates
 |       → DIFFERENCE ARRAY
 |
 |-- 2D matrix range sums
        → 2D PREFIX SUM


KEY IDEA:

sum(i...j) = prefix[j] - prefix[i-1]


============================================================
8. HASHMAP / HASHING CHEAT SHEET
============================================================

HASHMAP
 |
 |-- Frequency?
 |       → Frequency Map
 |
 |-- Duplicate?
 |       → Set / HashMap
 |
 |-- Pair complement?
 |       → HashMap
 |
 |-- "Have I seen this before?"
 |       → HashMap / Set
 |
 |-- Prefix sum relationship?
 |       → Prefix Sum + HashMap
 |
 |-- Group by property?
 |       → HashMap
 |
 |-- Character counts?
 |       → Frequency Map
 |
 |-- Sliding window frequency?
 |       → HashMap + Sliding Window
 |
 |-- Need O(1) average lookup?
        → HashMap / Set


SIGNALS:

"frequency"
"count occurrences"
"duplicate"
"seen before"
"complement"
"group"
"lookup"
"pair sum"


============================================================
9. BINARY SEARCH CHEAT SHEET
============================================================

BINARY SEARCH
 |
 |-- Sorted array + target?
 |       → CLASSIC BINARY SEARCH
 |
 |-- First valid position?
 |       → LOWER BOUND
 |
 |-- Last valid position?
 |       → UPPER BOUND
 |
 |-- Rotated sorted array?
 |       → ROTATED BINARY SEARCH
 |
 |-- Answer lies in numeric range?
 |       → BINARY SEARCH ON ANSWER
 |
 |-- Can ask "is this answer possible?"
 |       |
 |       → YES/NO monotonic predicate
 |       → BINARY SEARCH ON ANSWER


KEY SIGNAL:

"If answer increases, feasibility changes only once"

Example:

speed = 1 → impossible
speed = 2 → impossible
speed = 3 → possible
speed = 4 → possible
speed = 5 → possible

→ Binary Search on Answer


COMMON WORDS:

minimum possible
maximum possible
smallest capacity
minimum speed
minimum time
maximize minimum
minimize maximum
at least
at most
feasible


============================================================
10. BINARY SEARCH ON ANSWER
============================================================

PROBLEM
 |
 |-- Is there a numeric answer range?
 |       |
 |       YES
 |
 |-- Can I write:
 |       "Can X satisfy the requirement?"
 |
 |       YES
 |
 |-- Does feasibility change monotonically?
 |
 |       YES
 |
 → BINARY SEARCH ON ANSWER


TEMPLATE:

low = minimum possible answer
high = maximum possible answer

while (low <= high) {
    mid = ...

    if (isPossible(mid)) {
        // move toward better answer
    } else {
        // move opposite
    }
}


============================================================
11. LINKED LIST CHEAT SHEET
============================================================

LINKED LIST
 |
 |-- Find middle
 |       → FAST + SLOW
 |
 |-- Detect cycle
 |       → FAST + SLOW
 |
 |-- Find cycle start
 |       → FAST + SLOW
 |
 |-- Reverse list
 |       → POINTER REVERSAL
 |
 |-- Reverse part
 |       → PARTIAL REVERSAL
 |
 |-- Merge sorted lists
 |       → TWO POINTERS
 |
 |-- Remove node
 |       → DUMMY NODE
 |
 |-- Compare from both ends
 |       → REVERSE / STACK
 |
 |-- Find intersection
 |       → TWO POINTERS
 |
 |-- Palindrome
        → FAST/SLOW + REVERSE


============================================================
12. FAST + SLOW POINTER CHEAT SHEET
============================================================

LINKED LIST / SEQUENCE
 |
 |-- Middle?
 |       → FAST + SLOW
 |
 |-- Cycle?
 |       → FAST + SLOW
 |
 |-- Cycle entry?
 |       → FAST + SLOW
 |
 |-- Palindrome?
 |       → FAST + SLOW + REVERSE
 |
 |-- Detect repeated state?
        → FAST + SLOW


SIGNAL:

"middle"
"cycle"
"loop"
"meeting point"
"repeated state"


============================================================
13. STACK CHEAT SHEET
============================================================

STACK
 |
 |-- Parentheses?
 |       → STACK
 |
 |-- Nested structure?
 |       → STACK
 |
 |-- Expression evaluation?
 |       → STACK
 |
 |-- Undo/backtracking state?
 |       → STACK
 |
 |-- Next greater/smaller?
 |       → MONOTONIC STACK
 |
 |-- Previous greater/smaller?
 |       → MONOTONIC STACK
 |
 |-- Histogram boundaries?
        → MONOTONIC STACK


SIGNALS:

"next greater"
"next smaller"
"previous greater"
"previous smaller"
"nearest"
"nested"
"parentheses"


============================================================
14. MONOTONIC STACK CHEAT SHEET
============================================================

MONOTONIC STACK
 |
 |-- Next Greater Element
 |       → DECREASING STACK
 |
 |-- Next Smaller Element
 |       → INCREASING STACK
 |
 |-- Previous Greater
 |       → DECREASING STACK
 |
 |-- Previous Smaller
 |       → INCREASING STACK
 |
 |-- Histogram
 |       → MONOTONIC STACK
 |
 |-- Temperature-like problems
 |       → MONOTONIC STACK
 |
 |-- Nearest greater/smaller
        → MONOTONIC STACK


KEY SIGNAL:

"nearest element satisfying comparison"


============================================================
15. QUEUE / DEQUE CHEAT SHEET
============================================================

QUEUE
 |
 |-- Level order
 |       → BFS
 |
 |-- Shortest unweighted path
 |       → BFS
 |
 |-- Multi-source expansion
 |       → MULTI-SOURCE BFS
 |
 |-- Process in arrival order
        → QUEUE


DEQUE
 |
 |-- Maximum of every window
 |       → MONOTONIC DEQUE
 |
 |-- Minimum of every window
 |       → MONOTONIC DEQUE
 |
 |-- Maintain candidates for sliding window
        → MONOTONIC DEQUE


IMPORTANT JS:

Do NOT use:

array.shift()

for large BFS.

Use:

let head = 0;
while (head < queue.length) {
    const node = queue[head++];
}


============================================================
16. HEAP / PRIORITY QUEUE CHEAT SHEET
============================================================

HEAP
 |
 |-- Top K largest
 |       → MIN HEAP SIZE K
 |
 |-- Top K smallest
 |       → MAX HEAP SIZE K
 |
 |-- Kth largest
 |       → MIN HEAP SIZE K
 |
 |-- Kth smallest
 |       → MAX HEAP SIZE K
 |
 |-- Repeatedly choose min/max
 |       → HEAP
 |
 |-- Scheduling
 |       → HEAP
 |
 |-- Merge K sorted structures
 |       → MIN HEAP
 |
 |-- Streaming median
 |       → TWO HEAPS
 |
 |-- Dynamic smallest/largest
        → PRIORITY QUEUE


SIGNALS:

"top K"
"Kth"
"smallest"
"largest"
"minimum available"
"maximum available"
"priority"
"streaming"


============================================================
17. TOP K CHEAT SHEET
============================================================

TOP K
 |
 |-- K largest
 |       → MIN HEAP OF SIZE K
 |
 |-- K smallest
 |       → MAX HEAP OF SIZE K
 |
 |-- K most frequent
 |       → HASHMAP + HEAP
 |
 |-- K closest
 |       → HEAP / SORT / QUICKSELECT
 |
 |-- Kth element
 |       → HEAP / QUICKSELECT
 |
 |-- Need sorted top K?
        → HEAP + optional sorting


Alternative:

If only kth element is needed
and average O(n) is acceptable:

→ QUICKSELECT


============================================================
18. INTERVAL CHEAT SHEET
============================================================

INTERVALS
 |
 |-- Overlapping intervals?
 |       → SORT BY START + MERGE
 |
 |-- Insert interval?
 |       → MERGE WITH SORTED INTERVALS
 |
 |-- Can attend all meetings?
 |       → SORT / SWEEP
 |
 |-- Minimum rooms?
 |       → SORT + MIN HEAP
 |
 |-- Maximum overlapping?
 |       → SWEEP LINE
 |
 |-- Timeline events?
        → SWEEP LINE


SIGNALS:

"interval"
"meeting"
"schedule"
"overlap"
"start/end"
"booking"
"rooms"
"events"


============================================================
19. SWEEP LINE CHEAT SHEET
============================================================

EVENTS ON A LINE
 |
 |-- Start event
 |       → +1
 |
 |-- End event
 |       → -1
 |
 |-- Sort events
 |       → Process chronologically
 |
 |-- Track active count
        → Maximum overlap / resources


USE FOR:

meeting rooms
airplanes
events
interval overlap
active users
bookings
line coverage


============================================================
20. TREE CHEAT SHEET
============================================================

TREE
 |
 |-- Explore every node
 |       → DFS
 |
 |-- Level by level
 |       → BFS
 |
 |-- Minimum depth
 |       → BFS
 |
 |-- Maximum depth
 |       → DFS
 |
 |-- Root-to-leaf path
 |       → DFS
 |
 |-- Path sum
 |       → DFS
 |
 |-- Subtree information
 |       → DFS / TREE DP
 |
 |-- Lowest common ancestor
 |       → TREE DFS / LCA
 |
 |-- Sorted tree
 |       → BST
 |
 |-- Serialize/deserialize
 |       → DFS / BFS
 |
 |-- Construct from traversals
        → RECURSION + HASHMAP


============================================================
21. TREE TRAVERSAL CHEAT SHEET
============================================================

PREORDER:

Root → Left → Right

Useful for:
- Copying tree
- Serialization
- Root-first processing


INORDER:

Left → Root → Right

IMPORTANT:

For BST:

INORDER = SORTED ORDER

Useful for:
- kth smallest
- sorted traversal
- BST validation


POSTORDER:

Left → Right → Root

Useful for:
- Bottom-up processing
- Subtree calculations
- Tree DP
- Delete tree


LEVEL ORDER:

Level by level

→ BFS + QUEUE


============================================================
22. BFS VS DFS
============================================================

GRAPH / TREE
 |
 |-- Need shortest path in UNWEIGHTED graph?
 |       → BFS
 |
 |-- Need minimum number of steps?
 |       → BFS
 |
 |-- Need level order?
 |       → BFS
 |
 |-- Need explore all paths?
 |       → DFS
 |
 |-- Need connected components?
 |       → DFS / BFS
 |
 |-- Need cycle detection?
 |       → DFS / BFS
 |
 |-- Need path/state exploration?
 |       → DFS
 |
 |-- Need backtracking?
 |       → DFS


MEMORY:

BFS = layers / distance

DFS = depth / exploration


============================================================
23. GRAPH CHEAT SHEET
============================================================

GRAPH
 |
 |-- Explore?
 |       → DFS / BFS
 |
 |-- Connected components?
 |       → DFS / BFS / DSU
 |
 |-- Cycle?
 |       → DFS / BFS / DSU
 |
 |-- Shortest unweighted?
 |       → BFS
 |
 |-- Shortest weighted, weights >= 0?
 |       → DIJKSTRA
 |
 |-- Negative edges?
 |       → BELLMAN-FORD
 |
 |-- All-pairs shortest path?
 |       → FLOYD-WARSHALL
 |
 |-- Dependencies?
 |       → TOPOLOGICAL SORT
 |
 |-- Dynamic connectivity?
 |       → DSU
 |
 |-- Bipartite?
 |       → BFS / DFS coloring
 |
 |-- Minimum spanning tree?
 |       → KRUSKAL / PRIM
 |
 |-- Strongly connected?
 |       → KOSARAJU / TARJAN
 |
 |-- Bridges?
 |       → TARJAN
 |
 |-- Articulation points?
        → TARJAN


============================================================
24. SHORTEST PATH DECISION TREE
============================================================

SHORTEST PATH
 |
 |-- Unweighted graph?
 |       → BFS
 |
 |-- Weights only 0 or 1?
 |       → 0-1 BFS
 |
 |-- All weights >= 0?
 |       → DIJKSTRA
 |
 |-- Negative weights?
 |       → BELLMAN-FORD
 |
 |-- Need every pair?
 |       → FLOYD-WARSHALL
 |
 |-- DAG?
 |       → TOPOLOGICAL ORDER + DP


============================================================
25. TOPOLOGICAL SORT CHEAT SHEET
============================================================

DEPENDENCIES / ORDER
 |
 |-- "Prerequisite"
 |       → TOPOLOGICAL SORT
 |
 |-- "Course schedule"
 |       → TOPOLOGICAL SORT
 |
 |-- "Build order"
 |       → TOPOLOGICAL SORT
 |
 |-- "Dependency resolution"
 |       → TOPOLOGICAL SORT
 |
 |-- Detect cycle in directed graph
 |       → TOPOLOGICAL SORT / DFS


IMPLEMENTATIONS:

KAHN'S ALGORITHM
→ BFS + indegree

DFS TOPOLOGICAL SORT
→ DFS + recursion stack/state


============================================================
26. UNION FIND / DSU CHEAT SHEET
============================================================

DSU
 |
 |-- Dynamic connectivity?
 |       → DSU
 |
 |-- "Are these connected?"
 |       → DSU
 |
 |-- Merge components?
 |       → DSU
 |
 |-- Count connected components?
 |       → DSU / DFS / BFS
 |
 |-- Detect cycle in undirected graph?
 |       → DSU
 |
 |-- Kruskal MST?
        → DSU


OPTIMIZATIONS:

Path Compression

+

Union by Rank / Size


============================================================
27. GRID / MATRIX CHEAT SHEET
============================================================

GRID
 |
 |-- Explore connected cells?
 |       → DFS / BFS
 |
 |-- Number of islands?
 |       → DFS / BFS
 |
 |-- Shortest path?
 |       → BFS
 |
 |-- Multiple starting points?
 |       → MULTI-SOURCE BFS
 |
 |-- Spread over time?
 |       → MULTI-SOURCE BFS
 |
 |-- Region boundaries?
 |       → DFS / BFS
 |
 |-- In-place grid transformation?
        → DFS / BFS / INDEX MAPPING


SIGNALS:

"island"
"grid"
"matrix"
"neighbors"
"spread"
"infect"
"distance"
"region"


============================================================
28. MULTI-SOURCE BFS
============================================================

USE WHEN:

Multiple starting points expand simultaneously.

Examples of signals:

"all rotten oranges spread"
"nearest source"
"minimum distance from any source"
"fire spreading"
"simultaneous expansion"
"cells become active"


PATTERN:

1. Put ALL initial sources into queue.
2. Mark them visited.
3. BFS level by level.
4. Each level = one unit of time/distance.


============================================================
29. BACKTRACKING CHEAT SHEET
============================================================

QUESTION:
"Generate ALL possible..."

 |
 |-- Subsets
 |       → BACKTRACKING
 |
 |-- Permutations
 |       → BACKTRACKING
 |
 |-- Combinations
 |       → BACKTRACKING
 |
 |-- Valid arrangements
 |       → BACKTRACKING
 |
 |-- Maze/path exploration
 |       → BACKTRACKING
 |
 |-- Constraint satisfaction
        → BACKTRACKING


BACKTRACKING STRUCTURE:

choose
   ↓
explore
   ↓
undo


KEY SIGNALS:

"all possible"
"generate"
"every combination"
"every permutation"
"all arrangements"
"find all valid"


============================================================
30. BACKTRACKING DECISION TREE
============================================================

ALL POSSIBILITIES
 |
 |-- Choose or don't choose?
 |       → INCLUDE / EXCLUDE
 |
 |-- Order matters?
 |       → PERMUTATIONS
 |
 |-- Order doesn't matter?
 |       → COMBINATIONS
 |
 |-- Need subsets?
 |       → SUBSETS
 |
 |-- Constraints?
 |       → BACKTRACK + PRUNING
 |
 |-- Duplicate values?
        → SORT + SKIP DUPLICATES


============================================================
31. DP RECOGNITION CHEAT SHEET
============================================================

DYNAMIC PROGRAMMING
 |
 |-- Optimization?
 |       → DP candidate
 |
 |-- Count number of ways?
 |       → DP candidate
 |
 |-- Minimum / maximum?
 |       → DP candidate
 |
 |-- Can choose/reuse items?
 |       → KNAPSACK DP
 |
 |-- Grid paths?
 |       → GRID DP
 |
 |-- Sequence comparison?
 |       → LCS / LIS / SEQUENCE DP
 |
 |-- String transformation?
 |       → STRING DP
 |
 |-- State changes over time?
 |       → STATE MACHINE DP
 |
 |-- Tree optimization?
 |       → TREE DP
 |
 |-- Interval optimization?
 |       → INTERVAL DP
 |
 |-- Small N <= ~20?
        → BITMASK DP candidate


IMPORTANT:

DP usually has:

1. State
2. Transition
3. Base case
4. Answer
5. Computation order


============================================================
32. DP VS GREEDY
============================================================

OPTIMIZATION
 |
 |-- Does a local choice always lead to optimal result?
 |       |
 |       YES
 |       → GREEDY
 |
 |       NO / UNKNOWN
 |       → DP candidate
 |
 |-- Are there overlapping subproblems?
 |       |
 |       YES
 |       → DP
 |
 |-- Need all possibilities but can optimize states?
        → DP


GREEDY SIGNALS:

sort + choose
earliest finish
largest/smallest local choice
minimum resources
maximum activities
interval scheduling


============================================================
33. KADANE'S ALGORITHM
============================================================

QUESTION:

"Maximum sum contiguous subarray"

→ KADANE


CORE IDEA:

current = max(num, current + num)
best = max(best, current)


RELATED SIGNALS:

maximum subarray sum
best contiguous sum
maximum profit-like contiguous sequence


VARIATIONS:

- Maximum sum
- Minimum sum
- Track start/end
- Circular maximum subarray


============================================================
34. CYCLIC SORT CHEAT SHEET
============================================================

ARRAY VALUES
 |
 |-- Values in range 1..n?
 |       |
 |       YES
 |
 |-- Need missing number?
 |       → CYCLIC SORT / INDEX MAPPING
 |
 |-- Need duplicates?
 |       → CYCLIC SORT
 |
 |-- Need missing numbers?
 |       → CYCLIC SORT
 |
 |-- Need first missing positive?
        → INDEX MAPPING


KEY IDEA:

value x belongs at index x - 1


============================================================
35. GREEDY CHEAT SHEET
============================================================

GREEDY
 |
 |-- Intervals?
 |       → SORT + GREEDY
 |
 |-- Scheduling?
 |       → GREEDY
 |
 |-- Earliest finish?
 |       → GREEDY
 |
 |-- Resource allocation?
 |       → GREEDY / HEAP
 |
 |-- Local choice appears provably optimal?
        → GREEDY


WARNING:

"Looks greedy" is NOT enough.

Need an exchange argument,
mathematical proof,
or known greedy property.


============================================================
36. TRIE CHEAT SHEET
============================================================

TRIE
 |
 |-- Prefix matching?
 |       → TRIE
 |
 |-- Autocomplete?
 |       → TRIE
 |
 |-- Dictionary prefix?
 |       → TRIE
 |
 |-- Starts with?
 |       → TRIE
 |
 |-- Word search with many prefixes?
        → TRIE


SIGNALS:

"prefix"
"starts with"
"autocomplete"
"dictionary"
"word prefix"


============================================================
37. BIT MANIPULATION CHEAT SHEET
============================================================

BITS
 |
 |-- Find unique element?
 |       → XOR
 |
 |-- Check/set/clear bit?
 |       → BIT MASK
 |
 |-- Subsets of small N?
 |       → BITMASK
 |
 |-- Count set bits?
 |       → BIT COUNT
 |
 |-- Power of two?
 |       → BIT CHECK
 |
 |-- Toggle state?
 |       → XOR
 |
 |-- Compact state representation?
        → BITMASK


IMPORTANT XOR PROPERTIES:

a ^ a = 0
a ^ 0 = a
a ^ b ^ a = b


============================================================
38. RANGE QUERY CHEAT SHEET
============================================================

RANGE
 |
 |-- Static range sum?
 |       → PREFIX SUM
 |
 |-- Static range minimum?
 |       → SPARSE TABLE / SEGMENT TREE
 |
 |-- Dynamic range sum?
 |       → FENWICK TREE
 |
 |-- Dynamic range update/query?
 |       → SEGMENT TREE
 |
 |-- Many interval operations?
        → SEGMENT TREE / FENWICK


============================================================
39. DIFFERENCE ARRAY CHEAT SHEET
============================================================

MULTIPLE RANGE UPDATES
 |
 |-- Add X to [L, R]
 |       → DIFFERENCE ARRAY
 |
 |-- Many updates, final array needed?
 |       → DIFFERENCE ARRAY
 |
 |-- Need efficient range increments?
        → DIFFERENCE ARRAY


CORE:

diff[L] += x
diff[R + 1] -= x

Then prefix sum.


============================================================
40. EXACTLY K TRICK
============================================================

QUESTION:

"Exactly K"

Often think:

EXACTLY(K)
=
AT_MOST(K) - AT_MOST(K - 1)


Useful for:

- Exactly K distinct
- Exactly K odd numbers
- Exactly K elements satisfying condition
- Exactly K special values


IMPORTANT:

This is especially powerful with sliding window
when "at most K" is easy to calculate.


============================================================
41. CONSTRAINT → COMPLEXITY CHEAT SHEET
============================================================

ROUGH INTERVIEW GUIDELINES:

N <= 10
→ O(N!)

N <= 15-20
→ O(2^N)
→ BITMASK / BACKTRACKING

N <= 100
→ O(N^3) may be possible

N <= 500
→ O(N^2) often possible

N <= 2,000
→ O(N^2) may be possible depending on language/time

N <= 100,000
→ O(N log N) or O(N)

N <= 1,000,000
→ O(N) / O(N log N) carefully

N very large
→ O(log N) / O(1) / mathematical solution


IMPORTANT:

These are guidelines, NOT strict rules.


============================================================
42. CONSTRAINT → ALGORITHM CHEAT SHEET
============================================================

N small
→ Backtracking / Bitmask / Exponential DP

N large + sorted
→ Binary Search / Two Pointers

N large + frequency
→ HashMap / Set

N large + contiguous
→ Sliding Window / Prefix Sum

N large + top K
→ Heap

N large + maximum subarray
→ Kadane

N large + values 1..N
→ Cyclic Sort / Index Mapping

Graph + unweighted shortest path
→ BFS

Graph + weighted non-negative
→ Dijkstra

Graph + negative weights
→ Bellman-Ford

Graph + dependencies
→ Topological Sort

Dynamic connectivity
→ DSU

All combinations
→ Backtracking

Optimization + overlapping states
→ DP

Prefix matching
→ Trie

Range queries
→ Prefix Sum / Fenwick / Segment Tree


============================================================
43. STRING PATTERN CHEAT SHEET
============================================================

STRING
 |
 |-- Character frequency?
 |       → HASHMAP / ARRAY COUNT
 |
 |-- Anagram?
 |       → FREQUENCY MAP / SORT
 |
 |-- Palindrome?
 |       → TWO POINTERS
 |
 |-- Longest substring with condition?
 |       → SLIDING WINDOW
 |
 |-- Minimum window?
 |       → SLIDING WINDOW + FREQUENCY MAP
 |
 |-- Prefix?
 |       → TRIE
 |
 |-- Pattern matching?
 |       → KMP / Z / ROLLING HASH
 |
 |-- Repeated substring?
 |       → HASHING / KMP / Z
 |
 |-- Parentheses?
 |       → STACK


============================================================
44. PALINDROME CHEAT SHEET
============================================================

PALINDROME
 |
 |-- String
 |       → TWO POINTERS
 |
 |-- Linked List
 |       → FAST/SLOW + REVERSE
 |
 |-- Need all palindromic substrings
 |       → DP / EXPAND AROUND CENTER
 |
 |-- Longest palindrome
 |       → DP / CENTER EXPANSION / MANACHER


============================================================
45. ANAGRAM CHEAT SHEET
============================================================

ANAGRAM
 |
 |-- Compare two strings
 |       → FREQUENCY COUNT
 |
 |-- Group anagrams
 |       → HASHMAP + SORTED KEY
 |       OR
 |       → HASHMAP + FREQUENCY SIGNATURE
 |
 |-- Find anagram windows
        → SLIDING WINDOW + FREQUENCY MAP


============================================================
46. GRAPH REPRESENTATION CHEAT SHEET
============================================================

GRAPH
 |
 |-- Sparse graph
 |       → ADJACENCY LIST
 |
 |-- Dense graph
 |       → ADJACENCY MATRIX
 |
 |-- Need edge lookup often?
 |       → MATRIX / HASHMAP
 |
 |-- Need traversal?
        → ADJACENCY LIST


COMMON:

const graph = Array.from(
    { length: n },
    () => []
);


============================================================
47. MST CHEAT SHEET
============================================================

MINIMUM SPANNING TREE
 |
 |-- Sort edges naturally?
 |       → KRUSKAL
 |       → SORT + DSU
 |
 |-- Grow from a node?
        → PRIM
        → MIN HEAP


============================================================
48. ADVANCED GRAPH CHEAT SHEET
============================================================

GRAPH
 |
 |-- Strongly connected components
 |       → KOSARAJU / TARJAN
 |
 |-- Bridges
 |       → TARJAN
 |
 |-- Articulation points
 |       → TARJAN
 |
 |-- Bipartite
 |       → BFS / DFS COLORING
 |
 |-- DAG optimization
 |       → TOPOLOGICAL SORT + DP
 |
 |-- Eulerian path/circuit
 |       → HIERHOLZER
 |
 |-- Network flow
        → MAX FLOW / MIN CUT


============================================================
49. DP PATTERN MAP
============================================================

DP
 |
 |-- One-dimensional progression
 |       → 1D DP
 |
 |-- Grid
 |       → 2D DP
 |
 |-- Pick / don't pick
 |       → KNAPSACK
 |
 |-- Partition
 |       → SUBSET / PARTITION DP
 |
 |-- Sequence
 |       → LIS / LCS
 |
 |-- String transformation
 |       → EDIT DISTANCE DP
 |
 |-- Intervals
 |       → INTERVAL DP
 |
 |-- Tree
 |       → TREE DP
 |
 |-- Small states
 |       → BITMASK DP
 |
 |-- Digits under constraints
 |       → DIGIT DP
 |
 |-- State transitions
 |       → STATE MACHINE DP
 |
 |-- DAG
        → DAG DP


============================================================
50. JS-SPECIFIC DSA PATTERN CHEAT SHEET
============================================================

ARRAY STACK:

const stack = [];

stack.push(x);
stack.pop();


QUEUE:

const queue = [];
let head = 0;

queue.push(x);

const item = queue[head++];


MAP:

const map = new Map();

map.set(key, value);
map.get(key);
map.has(key);
map.delete(key);


SET:

const set = new Set();

set.add(x);
set.has(x);
set.delete(x);


SORT NUMERICALLY:

arr.sort((a, b) => a - b);


DESCENDING:

arr.sort((a, b) => b - a);


FREQUENCY:

const freq = new Map();

for (const x of arr) {
    freq.set(x, (freq.get(x) || 0) + 1);
}


============================================================
51. JAVASCRIPT DSA DATA STRUCTURES TO IMPLEMENT
============================================================

MUST KNOW:

1. Stack
2. Queue
3. Deque
4. Singly Linked List
5. Doubly Linked List
6. Binary Tree
7. BST
8. Min Heap
9. Max Heap
10. Priority Queue
11. Graph
12. Trie
13. Union Find / DSU
14. Fenwick Tree
15. Segment Tree


============================================================
52. WHEN YOU SEE THESE WORDS...
============================================================

"sorted"
→ Binary Search / Two Pointers

"pair"
→ Two Pointers / HashMap

"triplet"
→ Sort + Two Pointers

"contiguous"
→ Sliding Window / Prefix Sum / Kadane

"substring"
→ Sliding Window / String algorithms

"subarray"
→ Sliding Window / Prefix Sum / Kadane

"frequency"
→ HashMap

"duplicate"
→ Set / HashMap

"seen before"
→ Set / HashMap

"next greater"
→ Monotonic Stack

"next smaller"
→ Monotonic Stack

"nearest greater"
→ Monotonic Stack

"top K"
→ Heap

"Kth largest"
→ Min Heap / Quickselect

"Kth smallest"
→ Max Heap / Quickselect

"middle of linked list"
→ Fast + Slow

"cycle"
→ Fast + Slow / DSU depending on problem

"reverse linked list"
→ Pointer Reversal

"interval"
→ Sort + Merge

"overlap"
→ Intervals / Sweep Line

"meeting rooms"
→ Sort + Heap / Sweep Line

"minimum rooms"
→ Min Heap

"shortest path"
→ BFS / Dijkstra / Bellman-Ford

"unweighted graph"
→ BFS

"weighted graph"
→ Dijkstra / Bellman-Ford

"dependencies"
→ Topological Sort

"prerequisites"
→ Topological Sort

"connected components"
→ DFS / BFS / DSU

"dynamic connectivity"
→ DSU

"island"
→ DFS / BFS

"grid"
→ DFS / BFS

"spread"
→ Multi-source BFS

"all combinations"
→ Backtracking

"all permutations"
→ Backtracking

"all subsets"
→ Backtracking

"minimum cost"
→ DP / Greedy depending on structure

"maximum value"
→ DP / Greedy depending on structure

"number of ways"
→ DP

"overlapping subproblems"
→ DP

"prefix"
→ Trie / Prefix Sum depending on context

"range sum"
→ Prefix Sum

"range update"
→ Difference Array

"dynamic range query"
→ Fenwick / Segment Tree

"XOR"
→ Bit Manipulation

"single unique"
→ XOR

"values 1..N"
→ Cyclic Sort / Index Mapping

"palindrome"
→ Two Pointers

"parentheses"
→ Stack

"nested"
→ Stack

"autocomplete"
→ Trie


============================================================
53. THE MOST IMPORTANT CONFUSIONS
============================================================


TWO POINTERS vs SLIDING WINDOW

Two Pointers:
- pointers represent positions
- may move independently
- often sorted array
- pair/triplet/partition/merge

Sliding Window:
- [left ... right] represents a contiguous window
- maintain window state
- expand right
- shrink left when necessary


BINARY SEARCH vs TWO POINTERS

Sorted + searching for one value
→ Binary Search

Sorted + relationship between two/more values
→ Two Pointers


SLIDING WINDOW vs PREFIX SUM

Positive/non-negative + monotonic window condition
→ Sliding Window

Exact sum + negative values
→ Prefix Sum + HashMap


BFS vs DFS

Shortest unweighted distance
→ BFS

Level order
→ BFS

Explore paths/components
→ DFS/BFS


DP vs GREEDY

Local choice provably optimal
→ Greedy

Need to remember multiple states
→ DP


DFS/BFS vs DSU

Static connectivity/traversal
→ DFS/BFS

Repeated union/connectivity queries
→ DSU


HEAP vs SORT

Need everything sorted
→ Sort

Need only top K / repeated min/max
→ Heap


============================================================
54. MASTER "WHAT SHOULD I THINK FIRST?" FLOWCHART
============================================================

READ THE PROBLEM
        |
        ↓
WHAT IS THE INPUT?
        |
        +-----------------------------+
        |                             |
      ARRAY                         GRAPH/TREE
        |                             |
        ↓                             ↓
  SORTED?                       DFS / BFS / DSU
        |
   +----+----+
   |         |
  YES       NO
   |         |
   ↓         ↓
SEARCH?   FREQUENCY?
   |         |
   ↓         ↓
BINARY    HASHMAP
SEARCH
   |
   ↓
PAIR?
   |
   ↓
TWO POINTERS


CONTIGUOUS?
   |
  YES
   |
   +----------------------+
   |                      |
 FIXED K                VARIABLE
   |                      |
   ↓                      ↓
SLIDING              MONOTONIC?
WINDOW                   |
                         ↓
                  SLIDING WINDOW


NEGATIVE NUMBERS + EXACT SUM?
   |
  YES
   ↓
PREFIX SUM + HASHMAP


TOP K?
   |
  YES
   ↓
HEAP


NEXT GREATER/SMALLER?
   |
  YES
   ↓
MONOTONIC STACK


MIDDLE/CYCLE LINKED LIST?
   |
  YES
   ↓
FAST + SLOW


ALL POSSIBILITIES?
   |
  YES
   ↓
BACKTRACKING


MIN/MAX/COUNT WAYS + OVERLAPPING STATES?
   |
  YES
   ↓
DP


DEPENDENCIES?
   |
  YES
   ↓
TOPOLOGICAL SORT


SHORTEST PATH?
   |
   +-- Unweighted → BFS
   |
   +-- 0/1 weights → 0-1 BFS
   |
   +-- Non-negative weights → DIJKSTRA
   |
   +-- Negative weights → BELLMAN-FORD


RANGE QUERY?
   |
   +-- Static sum → PREFIX SUM
   |
   +-- Dynamic → FENWICK / SEGMENT TREE


PREFIX MATCHING?
   |
  YES
   ↓
TRIE


============================================================
55. 30-SECOND INTERVIEW PATTERN RECOGNITION
============================================================

When interviewer gives a problem:

STEP 1:
Identify the data structure.

Array?
String?
Linked List?
Tree?
Graph?
Grid?
Interval?

STEP 2:
Look for keywords.

Sorted?
Contiguous?
Frequency?
Top K?
Shortest?
Next greater?
Dependencies?
All combinations?
Minimum/maximum?
Prefix?
Range?

STEP 3:
Ask about constraints.

N?
Value range?
Negative numbers?
Duplicates?
Sorted?
Memory restrictions?

STEP 4:
Identify likely pattern.

STEP 5:
Ask:

"Can I solve this in O(n)?"

If not:

"Can sorting make it easier?"

"Can HashMap give O(1) lookup?"

"Can two pointers avoid nested loops?"

"Can sliding window avoid recomputing?"

"Can prefix sum avoid repeated range sums?"

"Can heap maintain top K?"

"Can binary search exploit monotonicity?"

"Can DP avoid recomputing states?"

"Can DFS/BFS model the exploration?"

"Can DSU maintain connectivity?"

STEP 6:
State complexity BEFORE coding.

STEP 7:
Code.

STEP 8:
Test edge cases.


============================================================
56. EDGE CASE CHEAT SHEET
============================================================

ALWAYS CHECK:

Empty input
Single element
Two elements
All duplicates
No duplicates
Already sorted
Reverse sorted
Negative values
Zero
Large values
All same values
Target absent
Target at beginning
Target at end
Odd/even length
Cycle exists
Cycle doesn't exist
Disconnected graph
Self-loop
Duplicate edges
Single-node tree
Skewed tree
Empty tree
No valid answer
Multiple valid answers


============================================================
57. FINAL PATTERN MAP
============================================================

ARRAY
→ Two Pointers
→ Sliding Window
→ Prefix Sum
→ HashMap
→ Binary Search
→ Kadane
→ Cyclic Sort
→ Difference Array
→ Sorting

STRING
→ Sliding Window
→ Frequency Map
→ Two Pointers
→ Stack
→ Trie
→ KMP/Z/Hashing

LINKED LIST
→ Fast/Slow
→ Reversal
→ Dummy Node
→ Two Pointers
→ Merge

STACK
→ Parentheses
→ Monotonic Stack
→ Expression Parsing

QUEUE
→ BFS
→ Multi-source BFS

DEQUE
→ Monotonic Queue
→ Sliding Window Maximum/Minimum

HEAP
→ Top K
→ Kth
→ Scheduling
→ K-way Merge
→ Median

INTERVAL
→ Sort + Merge
→ Sweep Line
→ Heap

TREE
→ DFS
→ BFS
→ BST
→ Tree DP
→ LCA

GRAPH
→ DFS
→ BFS
→ Dijkstra
→ Bellman-Ford
→ Topological Sort
→ DSU
→ MST
→ SCC

BACKTRACKING
→ Subsets
→ Permutations
→ Combinations
→ Constraint Search

DP
→ 1D
→ 2D
→ Knapsack
→ Sequence
→ String
→ Grid
→ Interval
→ Tree
→ Bitmask
→ Digit
→ State Machine

GREEDY
→ Sort + Choose
→ Interval Scheduling
→ Resource Allocation

BIT
→ XOR
→ Masks
→ Set/Clear/Toggle
→ Bitmask DP

TRIE
→ Prefix
→ Dictionary
→ Autocomplete

RANGE
→ Prefix Sum
→ Difference Array
→ Fenwick
→ Segment Tree


============================================================
58. GOLDEN RULES TO MEMORIZE
============================================================

1. SORTED + SEARCH
   → BINARY SEARCH

2. SORTED + PAIR/TRIPLET
   → TWO POINTERS

3. CONTIGUOUS + FIXED K
   → SLIDING WINDOW

4. CONTIGUOUS + POSITIVE/NON-NEGATIVE +
   MONOTONIC CONDITION
   → SLIDING WINDOW

5. EXACT SUBARRAY SUM + NEGATIVES
   → PREFIX SUM + HASHMAP

6. MAXIMUM CONTIGUOUS SUM
   → KADANE

7. FREQUENCY / COMPLEMENT / SEEN BEFORE
   → HASHMAP / SET

8. NEXT GREATER / SMALLER
   → MONOTONIC STACK

9. TOP K / KTH / DYNAMIC MIN/MAX
   → HEAP

10. LINKED LIST MIDDLE / CYCLE
    → FAST + SLOW

11. REVERSE LINKED LIST
    → POINTER REVERSAL

12. INTERVAL OVERLAP
    → SORT + MERGE / SWEEP LINE

13. SHORTEST PATH + UNWEIGHTED
    → BFS

14. SHORTEST PATH + NON-NEGATIVE WEIGHTS
    → DIJKSTRA

15. SHORTEST PATH + NEGATIVE WEIGHTS
    → BELLMAN-FORD

16. DEPENDENCIES / PREREQUISITES
    → TOPOLOGICAL SORT

17. DYNAMIC CONNECTIVITY
    → DSU

18. ALL COMBINATIONS / PERMUTATIONS / SUBSETS
    → BACKTRACKING

19. COUNT WAYS / MIN / MAX +
    OVERLAPPING SUBPROBLEMS
    → DP

20. PREFIX MATCHING
    → TRIE

21. STATIC RANGE SUM
    → PREFIX SUM

22. RANGE UPDATES
    → DIFFERENCE ARRAY

23. DYNAMIC RANGE QUERIES
    → FENWICK / SEGMENT TREE

24. VALUES 1..N + MISPLACED ELEMENTS
    → CYCLIC SORT / INDEX MAPPING

25. XOR / UNIQUE ELEMENT
    → BIT MANIPULATION

26. MAX/MIN OF EVERY SLIDING WINDOW
    → MONOTONIC DEQUE

27. MULTIPLE SOURCES SPREAD SIMULTANEOUSLY
    → MULTI-SOURCE BFS

28. SMALL N (~20)
    → BITMASK / BACKTRACKING / EXPONENTIAL DP

29. "MINIMUM POSSIBLE X" +
    "CAN X WORK?"
    → BINARY SEARCH ON ANSWER

30. "EXACTLY K"
    → AT_MOST(K) - AT_MOST(K-1)


============================================================
59. ONE-LINE INTERVIEW CHEAT SHEET
============================================================

Sorted → Binary Search / Two Pointers

Pair → Two Pointers / HashMap

Triplet → Sort + Two Pointers

Contiguous → Sliding Window / Prefix Sum

Positive + Window Constraint → Sliding Window

Negative + Exact Sum → Prefix Sum + HashMap

Frequency → HashMap

Duplicate → Set

Next Greater → Monotonic Stack

Top K → Heap

Kth → Heap / Quickselect

Middle/Cycle → Fast + Slow

Reverse List → Pointer Reversal

Intervals → Sort + Merge

Overlap → Sweep Line

Shortest Unweighted → BFS

Shortest Weighted → Dijkstra

Negative Weights → Bellman-Ford

Dependencies → Topological Sort

Connectivity → DFS/BFS/DSU

Dynamic Connectivity → DSU

Grid → DFS/BFS

Spread → Multi-source BFS

All Possibilities → Backtracking

Optimization → DP / Greedy

Overlapping Subproblems → DP

Local Optimal Choice → Greedy

Prefix → Trie

Range Sum → Prefix Sum

Range Update → Difference Array

Dynamic Range → Fenwick/Segment Tree

Maximum Subarray → Kadane

1..N Values → Cyclic Sort

XOR → Bit Manipulation

Sliding Window Max/Min → Monotonic Deque

Minimum Possible X → Binary Search on Answer

Exactly K → AtMost(K) - AtMost(K-1)


============================================================
60. THE CORE MENTAL MODEL
============================================================

DO NOT THINK:

"What problem have I seen that looks like this?"

THINK:

"What property does this problem have?"

Then:

PROPERTY
   ↓
PATTERN
   ↓
DATA STRUCTURE
   ↓
ALGORITHM
   ↓
COMPLEXITY


Examples:

Sorted + Pair
→ Two Pointers
→ O(n)


Sorted + Search
→ Binary Search
→ O(log n)


Contiguous + Positive + Threshold
→ Sliding Window
→ O(n)


Exact Sum + Negative Values
→ Prefix Sum + HashMap
→ O(n)


Top K
→ Heap
→ O(n log k)


Next Greater
→ Monotonic Stack
→ O(n)


Shortest Unweighted Path
→ BFS
→ O(V + E)


Dependencies
→ Topological Sort
→ O(V + E)


All Possibilities
→ Backtracking
→ Usually exponential


Overlapping Optimization
→ DP
→ Depends on states/transitions
`;

const HEADER = /=+\n(\d+)\.\s+(.+?)\n=+\n/g;

/** Split the sheet into numbered sections: [{ num, title, body }]. */
export function sheetSections() {
  const out = [];
  const matches = [...PATTERN_SHEET.matchAll(HEADER)];
  matches.forEach((m, i) => {
    const start = m.index + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : PATTERN_SHEET.length;
    out.push({ num: Number(m[1]), title: m[2].trim(), body: PATTERN_SHEET.slice(start, end).replace(/\s+$/, '') });
  });
  return out;
}

export const sectionByNum = (n) => sheetSections().find((s) => s.num === n);
