class Solution {
    private final Map<Integer, Integer> idx = new HashMap<>(); // value -> position in inorder
    private int[] preorder;
    private int p = 0;                                         // next root in preorder

    public TreeNode buildTree(int[] preorder, int[] inorder) {
        this.preorder = preorder;
        for (int i = 0; i < inorder.length; i++) idx.put(inorder[i], i);
        return build(0, inorder.length - 1);
    }

    // build the subtree whose values occupy inorder[lo..hi]
    private TreeNode build(int lo, int hi) {
        if (lo > hi) return null;
        int val = preorder[p++];
        int mid = idx.get(val);
        TreeNode node = new TreeNode(val);
        node.left = build(lo, mid - 1);          // left subtree comes next in preorder
        node.right = build(mid + 1, hi);
        return node;
    }
}
