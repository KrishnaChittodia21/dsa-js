class Solution {
public:
    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
        TreeNode* node = root;
        while (node) {
            if (p->val < node->val && q->val < node->val) node = node->left;       // both on the left
            else if (p->val > node->val && q->val > node->val) node = node->right; // both on the right
            else return node;                                                      // they split here
        }
        return nullptr;
    }
};
