class Solution {
public:
    // Iterative DFS (explicit stack) so very deep trees don't overflow the browser's stack.
    vector<vector<int>> pathSum(TreeNode* root, int targetSum) {
        vector<vector<int>> result;
        vector<int> path;
        struct Frame { TreeNode* node; long long remaining; int depth; }; // depth = path length above node
        vector<Frame> stack;
        if (root) stack.push_back({root, targetSum, 0});

        while (!stack.empty()) {
            Frame f = stack.back();
            stack.pop_back();
            TreeNode* node = f.node;
            long long remaining = f.remaining - node->val;

            path.resize(f.depth);                           // undo back to the parent
            path.push_back(node->val);                      // choose

            if (!node->left && !node->right) {
                if (remaining == 0) result.push_back(path); // a real leaf: record a COPY
                continue;
            }
            // push right first so left is explored first (same order as recursion)
            if (node->right) stack.push_back({node->right, remaining, f.depth + 1});
            if (node->left)  stack.push_back({node->left,  remaining, f.depth + 1});
        }
        return result;
    }
};
