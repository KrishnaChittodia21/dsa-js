class Solution {
public:
    vector<int> dailyTemperatures(vector<int>& temperatures) {
        int n = temperatures.size();
        vector<int> answer(n, 0);
        stack<int> waiting;                              // indices, temperatures non-increasing
        for (int i = 0; i < n; i++) {
            while (!waiting.empty() && temperatures[waiting.top()] < temperatures[i]) {
                int j = waiting.top();
                waiting.pop();
                answer[j] = i - j;                       // day i is j's first warmer day
            }
            waiting.push(i);
        }
        return answer;
    }
};
