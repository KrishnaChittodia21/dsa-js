class Solution {
public:
    int maxPathSum(TreeNode* root) {
        best = INT_MIN;
        gain(root);
        return best;
    }

private:
    int best;

    // best sum of a path that starts at node and goes down at most one side
    int gain(TreeNode* node) {
        if (!node) return 0;
        int L = max(0, gain(node->left));          // ignore branches that only hurt
        int R = max(0, gain(node->right));
        best = max(best, node->val + L + R);       // path whose highest node is 'node'
        return node->val + max(L, R);              // one-sided: the parent may extend it
    }
};
