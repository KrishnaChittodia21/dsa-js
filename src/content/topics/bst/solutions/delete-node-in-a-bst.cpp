class Solution {
public:
    TreeNode* deleteNode(TreeNode* root, int key) {
        if (!root) return nullptr;                          // key not found
        if (key < root->val) {
            root->left = deleteNode(root->left, key);
        } else if (key > root->val) {
            root->right = deleteNode(root->right, key);
        } else {
            if (!root->left) return root->right;            // 0 or 1 child
            if (!root->right) return root->left;
            TreeNode* succ = root->right;                   // 2 children: in-order successor
            while (succ->left) succ = succ->left;
            root->val = succ->val;
            root->right = deleteNode(root->right, succ->val); // successor has no left child
        }
        return root;
    }
};
