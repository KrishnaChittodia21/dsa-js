class Codec {
    // Level-order (BFS) encoding with '#' for missing children — fully iterative.
    public String serialize(TreeNode root) {
        if (root == null) return "";
        List<String> out = new ArrayList<>();
        List<TreeNode> queue = new ArrayList<>();
        queue.add(root);
        for (int head = 0; head < queue.size(); head++) {
            TreeNode node = queue.get(head);
            if (node == null) { out.add("#"); continue; }
            out.add(String.valueOf(node.val));
            queue.add(node.left);                        // nulls are queued too
            queue.add(node.right);
        }
        while (out.get(out.size() - 1).equals("#")) out.remove(out.size() - 1); // trailing nulls carry no information
        return String.join(",", out);
    }

    public TreeNode deserialize(String data) {
        if (data.isEmpty()) return null;
        String[] tokens = data.split(",");
        TreeNode root = new TreeNode(Integer.parseInt(tokens[0]));
        List<TreeNode> queue = new ArrayList<>();
        queue.add(root);
        int i = 1;
        for (int head = 0; head < queue.size() && i < tokens.length; head++) {
            TreeNode node = queue.get(head);
            // the next two tokens are this node's left and right child
            if (i < tokens.length && !tokens[i].equals("#")) {
                node.left = new TreeNode(Integer.parseInt(tokens[i]));
                queue.add(node.left);
            }
            i++;
            if (i < tokens.length && !tokens[i].equals("#")) {
                node.right = new TreeNode(Integer.parseInt(tokens[i]));
                queue.add(node.right);
            }
            i++;
        }
        return root;
    }
}
