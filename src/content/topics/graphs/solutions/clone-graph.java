class Solution {
    public Node cloneGraph(Node node) {
        if (node == null) return null;
        return clone(node, new HashMap<>());
    }

    private Node clone(Node orig, Map<Node, Node> copies) { // original node → its clone
        if (copies.containsKey(orig)) return copies.get(orig);
        Node copy = new Node(orig.val);
        copies.put(orig, copy);                             // store BEFORE visiting neighbours (breaks cycles)
        for (Node nb : orig.neighbors) copy.neighbors.add(clone(nb, copies));
        return copy;
    }
}
