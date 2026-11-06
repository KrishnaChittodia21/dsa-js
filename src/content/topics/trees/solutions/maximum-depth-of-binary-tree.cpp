class Solution {
public:
    int maxDepth(TreeNode* root) {
        if (!root) return 0;                       // empty tree
        int left = maxDepth(root->left);           // ask the subtrees...
        int right = maxDepth(root->right);
        return 1 + max(left, right);               // ...and combine on the way up
    }
};
