class Solution {
public:
    vector<string> findRelativeRanks(vector<int>& score) {
        int n = score.size();
        priority_queue<pair<int, int>> heap;     // {score, index}, largest score first
        for (int i = 0; i < n; i++) heap.push({score[i], i});
        const string medals[] = {"Gold Medal", "Silver Medal", "Bronze Medal"};
        vector<string> answer(n);
        int place = 1;
        while (!heap.empty()) {
            int i = heap.top().second;
            heap.pop();
            answer[i] = place <= 3 ? medals[place - 1] : to_string(place);
            place++;
        }
        return answer;
    }
};
