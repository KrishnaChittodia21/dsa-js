class Solution {
public:
    TreeNode* searchBST(TreeNode* root, int val) {
        TreeNode* node = root;
        while (node && node->val != val) {
            // The ordering tells us which ONE side can still contain val.
            node = val < node->val ? node->left : node->right;
        }
        return node; // the matching subtree, or null
    }
};
