class Solution {
public:
    TreeNode* insertIntoBST(TreeNode* root, int val) {
        TreeNode* fresh = new TreeNode(val);
        if (!root) return fresh;
        TreeNode* node = root;
        while (true) {
            if (val < node->val) {
                if (!node->left) { node->left = fresh; break; }   // fell off → attach here
                node = node->left;
            } else {
                if (!node->right) { node->right = fresh; break; }
                node = node->right;
            }
        }
        return root;
    }
};
