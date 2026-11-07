class Solution {
public:
    bool isValidBST(TreeNode* root) {
        // Each entry: node, low, high — node->val must lie strictly inside (low, high).
        // long long bounds so INT_MIN / INT_MAX values still fit inside.
        vector<tuple<TreeNode*, long long, long long>> stack = {{root, LLONG_MIN, LLONG_MAX}};
        while (!stack.empty()) {
            auto [node, low, high] = stack.back();
            stack.pop_back();
            if (!node) continue;
            if (node->val <= low || node->val >= high) return false;
            stack.emplace_back(node->left, low, node->val);   // left: tighten the upper bound
            stack.emplace_back(node->right, node->val, high); // right: tighten the lower bound
        }
        return true;
    }
};
