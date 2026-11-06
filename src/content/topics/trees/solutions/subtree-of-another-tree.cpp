class Solution {
public:
    bool isSubtree(TreeNode* root, TreeNode* subRoot) {
        if (!root) return false;
        return isSame(root, subRoot) || isSubtree(root->left, subRoot) || isSubtree(root->right, subRoot);
    }

private:
    bool isSame(TreeNode* a, TreeNode* b) {
        if (!a || !b) return a == b;   // both null → true, exactly one null → false
        return a->val == b->val && isSame(a->left, b->left) && isSame(a->right, b->right);
    }
};
