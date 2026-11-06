class Solution {
public:
    int diameterOfBinaryTree(TreeNode* root) {
        best = 0;
        height(root);
        return best;
    }

private:
    int best = 0;

    // returns the number of nodes on the longest downward path from node
    int height(TreeNode* node) {
        if (!node) return 0;
        int L = height(node->left);
        int R = height(node->right);
        best = max(best, L + R);     // longest path bending at node (in edges)
        return 1 + max(L, R);        // one-sided path for the parent
    }
};
