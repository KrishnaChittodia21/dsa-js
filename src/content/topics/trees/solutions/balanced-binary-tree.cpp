class Solution {
public:
    bool isBalanced(TreeNode* root) {
        return check(root) != -1;
    }

private:
    // returns the height of node's subtree, or -1 if it is not balanced
    int check(TreeNode* node) {
        if (!node) return 0;
        int L = check(node->left);
        if (L == -1) return -1;                    // already failed below: stop early
        int R = check(node->right);
        if (R == -1) return -1;
        if (abs(L - R) > 1) return -1;             // this node breaks the rule
        return 1 + max(L, R);
    }
};
