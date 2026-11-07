class Solution {
public:
    int goodNodes(TreeNode* root) {
        // Iterative DFS with an explicit stack: safe even for a 10^5-node chain.
        int count = 0;
        vector<pair<TreeNode*, int>> stack = {{root, INT_MIN}}; // {node, max value on the path ABOVE node}
        while (!stack.empty()) {
            auto [node, maxAbove] = stack.back();
            stack.pop_back();
            if (node->val >= maxAbove) count++;         // nothing above is greater
            int next = max(maxAbove, node->val);        // what the children will see above them
            if (node->left) stack.push_back({node->left, next});
            if (node->right) stack.push_back({node->right, next});
        }
        return count;
    }
};
