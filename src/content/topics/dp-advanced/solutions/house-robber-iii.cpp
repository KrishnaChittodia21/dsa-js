class Solution {
    // returns {best if this node is robbed, best if it is skipped}
    pair<int, int> dfs(TreeNode* node) {
        if (!node) return {0, 0};
        auto [leftRob, leftSkip] = dfs(node->left);
        auto [rightRob, rightSkip] = dfs(node->right);
        int robIt = node->val + leftSkip + rightSkip;
        int skipIt = max(leftRob, leftSkip) + max(rightRob, rightSkip);
        return {robIt, skipIt};
    }

public:
    int rob(TreeNode* root) {
        auto [robIt, skipIt] = dfs(root);
        return max(robIt, skipIt);
    }
};
