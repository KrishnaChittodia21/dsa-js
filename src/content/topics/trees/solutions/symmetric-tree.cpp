class Solution {
public:
    bool isSymmetric(TreeNode* root) {
        return !root || mirror(root->left, root->right);
    }

private:
    // a is on the left side, b is its mirror position on the right side
    bool mirror(TreeNode* a, TreeNode* b) {
        if (!a && !b) return true;
        if (!a || !b) return false;
        if (a->val != b->val) return false;
        return mirror(a->left, b->right)     // outer pair
            && mirror(a->right, b->left);    // inner pair
    }
};
