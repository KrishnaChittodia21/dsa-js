class Solution {
    static long long dist(const vector<int>& p) {
        return (long long) p[0] * p[0] + (long long) p[1] * p[1]; // squared distance, no sqrt needed
    }

public:
    vector<vector<int>> kClosest(vector<vector<int>>& points, int k) {
        auto cmp = [](const vector<int>& a, const vector<int>& b) { return dist(a) < dist(b); };
        priority_queue<vector<int>, vector<vector<int>>, decltype(cmp)> heap(cmp); // farthest on top
        for (auto& p : points) {
            heap.push(p);
            if ((int) heap.size() > k) heap.pop();
        }
        vector<vector<int>> answer;
        while (!heap.empty()) {
            answer.push_back(heap.top());
            heap.pop();
        }
        return answer;
    }
};
