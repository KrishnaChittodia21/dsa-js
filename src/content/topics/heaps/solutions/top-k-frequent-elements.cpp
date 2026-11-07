class Solution {
public:
    vector<int> topKFrequent(vector<int>& nums, int k) {
        unordered_map<int, int> count;
        for (int x : nums) count[x]++;

        // {count, value}, least frequent on top
        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> heap;
        for (auto& [value, n] : count) {
            heap.push({n, value});
            if ((int) heap.size() > k) heap.pop();
        }
        vector<int> answer;
        while (!heap.empty()) {
            answer.push_back(heap.top().second);
            heap.pop();
        }
        return answer;
    }
};
