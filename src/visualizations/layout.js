// Layout helpers for node-link diagrams. Coordinates are in abstract units; panels scale them.

// Binary tree from a level-order array (LeetCode style, nulls allowed).
// Returns nodes [{id, val, x, y}] and edges [[parentId, childId]] with x = in-order position.
export function layoutLevelOrderTree(arr) {
  if (!arr || !arr.length || arr[0] == null) return { nodes: [], edges: [], byIndex: {} };
  const nodes = [{ id: 0, val: arr[0], left: null, right: null, depth: 0 }];
  const queue = [nodes[0]];
  let head = 0;
  let i = 1;
  while (head < queue.length && i < arr.length) {
    const n = queue[head++];
    for (const side of ['left', 'right']) {
      if (i < arr.length && arr[i] != null) {
        const child = { id: nodes.length, val: arr[i], left: null, right: null, depth: n.depth + 1 };
        nodes.push(child);
        n[side] = child;
        queue.push(child);
      }
      i++;
    }
  }
  let x = 0;
  const assign = (n) => {
    if (!n) return;
    assign(n.left);
    n.x = x++;
    n.y = n.depth;
    assign(n.right);
  };
  assign(nodes[0]);
  const edges = [];
  for (const n of nodes) {
    if (n.left) edges.push([n.id, n.left.id]);
    if (n.right) edges.push([n.id, n.right.id]);
  }
  return { nodes, edges, root: nodes[0] };
}

// Complete binary tree (heap) from an array: index i has children 2i+1, 2i+2.
export function layoutHeap(arr) {
  const nodes = arr.map((val, i) => ({ id: i, val, depth: Math.floor(Math.log2(i + 1)) }));
  let x = 0;
  const assign = (i) => {
    if (i >= arr.length) return;
    assign(2 * i + 1);
    nodes[i].x = x++;
    nodes[i].y = nodes[i].depth;
    assign(2 * i + 2);
  };
  assign(0);
  const edges = [];
  for (let i = 1; i < arr.length; i++) edges.push([(i - 1) >> 1, i]);
  return { nodes, edges };
}

// N-ary tree given as {id, label, children: []}: leaves get consecutive x, parents are centred.
export function layoutNary(root) {
  const nodes = [];
  const edges = [];
  let leafX = 0;
  const walk = (n, depth) => {
    const node = { id: n.id, val: n.label, y: depth };
    nodes.push(node);
    if (!n.children || n.children.length === 0) {
      node.x = leafX++;
    } else {
      const xs = n.children.map((c) => {
        edges.push([n.id, c.id]);
        return walk(c, depth + 1).x;
      });
      node.x = (xs[0] + xs[xs.length - 1]) / 2;
    }
    return node;
  };
  if (root) walk(root, 0);
  return { nodes, edges };
}

// Nodes on a circle (good default for small graphs).
export function layoutCircle(n) {
  const nodes = [];
  const R = Math.max(1.6, n * 0.42);
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    nodes.push({ id: i, val: i, x: R + R * Math.cos(a), y: R + R * Math.sin(a) });
  }
  return nodes;
}
