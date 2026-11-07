class Solution {
public:
    int getMinimumDifference(TreeNode* root) {
        int best = INT_MAX;
        TreeNode* prev = nullptr;                 // previous node in sorted (in-order) order
        vector<TreeNode*> stack;
        TreeNode* node = root;
        while (node || !stack.empty()) {
            while (node) { stack.push_back(node); node = node->left; }
            node = stack.back();
            stack.pop_back();
            if (prev) best = min(best, node->val - prev->val); // sorted → always >= 0
            prev = node;
            node = node->right;
        }
        return best;
    }
};
