class Solution {
    struct Info { bool isBST; long long mn, mx, sum; };

public:
    int maxSumBST(TreeNode* root) {
        long long best = 0; // the empty BST
        if (!root) return best;

        // Iterative post-order (explicit stack) so very deep trees don't overflow the browser's stack:
        // collect nodes root-first, then walk them in reverse so children are done before their parent.
        vector<TreeNode*> order;
        vector<TreeNode*> stack = {root};
        while (!stack.empty()) {
            TreeNode* node = stack.back();
            stack.pop_back();
            order.push_back(node);
            if (node->left) stack.push_back(node->left);
            if (node->right) stack.push_back(node->right);
        }

        unordered_map<TreeNode*, Info> info;
        const Info empty = {true, LLONG_MAX, LLONG_MIN, 0};
        for (int i = (int)order.size() - 1; i >= 0; i--) {
            TreeNode* node = order[i];
            Info l = node->left ? info[node->left] : empty;
            Info r = node->right ? info[node->right] : empty;
            if (l.isBST && r.isBST && l.mx < node->val && node->val < r.mn) {
                long long sum = l.sum + node->val + r.sum;
                best = max(best, sum);
                info[node] = {true, min(l.mn, (long long)node->val), max(r.mx, (long long)node->val), sum};
            } else {
                info[node] = {false, 0, 0, 0}; // min/max/sum are irrelevant once isBST is false
            }
        }
        return best;
    }
};
