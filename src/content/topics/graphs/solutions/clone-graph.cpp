class Solution {
    unordered_map<Node*, Node*> copies; // original node → its clone

    Node* clone(Node* orig) {
        auto it = copies.find(orig);
        if (it != copies.end()) return it->second;
        Node* copy = new Node(orig->val);
        copies[orig] = copy;            // store BEFORE visiting neighbours (breaks cycles)
        for (Node* nb : orig->neighbors) copy->neighbors.push_back(clone(nb));
        return copy;
    }

public:
    Node* cloneGraph(Node* node) {
        if (node == nullptr) return nullptr;
        copies.clear();
        return clone(node);
    }
};
